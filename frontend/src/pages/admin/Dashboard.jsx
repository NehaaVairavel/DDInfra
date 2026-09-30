import { useState, useEffect, useMemo } from "react";
import publicService from "@/services/publicService";
import enquiryService from "@/services/enquiryService";
import {
  CheckCircle,
  Mail,
  TrendingUp,
  TrendingDown,
  Globe,
  Box,
  Activity,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { useProductStore } from "@/store/useProductStore";
import "@/styles/admin.css";

/* ─── CountUp animation ─── */
const CountUp = ({ end, duration = 1400, prefix = "" }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(ease * end));
      if (progress < 1) window.requestAnimationFrame(step);
      else setCount(end);
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return (
    <>
      {prefix}
      {count.toLocaleString()}
    </>
  );
};

/* ─── Color map per card ─── */
const colorMap = {
  yellow: {
    iconBg: "#FEF9EC",
    iconColor: "#B45309",
    lineStroke: "#F5B301",
    trendBg: "#FEF9EC",
    trendColor: "#B45309",
  },
  blue: {
    iconBg: "#EFF6FF",
    iconColor: "#1D4ED8",
    lineStroke: "#3B82F6",
    trendBg: "#EFF6FF",
    trendColor: "#1D4ED8",
  },
  green: {
    iconBg: "#F0FDF4",
    iconColor: "#16A34A",
    lineStroke: "#22C55E",
    trendBg: "#F0FDF4",
    trendColor: "#16A34A",
  },
  purple: {
    iconBg: "#F5F3FF",
    iconColor: "#7C3AED",
    lineStroke: "#8B5CF6",
    trendBg: "#F5F3FF",
    trendColor: "#7C3AED",
  },
  orange: {
    iconBg: "#FFF7ED",
    iconColor: "#EA580C",
    lineStroke: "#F97316",
    trendBg: "#FFF7ED",
    trendColor: "#EA580C",
  },
};

