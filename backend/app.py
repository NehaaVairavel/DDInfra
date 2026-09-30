import os
import re
import certifi
from datetime import timedelta, datetime
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity
)
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv
from flask_socketio import SocketIO, emit
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import threading

# Import custom utils
from utils.r2 import upload_file_to_r2, delete_file_from_r2


load_dotenv(override=True)

app = Flask(__name__)

# ── CORS — Most permissive for local dev ──────────────────────────────────
CORS(app, supports_credentials=True,
     resources={r"/api/*": {
         "origins": ["http://localhost:8080", "http://localhost:8081", "http://localhost:8082", "http://localhost:3000", "*"],
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
         "allow_headers": ["Content-Type", "Authorization", "Accept"]
     }})

# ── Manual CORS header injection on EVERY response (failsafe) ────────────
@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin", "*")
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept"
    return response

@app.before_request
def handle_options():
    if request.method == "OPTIONS":
        response = app.make_default_options_response()
        return response

# ── Auth extensions ───────────────────────────────────────────────────────
bcrypt = Bcrypt(app)
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "ddinfra-secret-change-this-in-production")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)
jwt = JWTManager(app)

# ── Real-Time Sync (Socket.IO) ───────────────────────────────────────────
socketio = SocketIO(app, cors_allowed_origins="*", async_mode=os.getenv("SOCKETIO_ASYNC_MODE", "gevent"))

# ── MongoDB Connection ────────────────────────────────────────────────────
MONGO_URI    = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "ddinfra")

client = MongoClient(MONGO_URI, tls=True, tlsCAFile=certifi.where())
db     = client[MONGO_DB_NAME]

products_col  = db["products"]
enquiries_col = db["enquiries"]
contacts_col  = db["contacts"]
gallery_col   = db["gallery"]
settings_col  = db["settings"]
admins_col    = db["admins"]
counters_col  = db["counters"]
hero_media_col = db["hero_media"]
parts_col     = db["parts"]

# ── Database Indexes (Performance Optimization) ───────────────────────────
try:
    products_col.create_index("category")
    products_col.create_index("featured")
    products_col.create_index("availability")
    products_col.create_index("reference_no", unique=True, sparse=True)
    parts_col.create_index("reference_no", unique=True, sparse=True)
    admins_col.create_index("username")
    admins_col.create_index("email")
    enquiries_col.create_index("status")
    contacts_col.create_index("status")
    contacts_col.create_index("is_read")
    print("[✓] Database indexes ensured.", flush=True)
except Exception as e:
    print(f"[!] Failed to create indexes: {e}", flush=True)

# ── Helpers ───────────────────────────────────────────────────────────────
def serialize(doc):
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    
    # Format image URLs correctly as per Exact Fix Requirement
    R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL", "").rstrip("/")
    FALLBACK_IMAGE = "https://images.unsplash.com/photo-1541888009187-54b38dcd2b31?auto=format&fit=crop&q=80&w=800"
    
    # Get updatedAt for versioning
    updated_at = doc.get("updated_at") or doc.get("updatedAt") or doc.get("created_at")
    v_param = ""
    if updated_at:
        if isinstance(updated_at, datetime):
            v_param = f"?v={int(updated_at.timestamp())}"
        else:
            # Try to handle string date if needed
            v_param = f"?v={updated_at}"
            
    # Try to get API_BASE from request, fallback if out of context
    try:
        from flask import request
        API_BASE = request.host_url.rstrip("/")
    except:
        API_BASE = ""

    def process_url(img):
        if not img or not isinstance(img, str) or img.strip() == "": return None
        # Clean the string
        img = img.strip()
        
        if img.startswith("blob:"):
            # blob: URLs are invalid after refresh, but we return them if they are there
            return img
            
        final_url = img
        if not (img.startswith("http://") or img.startswith("https://")):
            if img.startswith("uploads/") or img.startswith("/uploads/"):
                final_url = f"{API_BASE}/{img.lstrip('/')}"
            else:
                # Assume R2 object key
                final_url = f"{R2_PUBLIC_URL}/{img.lstrip('/')}"
        
        # Append version param if not already present and not a blob
        if v_param and "?" not in final_url and not final_url.startswith("blob:"):
            # Clean v_param if it contains spaces or weird chars
            clean_v = str(v_param).replace(" ", "_")
            final_url = f"{final_url}{clean_v}"
        return final_url

    # Normalize all potential image fields
    # 1. photos/gallery/images (arrays)
    gallery_fields = ["images", "gallery", "photos", "photo_list"]
    all_images = []
    for field in gallery_fields:
        if field in doc and isinstance(doc[field], list):
            processed = []
            for img in doc[field]:
                final = process_url(img)
                if final:
                    processed.append(final)
            doc[field] = processed
            all_images.extend(processed)
    
    # 2. singular image fields
    singular_fields = ["image", "photo", "image_url", "thumbnail"]
    main_image = None
    for field in singular_fields:
        if field in doc and doc[field]:
            val = process_url(doc[field])
            if val:
                doc[field] = val
                if not main_image: main_image = val

    # 3. Consolidate into 'image' and 'images' for frontend consistency
    if not main_image and all_images:
        main_image = all_images[0]
    
    doc["image"] = main_image or FALLBACK_IMAGE
    doc["images"] = all_images if all_images else [doc["image"]]
    
    # Ensure updatedAt is in the response for frontend cache busting
    if updated_at:
        doc["updatedAt"] = str(updated_at)
    else:
        doc["updatedAt"] = "1.0"
        
    # Reference Number Logic
    # 1. Use existing reference_no if present
    if doc.get("reference_no"):
        doc["reference_number"] = doc.get("reference_no")
    # 2. Fallback to old keys for backward compatibility
    elif doc.get("reference_number"):
        doc["reference_number"] = doc.get("reference_number")
    elif doc.get("reference"):
        doc["reference_number"] = doc.get("reference")
    # 3. Dynamic generation (only if still missing, though new products should have it)
    else:
        obj_id_str = str(doc.get("id") or "")
        doc["reference_number"] = f"DD{obj_id_str[-5:].upper()}" if obj_id_str else "DD001"
        
    # JSON serialization safety: convert any remaining datetime objects to strings
    for k, v in list(doc.items()):
        if isinstance(v, datetime):
            doc[k] = v.isoformat()
            
    return doc

def serialize_list(docs):
    return [serialize(d) for d in docs]

# ── Reference Number Generator (Products) ────────────────────────────────
CATEGORY_CODES = {
    "Excavators": "EXC",
    "Backhoe Loaders": "BHL",
    "Dozers": "DOZ",
    "Wheel Loaders": "WHL",
    "Graders": "GRD",
    "Rollers": "ROL",
    "Skid Steer": "SKD",
    "Buckets": "BKT",
    "Material Handlers": "MTH",
    "Others": "OTH"
}

VALID_CATEGORIES = list(CATEGORY_CODES.keys())

def get_next_reference(category_name):
    # Normalize category name to match map
    code = CATEGORY_CODES.get(category_name, "OTH")
    
    # Atomic increment in MongoDB
    counter = counters_col.find_one_and_update(
        {"category": code},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True
    )
    
    seq = counter.get("seq", 1)
    # Format: [CODE]-[3 DIGITS] (e.g. EXC-001)
    return f"{code}-{str(seq).zfill(3)}"

# ── Reference Number Generator (Parts) ────────────────────────────────────
PARTS_CATEGORY_CODES = {
    "Engine Parts":        "ENG",
    "Hydraulic Parts":     "HYD",
    "Undercarriage Parts": "UND",
    "Attachment Parts":    "ATT",
    "Swing System Parts":  "SWG",
    "Travel System Parts": "TRV",
    "Electrical Parts":    "ELE",
    "Cabin Parts":         "CAB",
    "Wear Parts (GET)":    "GET",
    "Maintenance Parts":   "MNT",
}

def get_next_part_reference(category_name):
    """Generate category-based reference number for parts: ENG-0001, HYD-0002, etc."""
    code = PARTS_CATEGORY_CODES.get(category_name, "MNT")
    counter_key = f"PART_{code}"
    counter = counters_col.find_one_and_update(
        {"category": counter_key},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True
    )
    seq = counter.get("seq", 1)
    return f"{code}-{str(seq).zfill(4)}"

