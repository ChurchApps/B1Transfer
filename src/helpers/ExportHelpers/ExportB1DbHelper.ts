import {
  ImportHelper, ImportPersonInterface, ImportHouseholdInterface
  , ImportCampusInterface, ImportServiceInterface, ImportServiceTimeInterface
  , ImportGroupInterface, ImportGroupMemberInterface, ImportGroupServiceTimeInterface
  , ImportVisitInterface, ImportSessionInterface, ImportVisitSessionInterface
  , ImportDonationBatchInterface, ImportFundInterface, ImportDonationInterface
  , ImportFundDonationInterface, ImportDataInterface, ImportFormsInterface
  , ImportQuestionsInterface, ImportFormSubmissions, ImportAnswerInterface
} from "../ImportHelper";
import { ApiHelper } from "..";
import { runStep } from "./RunStep";

const BATCH_SIZE = 1000;
const MAX_RETRIES = 3;

export interface UndoEntry { endpoint: string; apiName: any; id: string }

// Endpoints the Api's audit registry marks batch-capable. Only these accept X-Batch-Id;
// any other route 400s when the header is present, so the batch header is scoped to just these.
const BATCH_CAPABLE = [
  "/campuses",
  "/people",
  "/groups",
  "/groupmembers",
  "/forms",
  "/donations",
  "/households",
  "/questions",
  "/services",
  "/servicetimes",
  "/groupservicetimes",
  "/funds",
  "/donationbatches",
  "/funddonations"
];

// ponytail: module-level log of every row this run inserted; reversed = FK-safe delete order
let undoLog: UndoEntry[] = [];

// Set only while an import is running; the request hook stamps the header on batch-capable calls.
let activeBatchId: string | undefined;
const batchRequestHook = (url: string, requestOptions: any) => {
  if (activeBatchId && BATCH_CAPABLE.some(e => url.endsWith(e))) {
    requestOptions.headers = { ...(requestOptions.headers || {}), "X-Batch-Id": activeBatchId };
  }
};

const postInBatches = async <T extends { id?: string }>(
  endpoint: string,
  data: T[],
  apiName: any,
  progressCallback?: (current: number, total: number, isComplete: boolean) => void
): Promise<T[]> => {
  const results: T[] = [];
  const totalBatches = Math.ceil(data.length / BATCH_SIZE);

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const currentBatch = Math.floor(i / BATCH_SIZE) + 1;
    const batch = data.slice(i, i + BATCH_SIZE);
    const isLastBatch = currentBatch === totalBatches;

    if (progressCallback) {
      progressCallback(currentBatch, totalBatches, isLastBatch);
    }

    let batchResults: T[] = [];
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        batchResults = (await ApiHelper.post(endpoint, batch, apiName)) || [];
        break;
      } catch (e) {
        if (attempt === MAX_RETRIES) throw e;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    const mapped = Math.min(batch.length, batchResults.length);
    for (let j = 0; j < mapped; j++) {
      batch[j].id = batchResults[j].id;
      if (batch[j].id) undoLog.push({ endpoint, apiName, id: batch[j].id as string });
      results.push(batch[j]);
    }
  }

  return results;
};

export interface ImportResult { undoLog: UndoEntry[]; batchId?: string }

const exportToB1Db = async (exportData: ImportDataInterface, updateProgress: (name: string, status: string) => void, importSourceName?: string): Promise<ImportResult> => {

  undoLog = [];

  const runImport = (keyName: string, code: () => void, skipComplete = false) => runStep(keyName, updateProgress, code, skipComplete);

  let batchId: string | undefined;
  try {
    const label = `Import from ${importSourceName || "file"} ${new Date().toLocaleDateString()}`;
    const batch = await ApiHelper.post("/batches", { label, source: "import" }, "MembershipApi");
    batchId = batch?.id;
  } catch (e) {
    // Batch tracking is best-effort; a failure here must not block the import itself.
    console.error("Could not create undo batch; import will not be undoable from B1Admin", e);
  }

  const prevOnRequest = ApiHelper.onRequest;
  if (batchId) {
    activeBatchId = batchId;
    ApiHelper.onRequest = batchRequestHook;
  }

  try {
    const campusResult = await exportCampuses(exportData, runImport);
    const tmpPeople = await exportPeople(exportData, runImport, updateProgress);
    const tmpGroups = await exportGroups(exportData, tmpPeople, campusResult.serviceTimes, runImport, updateProgress);
    await exportAttendance(exportData, tmpPeople, tmpGroups, campusResult.services, campusResult.serviceTimes, runImport, updateProgress);
    await exportDonations(exportData, tmpPeople, runImport, updateProgress);
    await exportForms(exportData, tmpPeople, tmpGroups, runImport);
  } finally {
    activeBatchId = undefined;
    ApiHelper.onRequest = prevOnRequest;
    if (batchId) {
      try {
        await ApiHelper.post(`/batches/${batchId}/complete`, {}, "MembershipApi");
        console.log(`Import recorded as batch ${batchId}. It can be undone from B1Admin Settings → Batches.`);
      } catch (e) {
        console.error("Could not close undo batch", batchId, e);
      }
    }
  }

  return { undoLog, batchId };
};

