import { useMemo, useState } from "react";
import { Activity, X } from "lucide-react";
import ClientCard from "./ClientCard";

const displayNumber = (value, digits = 4, suffix = "") => {
  if (value === null || value === undefined || value === "") return "Not returned";
  const number = Number(value);
  return Number.isFinite(number) ? `${number.toFixed(digits)}${suffix}` : "Not returned";
};

const displayPercent = (value) => {
  if (value === null || value === undefined || value === "") return "Not returned";
  const number = Number(value);
  return Number.isFinite(number) ? `${(number * 100).toFixed(2)}%` : "Not returned";
};

export default function ClientExplorer({ clients = [], title = "Client explorer" }) {
  const [selectedId, setSelectedId] = useState(null);
  const uniqueClients = useMemo(() => {
    const byId = new Map();
    for (const record of clients) {
      if (record?.client === null || record?.client === undefined) continue;
      // If duplicate client IDs occur, the last record in the API response is shown.
      byId.set(String(record.client), record);
    }
    return [...byId.values()];
  }, [clients]);
  const selectedClient = uniqueClients.find((client) => String(client.client) === selectedId);

  if (!uniqueClients.length) {
    return (
      <div className="surface client-empty">
        <Activity size={20} aria-hidden="true" />
        <div>
          <h4>No client metrics available</h4>
          <p>The metrics endpoint has not returned client records. No device names, sample counts or activity are inferred.</p>
        </div>
        <style>{`.client-empty { display:flex; align-items:flex-start; gap:13px; padding:20px; color:#91a1aa; } .client-empty h4 { margin:0; color:#dce6ea; font-size:.88rem; } .client-empty p { max-width:650px; margin:6px 0 0; color:#8798a1; font-size:.78rem; line-height:1.55; }`}</style>
      </div>
    );
  }

  return (
    <div className="client-explorer">
      <div className="client-explorer-grid">
        {uniqueClients.map((client) => (
          <ClientCard
            key={String(client.client)}
            client={client}
            selected={selectedId === String(client.client)}
            onSelect={() => setSelectedId((current) => current === String(client.client) ? null : String(client.client))}
          />
        ))}
      </div>

      {selectedClient && (
        <section className="surface client-detail" aria-labelledby="client-detail-title" aria-live="polite">
          <div className="client-detail-head">
            <div>
              <p className="page-kicker">{title}</p>
              <h4 id="client-detail-title">Client {selectedClient.client}</h4>
            </div>
            <button className="icon-button" type="button" onClick={() => setSelectedId(null)} aria-label="Close client details"><X size={17} /></button>
          </div>
          <div className="client-detail-grid">
            <div><span>Accuracy</span><strong>{displayPercent(selectedClient.accuracy)}</strong></div>
            <div><span>Loss</span><strong>{displayNumber(selectedClient.loss)}</strong></div>
            <div><span>Trust score</span><strong>{displayNumber(selectedClient.trust)}</strong></div>
          </div>
          <p className="client-detail-note">These values are the fields returned for this client by <code>GET /metrics</code>. The API does not return a device name, type, local sample count, trust-factor breakdown or a round-specific accept/reject event.</p>
          <style>{`
            .client-detail { padding:18px; }
            .client-detail-head { display:flex; align-items:center; justify-content:space-between; gap:16px; }
            .client-detail-head .page-kicker { margin-bottom:5px; }
            .client-detail-head h4 { margin:0; color:#e7eff2; font-size:1rem; font-weight:620; }
            .icon-button { display:grid; width:35px; height:35px; place-items:center; border:1px solid var(--line); border-radius:10px; background:rgba(255,255,255,.025); color:#aab8bf; cursor:pointer; }
            .icon-button:hover { border-color:rgba(84,214,207,.3); color:var(--accent); }
            .client-detail-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin-top:16px; }
            .client-detail-grid div { border:1px solid var(--line); border-radius:10px; padding:12px; }
            .client-detail-grid span,.client-detail-grid strong { display:block; }
            .client-detail-grid span { color:#8798a1; font-size:.7rem; }
            .client-detail-grid strong { margin-top:6px; color:#dfe9ec; font-size:.9rem; font-variant-numeric:tabular-nums; }
            .client-detail-note { margin:13px 0 0; color:#82939c; font-size:.74rem; line-height:1.6; }
            .client-detail-note code { color:#b7d5d4; font-family:"JetBrains Mono",monospace; font-size:.7rem; }
            @media(max-width:500px) { .client-detail-grid { grid-template-columns:1fr; } }
          `}</style>
        </section>
      )}

      <style>{`.client-explorer { display:grid; gap:14px; } .client-explorer-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; } @media(max-width:1000px) { .client-explorer-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } } @media(max-width:560px) { .client-explorer-grid { grid-template-columns:1fr; } }`}</style>
    </div>
  );
}
