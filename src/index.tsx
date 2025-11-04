import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { EnvironmentHelper } from "./helpers";

EnvironmentHelper.init().then(() => {
  const container = document.getElementById("root");
  const root = createRoot(container!);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
