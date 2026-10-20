import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

const steps = ["Loading project interface", "Preparing workspace", "Console ready"];

export default function BootScreen({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep >= steps.length) {
      const timer = window.setTimeout(onComplete, 450);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setCurrentStep((step) => step + 1), 360);
    return () => window.clearTimeout(timer);
  }, [currentStep, onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        className="boot-screen"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="boot-card">
          <span className="boot-mark"><ShieldCheck size={25} /></span>
          <p className="page-kicker">TrustAwareFL-IDS</p>
          <h1>Project console</h1>
          <p className="boot-subtitle">Federated learning · IoT intrusion detection</p>
          <div className="boot-steps">
            {steps.map((step, index) => (
              <div className="boot-step" key={step}>
                <span className={`boot-check ${index < currentStep ? "boot-check-done" : ""}`}>{index < currentStep ? "✓" : ""}</span>
                <span>{step}</span>
                {index < currentStep && <span className="boot-ready">Ready</span>}
              </div>
            ))}
          </div>
        </div>
        <style>{`
          .boot-screen { position: fixed; z-index: 100; display: grid; inset: 0; place-items: center; background: radial-gradient(ellipse at 50% 10%,rgba(46,126,128,.15),transparent 42%),#080d12; padding: 20px; }
          .boot-card { width: min(100%,440px); border: 1px solid var(--line); border-radius: 20px; background: rgba(16,24,32,.82); padding: 30px; box-shadow: 0 28px 90px rgba(0,0,0,.3); }
          .boot-mark { display: grid; width: 48px; height: 48px; margin-bottom: 22px; place-items: center; border: 1px solid rgba(84,214,207,.22); border-radius: 15px; background: var(--accent-soft); color: var(--accent); }
          .boot-card h1 { margin: 0; color: #eaf1f4; font-size: 1.75rem; letter-spacing: -.05em; }
          .boot-subtitle { margin: 8px 0 25px; color: #8999a2; font-size: .83rem; }
          .boot-steps { display: grid; gap: 13px; }
          .boot-step { display: flex; align-items: center; gap: 10px; color: #a8b5bc; font-size: .8rem; }
          .boot-check { display: grid; width: 18px; height: 18px; flex: 0 0 auto; place-items: center; border: 1px solid rgba(148,163,184,.25); border-radius: 50%; color: #06201d; font-size: .68rem; }
          .boot-check-done { border-color: var(--accent); background: var(--accent); }
          .boot-ready { margin-left: auto; color: #69d2a7; font-size: .67rem; }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
}
