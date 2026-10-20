import { useState } from "react";
import { AlertTriangle, LoaderCircle, RotateCcw, ScanSearch, ShieldAlert, ShieldCheck } from "lucide-react";
import { DEFAULT_TRAFFIC_FEATURES, predictTraffic } from "../services/api";

const groups = [
  { title: "Connection metadata", description: "Protocol, service and connection state", fields: [
    { name: "dur", label: "Duration", kind: "number", step: "any" },
    { name: "proto", label: "Protocol", kind: "select", options: ["tcp", "udp", "arp", "ospf", "icmp"] },
    { name: "service", label: "Service", kind: "select", options: ["-", "http", "dns", "smtp", "ftp", "ssh", "pop3"] },
    { name: "state", label: "Connection state", kind: "select", options: ["FIN", "INT", "CON", "REQ", "RST"] },
  ] },
  { title: "Packet statistics", description: "Packets sent, received and lost", fields: [
    { name: "spkts", label: "Source packets", kind: "number", step: "1" },
    { name: "dpkts", label: "Destination packets", kind: "number", step: "1" },
    { name: "sloss", label: "Source packet loss", kind: "number", step: "1" },
    { name: "dloss", label: "Destination packet loss", kind: "number", step: "1" },
  ] },
  { title: "Bytes and rates", description: "Traffic volume and throughput features", fields: [
    { name: "sbytes", label: "Source bytes", kind: "number", step: "1" },
    { name: "dbytes", label: "Destination bytes", kind: "number", step: "1" },
    { name: "rate", label: "Rate", kind: "number", step: "any" },
    { name: "sload", label: "Source load", kind: "number", step: "any" },
    { name: "dload", label: "Destination load", kind: "number", step: "any" },
    { name: "smean", label: "Source mean size", kind: "number", step: "1" },
    { name: "dmean", label: "Destination mean size", kind: "number", step: "1" },
    { name: "response_body_len", label: "Response body length", kind: "number", step: "1" },
  ] },
  { title: "Timing features", description: "Inter-packet timing and TCP handshake durations", fields: [
    { name: "sinpkt", label: "Source inter-packet time", kind: "number", step: "any" },
    { name: "dinpkt", label: "Destination inter-packet time", kind: "number", step: "any" },
    { name: "sjit", label: "Source jitter", kind: "number", step: "any" },
    { name: "djit", label: "Destination jitter", kind: "number", step: "any" },
    { name: "tcprtt", label: "TCP round-trip time", kind: "number", step: "any" },
    { name: "synack", label: "SYN-ACK time", kind: "number", step: "any" },
    { name: "ackdat", label: "ACK data time", kind: "number", step: "any" },
  ] },
  { title: "Connection counts and flags", description: "Window sizes, connection counts and binary indicators", fields: [
    { name: "swin", label: "Source window", kind: "number", step: "1" },
    { name: "stcpb", label: "Source TCP base", kind: "number", step: "1" },
    { name: "dtcpb", label: "Destination TCP base", kind: "number", step: "1" },
    { name: "dwin", label: "Destination window", kind: "number", step: "1" },
    { name: "trans_depth", label: "Transaction depth", kind: "number", step: "1" },
    { name: "ct_src_dport_ltm", label: "Source destination-port count", kind: "number", step: "1" },
    { name: "ct_dst_sport_ltm", label: "Destination source-port count", kind: "number", step: "1" },
    { name: "is_ftp_login", label: "FTP login flag", kind: "binary" },
    { name: "ct_ftp_cmd", label: "FTP command count", kind: "number", step: "1" },
    { name: "ct_flw_http_mthd", label: "HTTP method count", kind: "number", step: "1" },
    { name: "is_sm_ips_ports", label: "Same IP and port flag", kind: "binary" },
  ] },
];

const integerFields = new Set(groups.flatMap((group) => group.fields.filter((field) => field.step === "1").map((field) => field.name)));
const binaryFields = new Set(["is_ftp_login", "is_sm_ips_ports"]);
const hasNumericValue = (value) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));