# ── Auto-sync admin from Easypanel Runtime Environment ─────────────────
def sync_admin_from_runtime_env():
    # Read values directly from runtime environment variables
    username = os.getenv("ADMIN_USERNAME")
    email    = os.getenv("ADMIN_EMAIL")
    password = os.getenv("ADMIN_PASSWORD")
    
    if not username or not email or not password:
        print("[!] Critical: ADMIN_USERNAME / ADMIN_EMAIL / ADMIN_PASSWORD missing in environment. Skipping sync.", flush=True)
        print(f"[!] ADMIN_USERNAME present: {bool(username)}, ADMIN_EMAIL present: {bool(email)}, ADMIN_PASSWORD present: {bool(password)}", flush=True)
        return
    
    print(f"[✓] Syncing admin — username={username}, email={email}", flush=True)
    
    try:
        # 1. Force remove all existing admin accounts
        admins_col.delete_many({})
        print("[✓] Removed old admins", flush=True)
        
        # 2. Insert fresh admin account from runtime variables
        admins_col.insert_one({
            "username": username,
            "email": email,
            "password": password,  # Plain-text; compared directly at login
            "role": "superadmin",
            "created_at": datetime.utcnow().isoformat()
        })
        print("[✓] Admin synced from environment variables successfully", flush=True)
    except Exception as e:
        print(f"[✗] Failed to sync admin: {e}", flush=True)

# ── Execute Sync on Module Load (for WSGI / Production) ─────────
try:
    with app.app_context():
        sync_admin_from_runtime_env()
except Exception as e:
    print(f"[!] Failed to auto-sync admin on startup: {e}", flush=True)


# ════════════════════════════════════════════════════════════════════
#  AUTH ENDPOINTS
# ════════════════════════════════════════════════════════════════════

@app.route("/api/admin/login", methods=["POST", "OPTIONS"])
@app.route("/api/login", methods=["POST", "OPTIONS"])
@app.route("/admin/login", methods=["POST", "OPTIONS"])
@app.route("/login", methods=["POST", "OPTIONS"])
def login():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
    
    data     = request.get_json(force=True, silent=True) or {}
    # Use 'identifier' as primary, but fallback to 'username' or 'email'
    login_id = data.get("identifier") or data.get("username") or data.get("email") or ""
    password = data.get("password", "")
    
    if not login_id or not password:
        return jsonify({"message": "Identifier and password required"}), 400

    # ── Primary path: look up admin in MongoDB (populated by sync_admin_from_runtime_env) ──
    user = admins_col.find_one({"$or": [
        {"username": login_id},
        {"email": login_id}
    ]})
    
    if user:
        stored_password = user.get("password", "")
        if stored_password != password:
            print(f"[✗] Wrong password for: {login_id}", flush=True)
            return jsonify({"message": "Invalid credentials"}), 401
        print(f"[✓] Login success (DB): {login_id}", flush=True)
        token = create_access_token(identity=str(user["_id"]))
        return jsonify({
            "token": token,
            "username": user["username"],
            "email": user.get("email", ""),
            "role": user.get("role", "superadmin")
        }), 200

    # ── Fallback path: compare directly against env vars if MongoDB sync had not run ──
    # This ensures login still works even if the startup DB sync failed.
    env_username = os.getenv("ADMIN_USERNAME", "")
    env_email    = os.getenv("ADMIN_EMAIL", "")
    env_password = os.getenv("ADMIN_PASSWORD", "")

    if env_username and env_email and env_password:
        id_matches = (login_id == env_username or login_id == env_email)
        if id_matches and password == env_password:
            print(f"[✓] Login success (env fallback): {login_id}", flush=True)
            # Re-run sync so DB is populated for future requests
            try:
                sync_admin_from_runtime_env()
                user = admins_col.find_one({"username": env_username})
            except Exception:
                pass
            if user:
                token = create_access_token(identity=str(user["_id"]))
            else:
                token = create_access_token(identity="env_admin")
            return jsonify({
                "token": token,
                "username": env_username,
                "email": env_email,
                "role": "superadmin"
            }), 200

    print(f"[✗] Admin not found or wrong credentials: {login_id}", flush=True)
    return jsonify({"message": "Invalid credentials"}), 401


@app.route("/api/me", methods=["GET"])
@jwt_required()
def me():
    uid  = get_jwt_identity()
    user = admins_col.find_one({"_id": ObjectId(uid)})
    if not user:
        return jsonify({"message": "User not found"}), 404
    return jsonify(serialize(user)), 200


# ════════════════════════════════════════════════════════════════════
#  DASHBOARD
# ════════════════════════════════════════════════════════════════════

@app.route("/api/dashboard", methods=["GET"])
@jwt_required()
def dashboard():
    total = products_col.count_documents({})
    
    # Use $regex for case-insensitive matching or exact matches
    sold = products_col.count_documents({"availability": {"$in": ["sold", "Sold", "SOLD"]}})
    coming_soon = products_col.count_documents({"availability": {"$in": ["coming_soon", "Coming Soon", "coming soon"]}})
    
    # Everything else defaults to Active/In Stock to ensure math perfectly aligns
    available = total - sold - coming_soon
    
    enqs = enquiries_col.count_documents({})
    return jsonify({
        "total_products": total,
        "available_products": available,
        "sold_products": sold,
        "coming_soon_products": coming_soon,
        "enquiries_count": enqs
    }), 200


# ════════════════════════════════════════════════════════════════════
#  MEDIA UPLOAD
# ════════════════════════════════════════════════════════════════════

@app.route("/api/upload", methods=["POST"])
@jwt_required()
def upload_files():
    try:
        if 'files' not in request.files:
            return jsonify({"success": False, "message": "No files provided in request"}), 400
        
        files = request.files.getlist('files')
        if not files:
            return jsonify({"success": False, "message": "File list is empty"}), 400

        uploaded_urls = []
        failed_files = []

        for file in files:
            if not file or file.filename == '':
                continue
            try:
                key = upload_file_to_r2(file, file.filename)
                if key:
                    uploaded_urls.append(key)
                    print(f"[✓] Uploaded: {key}", flush=True)
                else:
                    print(f"[✗] upload_file_to_r2 returned None for '{file.filename}'", flush=True)
                    failed_files.append(file.filename)
            except EnvironmentError as env_err:
                # R2 credentials/config issue — abort immediately
                print(f"[✗] R2 environment error: {env_err}", flush=True)
                return jsonify({"success": False, "message": f"Image upload failed: {str(env_err)}"}), 500
            except Exception as upload_err:
                print(f"[✗] Upload error for '{file.filename}': {upload_err}", flush=True)
                failed_files.append(file.filename)

        if failed_files and not uploaded_urls:
            # All uploads failed
            return jsonify({
                "success": False,
                "message": f"Image upload failed for: {', '.join(failed_files)}",
                "urls": []
            }), 500

        print(f"[✓] Upload complete: {len(uploaded_urls)} succeeded, {len(failed_files)} failed", flush=True)
        return jsonify({"urls": uploaded_urls, "failed": failed_files}), 200

    except Exception as e:
        print(f"[✗] /api/upload unexpected error: {e}", flush=True)
        return jsonify({"success": False, "message": f"Upload endpoint error: {str(e)}"}), 500


# ════════════════════════════════════════════════════════════════════
#  PRODUCTS
# ════════════════════════════════════════════════════════════════════

