import { useCallback, useEffect, useState } from "react";
import { Activity, Clock3, RefreshCw, ShieldCheck, UsersRound } from "lucide-react";
import NetworkAnimation from "../components/animation/NetworkAnimation";
import ClientExplorer from "../components/dashboard/ClientExplorer";
import StatCard from "../components/dashboard/StatCard";
import { getMetrics } from "../services/api";

const formatPercent = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  return Number.isFinite(number) ? `${(number * 100).toFixed(2)}%` : "—";
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(4) : "—";
};

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await getMetrics();
      setMetrics(data);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Metrics are not available from the API yet.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialFetch = window.setTimeout(fetchMetrics, 0);
    const interval = window.setInterval(fetchMetrics, 10000);
    return () => {
      window.clearTimeout(initialFetch);
      window.clearInterval(interval);
    };
  }, [fetchMetrics]);

  const clients = Array.isArray(metrics?.clients) ? metrics.clients : [];
  const clientCount = new Set(clients.filter((client) => client?.client !== null && client?.client !== undefined).map((client) => String(client.client))).size;
  const hasMetrics = metrics !== null;

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="page-kicker">Project monitor</p>
          <h2 className="page-title">System overview</h2>
          <p className="page-description">Federated intrusion detection prototype for IoT traffic, with trust-weighted model aggregation.</p>
        </div>
        <div className="status-pill" data-state={hasMetrics ? "healthy" : error ? "error" : "checking"}>
          <span className="status-dot" />
          {loading && !hasMetrics ? "Loading metrics" : hasMetrics ? `Round ${metrics.current_round ?? "—"} data` : "No metrics loaded"}
        </div>
      </div>

      {error && (
        <div className="notice error-notice" role="status">
          <span>{error}</span>
          <button className="inline-retry" type="button" onClick={fetchMetrics}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      <div className="stat-grid">
        <StatCard icon={Activity} title="Logged accuracy mean" value={hasMetrics ? formatPercent(metrics.global_accuracy) : "—"} detail="API-reported client mean; not a held-out global score" />
        <StatCard icon={Clock3} title="Logged loss mean" value={hasMetrics ? formatValue(metrics.global_loss) : "—"} detail="Mean from the latest logged round" />
        <StatCard icon={ShieldCheck} title="Best logged accuracy mean" value={hasMetrics ? formatPercent(metrics.best_accuracy) : "—"} detail="Best round-level client mean returned by the API" />
        <StatCard icon={UsersRound} title="Reporting clients" value={hasMetrics ? String(clientCount) : "—"} detail="Distinct client IDs in the latest metrics response" />
      </div>

      <section className="surface network-panel">
        <div className="panel-heading">
          <div>
            <h3 className="section-title">Federated workflow</h3>
            <p className="section-note">Schematic view of the local simulation setup; it does not show live network traffic.</p>
          </div>
          <span className="subtle-count">3 schematic client partitions</span>
        </div>
        <NetworkAnimation />
      </section>

      <section className="page-stack client-section">
        <div className="panel-heading">
          <div>
            <h3 className="section-title">Latest client report</h3>
            <p className="section-note">Trust values are heuristic aggregation weights, not verified security labels.</p>
          </div>
        </div>
        {loading && clients.length === 0
          ? <div className="surface empty-state"><Activity size={22} aria-hidden="true" /><div><h4>Fetching the latest report</h4><p>The dashboard will fill in when the metrics endpoint responds.</p></div></div>
          : <ClientExplorer clients={clients} title="Dashboard client detail" />}
      </section>

      <style>{`
        .stat-grid { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 14px; }
        .network-panel { padding: 19px; }
        .panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
        .subtle-count { color: #84949e; font-size: .75rem; }
        .client-section { gap: 14px; }
        .empty-state { display: flex; align-items: flex-start; gap: 14px; padding: 22px; color: #90a0a9; }
        .empty-state h4 { margin: 0; color: #d9e2e7; font-size: .93rem; font-weight: 600; }
        .empty-state p { margin: 6px 0 0; font-size: .83rem; line-height: 1.55; }
        .inline-retry { display: inline-flex; align-items: center; gap: 6px; margin-left: 12px; border: 0; background: transparent; color: #f5d38f; font-weight: 650; cursor: pointer; }
        @media(max-width:1000px) { .stat-grid { grid-template-columns: repeat(2,minmax(0,1fr)); } }
        @media(max-width:560px) { .stat-grid { grid-template-columns: 1fr; } .network-panel { padding: 14px; } .panel-heading { align-items: flex-start; } }
      `}</style>
    </div>
  );
}
