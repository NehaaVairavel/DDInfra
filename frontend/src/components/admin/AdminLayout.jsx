import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEnquiryStore } from "@/store/useEnquiryStore";
import { useContactStore } from "@/store/useContactStore";
import logo from "@/assets/logo.png";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Mail,
  Image as ImageIcon,
  Settings,
  LogOut,
  Search,
  Bell,
  Menu,
  ChevronDown,
  Globe,
  Clock,
  Box,
  Wrench,
  Layers,
  X,
  MessageSquare,
  Film,
} from "lucide-react";
import "@/styles/admin.css";

/* ─── Sidebar Navigation Item ─── */
const SidebarItem = ({ icon: Icon, label, path, onClick, badge }) => (
  <NavLink
    to={path}
    end={path === "/admin"}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 mx-3 rounded-2xl transition-all duration-300 group relative mb-1 ${
        isActive
          ? "sidebar-active-premium admin-sidebar-label text-[#111827]"
          : "sidebar-hover text-[#64748B] hover:text-[#111827]"
      }`
    }
  >
    {({ isActive }) => (
      <>
        <Icon
          size={17}
          className={`shrink-0 transition-all duration-300 ${
            isActive
              ? "text-[#111827]"
              : "group-hover:translate-x-0.5 group-hover:text-[#111827]"
          }`}
        />
        <span className="admin-sidebar-label flex items-center justify-between w-full">
          <span>{label}</span>
          {badge > 0 && (
            <span className="ml-auto bg-[#EF4444] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center animate-pulse">
              {badge}
            </span>
          )}
        </span>
      </>
    )}
  </NavLink>
);


/* ─── Sidebar Group (Expandable) ─── */
const SidebarGroup = ({ icon: Icon, label, subItems, onSubItemClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full gap-3 px-4 py-3 mx-3 rounded-2xl transition-all duration-300 group relative sidebar-hover text-[#64748B] hover:text-[#111827] cursor-pointer"
        style={{ width: "calc(100% - 24px)", border: "none", background: "transparent" }}
      >
        <div className="flex items-center gap-3">
          <Icon size={17} className="shrink-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-[#111827]" />
          <span className="admin-sidebar-label">{label}</span>
        </div>
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out`}
        style={{ maxHeight: isOpen ? "200px" : "0", opacity: isOpen ? 1 : 0 }}
      >
        <div className="pl-12 pr-4 py-1 flex flex-col gap-1">
          {subItems.map((item, idx) => (
            <NavLink
              key={idx}
              to={item.path}
              onClick={onSubItemClick}
              className={({ isActive }) =>
                `block py-2 px-3 rounded-xl text-[12px] font-medium transition-colors ${
                  isActive ? "bg-[#FEF9EC] text-[#F5B301]" : "text-[#64748B] hover:text-[#111827] hover:bg-slate-50"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── Main AdminLayout ─── */
const AdminLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [uaeTime, setUaeTime] = useState("");
  const [isNotifOpen, setNotifOpen] = useState(false);
  const bellRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const { enquiries, init: initEnquiries, markAsRead: markEnquiryRead } = useEnquiryStore();
  const { messages, init: initContacts, markAsRead: markContactRead } = useContactStore();

  useEffect(() => {
    initEnquiries();
    initContacts();
  }, [initEnquiries, initContacts]);

  // Close notification panel when clicking outside bell or dropdown
  useEffect(() => {
    if (!isNotifOpen) return;
    const handleClickOutside = (e) => {
      if (
        bellRef.current && !bellRef.current.contains(e.target) &&
        notifRef.current && !notifRef.current.contains(e.target)
      ) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isNotifOpen]);

  useEffect(() => {
    const updateTime = () => {
      const options = {
        timeZone: "Asia/Dubai",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      };
      setUaeTime(new Intl.DateTimeFormat("en-US", options).format(new Date()));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const unreadEnquiries = enquiries.filter((e) => e.is_read === false);
  const unreadEnquiriesCount = unreadEnquiries.length;

  const unreadMessages = messages.filter((m) => m.is_read === false);
  const unreadMessagesCount = unreadMessages.length;

  const totalUnreadCount = unreadEnquiriesCount + unreadMessagesCount;

  const mergedNotifications = useMemo(() => {
    const list = [
      ...unreadEnquiries.map(e => ({
        id: e.id,
        type: "enquiry",
        name: e.name,
        title: e.interested_product || "General Enquiry",
        date: e.created_at,
      })),
      ...unreadMessages.map(m => ({
        id: m.id,
        type: "message",
        name: m.name,
        title: m.message || "General Message",
        date: m.created_at,
      }))
    ];
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [unreadEnquiries, unreadMessages]);

  const toggleSidebar = () => setSidebarOpen((p) => !p);

  const menuItems = [
    { icon: LayoutDashboard, label: "Home", path: "/admin" },
    { icon: Box, label: "Products", path: "/admin/products" },
    { icon: PlusCircle, label: "Add Product", path: "/admin/add-product" },
    { 
      icon: Wrench, 
      label: "Parts", 
      subItems: [
        { label: "Parts List", path: "/admin/parts" },
        { label: "Add New Part", path: "/admin/add-part" },
      ]
    },
    { icon: Layers, label: "Gallery", path: "/admin/media" },
    { icon: Film, label: "Hero Slider", path: "/admin/hero-media" },
    { icon: Mail, label: "Enquiries", path: "/admin/enquiries", badge: unreadEnquiriesCount },
    { icon: MessageSquare, label: "Messages", path: "/admin/messages", badge: unreadMessagesCount },
  ];

  return (
    <div
      className="flex h-screen overflow-hidden antialiased"
      style={{ background: "#F6F7FB", fontFamily: "'Inter', sans-serif" }}
    >
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(17,24,39,0.45)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ══════════════════════════ SIDEBAR ══════════════════════════ */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          width: "230px",
          minWidth: "230px",
          background: "#ffffff",
          borderRight: "1px solid #EAECEF",
          boxShadow: "4px 0 20px rgba(15,23,42,0.04)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-6 shrink-0"
          style={{
            height: "68px",
            borderBottom: "1px solid #EAECEF",
          }}
        >
          <div
            className="flex items-center justify-center shrink-0 overflow-hidden"
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "10px",
              background: "#F6F7FB",
              border: "1px solid #EAECEF",
            }}
          >
            <img src={logo} alt="DD Infra & CO" className="h-5 w-auto object-contain" />
          </div>
          <div className="flex flex-col">
            <span
              style={{
                fontFamily: "'Sora', sans-serif",
                fontWeight: 700,
                fontSize: "17px",
                color: "#111827",
                letterSpacing: "-0.03em",
                lineHeight: 1.2,
              }}
            >
              DD Infra & CO
            </span>
            <span
              className="admin-label-small"
              style={{ color: "#F5B301", fontSize: "9px" }}
            >
              Heavy Equipment
            </span>
          </div>

          {/* Mobile close */}
          <button
            className="ml-auto lg:hidden"
            onClick={() => setSidebarOpen(false)}
            style={{ color: "#64748B" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation section label */}
        <div className="px-6 pt-6 pb-2">
          <span
            className="admin-label-small"
            style={{ color: "#CBD5E1", fontSize: "9px" }}
          >
            Navigation
          </span>
        </div>

        {/* Menu items */}
        <nav
          className="flex-1 overflow-y-auto custom-scrollbar py-1 flex flex-col"
          style={{ gap: "2px" }}
        >
          {menuItems.map((item, i) => item.subItems ? (
            <SidebarGroup
              key={item.label}
              icon={item.icon}
              label={item.label}
              subItems={item.subItems}
              onSubItemClick={() => setSidebarOpen(false)}
            />
          ) : (
            <SidebarItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              path={item.path}
              onClick={() => setSidebarOpen(false)}
              badge={item.badge}
            />
          ))}
        </nav>

        {/* Divider */}
        <div className="sidebar-separator" />

        {/* Logout */}
        <div className="px-3 pb-5">
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-2xl transition-all duration-300 group"
            style={{ color: "#64748B" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#FFF1F2";
              e.currentTarget.style.color = "#BE123C";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#64748B";
            }}
          >
            <LogOut
              size={17}
              className="shrink-0 transition-transform duration-300 group-hover:-translate-x-0.5"
            />
            <span className="admin-sidebar-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* ══════════════════════════ MAIN CONTENT ══════════════════════════ */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ── TOP NAVBAR ── */}
        <header
          className="shrink-0 sticky top-0 z-[9999] flex items-center justify-between px-5 sm:px-7"
          style={{
            height: "68px",
            background: "#ffffff",
            borderBottom: "1px solid #EAECEF",
            boxShadow: "0 1px 0 #EAECEF",
          }}
        >
          {/* Left side */}
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 rounded-xl transition-colors"
              style={{ color: "#64748B" }}
              onClick={toggleSidebar}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F6F7FB")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Menu size={22} />
            </button>

            {/* Search bar */}
            <div
              className="hidden md:flex items-center gap-2 flex-1 max-w-[340px]"
              style={{
                background: "#F6F7FB",
                border: "1px solid #EAECEF",
                borderRadius: "14px",
                padding: "10px 16px",
                transition: "all 0.2s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.background = "#ffffff";
                e.currentTarget.style.borderColor = "#F5B301";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(245,179,1,0.12)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.background = "#F6F7FB";
                e.currentTarget.style.borderColor = "#EAECEF";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <Search size={15} style={{ color: "#94A3B8", flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search products, enquiries..."
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  width: "100%",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#111827",
                }}
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* UAE Time badge */}
            <div
              className="hidden xl:flex items-center gap-2 px-3 py-2"
              style={{
                background: "#F6F7FB",
                border: "1px solid #EAECEF",
                borderRadius: "12px",
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "#22C55E" }}
              />
              <div className="flex flex-col">
                <span
                  className="admin-label-small"
                  style={{ color: "#94A3B8", fontSize: "8px" }}
                >
                  Dubai, UAE
                </span>
                <span
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    fontWeight: 700,
                    fontSize: "12px",
                    color: "#111827",
                    lineHeight: 1.2,
                  }}
                >
                  {uaeTime}
                </span>
              </div>
            </div>

            {/* Quick Add */}
            <button
              className="hidden sm:flex btn-quick-add-premium items-center gap-2"
              style={{ padding: "10px 18px", borderRadius: "14px" }}
              onClick={() => navigate("/admin/add-product")}
            >
              <PlusCircle size={15} />
              <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "13px" }}>
                Quick Add
              </span>
            </button>

            {/* Notification bell */}
            <div className="relative">
              <button
                ref={bellRef}
                className="flex items-center justify-center rounded-xl transition-all relative"
                style={{
                  width: "40px",
                  height: "40px",
                  background: isNotifOpen ? "#FEF9EC" : "#F6F7FB",
                  border: `1px solid ${isNotifOpen ? "#FDE68A" : "#EAECEF"}`,
                  color: isNotifOpen ? "#F5B301" : "#64748B",
                }}
                onClick={() => setNotifOpen((p) => !p)}
                onMouseEnter={(e) => { if (!isNotifOpen) e.currentTarget.style.color = "#111827"; }}
                onMouseLeave={(e) => { if (!isNotifOpen) e.currentTarget.style.color = "#64748B"; }}
                aria-label="Notifications"
                aria-expanded={isNotifOpen}
              >
                <Bell size={17} />
                {totalUnreadCount > 0 ? (
                  <span
                    className="absolute -top-1 -right-1 flex items-center justify-center rounded-full ring-2 ring-white text-white animate-pulse"
                    style={{ minWidth: 16, height: 16, background: "#EF4444", fontSize: 9, fontWeight: 800, padding: "0 3px" }}
                  >
                    {totalUnreadCount > 9 ? "9+" : totalUnreadCount}
                  </span>
                ) : (
                  <span
                    className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full ring-2 ring-white"
                    style={{ background: "#F5B301" }}
                  />
                )}
              </button>

              {/* Portal — renders directly on document.body, never clipped by parent overflow */}
              {isNotifOpen && createPortal(
                <div
                  ref={notifRef}
                  className="notif-dropdown"
                  style={{
                    position: "fixed",
                    top: "76px",
                    right: "24px",
                    width: "320px",
                    zIndex: 99999,
                  }}
                >
                  <div
                    className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: "1px solid #F1F3F7" }}
                  >
                    <span
                      style={{
                        fontFamily: "'Sora', sans-serif",
                        fontWeight: 700,
                        fontSize: "14px",
                        color: "#111827",
                      }}
                    >
                      Unread Feed
                    </span>
                    {totalUnreadCount > 0 && (
                      <span
                        style={{
                          background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A",
                          borderRadius: 999, padding: "2px 8px", fontSize: 9, fontWeight: 800,
                        }}
                      >
                        {totalUnreadCount} New
                      </span>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto custom-scrollbar">
                    {mergedNotifications.length === 0 ? (
                      <div style={{ padding: "24px 20px", textAlign: "center", color: "#94A3B8", fontSize: 13, fontFamily: "'Inter',sans-serif" }}>
                        All caught up! No unread notifications.
                      </div>
                    ) : (
                      mergedNotifications.slice(0, 8).map((item) => (
                        <div
                          key={`${item.type}-${item.id}`}
                          className="px-5 py-3.5 cursor-pointer transition-colors"
                          style={{ borderBottom: "1px solid #F8FAFC" }}
                          onClick={() => {
                            setNotifOpen(false);
                            if (item.type === "enquiry") {
                              navigate("/admin/enquiries");
                              markEnquiryRead(item.id);
                            } else {
                              navigate("/admin/messages");
                              markContactRead(item.id);
                            }
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#FFFBEB")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: item.type === "enquiry" ? "#F5B301" : "#3B82F6", flexShrink: 0 }} />
                            <div
                              style={{
                                fontFamily: "'Inter', sans-serif",
                                fontWeight: 700,
                                fontSize: "13px",
                                color: "#111827",
                              }}
                            >
                              {item.name || "Client"}{" "}
                              <span style={{ fontSize: "10px", color: "#64748B", fontWeight: 500 }}>
                                ({item.type === "enquiry" ? "Enquiry" : "Message"})
                              </span>
                            </div>
                          </div>
                          <div
                            style={{
                              fontFamily: "'Inter', sans-serif",
                              fontSize: "11px",
                              color: "#94A3B8",
                              marginTop: "3px",
                              paddingLeft: 13,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }}
                          >
                            {item.title}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div
                    className="px-5 py-3 text-center flex justify-around"
                    style={{ borderTop: "1px solid #F1F3F7" }}
                  >
                    <button
                      style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: 600, color: "#64748B" }}
                      onClick={() => { setNotifOpen(false); navigate("/admin/enquiries"); }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#F5B301")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
                    >
                      Enquiries
                    </button>
                    <span style={{ color: "#CBD5E1" }}>|</span>
                    <button
                      style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: 600, color: "#64748B" }}
                      onClick={() => { setNotifOpen(false); navigate("/admin/messages"); }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#3B82F6")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
                    >
                      Messages
                    </button>
                  </div>
                </div>,
                document.body
              )}
            </div>

            {/* Divider */}
            <div
              className="hidden sm:block w-px h-8 mx-1"
              style={{ background: "#EAECEF" }}
            />

            {/* Admin profile */}
            <div className="flex items-center gap-2.5 cursor-pointer group">
              <div className="hidden lg:flex flex-col items-end">
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: "13px",
                    color: "#111827",
                  }}
                >
                  {user?.username || "Admin User"}
                </span>
                <span
                  className="admin-label-small"
                  style={{
                    background: "#FEF9EC",
                    color: "#B45309",
                    border: "1px solid #FDE68A",
                    borderRadius: "6px",
                    padding: "2px 6px",
                    fontSize: "8px",
                  }}
                >
                  Global Manager
                </span>
              </div>
              <div
                className="flex items-center justify-center text-sm font-bold transition-all duration-300"
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "12px",
                  background: "#111827",
                  color: "#F5B301",
                  fontFamily: "'Sora', sans-serif",
                  fontWeight: 800,
                  boxShadow: "0 2px 8px rgba(17,24,39,0.2)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 6px 20px rgba(245,179,1,0.35)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(17,24,39,0.2)";
                }}
              >
                {user?.username?.[0]?.toUpperCase() || "A"}
              </div>
              <ChevronDown
                size={14}
                style={{ color: "#CBD5E1" }}
                className="group-hover:text-[#64748B] transition-colors"
              />
            </div>
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <div
          className="flex-1 overflow-auto"
          style={{ background: "#F6F7FB", padding: "28px 24px" }}
        >
          <div className="w-full max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
