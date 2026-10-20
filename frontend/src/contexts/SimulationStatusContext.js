import { createContext, useContext } from "react";

export const SimulationStatusContext = createContext(null);

export function useSimulationStatus() {
  const context = useContext(SimulationStatusContext);
  if (!context) {
    throw new Error("useSimulationStatus must be used inside SimulationStatusProvider.");
  }
  return context;
}
