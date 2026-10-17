import { test } from "node:test";
import assert from "node:assert/strict";
import JSZip from "jszip";
import readB1Zip from "../ImportHelpers/ImportB1ZipHelper";
import exportToB1Db from "../ExportHelpers/ExportB1DbHelper";
import { ApiHelper } from "..";

// Issue #1258: a church's own B1 export includes attendance for groups that were later
// deleted, so attendance.csv can reference a groupKey that isn't in groups.csv.
test("a B1 zip with attendance for a deleted group loads and skips those rows", async () => {
  const zip = new JSZip();
  zip.file("people.csv", "importKey,firstName,lastName\n1,Donald,Clark\n");
  zip.file("services.csv", "campus,service,time,importKey\nMain,Sunday,9am,1\n");
  zip.file("groups.csv", "importKey,name,serviceTimeKey\n10,Adult Bible Class,1\n");
  zip.file("attendance.csv", "date,serviceTimeKey,groupKey,personKey\n2026-03-08,1,10,1\n2026-03-08,1,99,1\n");
  const data = await zip.generateAsync({ type: "uint8array" });

  const result = await readB1Zip(data as unknown as File);
  assert.equal(result.groups.length, 1);
  assert.equal(result.sessions.length, 1);
  assert.equal(result.sessions[0].groupKey, "10");
  assert.equal(result.visitSessions.length, 1);
});

// Issue #1263: groupmembers.csv can list memberships for people or groups that aren't in the
// zip (deleted since, or a person row without a last name). Those rows had no ids to post and
// the Api rejects the whole Group Members batch, so they must be skipped when loading.
test("a B1 zip with memberships for missing people or groups loads only the matched ones", async () => {
  const zip = new JSZip();
  zip.file("people.csv", "importKey,firstName,lastName\n1,Donald,Clark\n2,NoLast,\n");
  zip.file("groups.csv", "importKey,name\n10,Adult Bible Class\n");
  zip.file("groupmembers.csv", "groupKey,personKey,leader\n10,1,false\n10,2,false\n10,99,false\n99,1,false\n");
  const data = await zip.generateAsync({ type: "uint8array" });

  const result = await readB1Zip(data as unknown as File);
  assert.equal(result.groupMembers.length, 1);
  assert.equal(result.groupMembers[0].groupKey, "10");
  assert.equal(result.groupMembers[0].personKey, "1");
});

// Issue #1268: B1 sessions taken without a service time export with a blank serviceTimeKey, and a
// session whose service time was deleted keeps a key missing from services.csv. Attendance by a
// person who was deleted has a personKey missing from people.csv. The Attendance step crashed on
// these ("null is not an object") instead of restoring the rest of the zip.
test("restoring a B1 zip with sessions for blank or deleted service times and deleted people completes", async () => {
  const zip = new JSZip();
  zip.file("people.csv", "importKey,firstName,lastName\n1,Donald,Clark\n");
  zip.file("services.csv", "campus,service,time,importKey\nMain,Sunday,9am,1\n");
  zip.file("groups.csv", "importKey,name,serviceTimeKey\n10,Adult Bible Class,1\n11,Youth,\n");
  zip.file("attendance.csv", "date,serviceTimeKey,groupKey,personKey\n2026-03-08,1,10,1\n2026-03-08,,11,1\n2026-03-15,77,11,1\n2026-03-15,77,11,99\n");
  const data = await zip.generateAsync({ type: "uint8array" });
  const importData = await readB1Zip(data as unknown as File);

  const posted: Record<string, any[]> = {};
  const originalPost = ApiHelper.post;
  let nextId = 1;
  ApiHelper.post = (async (path: string, body: any) => {
    posted[path] = body;
    return Array.isArray(body) ? body.map(() => ({ id: `id${nextId++}` })) : { id: `id${nextId++}` };
  }) as typeof ApiHelper.post;
  const statuses: Record<string, string> = {};
  try {
    await exportToB1Db(importData, (name, status) => { statuses[name] = status; });
  } finally {
    ApiHelper.post = originalPost;
  }

  assert.equal(statuses["Attendance"], "complete");
  assert.equal(posted["/sessions"].length, 3);
  const unmatched = posted["/sessions"].filter((s: any) => s.serviceTimeKey !== "1");
  assert.equal(unmatched.length, 2);
  assert.equal(unmatched.every((s: any) => s.serviceTimeId === undefined), true);
  assert.equal(posted["/visits"].length, 3);
  assert.equal(posted["/visits"].every((v: any) => v.personId), true);
  assert.equal(posted["/visitsessions"].every((vs: any) => vs.visitId && vs.sessionId), true);
});