@app.route("/api/products", methods=["GET"])
def get_products():
    category = request.args.get("category")
    featured = request.args.get("featured")
    show_all = request.args.get("all") == "true"
    paginated = request.args.get("paginated") == "true"
    query = {} if show_all else {}
    search = request.args.get("search")
    sort_by = request.args.get("sort", "display_order")  # default: display_order ASC

    if category and category.lower() not in ("all", ""):
        # Split by comma if multiple categories are passed
        categories = [c.strip() for c in category.split(",")]
        if categories:
            query["category"] = {"$in": [re.compile(f"^{re.escape(c)}$", re.IGNORECASE) for c in categories]}

    # Handle multiple brands — substring match so "CAT" matches "CAT", "Caterpillar" etc.
    brands = request.args.get("brands")
    if brands:
        brand_list = [b.strip() for b in brands.split(",") if b.strip()]
        if brand_list:
            # Use word-boundary-aware substring match for brands
            query["brand"] = {"$in": [re.compile(re.escape(b), re.IGNORECASE) for b in brand_list]}

    # Handle multiple locations — substring match so "UAE" matches "Dubai, UAE" etc.
    locations = request.args.get("locations")
    if locations:
        location_list = [l.strip() for l in locations.split(",") if l.strip()]
        if location_list:
            query["location"] = {"$in": [re.compile(re.escape(l), re.IGNORECASE) for l in location_list]}

    # Handle condition
    condition = request.args.get("condition")
    if condition and condition.lower() not in ("all", ""):
        query["condition"] = re.compile(f"^{re.escape(condition)}$", re.IGNORECASE)

    # Handle status/availability
    status = request.args.get("status")
    if status and status.lower() not in ("all", ""):
        # Front-end statuses: 'Available', 'Sold', 'Coming Soon'
        # Database statuses: 'in_stock', 'sold', 'coming_soon'
        status_map = {
            "available": "in_stock",
            "sold": "sold",
            "coming soon": "coming_soon",
            "reserved": "coming_soon"
        }
        db_status = status_map.get(status.lower())
        if db_status:
            # Use $and-wrapped $or so it doesn't conflict with search's $and clauses
            if db_status == "in_stock":
                availability_clause = {"$or": [
                    {"availability": "in_stock"},
                    {"availability": {"$exists": False}},
                    {"availability": ""}
                ]}
            else:
                availability_clause = {"availability": db_status}
            # Merge into $and to avoid clobbering existing $or keys
            if "$and" in query:
                query["$and"].append(availability_clause)
            else:
                if "$or" in availability_clause:
                    query["$or"] = availability_clause["$or"]
                else:
                    query.update(availability_clause)

    # Enhanced search support for reference_no
    if search:
        search_words = [re.escape(word) for word in search.split() if word]
        if search_words:
            # Each word must match somewhere in the product document
            and_clauses = []
            for word in search_words:
                and_clauses.append({
                    "$or": [
                        {"name": {"$regex": word, "$options": "i"}},
                        {"brand": {"$regex": word, "$options": "i"}},
                        {"model": {"$regex": word, "$options": "i"}},
                        {"reference_no": {"$regex": word, "$options": "i"}},
                        {"reference_number": {"$regex": word, "$options": "i"}},
                        {"category": {"$regex": word, "$options": "i"}},
                        {"location": {"$regex": word, "$options": "i"}}
                    ]
                })
            if "$and" in query:
                query["$and"].extend(and_clauses)
            else:
                query["$and"] = and_clauses

    pipeline = [{"$match": query}]

    # Try to convert string engine_hours to number for filtering
    engine_hours = request.args.get("engineHours")
    if engine_hours:
        try:
            max_hours = int(engine_hours)
            if max_hours < 50000:
                pipeline.append({
                    "$addFields": {
                        "numeric_hours": {
                            "$convert": {
                                "input": "$engine_hours",
                                "to": "int",
                                "onError": 0,
                                "onNull": 0
                            }
                        }
                    }
                })
                pipeline.append({"$match": {"numeric_hours": {"$lte": max_hours}}})
        except ValueError:
            pass

    # Try to convert string price to number for filtering
    min_price = request.args.get("minPrice")
    max_price = request.args.get("maxPrice")
    
    if min_price or max_price:
        pipeline.append({
            "$addFields": {
                "numeric_price": {
                    "$convert": {
                        # Strip non-numeric chars from price string e.g. "₹ 2,00,000" -> 200000
                        "input": {
                            "$replaceAll": {
                                "input": {
                                    "$replaceAll": {
                                        "input": { "$ifNull": ["$price", "0"] },
                                        "find": ",", "replacement": ""
                                    }
                                },
                                "find": "₹", "replacement": ""
                            }
                        },
                        "to": "double",
                        "onError": 0,
                        "onNull": 0
                    }
                }
            }
        })
        
        price_match = {}
        if min_price:
            try:
                price_match["$gte"] = float(min_price)
            except ValueError:
                pass
        if max_price:
            try:
                max_val = float(max_price)
                if max_val < 50000000:  # 50,000,000 is our frontend max limit meaning 'Any'
                    price_match["$lte"] = max_val
            except ValueError:
                pass
        if price_match:
            pipeline.append({"$match": {"numeric_price": price_match}})

    # Sort logic
    sort_query = {"_id": -1}
    if sort_by == "display_order" or sort_by == "Manual Order":
        pipeline.append({
            "$addFields": {
                "_sort_order": {
                    "$cond": {
                        "if": {"$gt": [{"$type": "$display_order"}, "missing"]},
                        "then": "$display_order",
                        "else": 999999
                    }
                }
            }
        })
        sort_query = {"_sort_order": 1, "_id": -1}
    elif sort_by == "Newest":
        sort_query = {"_id": -1}
    elif sort_by == "Oldest":
        sort_query = {"_id": 1}
    elif sort_by == "Price Low to High":
        # Need to ensure numeric_price exists
        if not any("$addFields" in stage and "numeric_price" in stage["$addFields"] for stage in pipeline):
            pipeline.append({
                "$addFields": {
                    "numeric_price": {
                        "$convert": {
                            "input": {"$replaceAll": {"input": {"$replaceAll": {"input": {"$ifNull": ["$price", "0"]}, "find": ",", "replacement": ""}}, "find": "₹", "replacement": ""}},
                            "to": "double",
                            "onError": 0,
                            "onNull": 0
                        }
                    }
                }
            })
        sort_query = {"numeric_price": 1, "_id": -1}
    elif sort_by == "Price High to Low":
        if not any("$addFields" in stage and "numeric_price" in stage["$addFields"] for stage in pipeline):
            pipeline.append({
                "$addFields": {
                    "numeric_price": {
                        "$convert": {
                            "input": {"$replaceAll": {"input": {"$replaceAll": {"input": {"$ifNull": ["$price", "0"]}, "find": ",", "replacement": ""}}, "find": "₹", "replacement": ""}},
                            "to": "double",
                            "onError": 0,
                            "onNull": 0
                        }
                    }
                }
            })
        sort_query = {"numeric_price": -1, "_id": -1}
    elif sort_by == "Hours Low to High":
        if not any("$addFields" in stage and "numeric_hours" in stage["$addFields"] for stage in pipeline):
            pipeline.append({
                "$addFields": {
                    "numeric_hours": {
                        "$convert": {
                            "input": "$engine_hours",
                            "to": "int",
                            "onError": 0,
                            "onNull": 0
                        }
                    }
                }
            })
        sort_query = {"numeric_hours": 1, "_id": -1}
    elif sort_by == "Hours High to Low":
        if not any("$addFields" in stage and "numeric_hours" in stage["$addFields"] for stage in pipeline):
            pipeline.append({
                "$addFields": {
                    "numeric_hours": {
                        "$convert": {
                            "input": "$engine_hours",
                            "to": "int",
                            "onError": 0,
                            "onNull": 0
                        }
                    }
                }
            })
        sort_query = {"numeric_hours": -1, "_id": -1}

    pipeline.append({"$sort": sort_query})

    if paginated:
        try:
            page = int(request.args.get("page", 1))
            limit = int(request.args.get("limit", 10))
        except ValueError:
            page = 1
            limit = 10
            
        skip = (page - 1) * limit
        
        # Facet to get both total count and paginated data in one query
        facet_pipeline = [
            {"$facet": {
                "metadata": [{"$count": "total"}],
                "data": [{"$skip": skip}, {"$limit": limit}]
            }}
        ]
        
        # Append facet to original pipeline
        full_pipeline = pipeline + facet_pipeline
        result = list(products_col.aggregate(full_pipeline))
        
        data = serialize_list(result[0]["data"])
        total = result[0]["metadata"][0]["total"] if result[0]["metadata"] else 0
        total_pages = (total + limit - 1) // limit
        
        resp = jsonify({
            "products": data,
            "total": total,
            "page": page,
            "totalPages": total_pages
        })
    else:
        # Non-paginated return (for Admin panel and backward compatibility)
        if "_sort_order" in sort_query or "numeric_price" in sort_query or "numeric_hours" in sort_query:
            # We need to project out the temporary fields if we want, but it's fine to leave them
            # or just project them out
            pipeline.append({"$project": {"_sort_order": 0, "numeric_price": 0, "numeric_hours": 0}})
            products = serialize_list(products_col.aggregate(pipeline))
        else:
            products = serialize_list(products_col.find(query).sort("_id", -1))
        
        resp = jsonify(products)

    # Disable HTTP caching to ensure real-time socket refetches always hit the database
    resp.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    return resp, 200


