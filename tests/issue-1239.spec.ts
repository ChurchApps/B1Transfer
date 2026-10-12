import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import JSZip from "jszip";
import { graceJwt } from "./helpers/api";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMP = path.join(__dirname, ".tmp");
const ZIP_PATH = path.join(TMP, "issue-1239.zip");

test("restoring a B1 Import Zip keeps each person's household role", async ({ page, request }) => {
  test.setTimeout(180000);
  fs.mkdirSync(TMP, { recursive: true });
  const zip = new JSZip();
  zip.file("people.csv", "importKey,householdName,householdRole,firstName,lastName\n"
    + "9001,Quillfeather,Head,Marlow,Quillfeather\n"
    + "9002,Quillfeather,Child,Juniper,Quillfeather\n");
  fs.writeFileSync(ZIP_PATH, await zip.generateAsync({ type: "nodebuffer" }));

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
  await page.getByText("B1 Import Zip", { exact: true }).click();
  await page.locator('input[type="file"]').setInputFiles(ZIP_PATH);
  await page.getByRole("button", { name: "Continue to Destination" }).click({ timeout: 60000 });
  await page.getByText("B1 Database", { exact: true }).click();
  await page.getByRole("button", { name: "Start Transfer" }).click();
  await expect(page.getByText(/Import Complete/)).toBeVisible({ timeout: 120000 });

  const jwt = await graceJwt(request);
  const people = await request.get("http://localhost:8084/membership/people/search?term=Quillfeather", { headers: { Authorization: `Bearer ${jwt}` } }).then(r => r.json());
  const roles = Object.fromEntries(people.map((p: any) => [p.name.first, p.householdRole]));
  expect(roles).toEqual({ Marlow: "Head", Juniper: "Child" });
});
