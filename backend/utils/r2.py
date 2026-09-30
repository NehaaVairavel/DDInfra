import os
import boto3
from botocore.config import Config
from datetime import datetime
import mimetypes

# Map common image extensions to MIME types
_MIME_MAP = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".bmp": "image/bmp",
    ".svg": "image/svg+xml",
}

def _get_content_type(filename):
    """Return the correct MIME type based on the file extension."""
    ext = os.path.splitext(filename)[-1].lower()
    return _MIME_MAP.get(ext, mimetypes.guess_type(filename)[0] or "image/jpeg")


def get_r2_client():
    endpoint = os.getenv("R2_ENDPOINT_URL")
    access_key = os.getenv("R2_ACCESS_KEY")
    secret_key = os.getenv("R2_SECRET_KEY")

    if not endpoint or not access_key or not secret_key:
        raise EnvironmentError(
            "R2 credentials are not configured. "
            "Set R2_ENDPOINT_URL, R2_ACCESS_KEY and R2_SECRET_KEY."
        )

    return boto3.client(
        's3',
        endpoint_url=endpoint,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=Config(signature_version='s3v4'),
        region_name='auto'
    )


def upload_file_to_r2(file_obj, filename):
    """
    Upload a file-like object to Cloudflare R2.
    Returns the unique object key (str) on success, or None on failure.
    """
    try:
        bucket = os.getenv("R2_BUCKET")
        if not bucket:
            raise EnvironmentError("R2_BUCKET environment variable is not set.")

        r2 = get_r2_client()
        content_type = _get_content_type(filename)

        # Create a unique filename to avoid collisions
        timestamp = int(datetime.utcnow().timestamp())
        safe_name = filename.replace(' ', '_').replace('/', '_')
        unique_filename = f"{timestamp}_{safe_name}"

        print(f"[→] Uploading to R2: bucket={bucket} key={unique_filename} type={content_type}", flush=True)

        r2.upload_fileobj(
            file_obj,
            bucket,
            unique_filename,
            ExtraArgs={'ContentType': content_type}
        )

        print(f"[✓] R2 upload success: {unique_filename}", flush=True)
        return unique_filename

    except EnvironmentError as e:
        print(f"[✗] R2 config error: {str(e)}", flush=True)
        raise  # Re-raise so the caller knows it's a config issue
    except Exception as e:
        print(f"[✗] R2 upload failed for '{filename}': {str(e)}", flush=True)
        return None


def delete_file_from_r2(key):
    """Delete a single object from R2 by its key. Returns True on success."""
    try:
        r2 = get_r2_client()
        bucket = os.getenv("R2_BUCKET")
        if not bucket or not key:
            print(f"[!] R2 delete skipped — missing bucket or key.", flush=True)
            return False
        r2.delete_object(Bucket=bucket, Key=key)
        print(f"[✓] R2 deleted: {key}", flush=True)
        return True
    except Exception as e:
        print(f"[✗] R2 delete error for key '{key}': {str(e)}", flush=True)
        return False
