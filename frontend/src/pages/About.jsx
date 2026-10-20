import { Activity, Database, GitMerge, Layers3 } from "lucide-react";

const capabilities = [
  { icon: Layers3, title: "CNN + BiLSTM classifier", text: "A neural network model is used for binary traffic classification." },
  { icon: GitMerge, title: "Federated workflow simulation", text: "Client model updates are combined using trust-weighted averaging." },
  { icon: Activity, title: "Heuristic trust scores", text: "The current trust manager updates scores from reported client accuracy." },
  { icon: Database, title: "UNSW-NB15 input", text: "The backend preprocessing pipeline targets the UNSW-NB15 feature schema." },
];

export default function About() {
  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="page-kicker">Project context</p>
          <h2 className="page-title">TrustAwareFL-IDS</h2>
          <p className="page-description">Federated learning-based intrusion detection for IoT networks with trust-aware aggregation.</p>
        </div>
        <span className="status-pill"><span className="status-dot" />Final-year project prototype</span>
      </div>

      <section className="surface about-intro">
        <p className="page-kicker">What the prototype demonstrates</p>
        <h3>Collaborative model training with trust-weighted updates</h3>
        <p>IoT networks generate traffic at many devices, which makes a single centralized training workflow an important privacy and deployment concern. Federated learning is being investigated as a way for independent participants to train locally and share model updates. Trust-aware aggregation explores whether participant behavior can influence how those updates contribute to a shared model.</p>
      </section>

      <section className="about-flow" aria-label="Federated learning concepts and prototype implementation">
        <article className="surface flow-card"><span className="flow-step">01 · Local data</span><h3>Traffic records</h3><p>In the federated learning design, raw records stay with each device. In this prototype, a single backend process loads the dataset and splits it into in-memory client partitions.</p><span className="flow-status">Design goal · centralized simulation input</span></article>
        <article className="surface flow-card"><span className="flow-step">02 · Client updates</span><h3>Local model training</h3><p>Simulated clients train model copies and return model weights to the server-side simulation loop. Updates are function results in one process, not device-to-server network messages.</p><span className="flow-status">Implemented · in-process</span></article>
        <article className="surface flow-card"><span className="flow-step">03 · Global model</span><h3>Weighted aggregation</h3><p>The backend combines client weights using normalized heuristic trust scores, saves the updated model and uses it in the following round.</p><span className="flow-status">Implemented · local simulation</span></article>
      </section>

      <section className="motivation-grid">
        <article className="surface motivation-card"><p className="page-kicker">Why federated learning?</p><h3>Study collaborative training across IoT participants</h3><p>Many IoT deployments have distributed data sources. Federated learning provides a useful research framework for training a shared model without designing the workflow around uploading every raw record. This repository simulates that workflow; it is not a distributed deployment.</p></article>
        <article className="surface motivation-card"><p className="page-kicker">Why trust-aware aggregation?</p><h3>Explore how client behavior affects model updates</h3><p>Participants may have uneven or corrupted training data. This project investigates weighting model updates using a trust heuristic. The current score is based on local training accuracy and should be treated as an experiment, not as proof that a participant is safe.</p></article>
      </section>

      <section className="capability-grid" aria-label="Implemented project components">
        {capabilities.map(({ icon: Icon, title, text }) => (
          <article className="surface capability-card" key={title}>
            <span className="capability-icon"><Icon size={18} /></span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className="surface limits-panel">
        <div>
          <p className="page-kicker">Implementation notes</p>
          <h3 className="section-title">Current scope and limitations</h3>
        </div>
        <ul>
          <li>Client partitions and training are simulated in one backend process; this is not a deployment across independent IoT devices.</li>
          <li>The malicious-client behavior is a controlled label-poisoning simulation in the current backend.</li>
          <li>Trust is heuristic and currently based on local accuracy; it is not a verified malicious-client detector.</li>
          <li>The prototype does not implement secure aggregation, encryption guarantees, or differential privacy.</li>
        </ul>
      </section>

      <style>{`
        .about-intro { padding: clamp(22px,4vw,34px); }
        .about-intro h3 { max-width: 720px; margin: 0; color: #e9f1f3; font-size: clamp(1.25rem,2.5vw,1.7rem); font-weight: 620; letter-spacing: -.035em; }
        .about-intro > p:last-child { max-width: 850px; margin: 13px 0 0; color: #9baab2; font-size: .9rem; line-height: 1.75; }
        .about-flow { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
        .flow-card { min-width:0; padding:16px; }
        .flow-step { color:#61d4cd; font-family:"JetBrains Mono",monospace; font-size:.65rem; }
        .flow-card h3,.motivation-card h3 { margin:13px 0 7px; color:#dce7eb; font-size:.91rem; font-weight:600; }
        .flow-card p,.motivation-card p:not(.page-kicker) { margin:0; color:#8e9ea6; font-size:.76rem; line-height:1.65; }
        .flow-status { display:block; margin-top:14px; border-top:1px solid var(--line); padding-top:10px; color:#9eafb6; font-size:.67rem; }
        .motivation-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
        .motivation-card { padding:17px; }
        .motivation-card .page-kicker { margin-bottom:8px; font-size:.65rem; }
        .capability-grid { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 13px; }
        .capability-card { min-height: 160px; padding: 17px; }
        .capability-icon { display: grid; width: 34px; height: 34px; place-items: center; border-radius: 10px; background: var(--accent-soft); color: var(--accent); }
        .capability-card h3 { margin: 16px 0 7px; color: #dae5e9; font-size: .86rem; font-weight: 600; }
        .capability-card p { margin: 0; color: #8999a2; font-size: .76rem; line-height: 1.6; }
        .limits-panel { display: grid; grid-template-columns: minmax(190px,.65fr) minmax(0,1.35fr); gap: 20px; padding: 20px; }
        .limits-panel ul { display: grid; gap: 11px; margin: 0; padding-left: 18px; color: #a6b3ba; font-size: .81rem; line-height: 1.55; }
        .limits-panel li::marker { color: #54d6cf; }
        @media(max-width:1000px) { .capability-grid { grid-template-columns: repeat(2,minmax(0,1fr)); } .about-flow { grid-template-columns:1fr; } }
        @media(max-width:620px) { .capability-grid,.limits-panel,.motivation-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
