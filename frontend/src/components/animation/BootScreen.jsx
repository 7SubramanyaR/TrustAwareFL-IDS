import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const steps = [
  "Initializing Neural Core...",
  "Loading CNN Engine...",
  "Loading BiLSTM Memory...",
  "Connecting IoT Clients...",
  "Starting Trust Evaluation...",
  "Synchronizing Federated Server...",
  "System Ready..."
];

export default function BootScreen({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep >= steps.length) {
      const timer = setTimeout(() => {
        onComplete();
      }, 800);

      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
    }, 700);

    return () => clearTimeout(timer);
  }, [currentStep, onComplete]);

  return (
    <AnimatePresence>

      <motion.div
        className="fixed inset-0 bg-[#05070A] flex items-center justify-center z-50"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1 }}
      >

        <div className="w-[700px]">

          <h1 className="text-cyan-400 text-4xl font-bold mb-12 text-center font-['Orbitron']">
            TRUST-AWARE FL IDS
          </h1>

          {steps.map((step, index) => (

            <div
              key={index}
              className="mb-6"
            >

              <div className="flex justify-between text-white mb-2">

                <span>{step}</span>

                {index < currentStep && (
                  <span className="text-green-400">
                    ✓
                  </span>
                )}

              </div>

              <div className="h-2 bg-gray-800 rounded">

                <motion.div

                  className="h-2 bg-cyan-400 rounded"

                  initial={{ width: 0 }}

                  animate={{
                    width:
                      index < currentStep
                        ? "100%"
                        : "0%"
                  }}

                  transition={{ duration: 0.5 }}

                />

              </div>

            </div>

          ))}

          {currentStep >= steps.length && (

            <motion.h2

              className="text-center text-3xl text-green-400 mt-12"

              initial={{ opacity: 0 }}

              animate={{ opacity: 1 }}

            >

              WELCOME, OPERATOR

            </motion.h2>

          )}

        </div>

      </motion.div>

    </AnimatePresence>
  );
}