/* ─── KPI Stat Card ─── */
const KpiCard = ({
  superTitle,
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  prefix = "",
  color = "yellow",
}) => {
  const theme = colorMap[color] || colorMap.yellow;

  return (
    <div className="kpi-card p-5 group">
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        {/* Icon */}
        <div
          className="flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105"
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: theme.iconBg,
            color: theme.iconColor,
          }}
        >
          <Icon size={18} />
        </div>

        {/* Trend badge + sparkline */}
        <div className="flex flex-col items-end gap-2">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
            style={{
              background: trendUp ? "#F0FDF4" : "#FFF1F2",
              color: trendUp ? "#16A34A" : "#BE123C",
            }}
          >
            {trendUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.04em",
              }}
            >
              {trend}
            </span>
          </div>

          {/* Mini sparkline */}
          <div
            style={{
              width: "72px",
              height: "28px",
              opacity: 0.45,
              transition: "opacity 0.4s ease",
            }}
            className="group-hover:!opacity-100"
          >
            <svg
              viewBox="0 0 100 30"
              className="w-full h-full overflow-visible"
            >
              <path
                d={
                  trendUp
                    ? "M0,25 Q20,18 40,20 T75,8 T100,3"
                    : "M0,5 Q20,12 40,18 T70,14 T100,24"
                }
                fill="none"
                stroke={theme.lineStroke}
                strokeWidth="3"
                strokeLinecap="round"
                className="chart-line"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Number + label */}
      <div>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "9px",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#94A3B8",
            marginBottom: "4px"
          }}
        >
          {superTitle}
        </p>
        <p
          className="admin-label-small mb-1"
          style={{ color: "#334155", fontWeight: 700, fontSize: "11px" }}
        >
          {title}
        </p>
        <div className="flex items-end gap-2 mt-1">
          <h3 className="admin-stats-number" style={{ color: "#0F172A", fontSize: "24px", lineHeight: "1.1" }}>
            <CountUp end={value} prefix={prefix} />
          </h3>
          <div
            className="flex items-center gap-1 mb-1.5"
            style={{
              background: "#F0FDF4",
              borderRadius: "99px",
              padding: "2px 8px",
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "#22C55E" }}
            />
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "10px",
                fontWeight: 700,
                color: "#16A34A",
                letterSpacing: "0.04em",
              }}
            >
              Live
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Dashboard Page ─── */
const Dashboard = () => {
  const { products, loading: productsLoading } = useProductStore();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  const stats = useMemo(() => {
    const normalizeAvailability = (value) => {
      const v = (value ?? "").toString().trim().toLowerCase();
      if (v === "sold") return "sold";
      if (v === "coming_soon" || v === "coming soon") return "coming_soon";
      return "in_stock";
    };

    return {
      total_products: products.length,
      available_products: products.filter(p => normalizeAvailability(p.availability) === "in_stock").length,
      sold_products: products.filter(p => normalizeAvailability(p.availability) === "sold").length,
      coming_soon_products: products.filter(p => normalizeAvailability(p.availability) === "coming_soon").length,
      enquiries_count: enquiries.length,
    };
  }, [products, enquiries]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const enquiriesData = await enquiryService.getAll();
        setEnquiries(
          Array.isArray(enquiriesData) ? enquiriesData.slice(0, 6) : []
        );
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading)
    return (
      <div className="admin-loading">
        <div className="flex items-center gap-3">
          <Activity size={18} style={{ color: "#F5B301" }} />
          <span>Loading Dashboard...</span>
        </div>
      </div>
    );

  return (
    <div style={{ animation: "fadeIn 0.5s ease" }}>
      {/* ── Page Header ── */}
      <div className="admin-page-header mb-8">
        <div>
          <h1 className="admin-dashboard-title" style={{ fontSize: "28px", color: "#111827" }}>
            Operations Dashboard
          </h1>
          <p className="admin-page-subtitle">
            Real-time view of global machinery export operations
          </p>
        </div>
        <div
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{ background: "#F0FDF4", border: "1px solid #86EFAC" }}
        >
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: "#22C55E" }}
          />
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "12px",
              fontWeight: 700,
              color: "#16A34A",
            }}
          >
            All Systems Live
          </span>
        </div>
      </div>

      {/* ── KPI Stats Grid ── */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8"
      >
        <KpiCard
          superTitle="Inventory Overview"
          title="TOTAL INVENTORY"
          value={stats.total_products}
          icon={Box}
          trend="+5"
          trendUp={true}
          color="yellow"
        />
        <KpiCard
          superTitle="Marketplace Status"
          title="ACTIVE LISTINGS"
          value={stats.available_products}
          icon={Globe}
          trend="+8"
          trendUp={true}
          color="blue"
        />
        <KpiCard
          superTitle="Sales Analytics"
          title="SOLD UNITS"
          value={stats.sold_products}
          icon={CheckCircle}
          trend="+15"
          trendUp={true}
          color="green"
        />
        <KpiCard
          superTitle="Product Pipeline"
          title="COMING SOON"
          value={stats.coming_soon_products || 0}
          icon={Clock}
          trend="Upcoming"
          trendUp={true}
          color="orange"
        />
      </div>

      {/* ── Global Inquiries Table ── */}
      <div
        className="admin-card overflow-hidden"
        style={{ borderRadius: "28px" }}
      >
        {/* Card header */}
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-7 py-5"
          style={{ borderBottom: "1px solid #EEF2F7" }}
        >
          <div>
            <h2
              className="admin-dashboard-title"
              style={{ fontSize: "20px", color: "#111827" }}
            >
              Global Inquiries
            </h2>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "13px",
                color: "#64748B",
                marginTop: "3px",
              }}
            >
              Live feed of active machinery export requests
            </p>
          </div>
          <Link
            to="/admin/enquiries"
            className="btn-secondary shrink-0"
            style={{ padding: "9px 20px", fontSize: "13px" }}
          >
            View Full Log
          </Link>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="admin-table" style={{ minWidth: "580px" }}>
            <thead>
              <tr>
                <th className="admin-table-header text-left">
                  Client / Origin
                </th>
                <th className="admin-table-header text-left">
                  Machinery Requested
                </th>
                <th className="admin-table-header text-center">Lifecycle</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    style={{
                      padding: "48px",
                      textAlign: "center",
                      color: "#94A3B8",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "14px",
                    }}
                  >
                    No active inquiries at this time.
                  </td>
                </tr>
              ) : (
                enquiries.map((q) => (
                  <tr key={q.id}>
                    {/* Client */}
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          className="flex items-center justify-center shrink-0 text-sm font-bold"
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            background: "#F1F3F7",
                            color: "#374151",
                            fontFamily: "'Sora', sans-serif",
                          }}
                        >
                          {q.name?.[0]?.toUpperCase() || "C"}
                        </div>
                        <div>
                          <div
                            style={{
                              fontFamily: "'Inter', sans-serif",
                              fontWeight: 700,
                              fontSize: "13px",
                              color: "#111827",
                            }}
                          >
                            {q.name}
                          </div>
                          <div
                            className="admin-label-small"
                            style={{
                              color: "#B45309",
                              marginTop: "2px",
                              fontSize: "9px",
                            }}
                          >
                            {q.country || "Unknown"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Machinery */}
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex items-center justify-center shrink-0"
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "8px",
                            background: "#F6F7FB",
                            color: "#64748B",
                          }}
                        >
                          <Box size={13} />
                        </div>
                        <span
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 600,
                            fontSize: "13px",
                            color: "#374151",
                          }}
                        >
                          {q.interested_product || "Fleet Inquiry"}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ textAlign: "center" }}>
                      <span
                        className={`status-pill ${
                          q.status === "new"
                            ? "status-pill-new"
                            : "status-pill-contacted"
                        }`}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            background:
                              q.status === "new" ? "#F59E0B" : "#22C55E",
                            display: "inline-block",
                          }}
                        />
                        {q.status === "new" ? "New" : "Contacted"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-7 py-3"
          style={{
            borderTop: "1px solid #F1F3F7",
            background: "#FAFBFC",
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "#22C55E" }}
            />
            <span
              className="admin-label-small"
              style={{ color: "#94A3B8", fontSize: "9px" }}
            >
              Data Synced: Just Now
            </span>
          </div>
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "12px",
              color: "#CBD5E1",
            }}
          >
            {enquiries.length} of {enquiries.length} records
          </span>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
