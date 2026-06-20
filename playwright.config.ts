import { defineConfig, devices } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_STATE_PATH = path.join(__dirname, "tests", ".auth-state.json");

const baseURL = process.env.BASE_URL || "http://localhost:3102";

export default defineConfig({
  testDir: "./tests",
  testMatch: /.*\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // The transfer specs mutate the shared demo DB (a full DB->DB round trip),
  // so they must run one-at-a-time and in order. Serialize.
  workers: 1,
  reporter: "list",
  timeout: 120 * 1000,
  expect: { timeout: 10 * 1000 },

  globalSetup: "./tests/global-setup.ts",

  use: {
    baseURL,
    storageState: STORAGE_STATE_PATH,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000
  },

  webServer: [
    {
      command: "npm --prefix ../Api run dev",
      url: "http://localhost:8084/health",
      reuseExistingServer: true,
      timeout: 60 * 1000,
      stdout: "pipe",
      stderr: "pipe"
    },
    {
      command: "yarn start",
      env: {
        VITE_STAGE: "dev",
        REACT_APP_API_BASE: "http://localhost:8084"
      },
      url: "http://localhost:3102",
      reuseExistingServer: true,
      timeout: 120 * 1000
    }
  ],

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], headless: true }
    }
  ]
});