@app.route("/api/products/<product_id>", methods=["GET"])
def get_product(product_id):
    try:
        product = products_col.find_one({"_id": ObjectId(product_id)})
        if not product:
            return jsonify({"error": "Product not found"}), 404
        return jsonify(serialize(product)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/products/ref/<ref_number>", methods=["GET"])
def get_product_by_ref(ref_number):
    try:
        # Search by 'reference_no', 'reference_number' or 'reference'
        product = products_col.find_one({
            "$or": [
                {"reference_no": ref_number},
                {"reference_number": ref_number},
                {"reference": ref_number}
            ]
        })
        
        # If not found, we might need a more complex check if we don't store ref in DB
        if not product:
            # Fallback: scan all products and check their generated ref (inefficient but works for small sets)
            all_products = products_col.find({})
            for p in all_products:
                serialized = serialize(p)
                if serialized.get("reference_number") == ref_number:
                    return jsonify(serialized), 200
            
            return jsonify({"error": "Product not found"}), 404
            
        return jsonify(serialize(product)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/categories", methods=["GET"])
def get_categories():
    return jsonify(VALID_CATEGORIES), 200


@app.route("/api/products", methods=["POST"])
@jwt_required()
def create_product():
    try:
        data = request.get_json(force=True, silent=True)
        if not data:
            print("[✗] create_product: No JSON payload received", flush=True)
            return jsonify({"success": False, "message": "No product data provided in request body"}), 400

        print(f"[→] create_product: received payload with keys: {list(data.keys())}", flush=True)

        # ── Validate required fields ──────────────────────────────────────────
        name = (data.get("name") or "").strip()
        if not name:
            return jsonify({"success": False, "message": "Product name is required"}), 400

        availability = data.get("availability") or "in_stock"
        valid_avail = ["in_stock", "coming_soon", "sold"]
        if availability not in valid_avail:
            return jsonify({"success": False, "message": f"Availability must be one of: {', '.join(valid_avail)}"}), 400
        data["availability"] = availability

        # ── Validate year ─────────────────────────────────────────────────────
        year = data.get("year")
        if year:
            try:
                year_int = int(year)
                max_allowed = datetime.utcnow().year + 2
                if year_int < 1980 or year_int > max_allowed:
                    return jsonify({"success": False, "message": f"Invalid year. Must be between 1980 and {max_allowed}"}), 400
                data["year"] = str(year_int)
            except (ValueError, TypeError):
                return jsonify({"success": False, "message": "Year must be a valid number"}), 400

        # ── Validate price ────────────────────────────────────────────────────
        price_raw = str(data.get("price") or "").replace(",", "").strip()
        if price_raw:
            try:
                float(price_raw)
            except ValueError:
                return jsonify({"success": False, "message": "Price must be a valid numeric value"}), 400

        # ── Validate and sanitize images ──────────────────────────────────────
        images = data.get("images")
        FALLBACK_IMAGE = "https://images.unsplash.com/photo-1541888009187-54b38dcd2b31?auto=format&fit=crop&q=80&w=800"

        if images is None or not isinstance(images, list):
            data["images"] = []
        else:
            # Strip None / empty strings from image array
            clean_images = [u for u in images if u and isinstance(u, str) and u.strip()]
            if len(clean_images) < len(images):
                print(f"[!] create_product: stripped {len(images) - len(clean_images)} invalid image URLs", flush=True)
            data["images"] = clean_images

        # Use first valid image as the main image field
        data["image"] = data["images"][0] if data["images"] else None

        # ── Validate / normalise category ──────────────────────────────────────
        category = (data.get("category") or "Others").strip()
        if category not in VALID_CATEGORIES:
            print(f"[!] create_product: unknown category '{category}' — defaulting to 'Others'", flush=True)
            category = "Others"
        data["category"] = category

        # ── Timestamps ────────────────────────────────────────────────────────
        now = datetime.utcnow()
        data["created_at"] = now.isoformat()
        data["updated_at"] = now

        # ── Auto-generate reference number ────────────────────────────────────
        try:
            data["reference_no"] = get_next_reference(category)
            print(f"[→] create_product: reference_no={data['reference_no']}", flush=True)
        except Exception as ref_err:
            print(f"[✗] create_product: reference number generation failed: {ref_err}", flush=True)
            return jsonify({"success": False, "message": f"Reference number generation failed: {str(ref_err)}"}), 500

        # ── Insert into MongoDB ───────────────────────────────────────────────
        try:
            print(f"[→] create_product: inserting into MongoDB...", flush=True)
            result = products_col.insert_one(data)
            print(f"[✓] create_product: inserted _id={result.inserted_id}", flush=True)
        except Exception as db_err:
            print(f"[✗] create_product: MongoDB insert failed: {db_err}", flush=True)
            return jsonify({"success": False, "message": f"Database error: {str(db_err)}"}), 500

        # ── Fetch and serialize ───────────────────────────────────────────────
        try:
            product = products_col.find_one({"_id": result.inserted_id})
            serialized = serialize(product)
        except Exception as ser_err:
            print(f"[✗] create_product: serialization error: {ser_err}", flush=True)
            # Product was saved, but we couldn't serialize — return minimal response
            return jsonify({"success": True, "id": str(result.inserted_id), "message": "Product saved but could not be fully serialized"}), 201

        # ── Broadcast real-time update ────────────────────────────────────────
        try:
            socketio.emit("products_updated", {"type": "create", "id": serialized.get("id"), "product": serialized})
            print(f"[✓] create_product: socket event emitted for product {serialized.get('id')}", flush=True)
        except Exception as sock_err:
            print(f"[!] create_product: socket emit failed (non-critical): {sock_err}", flush=True)

        return jsonify(serialized), 201

    except Exception as e:
        import traceback
        print(f"[✗] create_product UNEXPECTED ERROR: {e}", flush=True)
        print(traceback.format_exc(), flush=True)
        return jsonify({"success": False, "message": f"Internal server error: {str(e)}"}), 500


@app.route("/api/products/<product_id>", methods=["PUT"])
@jwt_required()
def update_product(product_id):
    try:
        # ── Validate ObjectId ──────────────────────────────────────────────────
        try:
            oid = ObjectId(product_id)
        except Exception:
            return jsonify({"success": False, "message": f"Invalid product ID format: '{product_id}'"}), 400

        data = request.get_json(force=True, silent=True) or {}
        data.pop("id", None)
        data.pop("_id", None)

        print(f"[→] update_product: id={product_id} keys={list(data.keys())}", flush=True)

        # ── Validate Year if provided ──────────────────────────────────────────
        year = data.get("year")
        if year:
            try:
                year_int = int(year)
                max_allowed = datetime.utcnow().year + 2
                if year_int < 1980 or year_int > max_allowed:
                    return jsonify({"success": False, "message": f"Invalid year. Must be between 1980 and {max_allowed}"}), 400
                data["year"] = str(year_int)
            except (ValueError, TypeError):
                return jsonify({"success": False, "message": "Year must be a valid number"}), 400

        if "category" in data and data["category"] not in VALID_CATEGORIES:
            data["category"] = "Others"

        # ── Sanitize image arrays ──────────────────────────────────────────────
        if "images" in data and isinstance(data["images"], list):
            data["images"] = [u for u in data["images"] if u and isinstance(u, str) and u.strip()]

        data["updated_at"] = datetime.utcnow()

        # ── Update MongoDB ─────────────────────────────────────────────────────
        result = products_col.update_one({"_id": oid}, {"$set": data})
        if result.matched_count == 0:
            print(f"[!] update_product: product {product_id} not found", flush=True)
            return jsonify({"success": False, "message": "Product not found"}), 404

        # ── Fetch updated product to broadcast full data ────────────────────────
        updated_product = products_col.find_one({"_id": oid})
        serialized = serialize(updated_product)

        # ── Broadcast real-time update ─────────────────────────────────────────
        try:
            socketio.emit("products_updated", {"type": "update", "id": product_id, "product": serialized})
            print(f"[✓] update_product: socket emitted for {product_id}", flush=True)
        except Exception as sock_err:
            print(f"[!] update_product: socket emit failed (non-critical): {sock_err}", flush=True)

        return jsonify({"message": "Product updated", "product": serialized}), 200

    except Exception as e:
        import traceback
        print(f"[✗] update_product UNEXPECTED ERROR for id={product_id}: {e}", flush=True)
        print(traceback.format_exc(), flush=True)
        return jsonify({"success": False, "message": f"Internal server error: {str(e)}"}), 500


@app.route("/api/products/<product_id>", methods=["DELETE"])
@jwt_required()
def delete_product(product_id):
    try:
        # ── Validate ObjectId format (matches update_product pattern) ──────────
        try:
            oid = ObjectId(product_id)
        except Exception:
            return jsonify({"error": f"Invalid product ID format: '{product_id}'"}), 400

        # 1. Fetch product to get image keys before deletion
        product = products_col.find_one({"_id": oid})
        if not product:
            return jsonify({"error": "Product not found"}), 404

        # 2. Collect all R2 image keys (raw keys stored in DB, not full URLs)
        R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL", "").rstrip("/")
        image_keys = []

        def extract_key(url_or_key):
            """Strip R2 public URL prefix to get the raw object key."""
            if not url_or_key or not isinstance(url_or_key, str):
                return None
            key = url_or_key.strip()
            # Remove version param
            key = key.split("?")[0]
            # Strip the R2 public base URL if present
            if R2_PUBLIC_URL and key.startswith(R2_PUBLIC_URL):
                key = key[len(R2_PUBLIC_URL):].lstrip("/")
            # Skip external/fallback URLs (Unsplash, blob:, http)
            if key.startswith("http://") or key.startswith("https://") or key.startswith("blob:"):
                return None
            return key if key else None

        for field in ["images", "gallery", "photos", "photo_list"]:
            if field in product and isinstance(product[field], list):
                for img in product[field]:
                    key = extract_key(img)
                    if key:
                        image_keys.append(key)

        for field in ["image", "photo", "image_url", "thumbnail"]:
            if product.get(field):
                key = extract_key(product[field])
                if key:
                    image_keys.append(key)

        # 3. Delete all unique image keys from R2
        deleted_r2 = 0
        for key in set(image_keys):
            success = delete_file_from_r2(key)
            if success:
                deleted_r2 += 1
            else:
                print(f"[!] Could not delete R2 key: {key}", flush=True)

        print(f"[✓] Deleted {deleted_r2}/{len(set(image_keys))} R2 images for product {product_id}", flush=True)

        # 4. Delete MongoDB document
        result = products_col.delete_one({"_id": oid})
        if result.deleted_count == 0:
            return jsonify({"error": "Product not found"}), 404

        # 5. Broadcast real-time update
        socketio.emit("products_updated", {"type": "delete", "id": product_id})

        return jsonify({"message": "Product and all associated images deleted"}), 200

    except Exception as e:
        print(f"[✗] Delete product error: {e}", flush=True)
        return jsonify({"error": str(e)}), 500


# ════════════════════════════════════════════════════════════════════
#  PRODUCT REORDER (Bulk display_order update)
# ════════════════════════════════════════════════════════════════════

@app.route("/api/products/reorder", methods=["PUT"])
@jwt_required()
def reorder_products():
    """
    Bulk-update display_order for multiple products in one atomic operation.
    Body: { "items": [{ "id": "<objectid>", "display_order": 0 }, ...] }
    """
    try:
        data = request.get_json(force=True, silent=True) or {}
        items = data.get("items", [])

        if not items or not isinstance(items, list):
            return jsonify({"error": "items array is required"}), 400

        # Build a bulk write operation — one UpdateOne per product
        from pymongo import UpdateOne
        operations = []
        for item in items:
            try:
                oid = ObjectId(item["id"])
            except Exception:
                continue  # skip invalid IDs gracefully
            operations.append(
                UpdateOne(
                    {"_id": oid},
                    {"$set": {"display_order": int(item["display_order"]), "updated_at": datetime.utcnow()}}
                )
            )

        if not operations:
            return jsonify({"error": "No valid product IDs provided"}), 400

        result = products_col.bulk_write(operations, ordered=False)
        print(f"[✓] reorder_products: updated {result.modified_count}/{len(operations)} products", flush=True)

        # Broadcast reorder event so all connected clients (public pages) update immediately
        try:
            socketio.emit("products_reordered", {
                "items": [{"id": item["id"], "display_order": item["display_order"]} for item in items]
            })
        except Exception as sock_err:
            print(f"[!] reorder_products: socket emit failed (non-critical): {sock_err}", flush=True)

        return jsonify({
            "message": "Product order updated",
            "updated": result.modified_count
        }), 200

    except Exception as e:
        import traceback
        print(f"[✗] reorder_products UNEXPECTED ERROR: {e}", flush=True)
        print(traceback.format_exc(), flush=True)
        return jsonify({"error": str(e)}), 500




# ════════════════════════════════════════════════════════════════════
#  ENQUIRIES
# ════════════════════════════════════════════════════════════════════

@app.route("/api/enquiries", methods=["GET"])
@jwt_required()
def get_enquiries():
    query = {}
    search = request.args.get("search", "").strip()
    status_filter = request.args.get("status", "").strip()
    sort_order = request.args.get("sort", "newest")  # newest | oldest

    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
            {"interested_product": {"$regex": search, "$options": "i"}},
            {"reference_no": {"$regex": search, "$options": "i"}},
        ]

    if status_filter and status_filter != "all":
        query["status"] = status_filter

    sort_dir = -1 if sort_order == "newest" else 1
    enqs = serialize_list(enquiries_col.find(query).sort("_id", sort_dir))
    return jsonify(enqs), 200


def send_admin_notification_email(enquiry_data):
    def send_email():
        try:
            smtp_host = os.getenv("SMTP_HOST")
            smtp_port = int(os.getenv("SMTP_PORT", 587))
            smtp_user = os.getenv("SMTP_USER")
            smtp_pass = os.getenv("SMTP_PASS")
            admin_email = os.getenv("ADMIN_EMAIL", "admin@ddinfra.com")

            if not all([smtp_host, smtp_user, smtp_pass]):
                print("[!] SMTP credentials missing. Skipping email notification.")
                return

            enq_type = enquiry_data.get("enquiryType", "standard")
            subject_prefix = "[PRICE REQUEST]" if enq_type == "price_request" else "[NEW ENQUIRY]"
            product_name = enquiry_data.get("interested_product", "General")
            
            msg = MIMEMultipart()
            msg["From"] = smtp_user
            msg["To"] = admin_email
            msg["Subject"] = f"{subject_prefix} {product_name}"

            body = f"""
New Enquiry Received:

Name: {enquiry_data.get('name')}
Email: {enquiry_data.get('email')}
Phone: {enquiry_data.get('phone')}
Country: {enquiry_data.get('country')}
Product: {product_name}
Type: {"Price Request" if enq_type == "price_request" else "Standard Enquiry"}

Message:
{enquiry_data.get('message', '')}
"""
            msg.attach(MIMEText(body, "plain"))

            server = smtplib.SMTP(smtp_host, smtp_port)
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
            server.quit()
            print("[✓] Admin notification email sent successfully.")
        except Exception as e:
            print(f"[✗] Failed to send admin notification email: {e}")

    threading.Thread(target=send_email).start()

@app.route("/api/enquiries", methods=["POST"])
def create_enquiry():
    data = request.get_json(force=True, silent=True) or {}
    if not data:
        return jsonify({"error": "No data provided"}), 400
    data["created_at"] = datetime.utcnow().isoformat()
    data["status"]     = data.get("status", "new")
    data["is_read"]    = False
    data["enquiryType"] = data.get("enquiryType", "standard")
    
    result = enquiries_col.insert_one(data)
    data["id"] = str(result.inserted_id)
    data.pop("_id", None)
    
    # Send email notification
    send_admin_notification_email(data)
    
    # Broadcast real-time to admin panels
    try:
        socketio.emit("enquiry_submitted", data)
        socketio.emit("enquiry:new", data)
    except Exception:
        pass
    return jsonify(data), 201


@app.route("/api/enquiries/<enquiry_id>", methods=["PUT"])
@jwt_required()
def update_enquiry(enquiry_id):
    data = request.get_json(force=True, silent=True) or {}
    data.pop("id", None)
    data.pop("_id", None)
    result = enquiries_col.update_one({"_id": ObjectId(enquiry_id)}, {"$set": data})
    if result.matched_count == 0:
        return jsonify({"error": "Enquiry not found"}), 404
    return jsonify({"message": "Enquiry updated"}), 200


@app.route("/api/enquiries/<enquiry_id>/status", methods=["PUT"])
@jwt_required()
def update_enquiry_status(enquiry_id):
    data   = request.get_json(force=True, silent=True) or {}
    status = data.get("status")
    if not status:
        return jsonify({"error": "status field required"}), 400
    result = enquiries_col.update_one({"_id": ObjectId(enquiry_id)}, {"$set": {"status": status}})
    if result.matched_count == 0:
        return jsonify({"error": "Enquiry not found"}), 404
    enq = enquiries_col.find_one({"_id": ObjectId(enquiry_id)})
    serialized = serialize(enq)
    try:
        socketio.emit("enquiry:statusUpdated", serialized)
    except Exception:
        pass
    return jsonify(serialized), 200


@app.route("/api/enquiries/<enquiry_id>/read", methods=["PUT"])
@jwt_required()
def mark_enquiry_read(enquiry_id):
    try:
        oid = ObjectId(enquiry_id)
    except Exception:
        return jsonify({"error": "Invalid enquiry ID"}), 400
    result = enquiries_col.update_one({"_id": oid}, {"$set": {"is_read": True}})
    if result.matched_count == 0:
        return jsonify({"error": "Enquiry not found"}), 404
    enq = enquiries_col.find_one({"_id": oid})
    serialized = serialize(enq)
    try:
        socketio.emit("enquiry:read", serialized)
    except Exception:
        pass
    return jsonify(serialized), 200


@app.route("/api/enquiries/<enquiry_id>", methods=["DELETE"])
@jwt_required()
def delete_enquiry(enquiry_id):
    result = enquiries_col.delete_one({"_id": ObjectId(enquiry_id)})
    if result.deleted_count == 0:
        return jsonify({"error": "Enquiry not found"}), 404
    return jsonify({"message": "Enquiry deleted"}), 200


# ════════════════════════════════════════════════════════════════════
#  CONTACT MESSAGES
# ════════════════════════════════════════════════════════════════════

@app.route("/api/contacts", methods=["GET"])
@jwt_required()
def get_contacts():
    query = {}
    search = request.args.get("search", "").strip()
    status_filter = request.args.get("status", "").strip()
    sort_order = request.args.get("sort", "newest")  # newest | oldest

    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
            {"message": {"$regex": search, "$options": "i"}},
        ]

    if status_filter and status_filter != "all":
        query["status"] = status_filter

    sort_dir = -1 if sort_order == "newest" else 1
    contacts = serialize_list(contacts_col.find(query).sort("_id", sort_dir))
    return jsonify(contacts), 200


