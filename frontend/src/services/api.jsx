import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { "Content-Type": "application/json" },
});

export const DEFAULT_TRAFFIC_FEATURES = {
  dur: 0.12,
  proto: "tcp",
  service: "http",
  state: "FIN",
  spkts: 12,
  dpkts: 15,
  sbytes: 1200,
  dbytes: 2500,
  rate: 35,
  sload: 140,
  dload: 210,
  sloss: 0,
  dloss: 0,
  sinpkt: 15,
  dinpkt: 17,
  sjit: 0,
  djit: 0,
  swin: 255,
  stcpb: 100,
  dtcpb: 120,
  dwin: 255,
  tcprtt: 0.2,
  synack: 0.05,
  ackdat: 0.04,
  smean: 120,
  dmean: 145,
  trans_depth: 1,
  response_body_len: 512,
  ct_src_dport_ltm: 2,
  ct_dst_sport_ltm: 3,
  is_ftp_login: 0,
  ct_ftp_cmd: 0,
  ct_flw_http_mthd: 1,
  is_sm_ips_ports: 0,
};

export const getHealth = async () => (await api.get("/health")).data;
export const getMetrics = async () => (await api.get("/metrics")).data;
export const runSimulation = async (mode = "honest") =>
  (await api.post("/simulate", { mode }, { timeout: 15000 })).data;
export const getSimulationStatus = async () =>
  (await api.get("/simulate/status", { timeout: 10000 })).data;
export const getGraph = (graphName) => `${apiBaseUrl}/graphs/${encodeURIComponent(graphName)}`;
export const predictTraffic = async (features = DEFAULT_TRAFFIC_FEATURES) =>
  (await api.post("/predict", features)).data;

export default api;