function validateFeatures(features) {
  const errors = {};
  for (const group of groups) {
    for (const field of group.fields) {
      const value = features[field.name];
      if (field.kind === "select") {
        if (!value || !field.options.includes(value)) errors[field.name] = "Choose an available value.";
        continue;
      }
      if (value === "" || value === null || value === undefined) {
        errors[field.name] = "This feature is required.";
        continue;
      }
      const number = Number(value);
      if (!Number.isFinite(number)) errors[field.name] = "Enter a finite number.";
      else if (number < 0) errors[field.name] = "Enter zero or a positive value.";
      else if (integerFields.has(field.name) && !Number.isInteger(number)) errors[field.name] = "Enter a whole number.";
      else if (binaryFields.has(field.name) && number !== 0 && number !== 1) errors[field.name] = "Choose 0 or 1.";
    }
  }
  return errors;
}

function validateResponse(response) {
  if (!response || typeof response !== "object" || Array.isArray(response)) return "The backend returned an invalid response.";
  if (response.status === "error" || ["Unavailable", "Error"].includes(response.prediction)) {
    return response.error || response.recommendation || "The model could not evaluate this sample.";
  }
  if (!["Normal", "Attack"].includes(response.prediction) || !hasNumericValue(response.confidence)) {
    return "The backend response is missing a valid prediction or confidence value.";
  }
  if (Number(response.confidence) < 0 || Number(response.confidence) > 100) {
    return "The backend returned a confidence value outside the expected 0–100 range.";
  }
  if (response.recommendation !== null && response.recommendation !== undefined && typeof response.recommendation !== "string") {
    return "The backend returned an invalid recommendation value.";
  }
  for (const key of ["prob_attack", "prob_normal"]) {
    if (response[key] !== null && response[key] !== undefined && (!hasNumericValue(response[key]) || Number(response[key]) < 0 || Number(response[key]) > 1)) {
      return `The backend returned an invalid ${key} value.`;
    }
  }
  return "";
}

function showProbability(value) {
  if (!hasNumericValue(value)) return "Not returned";
  return `${(Number(value) * 100).toFixed(2)}%`;
}

function showConfidence(value) {
  if (!hasNumericValue(value)) return "Not returned";
  return `${Number(value).toFixed(2)}%`;
}

