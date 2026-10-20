import { useState } from "react";
import { SimulationStatusContext } from "./SimulationStatusContext";

const initialSimulation = {
  status: "idle",
  mode: null,
  message: "No simulation has been run in this backend process.",
  error: null,
  details: null,
};

export default function SimulationStatusProvider({ children }) {
  const [simulation, setSimulation] = useState(initialSimulation);

  return (
    <SimulationStatusContext.Provider value={{ simulation, setSimulation }}>
      {children}
    </SimulationStatusContext.Provider>
  );
}
