"use client";

import { useTheme } from "@/hooks/useTheme";

const NAV_MAIN = [
  { icon: "⊞", label: "Dashboard", id: "dashboard" },
  { icon: "✦", label: "Generate Leads", id: "generate" },
  { icon: "☰", label: "Manage Leads", id: "manage" },
  { icon: "◈", label: "Engage Leads", id: "engage" },
];

const NAV_CONTROL = [
  { icon: "👥", label: "Team Members", id: "team" },
  { icon: "⊕", label: "Lead Sources", id: "lead-sources" },
  { icon: "◻", label: "Ad Accounts", id: "ads" },
  { icon: "💬", label: "WhatsApp Account", id: "whatsapp" },
  { icon: "📞", label: "Tele Calling", id: "telecalling" },
  { icon: "⊟", label: "CRM Fields", id: "crm-fields" },
  { icon: "⚡", label: "API Center", id: "api" },
  { icon: "◈", label: "Business Center", id: "business" },
];

interface SidebarProps {
  activePage: string;
  onNavigate?: (id: string) => void;
}

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { theme, toggle } = useTheme();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🌱</div>
        <span className="sidebar-logo-text">GrowEasy</span>
      </div>

      {/* User */}
      <div className="sidebar-user">
        <div className="sidebar-avatar">VK</div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">VK Test</div>
          <div className="sidebar-user-role">Admin</div>
        </div>
      </div>

      {/* Main Nav */}
      <div className="sidebar-section-label">Main</div>
      {NAV_MAIN.map((item) => (
        <div
          key={item.id}
          className={`sidebar-item ${activePage === item.id ? "active" : ""}`}
          onClick={() => onNavigate?.(item.id)}
          id={`nav-${item.id}`}
        >
          <span className="sidebar-item-icon">{item.icon}</span>
          <span>{item.label}</span>
        </div>
      ))}

      {/* Control Center */}
      <div className="sidebar-section-label" style={{ marginTop: 8 }}>Control Center</div>
      {NAV_CONTROL.map((item) => (
        <div
          key={item.id}
          className={`sidebar-item ${activePage === item.id ? "active" : ""}`}
          onClick={() => onNavigate?.(item.id)}
          id={`nav-${item.id}`}
        >
          <span className="sidebar-item-icon">{item.icon}</span>
          <span>{item.label}</span>
        </div>
      ))}

      {/* Theme toggle at bottom */}
      <div style={{ marginTop: "auto", padding: "16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <button
          onClick={toggle}
          id="theme-toggle-btn"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 12px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.7)",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: 500,
            transition: "all 0.15s",
          }}
        >
          <span style={{ fontSize: "1.1rem" }}>{theme === "dark" ? "☀️" : "🌙"}</span>
          <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>
      </div>
    </aside>
  );
}