export default function Prediction() {
  const [features, setFeatures] = useState(() => ({ ...DEFAULT_TRAFFIC_FEATURES }));
  const [fieldErrors, setFieldErrors] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateFeature = (name, value) => {
    setFeatures((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  };

  const restoreDefaults = () => {
    setFeatures({ ...DEFAULT_TRAFFIC_FEATURES });
    setFieldErrors({});
    setError("");
    setResult(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = validateFeatures(features);
    setFieldErrors(errors);
    setError("");
    setResult(null);
    if (Object.keys(errors).length > 0) {
      setError("Review the highlighted fields before submitting.");
      return;
    }

    const payload = Object.fromEntries(Object.entries(features).map(([key, value]) => [
      key,
      typeof value === "string" && key !== "proto" && key !== "service" && key !== "state" ? Number(value) : value,
    ]));

    setLoading(true);
    try {
      const response = await predictTraffic(payload);
      const responseError = validateResponse(response);
      if (responseError) setError(responseError);
      else setResult(response);
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Prediction request failed. Confirm the backend and trained model are available.");
    } finally {
      setLoading(false);
    }
  };

  const isAttack = result?.prediction === "Attack";
  const ResultIcon = isAttack ? ShieldAlert : ShieldCheck;

  return (
    <div className="page-stack prediction-page">
      <div className="page-header">
        <div>
          <p className="page-kicker">Model inference</p>
          <h2 className="page-title">Traffic prediction</h2>
          <p className="page-description">Edit the 34 UNSW-NB15 features and submit one sample to the backend classifier.</p>
        </div>
        <span className="status-pill"><ScanSearch size={14} /> Sample inference only</span>
      </div>

      <div className="notice prediction-disclaimer">This is an interactive model-inference form, not a live network monitor. Defaults are from the project’s existing demonstration sample; they are not observed traffic.</div>

      <div className="prediction-layout">
        <form className="surface feature-form" onSubmit={handleSubmit} noValidate>
          <div className="form-heading"><div><h3 className="section-title">Traffic feature input</h3><p className="section-note">All model features are required. Numeric values must be finite and non-negative.</p></div><button className="button-secondary reset-button" type="button" onClick={restoreDefaults} disabled={loading}><RotateCcw size={14} /> Restore sample</button></div>
          {error && <div className="notice error-notice form-error" role="alert"><AlertTriangle size={15} />{error}</div>}

          {groups.map((group, groupIndex) => (
            <fieldset className="feature-group" key={group.title}>
              <legend><span>{String(groupIndex + 1).padStart(2, "0")}</span>{group.title}</legend>
              <p>{group.description}</p>
              <div className="feature-grid">
                {group.fields.map((field) => {
                  const id = `feature-${field.name}`;
                  const errorId = `${id}-error`;
                  const invalid = Boolean(fieldErrors[field.name]);
                  return (
                    <label className="feature-field" htmlFor={id} key={field.name}>
                      <span>{field.label}</span>
                      {field.kind === "select" ? (
                        <select id={id} value={features[field.name]} onChange={(event) => updateFeature(field.name, event.target.value)} aria-invalid={invalid} aria-describedby={invalid ? errorId : undefined} disabled={loading}>
                          <option value="" disabled>Select a value</option>
                          {field.options.map((option) => <option key={option} value={option}>{option === "-" ? "Not specified (-)" : option.toUpperCase()}</option>)}
                        </select>
                      ) : field.kind === "binary" ? (
                        <select id={id} value={features[field.name]} onChange={(event) => updateFeature(field.name, Number(event.target.value))} aria-invalid={invalid} aria-describedby={invalid ? errorId : undefined} disabled={loading}>
                          <option value={0}>0 · No</option><option value={1}>1 · Yes</option>
                        </select>
                      ) : (
                        <input id={id} type="number" min="0" step={field.step} required value={features[field.name]} onChange={(event) => updateFeature(field.name, event.target.value)} aria-invalid={invalid} aria-describedby={invalid ? errorId : undefined} disabled={loading} />
                      )}
                      {invalid && <span className="field-error" id={errorId}>{fieldErrors[field.name]}</span>}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}

          <button className="button-primary submit-button" type="submit" disabled={loading}>
            {loading ? <LoaderCircle className="spin" size={16} /> : <ScanSearch size={16} />}
            {loading ? "Waiting for model response…" : "Submit sample for prediction"}
          </button>
        </form>

        <aside className="surface prediction-result" aria-live="polite">
          {!result && !loading && !error && <div className="result-empty"><span className="result-empty-icon"><ScanSearch size={21} /></span><h3>Prediction result</h3><p>Submit the form to display the response returned by the backend model.</p></div>}
          {loading && <div className="result-empty"><LoaderCircle className="spin result-empty-icon" size={26} /><h3>Request in progress</h3><p>Waiting for inference. The form is locked to prevent duplicate submissions.</p></div>}
          {result && (
            <div className="result-content">
              <p className="page-kicker">Backend response</p>
              <div className={`result-banner ${isAttack ? "result-attack" : "result-normal"}`}><ResultIcon size={22} /><div><span>Predicted class</span><strong>{result.prediction}</strong></div></div>
              <div className="result-values">
                <div><span>Confidence</span><strong>{showConfidence(result.confidence)}</strong></div>
                <div><span>Attack probability</span><strong>{showProbability(result.prob_attack)}</strong></div>
                <div><span>Normal probability</span><strong>{showProbability(result.prob_normal)}</strong></div>
              </div>
              {result.recommendation && <div className="recommendation"><span>Recommendation returned by model</span><p>{result.recommendation}</p></div>}
              <p className="result-caveat">This result applies to the submitted sample. It is not a security verdict or evidence of model performance on other traffic.</p>
            </div>
          )}
          {error && !loading && <div className="result-empty result-error"><AlertTriangle size={20} /><h3>No valid prediction shown</h3><p>Resolve the form or backend issue and submit again. Errors are not converted into a class or probability.</p></div>}
        </aside>
      </div>

      <style>{`
        .prediction-page { gap:18px; }
        .prediction-disclaimer { margin-top:-8px; }
        .prediction-layout { display:grid; grid-template-columns:minmax(0,1.45fr) minmax(280px,.75fr); align-items:start; gap:14px; }
        .feature-form,.prediction-result { min-width:0; padding:18px; }
        .form-heading { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:16px; }
        .form-heading .section-note { max-width:500px; }
        .reset-button { min-height:37px; flex:0 0 auto; padding-inline:11px; font-size:.75rem; }
        .form-error { display:flex; align-items:flex-start; gap:8px; margin-bottom:14px; }
        .feature-group { min-width:0; margin:0 0 12px; border:1px solid var(--line); border-radius:12px; padding:13px; }
        .feature-group legend { padding:0 7px; color:#dce6ea; font-size:.82rem; font-weight:600; }
        .feature-group legend span { margin-right:8px; color:var(--accent); font-family:"JetBrains Mono",monospace; font-size:.65rem; }
        .feature-group > p { margin:0 0 12px; color:#7f9099; font-size:.7rem; }
        .feature-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
        .feature-field { display:grid; min-width:0; gap:5px; color:#a8b5bc; font-size:.7rem; }
        .feature-field input,.feature-field select { width:100%; min-width:0; height:37px; border:1px solid rgba(148,163,184,.17); border-radius:8px; outline:none; background:#0d151b; padding:0 9px; color:#dce6ea; font-size:.77rem; }
        .feature-field input:focus,.feature-field select:focus { border-color:rgba(84,214,207,.55); }
        .feature-field [aria-invalid="true"] { border-color:rgba(248,113,113,.65); }
        .field-error { color:#f2a5a5; font-size:.64rem; }
        .submit-button { width:100%; margin-top:3px; }
        .prediction-result { position:sticky; top:18px; min-height:310px; }
        .result-empty { display:flex; min-height:265px; flex-direction:column; align-items:center; justify-content:center; padding:22px; text-align:center; }
        .result-empty-icon { color:#51bdb7; }
        .result-empty h3 { margin:14px 0 0; color:#dce7eb; font-size:.95rem; font-weight:600; }
        .result-empty p { max-width:300px; margin:7px 0 0; color:#84949d; font-size:.77rem; line-height:1.55; }
        .result-error { color:#e5a3a3; }
        .result-error h3 { margin-top:12px; }
        .result-content > .page-kicker { margin-bottom:12px; }
        .result-banner { display:flex; align-items:center; gap:12px; border:1px solid var(--line); border-radius:12px; padding:13px; }
        .result-banner span,.result-banner strong { display:block; }
        .result-banner span { color:#8a9aa3; font-size:.69rem; }
        .result-banner strong { margin-top:4px; color:#e5edef; font-size:1.13rem; font-weight:650; }
        .result-normal { border-color:rgba(84,214,161,.19); background:rgba(84,214,161,.045); color:#61d3a2; }
        .result-attack { border-color:rgba(248,113,113,.2); background:rgba(248,113,113,.05); color:#f18b8b; }
        .result-values { display:grid; grid-template-columns:1fr; gap:8px; margin-top:12px; }
        .result-values div { display:flex; align-items:center; justify-content:space-between; gap:12px; border:1px solid var(--line); border-radius:9px; padding:10px; }
        .result-values span { color:#82919a; font-size:.71rem; }
        .result-values strong { color:#dce7eb; font-size:.82rem; font-variant-numeric:tabular-nums; }
        .recommendation { margin-top:13px; border-left:2px solid rgba(84,214,207,.48); padding:2px 0 2px 11px; }
        .recommendation span { color:#84949d; font-size:.64rem; text-transform:uppercase; letter-spacing:.07em; }
        .recommendation p { margin:5px 0 0; color:#c4d0d5; font-size:.78rem; line-height:1.55; }
        .result-caveat { margin:14px 0 0; color:#75858e; font-size:.69rem; line-height:1.5; }
        .spin { animation:spin 1s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @media(max-width:950px) { .prediction-layout { grid-template-columns:1fr; } .prediction-result { position:static; } .result-values { grid-template-columns:repeat(3,minmax(0,1fr)); } }
        @media(max-width:580px) { .feature-form,.prediction-result { padding:13px; } .feature-group { padding:11px; } .feature-grid,.result-values { grid-template-columns:1fr; } .form-heading { align-items:flex-start; flex-direction:column; } }
      `}</style>
    </div>
  );
}
