import { useCallback, useEffect, useState } from "react";
import { AlertCircle, ArrowDown, ArrowUp, CheckCircle2, Cpu, GitMerge, Info, LoaderCircle, Play, RotateCcw, ShieldAlert } from "lucide-react";
import ClientExplorer from "../components/dashboard/ClientExplorer";
import { useSimulationStatus } from "../contexts/SimulationStatusContext";
import { getMetrics, getSimulationStatus, runSimulation } from "../services/api";

const workflow = [
  {
    title: "Local data",
    direction: "Client role · data source",
    status: "Centralized simulation input",
    icon: Cpu,
    explanation: "Federated learning is intended to keep raw traffic records at each participant. In this prototype, the backend reads one dataset and splits it into client arrays in a single process. It does not deploy separate IoT devices.",
  },
  {
    title: "Client training",
    direction: "Client → local model",
    status: "Implemented in process",
    icon: Cpu,
    explanation: "Each simulated client loads the current global model and trains it on its assigned in-memory partition. The current client score is measured on that same local training partition, not on a held-out client validation set.",
  },
  {
    title: "Model updates",
    direction: "Client → server",
    status: "Returned in memory",
    icon: ArrowUp,
    explanation: "A client returns model weights to the simulation loop. This is a Python function return within one process, not a network transfer between separate devices. The API does not report update payloads or sizes.",
  },
  {
    title: "Trust update",
    direction: "Server evaluates client score",
    status: "Accuracy heuristic",
    icon: ShieldAlert,
    explanation: "Trust changes in steps based on local training accuracy, then is clamped to the configured score bounds. The implementation does not calculate validation accuracy, update similarity or reliability factors.",
  },
  {
    title: "Weighted aggregation",
    direction: "Server combines updates",
    status: "Trust-weighted mean",
    icon: GitMerge,
    explanation: "The aggregator normalizes client trust scores and uses them as weights. All submitted clients are included; there is no aggregation rejection threshold and sample count is not part of the weight.",
  },
  {
    title: "Next global round",
    direction: "Server → simulated clients",
    status: "Local model update",
    icon: ArrowDown,
    explanation: "The aggregated weights are saved to the global model path and loaded by clients in the next simulation round. The current workflow does not distribute a model over a device network.",
  },
];

const tabs = [
  { id: "workflow", label: "Workflow" },
  { id: "trust", label: "Trust & aggregation" },
  { id: "investigation", label: "Poisoning investigation" },
];

