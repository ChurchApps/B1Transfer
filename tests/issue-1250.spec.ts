import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMP = path.join(__dirname, ".tmp");
const ZIP_PATH = path.join(TMP, "issue-1250.zip");

test("a B1 Import Zip that can't be read shows an error instead of silently resetting", async ({ page }) => {
  fs.mkdirSync(TMP, { recursive: true });
  fs.writeFileSync(ZIP_PATH, "not a zip file");

  await page.goto("/");
  await page.getByText("B1 Import Zip", { exact: true }).click();
  await page.locator('input[type="file"]').setInputFiles(ZIP_PATH);
  await expect(page.getByText(/Failed to parse file/)).toBeVisible({ timeout: 30000 });
});
