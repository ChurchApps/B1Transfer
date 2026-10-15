import { test, expect, type APIRequestContext, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import JSZip from "jszip";
import Papa from "papaparse";
import { graceJwt } from "./helpers/api";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMP = path.join(__dirname, ".tmp");
const EXPORT_PATH = path.join(TMP, "issue-1240-export.zip");
const RESTORE_PATH = path.join(TMP, "issue-1240-restore.zip");
const API = "http://localhost:8084";
const SEED = "Thistlewood";
const RESTORED = "Brackenridge";

const call = async (request: APIRequestContext, jwt: string, method: "get" | "post", url: string, data?: unknown) => {
  const res = await request[method](`${API}${url}`, { headers: { Authorization: `Bearer ${jwt}` }, data });
  expect(res.ok(), `${method} ${url}`).toBeTruthy();
  return res.json();
};

const parse = (text: string) => (Papa.parse(text.trim(), { header: true, skipEmptyLines: true }).data as any[]);
const unparse = (rows: any[], text: string) => rows.length ? Papa.unparse(rows) : (text.split("\n")[0] || "");

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
  await expect(page.getByText("Choose a data source")).toBeVisible({ timeout: 30000 });
}

async function choose(page: Page, option: string) {
  await page.getByText(option, { exact: true }).first().click();
}

// Two separate households that share a surname, one person with every person field filled in,
// a group with an about and a leader, a named batch, a donation with a transaction id, a fund
// nobody has given to, a choice question, and a custom field value.
async function seed(request: APIRequestContext, jwt: string) {
  const [h1, h2] = await call(request, jwt, "post", "/membership/households", [{ name: SEED }, { name: SEED }]);
  const [ada, bram] = await call(request, jwt, "post", "/membership/people", [
    {
      householdId: h1.id,
      householdRole: "Head",
      name: { first: "Ada", last: SEED },
      anniversary: "2001-06-09",
      grade: "10",
      school: "Riverside High",
      donorNumber: "D-4417",
      nametagNotes: "Peanut allergy",
      contactInfo: { email: "ada.thistlewood@example.com" }
    },
    { householdId: h2.id, householdRole: "Head", name: { first: "Bram", last: SEED }, contactInfo: {} }
  ]);
  const [group] = await call(request, jwt, "post", "/membership/groups", [{ name: `${SEED} Circle`, categoryName: "Small Groups", about: "Tuesday night study", trackAttendance: false }]);
  await call(request, jwt, "post", "/membership/groupmembers", [{ groupId: group.id, personId: ada.id, leader: true }, { groupId: group.id, personId: bram.id, leader: false }]);
  const [giftFund, spareFund] = await call(request, jwt, "post", "/giving/funds", [{ name: `${SEED} Gift Fund`, taxDeductible: true }, { name: `${SEED} Spare Fund`, taxDeductible: false }]);
  expect(spareFund.id).toBeTruthy();
  const [batch] = await call(request, jwt, "post", "/giving/donationbatches", [{ name: `${SEED} Batch`, batchDate: "2026-03-08" }]);
  const [donation] = await call(request, jwt, "post", "/giving/donations", [{ batchId: batch.id, personId: ada.id, donationDate: "2026-03-08", amount: 75, method: "Card", transactionId: "txn_thistle_1" }]);
  await call(request, jwt, "post", "/giving/funddonations", [{ donationId: donation.id, fundId: giftFund.id, amount: 75 }]);
  const [form] = await call(request, jwt, "post", "/membership/forms", [{ name: `${SEED} Form`, contentType: "person" }]);
  await call(request, jwt, "post", "/membership/questions", [
    {
      formId: form.id,
      title: "Shirt size",
      fieldType: "Multiple Choice",
      sort: 1,
      choices: [{ value: "S", text: "Small" }, { value: "L", text: "Large" }]
    }
  ]);
  const [field] = await call(request, jwt, "post", "/membership/personfields", [{ name: `${SEED} Ministry`, fieldType: "Textbox", sort: 99 }]);
  await call(request, jwt, "post", "/membership/personfieldvalues", [{ personId: ada.id, fieldId: field.id, value: "Greeter" }]);
  await call(request, jwt, "post", "/membership/householdpickup", [{ householdId: h1.id, name: `Nan ${SEED}`, relationship: "Grandmother", status: "trusted", notes: "Call first" }]);
  await call(request, jwt, "post", "/membership/lists", [
    {
      name: `${SEED} List`,
      category: "Care",
      scope: "org",
      householdInclusion: "none",
      rules: { match: "all", conditions: [{ provider: "group", field: "memberOf", operator: "in", entityId: group.id }] }
    }
  ]);
}

