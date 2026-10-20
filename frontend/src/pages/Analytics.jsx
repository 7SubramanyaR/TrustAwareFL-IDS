import { getGraph } from "../services/api";

export default function Analytics() {
  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="page-kicker">Experiment review</p>
          <h2 className="page-title">Analytics</h2>
          <p className="page-description">Training and trust visualizations exposed by the existing backend graph endpoint.</p>
        </div>
        <span className="status-pill">Existing backend graphs</span>
      </div>

      <section className="surface graph-card graph-wide">
        <div className="graph-title"><span className="graph-index">01</span><div><h3 className="section-title">Average client accuracy by round</h3><p className="section-note">The existing accuracy graph asset.</p></div></div>
        <img src={getGraph("accuracy.png")} alt="Existing model accuracy graph" />
      </section>

      <div className="graph-grid">
        <section className="surface graph-card">
          <div className="graph-title"><span className="graph-index">02</span><div><h3 className="section-title">Loss by round</h3><p className="section-note">The existing loss graph asset.</p></div></div>
          <img src={getGraph("loss.png")} alt="Existing model loss graph" />
        </section>
        <section className="surface graph-card">
          <div className="graph-title"><span className="graph-index">03</span><div><h3 className="section-title">Trust score history</h3><p className="section-note">Heuristic scores recorded by the simulation.</p></div></div>
          <img src={getGraph("trust.png")} alt="Existing heuristic trust score graph" />
        </section>
      </div>

      <style>{`
        .graph-card { min-width: 0; padding: 18px; }
        .graph-title { display: flex; align-items: center; gap: 11px; margin-bottom: 16px; }
        .graph-index { color: #5dcfc8; font-family: "JetBrains Mono",monospace; font-size: .68rem; }
        .graph-card img { display: block; width: 100%; height: auto; border: 1px solid var(--line); border-radius: 11px; background: rgba(0,0,0,.18); }
        .graph-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 14px; }
        @media(max-width:760px) { .graph-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