export const undoB1DbImport = async (log: UndoEntry[], onProgress?: (done: number, total: number) => void) => {
  // Delete in reverse insertion order so children (e.g. funddonations) go before parents (donations/funds).
  for (let i = log.length - 1; i >= 0; i--) {
    const { endpoint, apiName, id } = log[i];
    try {
      await ApiHelper.delete(`${endpoint}/${id}`, apiName);
    } catch (e) {
      // ponytail: tolerate already-gone rows; keep deleting the rest
      console.error("Undo delete failed", endpoint, id, e);
    }
    if (onProgress) onProgress(log.length - i, log.length);
  }
};

const exportCampuses = async (exportData: ImportDataInterface, runImport: (keyName: string, code: () => void, skipComplete?: boolean) => Promise<void>) => {
  const tmpCampuses: ImportCampusInterface[] = [...exportData.campuses];
  const tmpServices: ImportServiceInterface[] = [...exportData.services];
  const tmpServiceTimes: ImportServiceTimeInterface[] = [...exportData.serviceTimes];

  await runImport("Campuses/Services/Times", async () => {
    if (tmpCampuses.length > 0) {
      await postInBatches("/campuses", tmpCampuses, "MembershipApi");
    }

    if (tmpServices.length > 0) {
      tmpServices.forEach((s) => { s.campusId = ImportHelper.getByImportKey(tmpCampuses, s.campusKey).id; });
      await postInBatches("/services", tmpServices, "AttendanceApi");
    }

    if (tmpServiceTimes.length > 0) {
      tmpServiceTimes.forEach((st) => { st.serviceId = ImportHelper.getByImportKey(tmpServices, st.serviceKey).id; });
      await postInBatches("/servicetimes", tmpServiceTimes, "AttendanceApi");
    }
  });
  return { campuses: tmpCampuses, services: tmpServices, serviceTimes: tmpServiceTimes };
};

const exportPeople = async (exportData: ImportDataInterface, runImport: (keyName: string, code: () => void, skipComplete?: boolean) => Promise<void>, updateProgress: (name: string, status: string) => void) => {
  const tmpPeople: ImportPersonInterface[] = [...exportData.people];
  const tmpHouseholds: ImportHouseholdInterface[] = [...exportData.households];

  tmpPeople.forEach((p) => {
    // Blank/invalid birthdates would make new Date("").toISOString() throw and abort the whole import.
    if (p.birthDate) {
      const d = new Date(p.birthDate);
      p.birthDate = isNaN(d.getTime()) ? undefined : d.toISOString();
    } else {
      p.birthDate = undefined;
    }
  });

  await runImport("Households", async () => {
    if (tmpHouseholds.length > 0) {
      await postInBatches("/households", tmpHouseholds, "MembershipApi");
    }
  });

  await runImport("People", async () => {
    if (tmpPeople.length > 0) {
      tmpPeople.forEach((p) => {
        p.householdId = ImportHelper.getByImportKey(tmpHouseholds, p.householdKey).id;
        p.householdRole = "Other";
      });
      await postInBatches("/people", tmpPeople, "MembershipApi", (current, total, isComplete) => {
        if (isComplete) {
          updateProgress("People", "complete");
        } else {
          updateProgress("People", `running (batch ${current}/${total})`);
        }
      });
    } else {
      updateProgress("People", "complete");
    }
  }, true);

  await runImport("Photos", async () => {
  });

  return tmpPeople;
};