@app.route("/api/contacts", methods=["POST"])
def create_contact():
    data = request.get_json(force=True, silent=True) or {}
    if not data:
        return jsonify({"error": "No data provided"}), 400
    data["created_at"] = datetime.utcnow().isoformat()
    data["status"]     = data.get("status", "new")
    data["is_read"]    = False
    result = contacts_col.insert_one(data)
    data["id"] = str(result.inserted_id)
    data.pop("_id", None)
    try:
        socketio.emit("contact:new", data)
        socketio.emit("contact:newMessage", data)
    except Exception:
        pass
    return jsonify(data), 201


@app.route("/api/contacts/<contact_id>/status", methods=["PUT"])
@jwt_required()
def update_contact_status(contact_id):
    data   = request.get_json(force=True, silent=True) or {}
    status = data.get("status")
    if not status:
        return jsonify({"error": "status field required"}), 400
    result = contacts_col.update_one({"_id": ObjectId(contact_id)}, {"$set": {"status": status}})
    if result.matched_count == 0:
        return jsonify({"error": "Contact message not found"}), 404
    contact = contacts_col.find_one({"_id": ObjectId(contact_id)})
    serialized = serialize(contact)
    try:
        socketio.emit("contact:statusUpdated", serialized)
    except Exception:
        pass
    return jsonify(serialized), 200


