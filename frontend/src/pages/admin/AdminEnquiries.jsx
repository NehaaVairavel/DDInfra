import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { useEnquiryStore } from "@/store/useEnquiryStore";
import {
  Search,
  Mail,
  Phone,
  Download,
  SlidersHorizontal,
  Trash2,
  ChevronDown,
  ArrowUpDown,
  Package,
  RefreshCw,
  Calendar,
  Hash,
  MapPin,
  X,
} from "lucide-react";
import { toast } from "sonner";
import "@/styles/admin.css";

/* ─────────────────────────── Status config ─────────────────────────── */
const STATUS_CONFIG = {
  new:         { label: "New",         dot: "#F59E0B", bg: "#FEF9EC", border: "#FDE68A", text: "#92400E" },
  contacted:   { label: "Contacted",   dot: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE", text: "#1E40AF" },
  in_progress: { label: "In Progress", dot: "#8B5CF6", bg: "#F5F3FF", border: "#DDD6FE", text: "#5B21B6" },
  closed:      { label: "Closed",      dot: "#22C55E", bg: "#F0FDF4", border: "#86EFAC", text: "#166534" },
};
const ALL_STATUSES = ["new", "contacted", "in_progress", "closed"];

/* ─────────────────────────── Status Pill ─────────────────────────── */
const StatusPill = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      color: cfg.text, borderRadius: 999, padding: "3px 10px",
      fontSize: 10, fontWeight: 700, fontFamily: "'Inter', sans-serif",
      textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
};

/* ─────────────────────────── Enquiry Type Badge ─────────────────────────── */
const EnquiryTypeBadge = ({ type }) => {
  if (type === "price_request") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        background: "#FFF7ED", border: "1px solid #FED7AA", color: "#C2410C",
        borderRadius: 6, padding: "2px 6px", fontSize: 10, fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.04em",
      }}>
        PRICE REQUEST
      </span>
    );
  }
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1D4ED8",
      borderRadius: 6, padding: "2px 6px", fontSize: 10, fontWeight: 700,
      textTransform: "uppercase", letterSpacing: "0.04em",
    }}>
      STANDARD
    </span>
  );
};

