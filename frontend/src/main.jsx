import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "@fontsource/inter";
import "@fontsource/orbitron";
import "@fontsource/jetbrains-mono";

import "./index.css";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
    <BrowserRouter>
        <App />
    </BrowserRouter>
);