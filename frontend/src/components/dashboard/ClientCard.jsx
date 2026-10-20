import { Activity, ChevronRight } from "lucide-react";

const formatPercent = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  return Number.isFinite(number) ? `${(number * 100).toFixed(2)}%` : "—";
};

const formatDecimal = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(4) : "—";
};

export default function ClientCard({ client, onSelect, selected = false }) {
  const trust = Number(client.trust);
  const scoreLabel = !Number.isFinite(trust)
    ? "Score unavailable"
    : trust < 0.5
      ? "Lower heuristic score"
      : trust < 0.8
        ? "Moderate heuristic score"
        : "Higher heuristic score";

  return (
    <button
      className={`surface client-card ${selected ? "client-card-selected" : ""}`}
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`View metrics for client ${client.client}`}
    >
      <span className="client-card-heading">
        <span className="client-avatar"><Activity size={17} aria-hidden="true" /></span>
        <span className="client-heading-text">
          <strong>Client {client.client}</strong>
          <span>Latest logged update</span>
        </span>
        <span className="trust-label">{scoreLabel}</span>
      </span>
      <span className="client-metrics">
        <span><span>Reported accuracy</span><strong>{formatPercent(client.accuracy)}</strong></span>
        <span><span>Reported loss</span><strong>{formatDecimal(client.loss)}</strong></span>
        <span><span>Trust weight</span><strong>{formatDecimal(client.trust)}</strong></span>
      </span>
      <span className="trust-track" aria-label={`Heuristic trust score ${Number.isFinite(trust) ? trust : "unavailable"}`}>
        <span style={{ width: `${Math.max(0, Math.min(100, Number.isFinite(trust) ? trust * 100 : 0))}%` }} />
      </span>
      <span className="client-card-footer">Inspect available metrics <ChevronRight size={14} aria-hidden="true" /></span>
      <style>{`
        .client-card { display: block; width: 100%; padding: 16px; color: inherit; text-align: left; cursor: pointer; transition: border-color .15s ease,transform .15s ease,background .15s ease; }
        .client-card:hover,.client-card-selected { border-color: rgba(84,214,207,.36); background: linear-gradient(145deg,rgba(24,43,49,.94),rgba(14,22,29,.94)); transform: translateY(-1px); }
        .client-card-heading { display: flex; min-width: 0; align-items: center; gap: 10px; }
        .client-avatar { display: grid; width: 35px; height: 35px; flex: 0 0 auto; place-items: center; border: 1px solid rgba(84,214,207,.17); border-radius: 11px; background: rgba(84,214,207,.08); color: #67d8d1; }
        .client-heading-text { min-width: 0; flex: 1; }
        .client-heading-text strong,.client-heading-text > span { display: block; }
        .client-heading-text strong { overflow: hidden; color: #e5edf0; font-size: .88rem; font-weight: 620; text-overflow: ellipsis; white-space: nowrap; }
        .client-heading-text > span { margin-top: 4px; color: #778892; font-size: .7rem; }
        .trust-label { border: 1px solid var(--line); border-radius: 999px; padding: 5px 7px; color: #9aabb4; font-size: .61rem; text-align: center; }
        .client-metrics { display: grid; gap: 10px; margin-top: 18px; }
        .client-metrics > span { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
        .client-metrics span span { color: #8b9aa3; font-size: .75rem; }
        .client-metrics strong { color: #dce7eb; font-size: .79rem; font-variant-numeric: tabular-nums; font-weight: 600; }
        .trust-track { display: block; overflow: hidden; height: 4px; margin-top: 15px; border-radius: 999px; background: rgba(255,255,255,.07); }
        .trust-track > span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg,#339f9b,#76e0d7); }
        .client-card-footer { display: flex; align-items: center; justify-content: flex-end; gap: 5px; margin-top: 13px; color: #71848d; font-size: .68rem; }
      `}</style>
    </button>
  );
}
