import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import BootScreen from "./components/animation/BootScreen";
import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import About from "./pages/About";
import Analytics from "./pages/Analytics";
import Dashboard from "./pages/Dashboard";
import Federated from "./pages/Federated";
import Prediction from "./pages/Prediction";
import SimulationStatusProvider from "./contexts/SimulationStatusProvider";

export default function App() {
  const [bootComplete, setBootComplete] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (!bootComplete) {
    return <BootScreen onComplete={() => setBootComplete(true)} />;
  }

  return (
    <div className="app-shell">
      <button
        className="nav-scrim"
        data-open={mobileNavOpen}
        aria-label="Close navigation"
        onClick={() => setMobileNavOpen(false)}
      />
      <Sidebar open={mobileNavOpen} onNavigate={() => setMobileNavOpen(false)} />
      <div className="app-content">
        <Topbar onMenuClick={() => setMobileNavOpen((open) => !open)} />
        <SimulationStatusProvider>
          <main className="app-main">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/prediction" element={<Prediction />} />
              <Route path="/federated" element={<Federated />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </SimulationStatusProvider>
      </div>
    </div>
  );
}