/* ─────────────────── Portal-based Status Dropdown ─────────────────── */
const StatusDropdown = ({ value, onChange, enquiryId }) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const cfg = STATUS_CONFIG[value] || STATUS_CONFIG.new;

  const openDropdown = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      });
    }
    setOpen(true);
  };

  const handleSelect = async (status) => {
    setOpen(false);
    if (status === value) return;
    onChange(enquiryId, status);
  };

  // Close on outside click / scroll
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("mousedown", close, true);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", close, true);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={(e) => { e.stopPropagation(); openDropdown(); }}
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          background: cfg.bg, border: `1px solid ${cfg.border}`,
          color: cfg.text, borderRadius: 999, padding: "3px 8px 3px 10px",
          fontSize: 10, fontWeight: 700, fontFamily: "'Inter', sans-serif",
          textTransform: "uppercase", letterSpacing: "0.04em", cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot }} />
        {cfg.label}
        <ChevronDown size={10} style={{ opacity: 0.6 }} />
      </button>

      {open && ReactDOM.createPortal(
        <div
          style={{
            position: "absolute",
            top: coords.top,
            left: coords.left,
            zIndex: 9999,
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #EAECEF",
            boxShadow: "0 8px 24px rgba(15,23,42,0.13)",
            overflow: "hidden",
            minWidth: 140,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {ALL_STATUSES.map((s) => {
            const c = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={(e) => { e.stopPropagation(); handleSelect(s); }}
                style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%",
                  padding: "9px 14px",
                  background: s === value ? "#F8FAFC" : "transparent",
                  border: "none", cursor: "pointer",
                  fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: c.text,
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.dot }} />
                {c.label}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
};

/* ─────────────────────────── Main Component ─────────────────────────── */
const formatOffer = (amount, currency) => {
  if (!amount) return "No Offer";
  const num = Number(amount).toLocaleString();
  if (currency === 'USD') return `$${num}`;
  if (currency === 'EUR') return `€${num}`;
  if (currency === 'INR') return `₹${num}`;
  if (currency === 'AED') return `AED ${num}`;
  return currency ? `${currency} ${num}` : num;
};

const AdminEnquiries = () => {
  const { enquiries, loading, fetchEnquiries, updateStatus, deleteEnquiry, markAsRead } = useEnquiryStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState("all");
  const [activeCountry, setActiveCountry] = useState("All");
  const [sortOrder, setSortOrder] = useState("newest");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  // Refresh on mount to make sure latest data is loaded
  useEffect(() => { fetchEnquiries(); }, [fetchEnquiries]);

  /* ── Row expand: auto mark-as-read ── */
  const handleRowExpand = useCallback((id, isRead) => {
    setExpandedId((prev) => {
      const next = prev === id ? null : id;
      if (next !== null && !isRead) {
        markAsRead(id);
      }
      return next;
    });
  }, [markAsRead]);

  /* ── Status update via store ── */
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updateStatus(id, newStatus);
      toast.success(`Status updated to ${STATUS_CONFIG[newStatus]?.label}`);
    } catch {
      toast.error("Status update failed");
    }
  };

  /* ── Delete via store ── */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this enquiry permanently?")) return;
    try {
      await deleteEnquiry(id);
      toast.success("Enquiry deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  /* ── CSV export ── */
  const handleExportCSV = () => {
    const rows = [
      ["Name", "Email", "Phone", "Country", "City", "Product", "Ref No", "Price", "Offer", "Year", "Status", "Date"],
      ...filteredEnquiries.map((e) => [
        e.name, e.email, e.phone, e.country, e.city,
        e.interested_product, e.reference_no, e.product_price, formatOffer(e.offer_amount, e.offer_currency), e.product_year,
        e.status, new Date(e.created_at).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${(v || "").toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "enquiries.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const countries = ["All", ...new Set(enquiries.map((e) => e.country).filter(Boolean))];

  const filteredEnquiries = useMemo(() => {
    return enquiries
      .filter((e) => {
        const q = searchQuery.toLowerCase();
        const matchSearch =
          !q ||
          (e.name || "").toLowerCase().includes(q) ||
          (e.email || "").toLowerCase().includes(q) ||
          (e.phone || "").toLowerCase().includes(q) ||
          (e.interested_product || "").toLowerCase().includes(q) ||
          (e.reference_no || "").toLowerCase().includes(q);

        const matchStatus = activeStatus === "all" || e.status === activeStatus;
        const matchCountry = activeCountry === "All" || e.country === activeCountry;

        let matchDate = true;
        if (dateFrom || dateTo) {
          const created = new Date(e.created_at);
          if (dateFrom && created < new Date(dateFrom)) matchDate = false;
          if (dateTo && created > new Date(dateTo + "T23:59:59")) matchDate = false;
        }

        return matchSearch && matchStatus && matchCountry && matchDate;
      })
      .sort((a, b) => {
        const da = new Date(a.created_at), db = new Date(b.created_at);
        return sortOrder === "newest" ? db - da : da - db;
      });
  }, [enquiries, searchQuery, activeStatus, activeCountry, sortOrder, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearchQuery(""); setActiveStatus("all"); setActiveCountry("All");
    setDateFrom(""); setDateTo("");
  };
  const hasActiveFilters = searchQuery || activeStatus !== "all" || activeCountry !== "All" || dateFrom || dateTo;

  if (loading && enquiries.length === 0)
    return <div className="admin-loading"><span>Loading Leads...</span></div>;

  return (
    <div style={{ animation: "fadeIn 0.5s ease" }}>
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Client Enquiries</h1>
          <p className="admin-page-subtitle">
            Manage global machinery requests · {enquiries.length} total leads
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={fetchEnquiries} className="btn-secondary" title="Refresh">
            <RefreshCw size={15} style={{ color: "#F5B301" }} />
            Refresh
          </button>
          <button onClick={handleExportCSV} className="btn-secondary">
            <Download size={16} style={{ color: "#F5B301" }} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="admin-filter-bar" style={{ flexWrap: "wrap", gap: 10 }}>
        {/* Search */}
        <div className="relative" style={{ minWidth: 220, maxWidth: 340, flex: 1 }}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={15} style={{ color: "#94A3B8" }} />
          <input
            type="text"
            placeholder="Search name, phone, email, ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-input"
            style={{ paddingLeft: 40 }}
          />
        </div>

        <div className="hidden xl:block w-px h-8" style={{ background: "#EAECEF" }} />

        {/* Status filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <SlidersHorizontal size={14} style={{ color: "#94A3B8" }} />
          <select
            value={activeStatus}
            onChange={(e) => setActiveStatus(e.target.value)}
            style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 600, color: "#374151", background: "transparent", border: "none", outline: "none", cursor: "pointer" }}
          >
            <option value="all">All Statuses</option>
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
          </select>
        </div>

        {/* Country filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <MapPin size={14} style={{ color: "#94A3B8" }} />
          <select
            value={activeCountry}
            onChange={(e) => setActiveCountry(e.target.value)}
            style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 600, color: "#374151", background: "transparent", border: "none", outline: "none", cursor: "pointer" }}
          >
            {countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Date range */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Calendar size={14} style={{ color: "#94A3B8" }} />
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            style={{ fontSize: 12, color: "#374151", border: "none", background: "transparent", outline: "none", cursor: "pointer" }} />
          <span style={{ color: "#94A3B8", fontSize: 12 }}>–</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            style={{ fontSize: 12, color: "#374151", border: "none", background: "transparent", outline: "none", cursor: "pointer" }} />
        </div>

        {/* Sort toggle */}
        <button
          onClick={() => setSortOrder((o) => o === "newest" ? "oldest" : "newest")}
          style={{
            display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
            borderRadius: 8, border: "1px solid #EAECEF", background: "#F8FAFC",
            cursor: "pointer", fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 600, color: "#374151",
          }}
        >
          <ArrowUpDown size={13} />
          {sortOrder === "newest" ? "Newest First" : "Oldest First"}
        </button>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button onClick={clearFilters} style={{
            display: "flex", alignItems: "center", gap: 4, padding: "5px 10px",
            borderRadius: 8, border: "1px solid #FECDD3", background: "#FFF1F2",
            color: "#BE123C", cursor: "pointer", fontSize: 12, fontWeight: 600,
          }}>
            <X size={12} /> Clear
          </button>
        )}

        <div style={{ marginLeft: "auto", fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 600, color: "#64748B" }}>
          {filteredEnquiries.length} results
        </div>
      </div>

      {/* Table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th className="admin-table-header text-left">Product</th>
                <th className="admin-table-header text-left">Client</th>
                <th className="admin-table-header text-left">Contact</th>
                <th className="admin-table-header text-left">Type</th>
                <th className="admin-table-header text-left">Location</th>
                <th className="admin-table-header text-left">Offer Price</th>
                <th className="admin-table-header text-left">Status</th>
                <th className="admin-table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnquiries.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 56, textAlign: "center", color: "#94A3B8", fontFamily: "'Inter',sans-serif", fontSize: 14 }}>
                    No enquiries match your filters.
                  </td>
                </tr>
              ) : filteredEnquiries.map((e) => (
                <>
                  <tr
                    key={e.id}
                    onClick={() => handleRowExpand(e.id, e.is_read)}
                    style={{
                      cursor: "pointer",
                      background: !e.is_read ? "rgba(245,179,1,0.04)" : undefined,
                      borderLeft: !e.is_read ? "3px solid #F5B301" : "3px solid transparent",
                    }}
                  >
                    {/* Product */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {/* Unread indicator dot */}
                        <div style={{ position: "relative" }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: 10,
                            background: "#F1F3F7", overflow: "hidden", flexShrink: 0,
                            border: "1px solid #EAECEF",
                          }}>
                            {e.product_image ? (
                              <img src={e.product_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Package size={18} style={{ color: "#CBD5E1" }} />
                              </div>
                            )}
                          </div>
                          {!e.is_read && (
                            <span style={{
                              position: "absolute", top: -3, right: -3,
                              width: 10, height: 10, borderRadius: "50%",
                              background: "#F5B301", border: "2px solid #fff",
                            }} />
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 13, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 150 }}>
                            {e.interested_product || "General Inquiry"}
                          </div>
                          <div style={{ display: "flex", gap: 4, marginTop: 3, flexWrap: "wrap" }}>
                            {e.reference_no && e.reference_no !== "N/A" && (
                              <span style={{
                                background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE",
                                borderRadius: 6, padding: "1px 6px", fontSize: 9, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 2
                              }}>
                                <Hash size={8} />
                                {e.reference_no}
                              </span>
                            )}
                            {e.product_year && (
                              <span style={{
                                background: "#F5F3FF", color: "#6D28D9", border: "1px solid #DDD6FE",
                                borderRadius: 6, padding: "1px 6px", fontSize: 9, fontWeight: 700
                              }}>
                                {e.product_year}
                              </span>
                            )}
                            {e.product_price && (
                              <span style={{
                                background: "#F0FDF4", color: "#15803D", border: "1px solid #86EFAC",
                                borderRadius: 6, padding: "1px 6px", fontSize: 9, fontWeight: 700
                              }}>
                                {e.product_price}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Client */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 9, background: "#F1F3F7",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13, color: "#374151", flexShrink: 0,
                        }}>
                          {e.name?.[0]?.toUpperCase() || "C"}
                        </div>
                        <div>
                          <div style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 13, color: "#111827" }}>
                            {e.name}
                          </div>
                          <div style={{ color: "#94A3B8", fontSize: 10, marginTop: 1 }}>
                            {new Date(e.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#374151" }}>
                          <Mail size={11} style={{ color: "#94A3B8" }} />
                          <a href={`mailto:${e.email}`} style={{ color: "#374151", textDecoration: "none" }} onClick={(ev) => ev.stopPropagation()}>
                            {e.email}
                          </a>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#374151" }}>
                          <Phone size={11} style={{ color: "#94A3B8" }} />
                          <a href={`tel:${e.phone}`} style={{ color: "#374151", textDecoration: "none" }} onClick={(ev) => ev.stopPropagation()}>
                            {e.phone}
                          </a>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td>
                      <EnquiryTypeBadge type={e.enquiryType || "standard"} />
                    </td>

                    {/* Location */}
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <span style={{
                          background: "#FEF9EC", color: "#B45309", border: "1px solid #FDE68A",
                          borderRadius: 6, padding: "2px 7px", fontSize: 10, fontWeight: 700, display: "inline-block", width: "fit-content"
                        }}>
                          {e.country || "—"}
                        </span>
                        {e.city && (
                          <span style={{ fontSize: 11, color: "#94A3B8" }}>
                            {e.city}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Offer Price */}
                    <td>
                      <span style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 13, color: e.offer_amount ? "#15803D" : "#94A3B8" }}>
                        {formatOffer(e.offer_amount, e.offer_currency)}
                      </span>
                    </td>

                    {/* Status */}
                    <td onClick={(ev) => ev.stopPropagation()}>
                      <StatusDropdown value={e.status || "new"} onChange={handleStatusUpdate} enquiryId={e.id} />
                    </td>

                    {/* Actions */}
                    <td onClick={(ev) => ev.stopPropagation()}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                        <button
                          onClick={() => handleDelete(e.id)}
                          title="Delete"
                          style={{
                            width: 32, height: 32, borderRadius: 9, background: "#F6F7FB",
                            border: "1px solid #EAECEF", color: "#64748B", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                          onMouseEnter={(el) => { el.currentTarget.style.background = "#FFF1F2"; el.currentTarget.style.borderColor = "#FECDD3"; el.currentTarget.style.color = "#BE123C"; }}
                          onMouseLeave={(el) => { el.currentTarget.style.background = "#F6F7FB"; el.currentTarget.style.borderColor = "#EAECEF"; el.currentTarget.style.color = "#64748B"; }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded message row */}
                  {expandedId === e.id && (
                    <tr key={`${e.id}-expanded`} style={{ background: "#FAFBFC" }}>
                      <td colSpan={8} style={{ padding: "0 20px 16px 20px" }}>
                        <div style={{
                          background: "#fff", border: "1px solid #EAECEF", borderRadius: 12,
                          padding: "14px 16px", fontFamily: "'Inter',sans-serif", fontSize: 13, color: "#374151", lineHeight: 1.7,
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <p style={{ fontWeight: 700, fontSize: 11, color: "#94A3B8", textTransform: "uppercase", margin: 0 }}>Client Message</p>
                            {e.offer_amount && (
                              <p style={{ fontWeight: 700, fontSize: 12, color: "#166534", margin: 0 }}>
                                Offer: {formatOffer(e.offer_amount, e.offer_currency)}
                              </p>
                            )}
                          </div>
                          <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{e.message || "No message provided."}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 28px", borderTop: "1px solid #F1F3F7", background: "#FAFBFC" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", animation: "pulse 2s ease infinite" }} />
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, color: "#94A3B8" }}>Live Data — Click row to expand message · Unread rows highlighted in amber</span>
          </div>
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: "#CBD5E1" }}>
            {filteredEnquiries.length} / {enquiries.length} records
          </span>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
};

export default AdminEnquiries;
