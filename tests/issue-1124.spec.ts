import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMP = path.join(__dirname, ".tmp");
const CSV_PATH = path.join(TMP, "issue-1124.csv");

test("importing a Custom CSV into B1 says Import, not Export, on the Run tab", async ({ page }) => {
  test.setTimeout(180000);
  fs.mkdirSync(TMP, { recursive: true });
  fs.writeFileSync(CSV_PATH, "First Name,Last Name,Email\nPriya,Hollings,priya.hollings@example.com\n");

  await page.goto("/login");
  const churchDialog = page.locator('[role="dialog"]').filter({ hasText: "Select a Church" });
  await Promise.race([
    page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30000 }).catch(() => {}),
    churchDialog.waitFor({ state: "visible", timeout: 30000 }).catch(() => {})
  ]);
  if (await churchDialog.isVisible().catch(() => false)) {
    await page.locator('[role="dialog"] h3:has-text("Grace Community Church")').first().click();
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30000 });
  }
  await page.getByText("Custom CSV / Excel", { exact: true }).click();
  await page.locator('input[type="file"]').setInputFiles(CSV_PATH);
  await page.getByRole("button", { name: /Confirm Mapping & Import/ }).click();

  await page.getByRole("button", { name: "Continue to Destination" }).click({ timeout: 60000 });
  await page.getByText("B1 Database", { exact: true }).click();
  await page.getByRole("button", { name: "Start Transfer" }).click();

  await expect(page.getByText("All data has been successfully imported into your B1 database.")).toBeVisible({ timeout: 120000 });
  await expect(page.getByText("Import Progress")).toBeVisible();
  await expect(page.getByText("Import Complete!")).toBeVisible();
  await expect(page.getByText(/^Export/)).toHaveCount(0);
});
