import { Activity, Cpu, Info, LayoutDashboard, ShieldCheck } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { name: "Overview", icon: LayoutDashboard, path: "/" },
  { name: "Federated run", icon: Cpu, path: "/federated" },
  { name: "Traffic prediction", icon: ShieldCheck, path: "/prediction" },
  { name: "Analytics", icon: Activity, path: "/analytics" },
  { name: "Project details", icon: Info, path: "/about" },
];

export default function Sidebar({ open = false, onNavigate = () => {} }) {
  return (
    <aside
      className={`sidebar ${open ? "sidebar-open" : ""}`}
      aria-label="Primary navigation"
    >
      <NavLink className="brand-lockup" to="/" onClick={onNavigate}>
        <span className="brand-mark"><ShieldCheck size={19} strokeWidth={1.8} /></span>
        <span>
          <span className="brand-name">TrustAware</span>
          <span className="brand-caption">FL · IoT IDS</span>
        </span>
      </NavLink>

      <p className="nav-section-label">Workspace</p>
      <nav className="sidebar-nav">
        {items.map(({ name, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            onClick={onNavigate}
            className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}
          >
            <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
            <span>{name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="sidebar-footer-mark" />
        <span>Research prototype</span>
      </div>

      <style>{`
        .sidebar { position: sticky; top: 0; display: flex; width: 252px; min-width: 252px; height: 100vh; flex-direction: column; border-right: 1px solid var(--line); background: rgba(11, 17, 22, .9); padding: 24px 15px 18px; }
        .brand-lockup { display: flex; align-items: center; gap: 12px; padding: 5px 10px 28px; color: inherit; text-decoration: none; }
        .brand-mark { display: grid; width: 38px; height: 38px; place-items: center; border: 1px solid rgba(84,214,207,.25); border-radius: 12px; background: var(--accent-soft); color: var(--accent); }
        .brand-name, .brand-caption { display: block; }
        .brand-name { font-size: 1rem; font-weight: 700; letter-spacing: -.03em; }
        .brand-caption { margin-top: 3px; color: var(--muted); font-size: .69rem; letter-spacing: .08em; text-transform: uppercase; }
        .nav-section-label { margin: 12px 11px 10px; color: #65737d; font-size: .66rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
        .sidebar-nav { display: grid; gap: 5px; }
        .nav-link { display: flex; min-height: 43px; align-items: center; gap: 12px; border: 1px solid transparent; border-radius: 10px; padding: 0 11px; color: #9aa9b2; font-size: .84rem; font-weight: 550; text-decoration: none; transition: color .15s ease, background .15s ease, border-color .15s ease; }
        .nav-link:hover { background: rgba(255,255,255,.035); color: #e6f0f2; }
        .nav-link-active { border-color: rgba(84,214,207,.12); background: var(--accent-soft); color: #75e1da; }
        .sidebar-footer { display: flex; align-items: center; gap: 9px; margin-top: auto; border-top: 1px solid var(--line); padding: 17px 10px 0; color: #74838d; font-size: .73rem; }
        .sidebar-footer-mark { width: 7px; height: 7px; border-radius: 50%; background: #d9ae64; }
        @media (max-width: 760px) { .sidebar { position: fixed; z-index: 40; left: 0; width: min(82vw, 290px); min-width: 0; transform: translateX(-105%); transition: transform .2s ease; box-shadow: 22px 0 60px rgba(0,0,0,.32); } .sidebar-open { transform: translateX(0); } }
      `}</style>
    </aside>
  );
}
