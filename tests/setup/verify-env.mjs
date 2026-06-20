const DEFAULT_BASE_URL = "http://localhost:3102";
const API_BASE = "http://localhost:8084";
// Tests work against either ENVIRONMENT=demo (stage demo deployments) or
// ENVIRONMENT=dev pointed at localhost — same set reset-demo accepts.
const ALLOWED_ENVIRONMENTS = ["demo", "dev"];
const REQUIRED_MODULES = ["membership", "attendance", "giving"];

class VerifyEnvError extends Error {
  constructor(message) {
    super(message);
    this.name = "VerifyEnvError";
  }
}

function refuse(lines) {
  const body = Array.isArray(lines) ? lines.join("\n  ") : lines;
  throw new VerifyEnvError(
    [
      "",
      "========================================",
      "B1Transfer tests refused to run.",
      `  ${body}`,
      "========================================",
      "",
    ].join("\n")
  );
}

function checkBaseUrl() {
  const raw = process.env.BASE_URL || DEFAULT_BASE_URL;
  let url;
  try {
    url = new URL(raw);
  } catch {
    refuse(`BASE_URL "${raw}" is not a valid URL.`);
  }
  if (url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    refuse([
      `BASE_URL "${raw}" is not local.`,
      "Tests only run against http://localhost:3102. Unset BASE_URL or point it at localhost.",
    ]);
  }
}

async function checkApiHealth() {
  let health;
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) refuse(`GET ${API_BASE}/health returned HTTP ${res.status}.`);
    health = await res.json();
  } catch (err) {
    if (err instanceof VerifyEnvError) throw err;
    refuse([
      `Could not reach Api at ${API_BASE}/health.`,
      `Error: ${err instanceof Error ? err.message : String(err)}`,
      "The Api dev server should already be running (Playwright webServer starts it).",
    ]);
  }
  if (!ALLOWED_ENVIRONMENTS.includes(health.environment)) {
    refuse([
      `Api reports environment="${health.environment}" but must be one of: ${ALLOWED_ENVIRONMENTS.join(", ")}.`,
      "Set ENVIRONMENT=demo or ENVIRONMENT=dev (against localhost) in Api/.env and restart the Api.",
    ]);
  }
  const loaded = health.modules ?? [];
  const missing = REQUIRED_MODULES.filter((m) => !loaded.includes(m));
  if (missing.length > 0) {
    refuse([
      `Api is missing modules for: ${missing.join(", ")}.`,
      "Check API_DATABASE_URL in Api/.env.",
    ]);
  }
}

export async function verifyEnv({ fullCheck } = {}) {
  checkBaseUrl();
  if (fullCheck) await checkApiHealth();
}

export { VerifyEnvError };