@app.route("/api/contacts/<contact_id>/read", methods=["PUT"])
@jwt_required()
def mark_contact_read(contact_id):
    try:
        oid = ObjectId(contact_id)
    except Exception:
        return jsonify({"error": "Invalid contact ID"}), 400
    result = contacts_col.update_one({"_id": oid}, {"$set": {"is_read": True}})
    if result.matched_count == 0:
        return jsonify({"error": "Contact message not found"}), 404
    contact = contacts_col.find_one({"_id": oid})
    serialized = serialize(contact)
    try:
        socketio.emit("contact:read", serialized)
    except Exception:
        pass
    return jsonify(serialized), 200


@app.route("/api/contacts/<contact_id>", methods=["DELETE"])
@jwt_required()
def delete_contact(contact_id):
    try:
        oid = ObjectId(contact_id)
    except Exception:
        return jsonify({"error": "Invalid contact ID"}), 400
    result = contacts_col.delete_one({"_id": oid})
    if result.deleted_count == 0:
        return jsonify({"error": "Contact message not found"}), 404
    try:
        socketio.emit("contact:deleted", {"id": contact_id})
    except Exception:
        pass
    return jsonify({"message": "Contact message deleted"}), 200


# ════════════════════════════════════════════════════════════════════
#  GALLERY
# ════════════════════════════════════════════════════════════════════

@app.route("/api/gallery", methods=["GET"])
def get_gallery():
    paginated = request.args.get("paginated") == "true"
    category = request.args.get("category")
    
    query = {}
    if category and category.lower() not in ("all", ""):
        import re
        query["category"] = re.compile(f"^{re.escape(category)}$", re.IGNORECASE)
        
    if paginated:
        try:
            page = int(request.args.get("page", 1))
            limit = int(request.args.get("limit", 10))
        except ValueError:
            page = 1
            limit = 10
            
        skip = (page - 1) * limit
        
        facet_pipeline = [
            {"$match": query},
            {"$sort": {"_id": -1}},
            {"$facet": {
                "metadata": [{"$count": "total"}],
                "data": [{"$skip": skip}, {"$limit": limit}]
            }}
        ]
        
        result = list(gallery_col.aggregate(facet_pipeline))
        data = serialize_list(result[0]["data"])
        total = result[0]["metadata"][0]["total"] if result[0]["metadata"] else 0
        total_pages = (total + limit - 1) // limit
        
        return jsonify({
            "gallery": data,
            "total": total,
            "page": page,
            "totalPages": total_pages
        }), 200
    else:
        items = serialize_list(gallery_col.find(query).sort("_id", -1))
        return jsonify(items), 200