// Keeps only the seeded rows, renamed, so the restore lands as new records beside the originals.
async function buildRestoreZip(exported: JSZip) {
  const read = async (name: string) => (await exported.file(name)?.async("string")) ?? "";
  const restore = new JSZip();
  const put = (name: string, text: string, keep: (row: any) => boolean) => {
    const rows = parse(text).filter(keep);
    restore.file(name, unparse(rows, text).split(SEED).join(RESTORED));
    return rows;
  };
  const people = put("people.csv", await read("people.csv"), r => r.lastName === SEED);
  const personKeys = new Set(people.map(r => r.importKey));
  const groups = put("groups.csv", await read("groups.csv"), r => r.name?.startsWith(SEED));
  const groupKeys = new Set(groups.map(r => r.importKey));
  put("groupmembers.csv", await read("groupmembers.csv"), r => groupKeys.has(r.groupKey));
  put("donations.csv", await read("donations.csv"), r => personKeys.has(r.personKey));
  put("funds.csv", await read("funds.csv"), r => r.name?.startsWith(SEED));
  const forms = put("forms.csv", await read("forms.csv"), r => r.name?.startsWith(SEED));
  const formKeys = new Set(forms.map(r => r.importKey));
  put("questions.csv", await read("questions.csv"), r => formKeys.has(r.formKey));
  put("personfields.csv", await read("personfields.csv"), r => r.name?.startsWith(SEED));
  put("personfieldvalues.csv", await read("personfieldvalues.csv"), r => personKeys.has(r.personKey));
  const householdKeys = new Set(people.map(r => r.householdKey));
  put("householdpickup.csv", await read("householdpickup.csv"), r => householdKeys.has(r.householdKey));
  put("lists.csv", await read("lists.csv"), r => r.name?.startsWith(SEED));
  fs.writeFileSync(RESTORE_PATH, await restore.generateAsync({ type: "nodebuffer" }));
}

