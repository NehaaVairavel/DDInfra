import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { useContactStore } from "@/store/useContactStore";
import {
  Search,
  Mail,
  Phone,
  Download,
  SlidersHorizontal,
  Trash2,
  ChevronDown,
  ArrowUpDown,
  RefreshCw,
  Calendar,
  X,
} from "lucide-react";
import { toast } from "sonner";
import "@/styles/admin.css";

/* ─────────────────────────── Status config ─────────────────────────── */
const STATUS_CONFIG = {
  new:         { label: "New",         dot: "#F59E0B", bg: "#FEF9EC", border: "#FDE68A", text: "#92400E" },
  contacted:   { label: "Contacted",   dot: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE", text: "#1E40AF" },
  resolved:    { label: "Resolved",    dot: "#22C55E", bg: "#F0FDF4", border: "#86EFAC", text: "#166534" },
  closed:      { label: "Closed",      dot: "#64748B", bg: "#F1F5F9", border: "#CBD5E1", text: "#334155" },
};
const ALL_STATUSES = ["new", "contacted", "resolved", "closed"];

/* ─────────────────── Portal-based Status Dropdown ─────────────────── */
const StatusDropdown = ({ value, onChange, messageId }) => {
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
    onChange(messageId, status);
  };

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
const AdminMessages = () => {
  const { messages, loading, init, fetchMessages, updateStatus, deleteMessage, markAsRead } = useContactStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    init();
  }, [init]);

  const handleRowExpand = useCallback((id, isRead) => {
    setExpandedId((prev) => {
      const next = prev === id ? null : id;
      if (next !== null && !isRead) {
        markAsRead(id);
      }
      return next;
    });
  }, [markAsRead]);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updateStatus(id, newStatus);
      toast.success(`Status updated to ${STATUS_CONFIG[newStatus]?.label}`);
    } catch {
      toast.error("Status update failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this message permanently?")) return;
    try {
      await deleteMessage(id);
      toast.success("Message deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ["Name", "Email", "Phone", "Message", "Status", "Date"],
      ...filteredMessages.map((m) => [
        m.name, m.email, m.phone, m.message,
        m.status, new Date(m.created_at).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${(v || "").toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "messages.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const filteredMessages = useMemo(() => {
    return messages
      .filter((m) => {
        const q = searchQuery.toLowerCase();
        const matchSearch =
          !q ||
          (m.name || "").toLowerCase().includes(q) ||
          (m.email || "").toLowerCase().includes(q) ||
          (m.phone || "").toLowerCase().includes(q) ||
          (m.message || "").toLowerCase().includes(q);

        const matchStatus = activeStatus === "all" || m.status === activeStatus;

        let matchDate = true;
        if (dateFrom || dateTo) {
          const created = new Date(m.created_at);
          if (dateFrom && created < new Date(dateFrom)) matchDate = false;
          if (dateTo && created > new Date(dateTo + "T23:59:59")) matchDate = false;
        }

        return matchSearch && matchStatus && matchDate;
      })
      .sort((a, b) => {
        const da = new Date(a.created_at), db = new Date(b.created_at);
        return sortOrder === "newest" ? db - da : da - db;
      });
  }, [messages, searchQuery, activeStatus, sortOrder, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearchQuery(""); setActiveStatus("all");
    setDateFrom(""); setDateTo("");
  };
  const hasActiveFilters = searchQuery || activeStatus !== "all" || dateFrom || dateTo;

  if (loading && messages.length === 0)
    return <div className="admin-loading"><span>Loading Messages...</span></div>;

  return (
    <div style={{ animation: "fadeIn 0.5s ease" }}>
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Contact Messages</h1>
          <p className="admin-page-subtitle">
            Manage general queries and message leads · {messages.length} total messages
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={fetchMessages} className="btn-secondary" title="Refresh">
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
            placeholder="Search name, phone, email, message..."
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
          {filteredMessages.length} results
        </div>
      </div>

      {/* Table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th className="admin-table-header text-left">Sender</th>
                <th className="admin-table-header text-left">Contact Info</th>
                <th className="admin-table-header text-left">Message Preview</th>
                <th className="admin-table-header text-left">Date</th>
                <th className="admin-table-header text-left">Status</th>
                <th className="admin-table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMessages.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 56, textAlign: "center", color: "#94A3B8", fontFamily: "'Inter',sans-serif", fontSize: 14 }}>
                    No messages match your filters.
                  </td>
                </tr>
              ) : filteredMessages.map((m) => (
                <>
                  <tr
                    key={m.id}
                    onClick={() => handleRowExpand(m.id, m.is_read)}
                    style={{
                      cursor: "pointer",
                      background: !m.is_read ? "rgba(245,179,1,0.04)" : undefined,
                      borderLeft: !m.is_read ? "3px solid #F5B301" : "3px solid transparent",
                    }}
                  >
                    {/* Sender */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <div style={{ position: "relative" }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 9, background: "#F1F3F7",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13, color: "#374151", flexShrink: 0,
                          }}>
                            {m.name?.[0]?.toUpperCase() || "M"}
                          </div>
                          {!m.is_read && (
                            <span style={{
                              position: "absolute", top: -3, right: -3,
                              width: 10, height: 10, borderRadius: "50%",
                              background: "#F5B301", border: "2px solid #fff",
                            }} />
                          )}
                        </div>
                        <div>
                          <div style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 13, color: "#111827" }}>
                            {m.name}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#374151" }}>
                          <Mail size={11} style={{ color: "#94A3B8" }} />
                          <a href={`mailto:${m.email}`} style={{ color: "#374151", textDecoration: "none" }} onClick={(ev) => ev.stopPropagation()}>
                            {m.email}
                          </a>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#374151" }}>
                          <Phone size={11} style={{ color: "#94A3B8" }} />
                          <a href={`tel:${m.phone}`} style={{ color: "#374151", textDecoration: "none" }} onClick={(ev) => ev.stopPropagation()}>
                            {m.phone}
                          </a>
                        </div>
                      </div>
                    </td>

                    {/* Message Preview */}
                    <td>
                      <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: "#475569", maxWidth: 350, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {m.message || "No message content."}
                      </div>
                    </td>

                    {/* Date */}
                    <td>
                      <div style={{ color: "#64748B", fontSize: 12, fontFamily: "'Inter',sans-serif" }}>
                        {new Date(m.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>

                    {/* Status */}
                    <td onClick={(ev) => ev.stopPropagation()}>
                      <StatusDropdown value={m.status || "new"} onChange={handleStatusUpdate} messageId={m.id} />
                    </td>

                    {/* Actions */}
                    <td onClick={(ev) => ev.stopPropagation()}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                        <button
                          onClick={() => handleDelete(m.id)}
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
                  {expandedId === m.id && (
                    <tr key={`${m.id}-expanded`} style={{ background: "#FAFBFC" }}>
                      <td colSpan={6} style={{ padding: "0 20px 16px 20px" }}>
                        <div style={{
                          background: "#fff", border: "1px solid #EAECEF", borderRadius: 12,
                          padding: "14px 16px", fontFamily: "'Inter',sans-serif", fontSize: 13, color: "#374151", lineHeight: 1.7,
                        }}>
                          <p style={{ fontWeight: 700, fontSize: 11, color: "#94A3B8", textTransform: "uppercase", marginBottom: 6 }}>Client Message Body</p>
                          <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{m.message || "No message body provided."}</p>
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
        <div style={{ display: "flex", alignItems: "center", justifySpace: "between", padding: "12px 28px", borderTop: "1px solid #F1F3F7", background: "#FAFBFC", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", animation: "pulse 2s ease infinite" }} />
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, color: "#94A3B8" }}>Live Data — Click row to expand message · Unread rows highlighted in amber</span>
          </div>
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: "#CBD5E1" }}>
            {filteredMessages.length} / {messages.length} records
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

export default AdminMessages;
