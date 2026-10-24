import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Map Fields' sticky header had no background, so rows showed through it when
// scrolled, and the footer said "2022 © Live Church Solutions".
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMP = path.join(__dirname, ".tmp");
const CSV_PATH = path.join(TMP, "issue-1348.csv");

test("the footer shows the current year and ChurchApps", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(`${new Date().getFullYear()} © ChurchApps. All rights reserved.`)).toBeVisible();
});

test("the Map Fields sticky header has a background", async ({ page }) => {
  fs.mkdirSync(TMP, { recursive: true });
  const columns = Array.from({ length: 25 }, (_, i) => `Column ${i + 1}`);
  fs.writeFileSync(CSV_PATH, columns.join(",") + "\n" + columns.map((_, i) => `Value ${i + 1}`).join(",") + "\n");

  await page.goto("/");
  await page.getByText("Custom CSV / Excel", { exact: true }).click();
  await page.locator('input[type="file"]').setInputFiles(CSV_PATH);
  const header = page.getByRole("columnheader", { name: "Your Column" });
  await expect(header).toBeVisible({ timeout: 30000 });
  const bg = await header.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).not.toBe("rgba(0, 0, 0, 0)");
  expect(bg).not.toBe("transparent");
});
