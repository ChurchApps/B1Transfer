import { test, expect, type APIRequestContext, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { graceJwt } from "./helpers/api";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMP = path.join(__dirname, ".tmp");
const API = "http://localhost:8084";
const SAMPLE_PATH = path.join(__dirname, "..", "public", "sampleimport.zip");
const OLD_FORMAT_PATH = path.join(__dirname, "fixtures", "sampleimport-v1.zip");

test.describe.configure({ mode: "serial" });

const get = async (request: APIRequestContext, jwt: string, url: string): Promise<any> =>
  request.get(`${API}${url}`, { headers: { Authorization: `Bearer ${jwt}` } }).then(r => r.json());

// Demo data reuses the sample's names, so "new" means ids that weren't there before the import.
async function snapshot(request: APIRequestContext, jwt: string) {
  const [
    people,
    groups,
    groupMembers,
    donations,
    batches,
    funds,
    forms,
    formSubmissions,
    answers,
    visits,
    sessions,
    visitSessions,
    fields,
    lists,
    groupServiceTimes
  ] = await Promise.all([
    "/membership/people",
    "/membership/groups",
    "/membership/groupmembers",
    "/giving/donations",
    "/giving/donationbatches",
    "/giving/funds",
    "/membership/forms",
    "/membership/formsubmissions",
    "/membership/answers",
    "/attendance/visits",
    "/attendance/sessions",
    "/attendance/visitsessions",
    "/membership/personfields",
    "/membership/lists",
    "/attendance/groupservicetimes"
  ].map(url => get(request, jwt, url)));
  return { people, groups, groupMembers, donations, batches, funds, forms, formSubmissions, answers, visits, sessions, visitSessions, fields, lists, groupServiceTimes };
}

type Snapshot = Awaited<ReturnType<typeof snapshot>>;
const added = (before: Snapshot, after: Snapshot, key: keyof Snapshot) => {
  const ids = new Set(before[key].map((r: any) => r.id));
  return after[key].filter((r: any) => !ids.has(r.id));
};

// The JWT cookie only restores the session through /login.
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

async function importZip(page: Page, file: string) {
  await gotoTool(page);
  await page.getByText("B1 Import Zip", { exact: true }).click();
  await page.locator('input[type="file"]').setInputFiles(file);
  await page.getByRole("button", { name: "Continue to Destination" }).click({ timeout: 60000 });
  await page.getByText("B1 Database", { exact: true }).click();
  await page.getByRole("button", { name: "Start Transfer" }).click();
  await expect(page.getByText(/Import Complete/)).toBeVisible({ timeout: 240000 });
  await expect(page.getByText("Import Completed with Errors")).toHaveCount(0);
}

function expectCoreCounts(before: Snapshot, after: Snapshot) {
  expect(added(before, after, "people")).toHaveLength(81);
  expect(added(before, after, "groups")).toHaveLength(30);
  expect(added(before, after, "groupMembers")).toHaveLength(98);
  expect(added(before, after, "donations")).toHaveLength(58);
  expect(added(before, after, "batches")).toHaveLength(4);
  expect(added(before, after, "forms")).toHaveLength(2);
  expect(added(before, after, "formSubmissions")).toHaveLength(3);
  expect(added(before, after, "answers")).toHaveLength(6);
  expect(added(before, after, "visitSessions")).toHaveLength(80);
  expect(added(before, after, "sessions")).toHaveLength(32);
  const fundNames = after.funds.map((f: any) => f.name);
  for (const name of ["General Fund", "Building Fund", "Missions Fund", "Youth Ministry", "Food Pantry", "Benevolence Fund"]) expect(fundNames).toContain(name);

  // Group 1 is listed with two service times; the second used to be dropped.
  const sundayMorning = added(before, after, "groups").find((g: any) => g.name === "Sunday Morning Service");
  const times = added(before, after, "groupServiceTimes").filter((t: any) => t.groupId === sundayMorning.id);
  expect(times).toHaveLength(2);
  expect(added(before, after, "groupServiceTimes")).toHaveLength(13);

  const newPeople = added(before, after, "people");
  const smiths = newPeople.filter((p: any) => p.name.last === "Smith");
  const john = smiths.find((p: any) => p.name.first === "John");
  expect(john.householdRole).toBe("Head");
  expect(smiths.filter((p: any) => p.householdId === john.householdId)).toHaveLength(5);
  expect(smiths.find((p: any) => p.name.first === "Mary").householdRole).toBe("Spouse");

  // Each answer belongs to one submission: Daniel and Lisa Brown answered the visitor card differently.
  const answersFor = (first: string) => {
    const person = newPeople.find((p: any) => p.name.last === "Brown" && p.name.first === first);
    const submission = added(before, after, "formSubmissions").find((s: any) => s.contentId === person.id);
    return added(before, after, "answers").filter((a: any) => a.formSubmissionId === submission.id).map((a: any) => a.value).sort();
  };
  expect(answersFor("Daniel")).toEqual(["Friend invited us", "Yes"]);
  expect(answersFor("Lisa")).toEqual(["Drove past the church", "Yes"]);
  return { john, smiths, newPeople, sundayMorning };
}

test("the downloadable sample zip imports every category into B1", async ({ page, request }) => {
  test.setTimeout(420000);
  fs.mkdirSync(TMP, { recursive: true });

  // The link on the Source tab must serve the sample this spec checks.
  await page.goto("/");
  await page.getByText("B1 Import Zip", { exact: true }).click();
  const href = await page.getByRole("link", { name: "here" }).getAttribute("href");
  const served = await request.get(href!).then(r => r.body());
  expect(served.equals(fs.readFileSync(SAMPLE_PATH))).toBeTruthy();
  const downloaded = path.join(TMP, "sampleimport.zip");
  fs.writeFileSync(downloaded, served);

  const jwt = await graceJwt(request);
  const before = await snapshot(request, jwt);
  await importZip(page, downloaded);
  const after = await snapshot(request, jwt);
  const { john, smiths, newPeople } = expectCoreCounts(before, after);

  const johnFull = await get(request, jwt, `/membership/people/${john.id}`);
  expect(String(johnFull.anniversary).slice(0, 10)).toBe("2000-06-10");
  expect(johnFull.donorNumber).toBe("1001");
  const michael = await get(request, jwt, `/membership/people/${smiths.find((p: any) => p.name.first === "Michael").id}`);
  expect(michael).toMatchObject({ grade: "7", school: "Lincoln Middle", nametagNotes: "Peanut allergy" });

  const fields = after.fields;
  const shirt = fields.find((f: any) => f.name === "T-Shirt Size");
  const gifts = fields.find((f: any) => f.name === "Spiritual Gifts");
  const values: any[] = await get(request, jwt, `/membership/personfieldvalues/person/${john.id}`);
  expect(values.find(v => v.fieldId === shirt.id)?.value).toBe("L");
  expect(values.find(v => v.fieldId === gifts.id)?.value).toBe("Teaching, Leadership");

  const pickups: any[] = await get(request, jwt, `/membership/householdpickup/${john.householdId}`);
  expect(pickups.find(p => p.name === "Linda Smith")).toMatchObject({ relationship: "Grandmother", status: "trusted", notes: "Picks up on Wednesdays" });

  const newGroups = added(before, after, "groups");
  const praiseTeam = newGroups.find((g: any) => g.name === "Praise Team");
  const praiseList = added(before, after, "lists").find((l: any) => l.name === "Praise Team Members");
  expect(praiseList).toMatchObject({ category: "Ministry", scope: "org" });
  const rules = typeof praiseList.rules === "string" ? JSON.parse(praiseList.rules) : praiseList.rules;
  expect(rules.conditions[0].entityId).toBe(praiseTeam.id);
  const members: any[] = await get(request, jwt, `/membership/groupmembers?groupId=${praiseTeam.id}`);
  const listPeople: any[] = await get(request, jwt, `/membership/lists/${praiseList.id}/people`);
  expect(members.length).toBeGreaterThan(0);
  expect(listPeople.map(p => p.id).sort()).toEqual(members.map(m => m.personId).sort());
  expect(listPeople.every(p => newPeople.some((n: any) => n.id === p.id))).toBeTruthy();
  const youthList = added(before, after, "lists").find((l: any) => l.name === "Youth Group Families");
  expect(youthList.householdInclusion).toBe("household");
});

test("an old-format B1 Import Zip still imports, including a group's extra service times", async ({ page, request }) => {
  test.setTimeout(420000);
  const jwt = await graceJwt(request);
  const before = await snapshot(request, jwt);
  await importZip(page, OLD_FORMAT_PATH);
  const after = await snapshot(request, jwt);
  expectCoreCounts(before, after);
});
