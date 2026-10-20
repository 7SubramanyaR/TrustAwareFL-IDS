import { Cpu, Server } from "lucide-react";

const clients = ["Client 01", "Client 02", "Client 03"];

export default function NetworkAnimation() {
  return (
    <div className="network-diagram" role="img" aria-label="Schematic federated-learning workflow showing three simulated clients and illustrative model update and distribution flows">
      <span className="workflow-schematic-label">Schematic workflow · illustrative motion only</span>
      <svg className="network-lines" viewBox="0 0 1000 280" preserveAspectRatio="none" aria-hidden="true">
        <path d="M500 84 C500 130 167 124 167 204" />
        <path d="M500 84 L500 204" />
        <path d="M500 84 C500 130 833 124 833 204" />
        <g className="packet-motion">
          <circle r="4" className="update-packet"><animateMotion path="M167 204 C167 124 500 130 500 84" dur="5.4s" begin="0s" repeatCount="indefinite" /></circle>
          <circle r="3" className="model-packet"><animateMotion path="M500 84 C500 130 167 124 167 204" dur="5.4s" begin="1.8s" repeatCount="indefinite" /></circle>
          <circle r="4" className="update-packet"><animateMotion path="M500 204 L500 84" dur="5.4s" begin="1.8s" repeatCount="indefinite" /></circle>
          <circle r="3" className="model-packet"><animateMotion path="M500 84 L500 204" dur="5.4s" begin="3.6s" repeatCount="indefinite" /></circle>
          <circle r="4" className="update-packet"><animateMotion path="M833 204 C833 124 500 130 500 84" dur="5.4s" begin="3.6s" repeatCount="indefinite" /></circle>
          <circle r="3" className="model-packet"><animateMotion path="M500 84 C500 130 833 124 833 204" dur="5.4s" begin="5.4s" repeatCount="indefinite" /></circle>
        </g>
      </svg>
      <div className="network-server">
        <span><Server size={18} /></span>
        <div><strong>Aggregation server</strong><small>Trust-weighted model update</small></div>
      </div>
      <div className="network-clients">
        {clients.map((client) => (
          <div className={`network-client client-${client.slice(-2)}`} key={client}>
            <span><Cpu size={17} /></span>
            <strong>{client}</strong>
            <small>Simulated partition</small>
          </div>
        ))}
      </div>
      <style>{`
        .network-diagram { position: relative; min-height: 210px; overflow: hidden; border: 1px solid rgba(148,163,184,.09); border-radius: 13px; background: radial-gradient(ellipse at 50% 8%,rgba(42,123,124,.10),transparent 48%),rgba(4,10,14,.28); padding: 20px 22px; }
        .workflow-schematic-label { position:absolute; right:12px; bottom:8px; z-index:2; color:#71858d; font-size:.59rem; letter-spacing:.025em; }
        .network-lines { position: absolute; inset: 0; width: 100%; height: 100%; }
        .network-lines path { fill: none; stroke: rgba(84,214,207,.28); stroke-width: 1.6; stroke-dasharray: 5 7; vector-effect: non-scaling-stroke; animation: link-dash 3s linear infinite; }
        .update-packet { fill:#72e5dc; filter:drop-shadow(0 0 4px rgba(84,214,207,.8)); }
        .model-packet { fill:#b8d4e4; filter:drop-shadow(0 0 4px rgba(184,212,228,.7)); }
        .network-server { position: relative; z-index: 1; display: flex; width: max-content; max-width: 100%; align-items: center; gap: 11px; margin: 0 auto; border: 1px solid rgba(84,214,207,.25); border-radius: 12px; background: #122027; padding: 10px 14px; box-shadow: 0 8px 26px rgba(0,0,0,.2); }
        .network-server { animation: server-response 5.4s ease-in-out infinite; }
        .network-server > span,.network-client > span { display: grid; width: 33px; height: 33px; flex: 0 0 auto; place-items: center; border-radius: 9px; background: rgba(84,214,207,.1); color: #6bdcd5; }
        .network-server strong,.network-server small,.network-client strong,.network-client small { display: block; }
        .network-server strong { color: #dce9eb; font-size: .77rem; font-weight: 600; }
        .network-server small,.network-client small { margin-top: 4px; color: #80929b; font-size: .64rem; }
        .network-clients { position: relative; z-index: 1; display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 12px; margin-top: 106px; }
        .network-client { display: flex; min-width: 0; align-items: center; gap: 9px; border: 1px solid rgba(148,163,184,.12); border-radius: 11px; background: #101920; padding: 9px 11px; animation: client-pulse 5.4s ease-in-out infinite; }
        .client-02 { animation-delay:1.8s; }
        .client-03 { animation-delay:3.6s; }
        .network-client > span { width: 30px; height: 30px; background: rgba(110,139,165,.12); color: #a2b7c4; }
        .network-client strong { color: #cbd6dc; font-size: .72rem; font-weight: 580; }
        .network-client small { font-size: .6rem; }
        @keyframes link-dash { to { stroke-dashoffset:-24; } }
        @keyframes client-pulse { 0%,20%,100% { border-color:rgba(148,163,184,.12); box-shadow:none; } 8%,14% { border-color:rgba(84,214,207,.55); box-shadow:0 0 16px rgba(84,214,207,.1); } }
        @keyframes server-response { 0%,22%,100% { border-color:rgba(84,214,207,.25); box-shadow:0 8px 26px rgba(0,0,0,.2); } 28%,35% { border-color:rgba(84,214,207,.58); box-shadow:0 0 20px rgba(84,214,207,.12); } }
        @media(prefers-reduced-motion:reduce) { .network-diagram *, .network-diagram *::before, .network-diagram *::after { animation:none !important; scroll-behavior:auto !important; } .packet-motion { display:none; } }
        @media(max-width:560px) { .network-diagram { min-height: 255px; padding: 16px 12px; } .network-clients { grid-template-columns: 1fr; gap: 7px; margin-top: 14px; } .network-lines { display: none; } .network-client { padding: 7px 9px; } .workflow-schematic-label { right:10px; bottom:6px; } }
      `}</style>
    </div>
  );
}
