import { test, expect, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import JSZip from "jszip";
import Papa from "papaparse";
import { getCounts } from "./helpers/api";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMP = path.join(__dirname, ".tmp");
const ZIP_PATH = path.join(TMP, "b1-export.zip");

fs.mkdirSync(TMP, { recursive: true });

// JWT cookie auto-restores session.
async function gotoTool(page: Page) {
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
  await expect(page.getByRole("combobox", { name: "Data Source" })).toBeVisible({ timeout: 30000 });
}

async function selectSource(page: Page, optionName: string | RegExp) {
  await page.getByRole("combobox", { name: "Data Source" }).click();
  await page.getByRole("option", { name: optionName, exact: typeof optionName === "string" }).click();
}

async function selectDestination(page: Page, optionName: string | RegExp) {
  await page.getByRole("combobox", { name: "Export Destination" }).click();
  await page.getByRole("option", { name: optionName, exact: typeof optionName === "string" }).click();
}

function csvRowCount(content: string): number {
  const parsed = Papa.parse(content.trim(), { header: true, skipEmptyLines: true });
  return (parsed.data as any[]).length;
}

test.describe.configure({ mode: "serial" });

test.describe("B1Transfer data transfer", () => {
  test("loads the B1 database as a source and previews every category", async ({ page }) => {
    await gotoTool(page);
    await selectSource(page, "B1 Database");

    await expect(page.getByRole("button", { name: "Continue to Destination" })).toBeVisible({ timeout: 60000 });

    await expect(page.getByRole("tab", { name: "People" })).toBeVisible();
    await page.getByRole("tab", { name: "Forms" }).click();
    await expect(page.getByText("Visitor Information Card")).toBeVisible();
  });

  test("exports the B1 database to a zip with every category intact", async ({ page, request }) => {
    const counts = await getCounts(request);
    expect(counts.questions).toBeGreaterThan(0); // sanity: demo has questions to export

    await gotoTool(page);
    await selectSource(page, "B1 Database");
    await page.getByRole("button", { name: "Continue to Destination" }).click({ timeout: 60000 });

    await selectDestination(page, "B1 Export Zip");
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 120000 }),
      page.getByRole("button", { name: "Start Export" }).click()
    ]);
    await download.saveAs(ZIP_PATH);

    const zip = await JSZip.loadAsync(fs.readFileSync(ZIP_PATH));
    const read = async (name: string) => csvRowCount(await zip.file(name)!.async("string"));

    // Each exported CSV must carry the full count the live DB reports.
    expect(await read("people.csv")).toBe(counts.people);
    expect(await read("groupmembers.csv")).toBe(counts.groupMembers);
    expect(await read("donations.csv")).toBe(counts.donations);
    expect(await read("forms.csv")).toBe(counts.forms);
    expect(await read("questions.csv")).toBe(counts.questions);
    expect(await read("formSubmissions.csv")).toBe(counts.formSubmissions);
    expect(await read("answers.csv")).toBe(counts.answers);
    expect(await read("attendance.csv")).toBe(counts.exportableAttendance);
  });

  test("exports the B1 database to every downloadable format", async ({ page }) => {
    for (const fmt of ["Breeze Export Zip", "Planning Center zip", "Tithe.ly Export Zip", "CCB / Pushpay Export Zip"]) {
      await gotoTool(page);
      await selectSource(page, "B1 Database");
      await page.getByRole("button", { name: "Continue to Destination" }).click({ timeout: 60000 });
      await selectDestination(page, fmt);
      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 60000 }),
        page.getByRole("button", { name: "Start Export" }).click()
      ]);
      expect(download.suggestedFilename()).toBeTruthy();
    }
  });

  test("round-trips the exported zip back into the B1 database", async ({ page, request }) => {
    test.setTimeout(300000);
    expect(fs.existsSync(ZIP_PATH)).toBeTruthy();
    const before = await getCounts(request);

    await gotoTool(page);
    await selectSource(page, "B1 Import Zip");
    await page.locator('input[type="file"]').setInputFiles(ZIP_PATH);

    await expect(page.getByRole("button", { name: "Continue to Destination" })).toBeVisible({ timeout: 60000 });
    await page.getByRole("button", { name: "Continue to Destination" }).click();

    await selectDestination(page, "B1 Database");
    await page.getByRole("button", { name: "Start Transfer" }).click();

    await expect(page.getByText(/Export Complete/)).toBeVisible({ timeout: 240000 });
    await expect(page.getByText("Export Completed with Errors")).toHaveCount(0);

    const after = await getCounts(request);
    // Clean 1:1 categories must have grown by exactly the imported count.
    expect(after.people).toBe(before.people * 2);
    expect(after.groupMembers).toBe(before.groupMembers * 2);
    expect(after.donations).toBe(before.donations * 2);
    expect(after.forms).toBe(before.forms * 2);
    expect(after.questions).toBe(before.questions * 2);
    expect(after.formSubmissions).toBe(before.formSubmissions * 2);
    expect(after.answers).toBe(before.answers * 2);
    // Attendance is keyed off looser linkage; just confirm it grew.
    expect(after.visits).toBeGreaterThan(before.visits);
    expect(after.sessions).toBeGreaterThan(before.sessions);
  });
});
