import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { EnvironmentHelper, takeInboundJwt } from "./helpers";

takeInboundJwt();
EnvironmentHelper.init().then(() => {
  const container = document.getElementById("root");
  const root = createRoot(container!);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