@app.route("/api/gallery", methods=["POST"])
@jwt_required()
def create_gallery_item():
    # Handle JSON (for existing URL)
    if request.is_json:
        data = request.get_json()
        if not data or not data.get('image_url'):
            return jsonify({"error": "No image provided"}), 400
        data["created_at"] = datetime.utcnow().isoformat()
        result = gallery_col.insert_one(data)
        data["id"] = str(result.inserted_id)
        data.pop("_id", None)
        try:
            socketio.emit("gallery:imageAdded", data)
        except Exception:
            pass
        return jsonify(data), 201

    # Multipart — support single OR multiple files
    category = request.form.get("category", "Others")
    name_hint = request.form.get("name", "")

    files_uploaded = request.files.getlist("images")  # multi-file
    if not files_uploaded:
        single = request.files.get("image")
        if single:
            files_uploaded = [single]

    if not files_uploaded:
        return jsonify({"error": "No image(s) provided"}), 400

    created_items = []
    for idx, file in enumerate(files_uploaded):
        if not file or file.filename == '':
            continue
        try:
            file.seek(0, 2)
            size_bytes = file.tell()
            file.seek(0)
        except Exception:
            size_bytes = None

        key = upload_file_to_r2(file, file.filename)
        if not key:
            continue
        doc = {
            "image_url": key,
            "category": category,
            "name": name_hint or file.filename,
            "size": size_bytes,
            "created_at": datetime.utcnow().isoformat(),
        }
        result = gallery_col.insert_one(doc)
        doc["id"] = str(result.inserted_id)
        doc.pop("_id", None)
        created_items.append(doc)
        try:
            socketio.emit("gallery:imageAdded", doc)
        except Exception:
            pass

    if not created_items:
        return jsonify({"error": "Upload failed for all files"}), 500

    return jsonify(created_items if len(created_items) > 1 else created_items[0]), 201


@app.route("/api/gallery/<item_id>", methods=["PUT"])
@jwt_required()
def update_gallery_item(item_id):
    """Rename or change category of a gallery item."""
    try:
        oid = ObjectId(item_id)
    except Exception:
        return jsonify({"error": "Invalid item ID"}), 400
    data = request.get_json(force=True, silent=True) or {}
    data.pop("id", None)
    data.pop("_id", None)
    data.pop("image_url", None)  # image URL is immutable via this endpoint
    if not data:
        return jsonify({"error": "No update fields provided"}), 400
    result = gallery_col.update_one({"_id": oid}, {"$set": data})
    if result.matched_count == 0:
        return jsonify({"error": "Item not found"}), 404
    updated = gallery_col.find_one({"_id": oid})
    updated["id"] = str(updated.pop("_id"))
    try:
        socketio.emit("gallery:imageUpdated", updated)
    except Exception:
        pass
    return jsonify(updated), 200


@app.route("/api/gallery/<item_id>", methods=["DELETE"])
@jwt_required()
def delete_gallery_item(item_id):
    result = gallery_col.delete_one({"_id": ObjectId(item_id)})
    if result.deleted_count == 0:
        return jsonify({"error": "Item not found"}), 404
    try:
        socketio.emit("gallery:imageDeleted", {"id": item_id})
    except Exception:
        pass
    return jsonify({"message": "Gallery item deleted"}), 200


# ════════════════════════════════════════════════════════════════════
#  SETTINGS
# ════════════════════════════════════════════════════════════════════

@app.route("/api/settings", methods=["GET"])
def get_settings():
    s = settings_col.find_one({})
    return jsonify(serialize(s) if s else {}), 200


@app.route("/api/settings", methods=["PUT"])
@jwt_required()
def update_settings():
    data = request.get_json(force=True, silent=True) or {}
    data.pop("id", None)
    data.pop("_id", None)
    settings_col.update_one({}, {"$set": data}, upsert=True)
    return jsonify({"message": "Settings updated"}), 200


# ════════════════════════════════════════════════════════════════════
#  HEALTH CHECK
# ════════════════════════════════════════════════════════════════════

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "db": MONGO_DB_NAME}), 200
@app.route("/")
def home():
    return {"status": "ok"}


# ════════════════════════════════════════════════════════════════════
#  STATIC FILES (UPLOADS)
# ════════════════════════════════════════════════════════════════════

@app.route("/uploads/<path:filename>")
def serve_uploads(filename):
    uploads_dir = os.path.join(app.root_path, "uploads")
    return send_from_directory(uploads_dir, filename)

# ════════════════════════════════════════════════════════════════════
#  HERO MEDIA
# ════════════════════════════════════════════════════════════════════

ALLOWED_HERO_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm'}

@app.route("/api/hero-media", methods=["GET"])
def get_hero_media():
    """Public endpoint — returns enabled hero slides sorted by order."""
    items = serialize_list(hero_media_col.find().sort("order", 1))
    return jsonify(items), 200


@app.route("/api/hero-media/youtube", methods=["POST"])
@jwt_required()
def add_youtube_hero_media():
    """Accept a YouTube URL and store it as a hero slider entry."""
    import re
    data = request.get_json(force=True, silent=True) or {}
    youtube_url = (data.get("youtube_url") or "").strip()
    name = (data.get("name") or "YouTube Video").strip()

    if not youtube_url:
        return jsonify({"error": "youtube_url is required"}), 400

    # Extract video ID from URL
    patterns = [
        r"(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([^&?/\s]{11})",
        r"youtube\.com/shorts/([^&?/\s]{11})",
    ]
    video_id = None
    for pattern in patterns:
        match = re.search(pattern, youtube_url)
        if match:
            video_id = match.group(1)
            break

    if not video_id:
        return jsonify({"error": "Invalid YouTube URL. Please use a valid youtube.com or youtu.be link."}), 400

    thumbnail = f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"

    # Get current max order
    last = hero_media_col.find_one(sort=[("order", -1)])
    order = (last["order"] if last and "order" in last else -1) + 1

    doc = {
        "url": youtube_url,
        "youtube_url": youtube_url,
        "media_type": "youtube",
        "slider_type": "youtube",
        "thumbnail": thumbnail,
        "name": name,
        "enabled": True,
        "order": order,
        "fit": "cover",
        "created_at": datetime.utcnow().isoformat(),
    }
    result = hero_media_col.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    try:
        socketio.emit("hero:added", doc)
    except Exception:
        pass
    return jsonify(doc), 201


@app.route("/api/hero-media", methods=["POST"])
@jwt_required()
def upload_hero_media():
    files = request.files.getlist("files")
    if not files:
        f = request.files.get("file")
        if f:
            files = [f]
    if not files:
        return jsonify({"error": "No files provided"}), 400

    # Get current max order
    last = hero_media_col.find_one(sort=[("order", -1)])
    order_counter = (last["order"] if last and "order" in last else -1) + 1

    created = []
    for file in files:
        if not file or not file.filename:
            continue
        ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
        if ext not in ALLOWED_HERO_EXTENSIONS:
            continue
        # Detect type
        mime = file.content_type or ""
        media_type = "video" if ("video" in mime or ext in {"mp4", "webm"}) else "image"

        key = upload_file_to_r2(file, file.filename)
        if not key:
            continue

        doc = {
            "url": key,
            "media_type": media_type,
            "name": file.filename,
            "enabled": True,
            "order": order_counter,
            "fit": "cover",
            "created_at": datetime.utcnow().isoformat(),
        }
        result = hero_media_col.insert_one(doc)
        doc["id"] = str(result.inserted_id)
        doc.pop("_id", None)
        try:
            socketio.emit("hero:added", doc)
        except Exception:
            pass
        created.append(doc)
        order_counter += 1

    return jsonify(created), 201


@app.route("/api/hero-media/<item_id>", methods=["PUT"])
@jwt_required()
def update_hero_media(item_id):
    try:
        oid = ObjectId(item_id)
    except Exception:
        return jsonify({"error": "Invalid ID"}), 400
    data = request.get_json(force=True, silent=True) or {}
    data.pop("_id", None)
    data.pop("id", None)
    hero_media_col.update_one({"_id": oid}, {"$set": data})
    item = hero_media_col.find_one({"_id": oid})
    serialized = serialize(item)
    try:
        socketio.emit("hero:updated", serialized)
    except Exception:
        pass
    return jsonify(serialized), 200