test("the B1 Export Zip round-trips every field staff can enter", async ({ page, request }) => {
  test.setTimeout(420000);
  fs.mkdirSync(TMP, { recursive: true });
  const jwt = await graceJwt(request);
  await seed(request, jwt);

  // Export the whole church.
  await gotoTool(page);
  await choose(page, "B1 Database");
  await page.getByRole("button", { name: "Continue to Destination" }).click({ timeout: 60000 });
  await choose(page, "B1 Export Zip");
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 180000 }),
    page.getByRole("button", { name: "Start Export" }).click()
  ]);
  await download.saveAs(EXPORT_PATH);
  const exported = await JSZip.loadAsync(fs.readFileSync(EXPORT_PATH));

  // The zip itself carries the fields.
  const people = parse(await exported.file("people.csv")!.async("string"));
  const ada = people.find(r => r.firstName === "Ada" && r.lastName === SEED);
  expect(ada).toMatchObject({ anniversary: "2001-06-09", grade: "10", school: "Riverside High", donorNumber: "D-4417", nametagNotes: "Peanut allergy" });

  // Restore the seeded rows under a new surname, then read them back from the Api.
  await buildRestoreZip(exported);
  await gotoTool(page);
  await choose(page, "B1 Import Zip");
  await page.locator('input[type="file"]').setInputFiles(RESTORE_PATH);
  await page.getByRole("button", { name: "Continue to Destination" }).click({ timeout: 60000 });
  await choose(page, "B1 Database");
  await page.getByRole("button", { name: "Start Transfer" }).click();
  await expect(page.getByText(/Import Complete/)).toBeVisible({ timeout: 180000 });
  await expect(page.getByText("Import Completed with Errors")).toHaveCount(0);

  const restoredPeople: any[] = await call(request, jwt, "get", `/membership/people/search?term=${RESTORED}`);
  const rAda = restoredPeople.find(p => p.name.first === "Ada");
  const rBram = restoredPeople.find(p => p.name.first === "Bram");
  expect(rAda).toMatchObject({ grade: "10", school: "Riverside High", donorNumber: "D-4417", nametagNotes: "Peanut allergy" });
  expect(String(rAda.anniversary).slice(0, 10)).toBe("2001-06-09");
  expect(rAda.householdId).not.toBe(rBram.householdId);

  const groups: any[] = await call(request, jwt, "get", "/membership/groups");
  const rGroup = groups.find(g => g.name === `${RESTORED} Circle`);
  expect(rGroup.about).toBe("Tuesday night study");
  const members: any[] = await call(request, jwt, "get", `/membership/groupmembers?groupId=${rGroup.id}`);
  expect(members.find(m => m.personId === rAda.id)?.leader).toBeTruthy();
  expect(members.find(m => m.personId === rBram.id)?.leader).toBeFalsy();

  const funds: any[] = await call(request, jwt, "get", "/giving/funds");
  expect(funds.map(f => f.name)).toContain(`${RESTORED} Spare Fund`);
  const batches: any[] = await call(request, jwt, "get", "/giving/donationbatches");
  const rBatch = batches.find(b => b.name === `${RESTORED} Batch`);
  expect(String(rBatch?.batchDate).slice(0, 10)).toBe("2026-03-08");
  const donations: any[] = await call(request, jwt, "get", "/giving/donations");
  expect(donations.find(d => d.personId === rAda.id)?.transactionId).toBe("txn_thistle_1");

  const forms: any[] = await call(request, jwt, "get", "/membership/forms");
  const rForm = forms.find(f => f.name === `${RESTORED} Form`);
  const questions: any[] = await call(request, jwt, "get", `/membership/questions?formId=${rForm.id}`);
  const choices = typeof questions[0].choices === "string" ? JSON.parse(questions[0].choices) : questions[0].choices;
  expect(choices).toEqual([{ value: "S", text: "Small" }, { value: "L", text: "Large" }]);

  const fields: any[] = await call(request, jwt, "get", "/membership/personfields");
  const rField = fields.find(f => f.name === `${RESTORED} Ministry`);
  const values: any[] = await call(request, jwt, "get", `/membership/personfieldvalues/person/${rAda.id}`);
  expect(values.find(v => v.fieldId === rField?.id)?.value).toBe("Greeter");

  const pickups: any[] = await call(request, jwt, "get", `/membership/householdpickup/${rAda.householdId}`);
  expect(pickups.find(p => p.name === `Nan ${RESTORED}`)).toMatchObject({ relationship: "Grandmother", status: "trusted", notes: "Call first" });

  const lists: any[] = await call(request, jwt, "get", "/membership/lists");
  const rList = lists.find(l => l.name === `${RESTORED} List`);
  expect(rList).toMatchObject({ category: "Care", scope: "org" });
  const rules = typeof rList.rules === "string" ? JSON.parse(rList.rules) : rList.rules;
  expect(rules.conditions[0].entityId).toBe(rGroup.id);
  const listPeople: any[] = await call(request, jwt, "get", `/membership/lists/${rList.id}/people`);
  expect(listPeople.map(p => p.id).sort()).toEqual([rAda.id, rBram.id].sort());
});