export default function Federated() {
  const { simulation, setSimulation } = useSimulationStatus();
  const [statusVerified, setStatusVerified] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [startPending, setStartPending] = useState(false);
  const [simulationMode, setSimulationMode] = useState("honest");
  const [activeTab, setActiveTab] = useState("workflow");
  const [selectedStep, setSelectedStep] = useState(0);
  const [clients, setClients] = useState([]);
  const [metricsError, setMetricsError] = useState("");
  const [metricsLoading, setMetricsLoading] = useState(true);

  const refreshMetrics = useCallback(async () => {
    try {
      const response = await getMetrics();
      setClients(Array.isArray(response?.clients) ? response.clients : []);
      setMetricsError("");
      return true;
    } catch (error) {
      setMetricsError(error.response?.data?.error || "Client metrics are not available from the API yet.");
      return false;
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  const syncSimulationStatus = useCallback(async () => {
    try {
      const snapshot = await getSimulationStatus();
      if (!snapshot || !["idle", "running", "completed", "failed"].includes(snapshot.status)) {
        throw new Error("The backend returned an invalid simulation status.");
      }
      setSimulation(snapshot);
      if (snapshot.mode) setSimulationMode(snapshot.mode);
      setStatusVerified(true);
      setStatusError("");
      if (snapshot.status === "completed") await refreshMetrics();
      return snapshot;
    } catch (error) {
      setStatusError(error.response?.data?.error || error.message || "Could not verify simulation status. Check the Flask API connection.");
      return null;
    }
  }, [refreshMetrics, setSimulation]);

  useEffect(() => {
    const initialFetch = window.setTimeout(refreshMetrics, 0);
    return () => window.clearTimeout(initialFetch);
  }, [refreshMetrics]);

  useEffect(() => {
    const initialStatusCheck = window.setTimeout(syncSimulationStatus, 0);
    return () => window.clearTimeout(initialStatusCheck);
  }, [syncSimulationStatus]);

  useEffect(() => {
    if (!statusVerified || simulation.status !== "running") return undefined;

    let active = true;
    let timer;
    const poll = async () => {
      const snapshot = await syncSimulationStatus();
      if (active) timer = window.setTimeout(poll, snapshot?.status === "running" ? 2000 : snapshot ? 0 : 4000);
    };
    timer = window.setTimeout(poll, 2000);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [simulation.status, statusVerified, syncSimulationStatus]);

  const handleSimulation = async () => {
    setStartPending(true);
    setStatusError("");
    try {
      const response = await runSimulation(simulationMode);
      setSimulation(response);
      setStatusVerified(true);
    } catch (error) {
      const responseSnapshot = error.response?.data;
      if (responseSnapshot && ["running", "completed", "failed"].includes(responseSnapshot.status)) {
        setSimulation(responseSnapshot);
        setStatusVerified(true);
      } else {
        const snapshot = await syncSimulationStatus();
        if (!snapshot) {
          setStatusError(error.response?.data?.error || "The run request did not return a result, and the current backend status could not be verified.");
        }
      }
    } finally {
      setStartPending(false);
    }
  };

  const retryStatusCheck = async () => {
    setStatusError("");
    await syncSimulationStatus();
  };

  const activeStep = workflow[selectedStep];
  const ActiveIcon = activeStep.icon;

  return (
    <div className="page-stack federated-page">
      <div className="page-header">
        <div>
          <p className="page-kicker">Research prototype</p>
          <h2 className="page-title">Federated learning</h2>
          <p className="page-description">Explore the local federated-learning simulation, inspect API-reported clients, and review how the current trust heuristic affects aggregation.</p>
        </div>
        <span className="status-pill"><span className="status-dot" />Illustrative workflow + local API</span>
      </div>

      <section className="surface simulation-panel">
        <div className="simulation-copy">
          <span className="simulation-icon"><Cpu size={20} /></span>
          <div><h3 className="section-title">Run backend simulation</h3><p className="section-note">The backend runs the selected experiment and reports its final process result. Round-level events and progress are not exposed.</p></div>
        </div>
        <label className="simulation-mode">Experiment mode
          <select value={simulationMode} onChange={(event) => setSimulationMode(event.target.value)} disabled={!statusVerified || startPending || simulation.status === "running"}>
            <option value="honest">Honest baseline</option>
            <option value="attack">Label-poisoning demonstration</option>
          </select>
        </label>
        <button className="button-primary" type="button" disabled={!statusVerified || startPending || simulation.status === "running"} onClick={handleSimulation}>
          {startPending || !statusVerified ? <LoaderCircle className="spin" size={16} /> : ["completed", "failed"].includes(simulation.status) ? <RotateCcw size={16} /> : <Play size={16} fill="currentColor" />}
          {!statusVerified ? "Checking status…" : startPending ? "Starting simulation…" : ["completed", "failed"].includes(simulation.status) ? "Run again" : "Run simulation"}
        </button>
        <div className={`simulation-response ${simulation.status === "failed" || statusError ? "simulation-error" : ""}`} role="status" aria-live="polite">
          {!statusVerified || simulation.status === "running" ? <LoaderCircle className="spin" size={16} /> : simulation.status === "failed" || statusError ? <AlertCircle size={16} /> : simulation.status === "completed" ? <CheckCircle2 size={16} /> : <Info size={16} />}
          <div>
            <strong>{!statusVerified ? "Checking backend status" : statusError ? "Could not verify current status" : simulation.status === "idle" ? "Idle" : simulation.status === "running" ? "Simulation running" : simulation.status === "failed" ? "Simulation failed" : "Simulation completed"}</strong>
            <p>{!statusVerified ? statusError || "Loading the authoritative status from the backend…" : statusError || simulation.message}</p>
            {simulation.status === "failed" && simulation.error && <p>{simulation.error}{simulation.details ? ` ${simulation.details}` : ""}</p>}
            {statusError && <button className="inline-retry" type="button" onClick={retryStatusCheck}>Retry status check</button>}
          </div>
        </div>
      </section>

      <div className="explorer-tabs" role="tablist" aria-label="Federated learning explorer">
        {tabs.map((tab) => (
          <button key={tab.id} id={`tab-${tab.id}`} role="tab" type="button" aria-selected={activeTab === tab.id} aria-controls={`panel-${tab.id}`} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "workflow" && (
        <section className="surface explorer-panel" id="panel-workflow" role="tabpanel" aria-labelledby="tab-workflow">
          <div className="panel-heading"><div><h3 className="section-title">Federated lifecycle</h3><p className="section-note">Select a stage to inspect its role and implementation status.</p></div><span className="illustrative-tag">Explanatory walkthrough</span></div>
          <div className="workflow-layout">
            <div className="workflow-step-list" aria-label="Workflow stages">
              {workflow.map((step, index) => {
                const StepIcon = step.icon;
                return <button className={`workflow-step ${selectedStep === index ? "workflow-step-active" : ""}`} type="button" key={step.title} aria-pressed={selectedStep === index} onClick={() => setSelectedStep(index)}><span className="step-number">{String(index + 1).padStart(2, "0")}</span><StepIcon size={16} /><span>{step.title}</span></button>;
              })}
            </div>
            <article className="workflow-detail" aria-live="polite">
              <div className="workflow-detail-top"><span className="workflow-detail-icon"><ActiveIcon size={18} /></span><span className="implementation-tag">{activeStep.status}</span></div>
              <p className="page-kicker">Stage {String(selectedStep + 1).padStart(2, "0")} · {activeStep.direction}</p>
              <h4>{activeStep.title}</h4>
              <p>{activeStep.explanation}</p>
              <div className="direction-line"><span>{selectedStep === 5 ? "Server" : "Client"}</span><span className="direction-arrow">{selectedStep === 5 ? <ArrowDown size={16} /> : <ArrowUp size={16} />}</span><span>{selectedStep === 5 ? "Simulated clients" : "Server / in-process loop"}</span></div>
            </article>
          </div>
          <div className="honesty-note"><Info size={15} /><p>Arrows explain the conceptual client/server roles. The current backend simulation runs in one process; the arrows are not live network telemetry.</p></div>
        </section>
      )}

      {activeTab === "trust" && (
        <section className="surface explorer-panel" id="panel-trust" role="tabpanel" aria-labelledby="tab-trust">
          <div className="panel-heading"><div><h3 className="section-title">Trust and aggregation, as implemented</h3><p className="section-note">The following description reflects the current backend logic, not the fuller formula proposed in the design brief.</p></div><span className="illustrative-tag">Heuristic only</span></div>
          <div className="trust-explainer-grid">
            <article className="trust-explainer-card trust-primary"><p className="page-kicker">Score update</p><code>new trust = clamp(previous trust + accuracy step, 0.10, 1.00)</code><p>The previous score is adjusted by a fixed step based on local training accuracy. The score bounds are limits; 0.10 is not an aggregation rejection threshold.</p></article>
            <article className="trust-explainer-card"><p className="page-kicker">Step rules</p><ul><li>Accuracy ≥ 0.95: add 0.03</li><li>Accuracy ≥ 0.90: add 0.01</li><li>Accuracy ≥ 0.80: no change</li><li>Accuracy &lt; 0.80: subtract 0.05</li></ul><p>Accuracy is measured on the client’s local training data in the current simulation.</p></article>
            <article className="trust-explainer-card"><p className="page-kicker">Aggregation weight</p><code>weightᵢ = trustᵢ / sum(trust)</code><p>Trust scores are normalized across submitted clients. The current aggregator does not multiply by client sample count.</p></article>
          </div>
          <div className="not-implemented-grid">
            <div><strong>Validation accuracy</strong><span>Not used in the current trust update.</span></div>
            <div><strong>Update similarity</strong><span>Not calculated by the current backend.</span></div>
            <div><strong>Reliability factor</strong><span>Not calculated by the current backend.</span></div>
            <div><strong>Smoothing formula</strong><span>No exponential or weighted smoothing is implemented; the previous score is incremented/decremented.</span></div>
            <div><strong>Trust threshold</strong><span>No client acceptance/rejection threshold is applied by the current aggregator.</span></div>
          </div>
          <div className="notice trust-warning">Trust is a heuristic aggregation weight. It is not proof that a client is benign and does not guarantee malicious-client detection.</div>
          <div className="trust-selected-client"><h4>Available client score</h4><p>Select a client in the explorer below to view its actual API-reported trust value. The API does not return per-factor scores, normalized aggregation weights or historical acceptance decisions.</p></div>
        </section>
      )}

      {activeTab === "investigation" && (
        <section className="surface explorer-panel" id="panel-investigation" role="tabpanel" aria-labelledby="tab-investigation">
          <div className="panel-heading"><div><h3 className="section-title">Malicious-client experiment</h3><p className="section-note">A controlled model-poisoning demonstration is distinct from classifying network traffic as an intrusion.</p></div><span className="illustrative-tag">Code-level scenario</span></div>
          <div className="investigation-summary">
            <div className="investigation-icon"><ShieldAlert size={20} /></div>
            <div><h4>Label-flipping scenario</h4><p>The simulation code flips 30% of labels assigned to Client 3 for its training input. This is a hardcoded demonstration condition; the metrics endpoint does not report a poisoning flag or per-round investigation record.</p></div>
          </div>
          <div className="investigation-empty"><Info size={18} /><div><strong>No experiment event records available through the current API</strong><p>No poisoning outcome, update similarity, threshold decision or rejected-client event is displayed here because those fields are not exposed to the frontend. The local client metrics below are not sufficient to infer a historical rejection.</p></div></div>
          <p className="section-note investigation-footnote">Label poisoning modifies a participant’s training labels. IDS attack classification predicts whether a network-flow sample is normal or an attack; these are different tasks.</p>
        </section>
      )}

      <section className="page-stack client-section">
        <div className="panel-heading"><div><h3 className="section-title">Client explorer</h3><p className="section-note">Client IDs and metric values below come from the latest response to <code>GET /metrics</code>. Select a card for details.</p></div>{metricsLoading && <span className="subtle-count">Loading metrics…</span>}</div>
        {metricsError && <div className="notice error-notice" role="status">{metricsError}<button className="inline-retry" type="button" onClick={refreshMetrics}>Retry</button></div>}
        <ClientExplorer clients={clients} title="Federated client detail" />
      </section>

      <style>{`
        .federated-page { gap:20px; }
        .simulation-panel { display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:center; gap:16px; padding:18px; }
        .simulation-copy { display:flex; align-items:center; gap:12px; }
        .simulation-icon,.workflow-detail-icon,.investigation-icon { display:grid; width:42px; height:42px; flex:0 0 auto; place-items:center; border:1px solid rgba(84,214,207,.2); border-radius:13px; background:var(--accent-soft); color:var(--accent); }
        .simulation-copy .section-note { max-width:750px; }
        .simulation-mode { display:grid; gap:5px; color:#a8b5bc; font-size:.7rem; }
        .simulation-mode select { min-height:38px; border:1px solid rgba(148,163,184,.17); border-radius:8px; background:#0d151b; padding:0 10px; color:#dce6ea; }
        .simulation-copy code,.client-section code { color:#b4d9d6; font-family:"JetBrains Mono",monospace; font-size:.72rem; }
        .simulation-response { display:flex; grid-column:1/-1; align-items:flex-start; gap:10px; border:1px solid rgba(84,214,207,.16); border-radius:11px; background:rgba(84,214,207,.05); padding:12px; color:#65d7cf; }
        .simulation-response strong { color:#d9efee; font-size:.8rem; }
        .simulation-response p { margin:5px 0 0; color:#95a8ae; font-size:.76rem; line-height:1.55; }
        .simulation-error { border-color:rgba(248,113,113,.2); background:rgba(248,113,113,.05); color:#f08e8e; }
        .explorer-tabs { display:flex; gap:6px; overflow-x:auto; border-bottom:1px solid var(--line); }
        .explorer-tabs button { position:relative; flex:0 0 auto; border:0; border-bottom:2px solid transparent; background:transparent; padding:11px 14px; color:#8798a1; font-size:.82rem; cursor:pointer; }
        .explorer-tabs button[aria-selected="true"] { border-bottom-color:var(--accent); color:#d9f0ee; }
        .explorer-panel { padding:19px; }
        .illustrative-tag,.implementation-tag { display:inline-flex; align-items:center; border:1px solid rgba(84,214,207,.16); border-radius:999px; background:rgba(84,214,207,.05); padding:6px 9px; color:#9bd8d5; font-size:.66rem; white-space:nowrap; }
        .workflow-layout { display:grid; grid-template-columns:minmax(210px,.66fr) minmax(0,1.34fr); gap:14px; }
        .workflow-step-list { display:grid; align-content:start; gap:5px; }
        .workflow-step { display:flex; min-height:41px; align-items:center; gap:9px; border:1px solid transparent; border-radius:9px; background:transparent; padding:0 10px; color:#8c9ba3; text-align:left; cursor:pointer; }
        .workflow-step:hover { background:rgba(255,255,255,.025); color:#d8e3e7; }
        .workflow-step-active { border-color:rgba(84,214,207,.15); background:var(--accent-soft); color:#72ded7; }
        .workflow-step > span:last-child { font-size:.77rem; }
        .step-number { color:#6b7d86; font-family:"JetBrains Mono",monospace; font-size:.62rem; }
        .workflow-detail { min-height:260px; border:1px solid var(--line); border-radius:13px; background:rgba(4,10,14,.22); padding:17px; }
        .workflow-detail-top { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:16px; }
        .workflow-detail-icon { width:36px; height:36px; border-radius:11px; }
        .workflow-detail .page-kicker { margin-bottom:7px; font-size:.65rem; }
        .workflow-detail h4 { margin:0; color:#e2ecef; font-size:1rem; font-weight:620; }
        .workflow-detail > p:not(.page-kicker) { max-width:700px; margin:9px 0 16px; color:#98a8b0; font-size:.82rem; line-height:1.65; }
        .direction-line { display:flex; align-items:center; justify-content:center; gap:12px; border:1px solid var(--line); border-radius:10px; background:rgba(255,255,255,.025); padding:10px; color:#aebdc3; font-size:.71rem; text-align:center; }
        .direction-arrow { display:grid; width:28px; height:28px; place-items:center; border-radius:50%; background:var(--accent-soft); color:var(--accent); }
        .honesty-note { display:flex; align-items:flex-start; gap:9px; margin-top:13px; color:#84949d; }
        .honesty-note svg { flex:0 0 auto; margin-top:2px; color:#a0b0b7; }
        .honesty-note p { margin:0; font-size:.74rem; line-height:1.55; }
        .trust-explainer-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:11px; }
        .trust-explainer-card { border:1px solid var(--line); border-radius:12px; background:rgba(255,255,255,.022); padding:14px; }
        .trust-explainer-card .page-kicker { margin-bottom:9px; font-size:.63rem; }
        .trust-explainer-card code { display:block; min-height:42px; color:#b9dfdc; font-family:"JetBrains Mono",monospace; font-size:.73rem; line-height:1.55; }
        .trust-explainer-card p:not(.page-kicker),.trust-explainer-card li { color:#98a8b0; font-size:.74rem; line-height:1.55; }
        .trust-explainer-card p:not(.page-kicker) { margin:10px 0 0; }
        .trust-explainer-card ul { display:grid; gap:5px; margin:0; padding-left:16px; }
        .trust-primary { border-color:rgba(84,214,207,.2); }
        .not-implemented-grid { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:8px; margin-top:12px; }
        .not-implemented-grid div { border:1px solid var(--line); border-radius:10px; padding:10px; }
        .not-implemented-grid strong,.not-implemented-grid span { display:block; }
        .not-implemented-grid strong { color:#cbd7dc; font-size:.7rem; }
        .not-implemented-grid span { margin-top:6px; color:#82929b; font-size:.66rem; line-height:1.5; }
        .trust-warning { margin-top:13px; }
        .trust-selected-client { margin-top:15px; border-top:1px solid var(--line); padding-top:14px; }
        .trust-selected-client h4 { margin:0; color:#dce7ea; font-size:.8rem; }
        .trust-selected-client p { margin:6px 0 0; color:#85959e; font-size:.74rem; line-height:1.55; }
        .investigation-summary { display:flex; align-items:flex-start; gap:13px; border:1px solid rgba(236,184,95,.17); border-radius:12px; background:rgba(236,184,95,.04); padding:15px; }
        .investigation-icon { border-color:rgba(236,184,95,.2); background:rgba(236,184,95,.08); color:#e1bc76; }
        .investigation-summary h4 { margin:1px 0 0; color:#e7e4d9; font-size:.87rem; }
        .investigation-summary p { margin:6px 0 0; color:#a99d81; font-size:.77rem; line-height:1.6; }
        .investigation-empty { display:flex; gap:10px; margin-top:12px; border:1px dashed rgba(148,163,184,.2); border-radius:11px; padding:14px; color:#95a5ad; }
        .investigation-empty svg { flex:0 0 auto; margin-top:1px; }
        .investigation-empty strong { color:#c5d0d5; font-size:.77rem; }
        .investigation-empty p { margin:5px 0 0; color:#8999a1; font-size:.73rem; line-height:1.55; }
        .investigation-footnote { margin-top:12px; }
        .client-section { gap:13px; }
        .panel-heading { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:15px; }
        .inline-retry { margin-left:10px; border:0; background:transparent; color:#f2d28f; cursor:pointer; }
        .subtle-count { color:#84949e; font-size:.75rem; }
        .spin { animation:spin 1s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @media(max-width:1050px) { .trust-explainer-grid { grid-template-columns:1fr; } .not-implemented-grid { grid-template-columns:repeat(3,minmax(0,1fr)); } }
        @media(max-width:760px) { .workflow-layout { grid-template-columns:1fr; } .workflow-step-list { grid-template-columns:repeat(2,minmax(0,1fr)); } .simulation-panel { grid-template-columns:1fr; } .simulation-panel > button { width:100%; } }
        @media(max-width:560px) { .explorer-panel { padding:14px; } .not-implemented-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .workflow-step { gap:6px; padding:0 6px; } .workflow-step > span:last-child { font-size:.69rem; } .illustrative-tag { font-size:.6rem; } }
      `}</style>
    </div>
  );
}
