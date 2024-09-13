import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <React.StrictMode>
    <div className="flex items-center justify-center min-w-[100vw] min-h-screen">
      <App />
    </div>
  </React.StrictMode>,
);