const exportGroups = async (
  exportData: ImportDataInterface,
  tmpPeople: ImportPersonInterface[],
  tmpServiceTimes: ImportServiceTimeInterface[],
  runImport: (keyName: string, code: () => void, skipComplete?: boolean) => Promise<void>,
  updateProgress: (name: string, status: string) => void
) => {
  const tmpGroups: ImportGroupInterface[] = [...exportData.groups];
  const tmpTimes: ImportGroupServiceTimeInterface[] = [...exportData.groupServiceTimes];
  const tmpMembers: ImportGroupMemberInterface[] = [...exportData.groupMembers];

  await runImport("Groups", async () => {
    if (tmpGroups.length > 0) {
      await postInBatches("/groups", tmpGroups, "MembershipApi");
    }
  });

  await runImport("Group Service Times", async () => {
    if (tmpTimes.length > 0) {
      tmpTimes.forEach((gst) => {
        gst.groupId = ImportHelper.getByImportKey(tmpGroups, gst.groupKey).id;
        gst.serviceTimeId = ImportHelper.getByImportKey(tmpServiceTimes, gst.serviceTimeKey).id;
      });
      await postInBatches("/groupservicetimes", tmpTimes, "AttendanceApi");
    }
  });

  await runImport("Group Members", async () => {
    if (tmpMembers.length > 0) {
      tmpMembers.forEach((gm) => {
        gm.groupId = ImportHelper.getByImportKey(tmpGroups, gm.groupKey)?.id;
        gm.personId = ImportHelper.getByImportKey(tmpPeople, gm.personKey)?.id;
      });
      await postInBatches("/groupmembers", tmpMembers, "MembershipApi", (current, total, isComplete) => {
        if (isComplete) {
          updateProgress("Group Members", "complete");
        } else {
          updateProgress("Group Members", `running (batch ${current}/${total})`);
        }
      });
    } else {
      updateProgress("Group Members", "complete");
    }
  }, true);

  return tmpGroups;
};

const exportForms = async (exportData: ImportDataInterface, tmpPeople: ImportPersonInterface[], tmpGroups: ImportGroupInterface[], runImport: (keyName: string, code: () => void) => Promise<void>) => {
  const tmpForms: ImportFormsInterface[] = [...exportData.forms];
  const tmpQuestions: ImportQuestionsInterface[] = [...exportData.questions];
  const tmpFormSubmissions: ImportFormSubmissions[] = [...exportData.formSubmissions];
  const tmpAnswers: ImportAnswerInterface[] = [...exportData.answers];

  await runImport("Forms", async () => {
    if (tmpForms.length > 0) {
      await postInBatches("/forms", tmpForms, "MembershipApi");
    }
  });

  await runImport("Questions", async () => {
    if (tmpQuestions.length > 0) {
      tmpQuestions.forEach(q => {
        q.formId = ImportHelper.getByImportKey(tmpForms, q.formKey).id;
      });
      await postInBatches("/questions", tmpQuestions, "MembershipApi");
    }
  });

  await runImport("Answers", async () => {
    if (tmpFormSubmissions.length > 0) {
      const resolved: ImportFormSubmissions[] = [];
      tmpFormSubmissions.forEach(fs => {
        const form = ImportHelper.getByImportKey(tmpForms, fs.formKey);
        const content = (fs.contentType === "group")
          ? ImportHelper.getByImportKey(tmpGroups, fs.personKey)
          : ImportHelper.getByImportKey(tmpPeople, fs.personKey);
        if (!form || !content) return; // skip orphan submission instead of aborting the whole transfer
        fs.formId = form.id;
        fs.contentId = content.id;

        const fsKey = (fs as any).importKey;
        const questions: any[] = [];
        const answers: any[] = [];
        tmpQuestions.forEach(q => {
          if (q.formId === form.id) {
            questions.push(q);

            tmpAnswers.forEach(a => {
              if (a.questionKey !== q.questionKey) return;
              if (fsKey && a.formSubmissionKey && a.formSubmissionKey !== fsKey) return;
              answers.push({ questionId: q.id, value: a.value });
            });

          }
        });
        fs.questions = questions;
        fs.answers = answers;
        resolved.push(fs);
      });
      tmpFormSubmissions.length = 0;
      tmpFormSubmissions.push(...resolved);
    }
  });
  await runImport("Form Submissions", async () => {
    if (tmpFormSubmissions.length > 0) {
      await postInBatches("/formsubmissions", tmpFormSubmissions, "MembershipApi");
    }
  });
};

