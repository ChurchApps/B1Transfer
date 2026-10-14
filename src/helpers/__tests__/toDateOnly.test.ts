import { test } from "node:test";
import assert from "node:assert/strict";
import { ImportHelper } from "../ImportHelper";

// Pure helper checks run with `yarn test:unit` (node:test). ImportHelper can't load under
// Playwright because @churchapps/apphelper's dist uses directory imports Node ESM rejects.

test("toDateOnly keeps the calendar day of UTC-midnight and local-midnight dates", () => {
  assert.equal(ImportHelper.toDateOnly(new Date("2026-03-08")), "2026-03-08");
  assert.equal(ImportHelper.toDateOnly(new Date("2026-03-08T00:00:00.000Z")), "2026-03-08");
  assert.equal(ImportHelper.toDateOnly("2026-03-08"), "2026-03-08");
  assert.equal(ImportHelper.toDateOnly(new Date("03/08/2026")), "2026-03-08");
});

test("getOrCreateBatch stores the source day as batchDate", () => {
  const batch = ImportHelper.getOrCreateBatch([], "Sunday", new Date("2026-03-08"));
  assert.equal(String(batch.batchDate).slice(0, 10), "2026-03-08");
});

test("a person with no household gets no householdId instead of throwing", () => {
  const person: { householdKey?: string, householdId?: string } = {};
  assert.doesNotThrow(() => { person.householdId = ImportHelper.householdIdFor([], person.householdKey); });
  assert.equal(person.householdId, undefined);
  assert.equal(ImportHelper.householdIdFor([{ importKey: "1", id: "HH1" }], "2"), undefined);
  assert.equal(ImportHelper.householdIdFor([{ importKey: "1", id: "HH1" }], "1"), "HH1");
});
