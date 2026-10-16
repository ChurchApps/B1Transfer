import { test } from "node:test";
import assert from "node:assert/strict";
import JSZip from "jszip";
import readB1Zip from "../ImportHelpers/ImportB1ZipHelper";

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
