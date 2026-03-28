import React from "react";
import ReactDOM from "react-dom/client";
import "@shoelace-style/shoelace/dist/themes/light.css";
import App from "./App";
import "./styles.css";
import "../../../dist/index.js";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