@app.route("/api/hero-media/<item_id>", methods=["DELETE"])
@jwt_required()
def delete_hero_media(item_id):
    try:
        oid = ObjectId(item_id)
    except Exception:
        return jsonify({"error": "Invalid ID"}), 400
    item = hero_media_col.find_one({"_id": oid})
    if not item:
        return jsonify({"error": "Not found"}), 404
    # Delete from R2
    url_key = item.get("url", "")
    if url_key and not url_key.startswith("http"):
        try:
            r2.delete_object(Bucket=R2_BUCKET, Key=url_key)
        except Exception as e:
            print(f"[!] Hero media R2 delete error: {e}", flush=True)
    hero_media_col.delete_one({"_id": oid})
    try:
        socketio.emit("hero:deleted", {"id": item_id})
    except Exception:
        pass
    return jsonify({"message": "Deleted"}), 200



@app.route("/api/parts", methods=["GET"])
def get_parts():
    query = {}
    search = request.args.get("search")
    sort_by = request.args.get("sort", "Newest")
    paginated = request.args.get("paginated") == "true"

    machine_types = request.args.get("machine_types")
    if machine_types:
        types_list = [t.strip() for t in machine_types.split(",") if t.strip()]
        if types_list:
            query["machine_type"] = {"$in": [re.compile(re.escape(t), re.IGNORECASE) for t in types_list]}

    brands = request.args.get("brands")
    if brands:
        brand_list = [b.strip() for b in brands.split(",") if b.strip()]
        if brand_list:
            query["brand"] = {"$in": [re.compile(re.escape(b), re.IGNORECASE) for b in brand_list]}

    models = request.args.get("models")
    if models:
        model_list = [m.strip() for m in models.split(",") if m.strip()]
        if model_list:
            query["model"] = {"$in": [re.compile(re.escape(m), re.IGNORECASE) for m in model_list]}

    category = request.args.get("category")
    if category:
        cat_list = [c.strip() for c in category.split(",") if c.strip()]
        if cat_list:
            query["category"] = {"$in": [re.compile(re.escape(c), re.IGNORECASE) for c in cat_list]}

    condition = request.args.get("condition")
    if condition and condition.lower() not in ("all", ""):
        query["condition"] = re.compile(f"^{re.escape(condition)}$", re.IGNORECASE)

    status = request.args.get("status")
    if status and status.lower() not in ("all", ""):
        status_map = {
            "available": "in_stock",
            "sold": "sold",
            "coming soon": "coming_soon",
            "reserved": "coming_soon"
        }
        db_status = status_map.get(status.lower())
        if db_status:
            if db_status == "in_stock":
                query["$or"] = [
                    {"availability": "in_stock"},
                    {"availability": {"$exists": False}},
                    {"availability": ""}
                ]
            else:
                query["availability"] = db_status

    if search:
        search_words = [re.escape(word) for word in search.split() if word]
        if search_words:
            and_clauses = []
            for word in search_words:
                and_clauses.append({
                    "$or": [
                        {"name": {"$regex": word, "$options": "i"}},
                        {"brand": {"$regex": word, "$options": "i"}},
                        {"model": {"$regex": word, "$options": "i"}},
                        {"part_number": {"$regex": word, "$options": "i"}},
                        {"machine_type": {"$regex": word, "$options": "i"}},
                        {"category": {"$regex": word, "$options": "i"}}
                    ]
                })
            if "$and" in query:
                query["$and"].extend(and_clauses)
            else:
                query["$and"] = and_clauses

    pipeline = [{"$match": query}]

    # Sort logic
    sort_query = {"_id": -1}
    if sort_by == "Newest":
        sort_query = {"_id": -1}
    elif sort_by == "Oldest":
        sort_query = {"_id": 1}
    
    pipeline.append({"$sort": sort_query})

    if paginated:
        try:
            page = int(request.args.get("page", 1))
            limit = int(request.args.get("limit", 10))
        except ValueError:
            page = 1
            limit = 10
        skip = (page - 1) * limit
        facet_pipeline = [
            {"$facet": {
                "metadata": [{"$count": "total"}],
                "data": [{"$skip": skip}, {"$limit": limit}]
            }}
        ]
        full_pipeline = pipeline + facet_pipeline
        result = list(parts_col.aggregate(full_pipeline))
        data = serialize_list(result[0]["data"])
        total = result[0]["metadata"][0]["total"] if result[0]["metadata"] else 0
        total_pages = (total + limit - 1) // limit
        resp = jsonify({
            "parts": data,
            "total": total,
            "page": page,
            "totalPages": total_pages
        })
    else:
        parts = serialize_list(parts_col.aggregate(pipeline))
        resp = jsonify(parts)

    resp.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    return resp, 200

@app.route("/api/parts/<part_id>", methods=["GET"])
def get_part(part_id):
    try:
        part = parts_col.find_one({"_id": ObjectId(part_id)})
        if not part:
            return jsonify({"error": "Part not found"}), 404
        return jsonify(serialize(part)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/api/parts", methods=["POST"])
@jwt_required()
def create_part():
    try:
        data = request.get_json(force=True, silent=True)
        if not data:
            return jsonify({"success": False, "message": "No part data provided"}), 400

        name = (data.get("name") or "").strip()
        if not name:
            return jsonify({"success": False, "message": "Part name is required"}), 400

        availability = data.get("availability") or "in_stock"
        if availability not in ["in_stock", "coming_soon", "sold"]:
            data["availability"] = "in_stock"
            
        images = data.get("images")
        if images is None or not isinstance(images, list):
            data["images"] = []
        else:
            data["images"] = [u for u in images if u and isinstance(u, str) and u.strip()]
        data["image"] = data["images"][0] if data["images"] else None

        now = datetime.utcnow()
        data["created_at"] = now.isoformat()
        data["updated_at"] = now

        # Generate part reference number
        counter = counters_col.find_one_and_update(
            {"category": "PARTS"},
            {"$inc": {"seq": 1}},
            upsert=True,
            return_document=True
        )
        seq = counter.get("seq", 1)
        data["reference_no"] = f"PART-{str(seq).zfill(4)}"

        result = parts_col.insert_one(data)
        part = parts_col.find_one({"_id": result.inserted_id})
        serialized = serialize(part)
        
        try:
            socketio.emit("parts_updated", {"type": "create", "id": serialized.get("id"), "part": serialized})
        except Exception:
            pass
            
        return jsonify(serialized), 201
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route("/api/parts/<part_id>", methods=["PUT"])
@jwt_required()
def update_part(part_id):
    try:
        oid = ObjectId(part_id)
        data = request.get_json(force=True, silent=True) or {}
        data.pop("id", None)
        data.pop("_id", None)

        if "images" in data and isinstance(data["images"], list):
            data["images"] = [u for u in data["images"] if u and isinstance(u, str) and u.strip()]

        data["updated_at"] = datetime.utcnow()
        
        result = parts_col.update_one({"_id": oid}, {"$set": data})
        if result.matched_count == 0:
            return jsonify({"success": False, "message": "Part not found"}), 404

        updated_part = parts_col.find_one({"_id": oid})
        serialized = serialize(updated_part)

        try:
            socketio.emit("parts_updated", {"type": "update", "id": part_id, "part": serialized})
        except Exception:
            pass

        return jsonify(serialized), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route("/api/parts/<part_id>", methods=["DELETE"])
@jwt_required()
def delete_part(part_id):
    try:
        oid = ObjectId(part_id)
        part = parts_col.find_one({"_id": oid})
        if not part:
            return jsonify({"success": False, "message": "Part not found"}), 404

        parts_col.delete_one({"_id": oid})
        try:
            socketio.emit("parts_updated", {"type": "delete", "id": part_id})
        except Exception:
            pass

        return jsonify({"success": True, "message": "Part deleted"}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# ════════════════════════════════════════════════════════════════════
#  ENTRY POINT
# ════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"DDInfra and Co Backend (Real-Time) running on http://0.0.0.0:{port}")
    socketio.run(app, host="0.0.0.0", port=port, debug=False, allow_unsafe_werkzeug=True)
