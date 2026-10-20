import { useCallback, useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { useLocation } from "react-router-dom";
import { getHealth } from "../../services/api";

const pageNames = {
  "/": "System overview",
  "/federated": "Federated learning",
  "/prediction": "Traffic prediction",
  "/analytics": "Analytics",
  "/about": "Project details",
};

export default function Topbar({ onMenuClick }) {
  const { pathname } = useLocation();
  const [apiState, setApiState] = useState("checking");

  const checkApi = useCallback(async () => {
    try {
      const response = await getHealth();
      setApiState(response?.status === "healthy" ? "healthy" : "error");
    } catch {
      setApiState("error");
    }
  }, []);

  useEffect(() => {
    const initialCheck = window.setTimeout(checkApi, 0);
    const interval = window.setInterval(checkApi, 30000);
    return () => {
      window.clearTimeout(initialCheck);
      window.clearInterval(interval);
    };
  }, [checkApi]);

  const statusLabel = {
    checking: "Checking API",
    healthy: "API reachable",
    error: "API unavailable",
  }[apiState];

  return (
    <header className="topbar">
      <button className="menu-button" type="button" aria-label="Open navigation" onClick={onMenuClick}>
        <Menu size={20} />
      </button>
      <div className="topbar-heading">
        <p className="topbar-kicker">Trust-aware federated IDS</p>
        <h1>{pageNames[pathname] || "System overview"}</h1>
      </div>
      <div className="status-pill" data-state={apiState} title="Checks the Flask health endpoint only">
        <span className="status-dot" />
        <span>{statusLabel}</span>
      </div>
      <style>{`
        .topbar { display: flex; min-height: 76px; align-items: center; gap: 15px; border-bottom: 1px solid var(--line); background: rgba(10,16,21,.72); padding: 0 clamp(17px,3vw,42px); }
        .topbar-heading { min-width: 0; flex: 1; }
        .topbar-kicker { margin: 0 0 4px; color: #768690; font-size: .68rem; font-weight: 650; letter-spacing: .12em; text-transform: uppercase; }
        .topbar h1 { margin: 0; color: #e6eef2; font-size: .98rem; font-weight: 600; letter-spacing: -.02em; }
        .menu-button { display: none; width: 39px; height: 39px; align-items: center; justify-content: center; border: 1px solid var(--line); border-radius: 10px; background: rgba(255,255,255,.03); color: #c4d0d6; cursor: pointer; }
        @media (max-width: 760px) { .topbar { min-height: 68px; } .menu-button { display: inline-flex; } .topbar-kicker { font-size: .6rem; } .topbar h1 { font-size: .87rem; } .status-pill { padding: 7px 9px; font-size: 0; } .status-pill .status-dot { width: 8px; height: 8px; } }
      `}</style>
    </header>
  );
}
