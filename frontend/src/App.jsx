import { useState } from "react";
import BootScreen from "./components/animation/BootScreen";
import { Routes, Route } from "react-router-dom";

import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";

import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Prediction from "./pages/Prediction";
import Federated from "./pages/Federated";
import About from "./pages/About";

export default function App() {
    const [bootComplete, setBootComplete] = useState(false);

    if (!bootComplete) {
    return <BootScreen onComplete={() => setBootComplete(true)} />;
    }

    return (

        <div className="flex h-screen bg-[#05070A] text-white">

            <Sidebar />

            <div className="flex-1 flex flex-col">

                <Topbar />

                <main className="flex-1 p-8 overflow-auto">

                    <Routes>

                        <Route path="/" element={<Dashboard />} />

                        <Route path="/analytics" element={<Analytics />} />

                        <Route path="/prediction" element={<Prediction />} />

                        <Route path="/federated" element={<Federated />} />

                        <Route path="/about" element={<About />} />

                    </Routes>

                </main>

            </div>

        </div>

    );

}