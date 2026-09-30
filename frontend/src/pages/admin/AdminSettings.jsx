import { useState, useEffect } from "react";
import settingsService from "@/services/settingsService";
import {
  Building,
  Mail,
  Lock,
  LogOut,
  Globe,
  Smartphone,
  MapPin,
  MessageCircle,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import "@/styles/admin.css";

/* ─── Tab button ─── */
const TabButton = ({ active, label, icon: Icon, onClick }) => (
  <button
    onClick={onClick}
    className="settings-tab-btn"
    style={
      active
        ? {
            background: "linear-gradient(135deg, #F5B301 0%, #FFCC33 100%)",
            color: "#111827",
            boxShadow: "0 4px 14px rgba(245,179,1,0.28)",
          }
        : {}
    }
  >
    <Icon size={16} style={{ flexShrink: 0 }} />
    <span style={{ flex: 1 }}>{label}</span>
    {active && <ChevronRight size={14} />}
  </button>
);

/* ─── Form section card ─── */
const Section = ({ title, description, children }) => (
  <div
    className="admin-card p-8"
    style={{
      borderRadius: "28px",
      animation: "fadeIn 0.3s ease",
    }}
  >
    <div
      className="mb-7 pb-6"
      style={{ borderBottom: "1px solid #F1F3F7" }}
    >
      <h2
        style={{
          fontFamily: "'Sora', sans-serif",
          fontWeight: 700,
          fontSize: "20px",
          color: "#111827",
          letterSpacing: "-0.03em",
          marginBottom: "4px",
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "14px",
          color: "#64748B",
        }}
      >
        {description}
      </p>
    </div>
    {children}
  </div>
);

/* ─── Input field ─── */
const Input = ({ label, icon: Icon, type = "text", value, onChange, name, ...props }) => (
  <div style={{ marginBottom: "20px" }}>
    <label
      style={{
        display: "block",
        fontFamily: "'Inter', sans-serif",
        fontSize: "13px",
        fontWeight: 600,
        color: "#374151",
        marginBottom: "6px",
      }}
    >
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <Icon
          className="absolute left-4 top-1/2 -translate-y-1/2"
          size={16}
          style={{ color: "#94A3B8" }}
        />
      )}
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        className="admin-input"
        style={Icon ? { paddingLeft: "44px" } : {}}
        {...props}
      />
    </div>
  </div>
);

/* ─── AdminSettings Page ─── */
const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState("company");
  const [settings, setSettings] = useState({
    company_name: "",
    email: "",
    phone: "",
    whatsapp: "",
    hero_text: "",
  });
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await settingsService.get();
        if (data.company_name) setSettings(data);
      } catch (error) {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await settingsService.update(settings);
      toast.success("Settings updated successfully!");
    } catch (error) {
      toast.error("Failed to update settings");
    }
  };

  if (loading)
    return (
      <div className="admin-loading">
        <span>Loading Settings...</span>
      </div>
    );

  return (
    <div style={{ animation: "fadeIn 0.5s ease", paddingBottom: "60px" }}>
      {/* ── Page Header ── */}
      <div className="admin-page-header mb-8">
        <div>
          <h1 className="admin-page-title">Settings</h1>
          <p className="admin-page-subtitle">Control center configuration</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 max-w-6xl">
        {/* ── Left sidebar ── */}
        <div
          style={{ width: "100%", maxWidth: "256px", flexShrink: 0 }}
        >
          <div
            className="p-4"
            style={{
              background: "#ffffff",
              border: "1px solid #EAECEF",
              borderRadius: "22px",
              boxShadow: "0 4px 16px rgba(15,23,42,0.04)",
            }}
          >
            <div
              className="px-2 pb-3 mb-1"
              style={{ borderBottom: "1px solid #F1F3F7" }}
            >
              <span
                className="admin-label-small"
                style={{ color: "#CBD5E1", fontSize: "9px" }}
              >
                Configuration
              </span>
            </div>

            <div className="flex flex-col gap-1 mt-2">
              <TabButton
                active={activeTab === "company"}
                label="Company Profile"
                icon={Building}
                onClick={() => setActiveTab("company")}
              />
              <TabButton
                active={activeTab === "website"}
                label="Website Settings"
                icon={Globe}
                onClick={() => setActiveTab("website")}
              />
              <TabButton
                active={activeTab === "security"}
                label="Security & Access"
                icon={Lock}
                onClick={() => setActiveTab("security")}
              />
            </div>

            <div
              className="pt-4 mt-4"
              style={{ borderTop: "1px solid #F1F3F7" }}
            >
              <button
                onClick={logout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full transition-all duration-200 group"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#64748B",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#FFF1F2";
                  e.currentTarget.style.color = "#BE123C";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#64748B";
                }}
              >
                <LogOut size={16} style={{ flexShrink: 0 }} />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* ── Right content ── */}
        <div className="flex-1">
          {activeTab === "company" && (
            <Section
              title="Company Profile"
              description="Manage your business information and global presence"
            >
              <form onSubmit={handleSave}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  <Input
                    label="Company Name"
                    name="company_name"
                    value={settings.company_name}
                    onChange={handleInputChange}
                    icon={Building}
                    placeholder="DD Infra & CO"
                  />
                  <Input
                    label="Support Email"
                    name="email"
                    value={settings.email}
                    onChange={handleInputChange}
                    icon={Mail}
                    placeholder="info@ddinfra.com"
                  />
                  <Input
                    label="Phone Number"
                    name="phone"
                    value={settings.phone}
                    onChange={handleInputChange}
                    icon={Smartphone}
                    placeholder="+971 ..."
                  />
                  <Input
                    label="WhatsApp Number"
                    name="whatsapp"
                    value={settings.whatsapp}
                    onChange={handleInputChange}
                    icon={MessageCircle}
                    placeholder="+971 ..."
                  />
                </div>
                <div
                  className="flex justify-end mt-6 pt-6"
                  style={{ borderTop: "1px solid #F1F3F7" }}
                >
                  <button type="submit" className="btn-accent">
                    Save Changes
                  </button>
                </div>
              </form>
            </Section>
          )}

          {activeTab === "website" && (
            <Section
              title="Website Settings"
              description="Configure your public facing website appearance"
            >
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: "6px",
                  }}
                >
                  Hero Section Title
                </label>
                <textarea
                  name="hero_text"
                  value={settings.hero_text}
                  onChange={handleInputChange}
                  className="admin-textarea"
                  style={{ height: "120px" }}
                  placeholder="Welcome to DD Infra & CO..."
                />
              </div>
              <div
                className="flex justify-end mt-6 pt-6"
                style={{ borderTop: "1px solid #F1F3F7" }}
              >
                <button onClick={handleSave} className="btn-accent">
                  Save Website Config
                </button>
              </div>
            </Section>
          )}

          {activeTab === "security" && (
            <Section
              title="Security & Access"
              description="Manage password policies and account protection"
            >
              <div style={{ maxWidth: "440px" }}>
                <Input
                  label="Current Password"
                  type="password"
                  icon={Lock}
                  placeholder="••••••••"
                />
                <Input
                  label="New Password"
                  type="password"
                  icon={Lock}
                  placeholder="••••••••"
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  icon={Lock}
                  placeholder="••••••••"
                />
              </div>
              <div
                className="flex justify-end mt-6 pt-6"
                style={{ borderTop: "1px solid #F1F3F7" }}
              >
                <button onClick={handleSave} className="btn-accent">
                  Update Credentials
                </button>
              </div>
            </Section>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AdminSettings;