const exportDonations = async (exportData: ImportDataInterface, tmpPeople: ImportPersonInterface[], runImport: (keyName: string, code: () => void, skipComplete?: boolean) => Promise<void>, updateProgress: (name: string, status: string) => void) => {
  const tmpFunds: ImportFundInterface[] = [...exportData.funds];
  const tmpBatches: ImportDonationBatchInterface[] = [...exportData.batches];
  const tmpDonations: ImportDonationInterface[] = [...exportData.donations];

  await runImport("Funds", async () => {
    await postInBatches("/funds", tmpFunds, "GivingApi");
  });

  await runImport("Donation Batches", async () => {
    if (tmpBatches.length > 0) {
      await postInBatches("/donationbatches", tmpBatches, "GivingApi");
    }
  });

  await runImport("Donations", async () => {
    if (tmpDonations.length > 0) {
      tmpDonations.forEach((d) => {
        d.batchId = ImportHelper.getByImportKey(tmpBatches, d.batchKey).id;
        d.personId = ImportHelper.getByImportKey(tmpPeople, d.personKey)?.id;
      });

      await postInBatches("/donations", tmpDonations, "GivingApi", (current, total) => {
        updateProgress("Donations", `running (batch ${current}/${total})`);
      });
    } else {
      updateProgress("Donations", "running");
    }
  }, true);

  await runImport("Donation Funds", async () => {
    const tmpFundDonations: ImportFundDonationInterface[] = [...exportData.fundDonations];
    if (tmpFundDonations.length > 0) {
      tmpFundDonations.forEach((fd) => {
        fd.donationId = ImportHelper.getByImportKey(tmpDonations, fd.donationKey).id;
        fd.fundId = ImportHelper.getByImportKey(tmpFunds, fd.fundKey).id;
      });
      await postInBatches("/funddonations", tmpFundDonations, "GivingApi", (current, total, isComplete) => {
        if (isComplete) {
          updateProgress("Donations", "complete");
        } else {
          updateProgress("Donations", `running (fund donations batch ${current}/${total})`);
        }
      });
    } else {
      updateProgress("Donations", "complete");
    }
  }, true);
};

const exportAttendance = async (
  exportData: ImportDataInterface,
  tmpPeople: ImportPersonInterface[],
  tmpGroups: ImportGroupInterface[],
  tmpServices: ImportServiceInterface[],
  tmpServiceTimes: ImportServiceTimeInterface[],
  runImport: (keyName: string, code: () => void, skipComplete?: boolean) => Promise<void>,
  updateProgress: (name: string, status: string) => void
) => {
  const tmpSessions: ImportSessionInterface[] = [...exportData.sessions];
  const tmpVisits: ImportVisitInterface[] = [...exportData.visits];
  await runImport("Attendance", async () => {
    if (tmpSessions.length > 0) {
      tmpSessions.forEach((s) => {
        s.groupId = ImportHelper.getByImportKey(tmpGroups, s.groupKey).id;
        s.serviceTimeId = ImportHelper.getByImportKey(tmpServiceTimes, s.serviceTimeKey).id;
      });
      await postInBatches("/sessions", tmpSessions, "AttendanceApi");
    }

    if (tmpVisits.length > 0) {
      tmpVisits.forEach((v) => {
        v.personId = ImportHelper.getByImportKey(tmpPeople, v.personKey).id;
        try {
          v.serviceId = ImportHelper.getByImportKey(tmpServices, v.serviceKey).id;
        } catch {
          v.groupId = ImportHelper.getByImportKey(tmpGroups, v.groupKey).id;
        }
      });
      await postInBatches("/visits", tmpVisits, "AttendanceApi", (current, total, isComplete) => {
        if (isComplete) {
          if (exportData.visitSessions.length > 0) {
            updateProgress("Attendance", "running");
          } else {
            updateProgress("Attendance", "complete");
          }
        } else {
          updateProgress("Attendance", `running (visits batch ${current}/${total})`);
        }
      });
    }

    const tmpVisitSessions: ImportVisitSessionInterface[] = [...exportData.visitSessions];
    if (tmpVisitSessions.length > 0 && tmpVisits.length > 0) {
      tmpVisitSessions.forEach((vs) => {
        vs.visitId = ImportHelper.getByImportKey(tmpVisits, vs.visitKey).id;
        vs.sessionId = ImportHelper.getByImportKey(tmpSessions, vs.sessionKey).id;
      });
      await postInBatches("/visitsessions", tmpVisitSessions, "AttendanceApi", (current, total, isComplete) => {
        if (isComplete) {
          updateProgress("Attendance", "complete");
        } else {
          updateProgress("Attendance", `running (visit sessions batch ${current}/${total})`);
        }
      });
    } else if (tmpVisits.length === 0 && tmpSessions.length === 0) {
      updateProgress("Attendance", "complete");
    }
  }, true);
};

export default exportToB1Db;
