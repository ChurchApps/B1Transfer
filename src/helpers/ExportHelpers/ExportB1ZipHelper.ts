import { UploadHelper, PersonInterface } from "..";
import { ArrayHelper } from "@churchapps/apphelper";
import {
  ImportHelper
  , ImportCampusInterface, ImportServiceInterface
  , ImportGroupServiceTimeInterface
  , ImportVisitInterface, ImportSessionInterface
  , ImportDonationBatchInterface, ImportFundInterface
  , ImportDataInterface
  , ImportHouseholdInterface
} from "../ImportHelper";
import Papa from "papaparse";

const generateB1Zip = async (importData: ImportDataInterface, updateProgress: (name: string, status: string) => void) => {
  let files = [];

  const sleep = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds))

  const runImport = async (keyName: string, code: () => Promise<void>) => {
    updateProgress(keyName, "running");
    try {
      await sleep(100);
      await code();
      updateProgress(keyName, "complete");
    } catch (e) {
      updateProgress(keyName, "error");
    }
  }

  files.push({ name: "services.csv", contents: await exportCampuses(importData, runImport) });

  files.push({ name: "people.csv", contents: await exportPeople(importData, runImport) });

  exportPhotos(importData.people, files, runImport);

  files.push({ name: "groups.csv", contents: await exportGroups(importData, runImport) });

  files.push({ name: "groupmembers.csv", contents: await exportGroupMembers(importData, runImport) });

  files.push({ name: "donations.csv", contents: await exportDonations(importData, runImport) });

  files.push({ name: "attendance.csv", contents: await exportAttendance(importData, runImport) });

  files.push({ name: "forms.csv", contents: await exportForms(importData, runImport) });

  files.push({ name: "questions.csv", contents: await exportQuestions(importData, runImport) });

  files.push({ name: "formSubmissions.csv", contents: await exportFormSubmissions(importData, runImport) });

  files.push({ name: "answers.csv", contents: await exportAnswers(importData, runImport) });

  compressZip(files, runImport);

}
const exportCampuses = async (importData: ImportDataInterface, runImport: (keyName: string, code: () => Promise<void>) => Promise<void>) => {
  const { campuses, services, serviceTimes } = importData;
  let data: any[] = [];
  await runImport("Campuses/Services/Times", async () => {
    serviceTimes.forEach((st) => {
      let service: ImportServiceInterface = ImportHelper.getById(services, st.serviceId);
      let campus: ImportCampusInterface = ImportHelper.getById(campuses, service.campusId);
      let row = {
        importKey: st.id,
        campus: campus.name,
        service: service.name,
        time: st.name
      }
      data.push(row);
    });
  });
  return Papa.unparse(data);
}

const exportGroupMembers = async (importData: ImportDataInterface, runImport: (keyName: string, code: () => Promise<void>) => Promise<void>) => {
  const { groupMembers } = importData;
  let data: any[] = [];
  await runImport("Group Members", async () => {
    groupMembers.forEach((gm) => {
      let row = { groupKey: gm.groupId, personKey: gm.personId }
      data.push(row);
    });
  });
  return Papa.unparse(data);
}

const compressZip = async (files: { name: string, contents: any }[], runImport: (keyName: string, code: () => Promise<void>) => Promise<void>) => {
  await runImport("Compressing", async () => {
    UploadHelper.zipFiles(files, "B1Export.zip");
  });
}

const exportPeople = async (importData: ImportDataInterface, runImport: (keyName: string, code: () => Promise<void>) => Promise<void>) => {
  let tmpHouseholds: ImportHouseholdInterface[] = [...importData.households];
  let data: any[] = [];
  const { people } = importData;
  await runImport("People", async () => {
    people.forEach((p) => {
      let household = tmpHouseholds.find(h => p.householdKey === h.importKey)
      let row = {
        importKey: p.importKey,
        household: household.name ?? p.name.last,
        lastName: p.name.last, firstName: p.name.first, middleName: p.name.middle, nickName: p.name.nick,
        birthDate: p.birthDate, gender: p.gender, maritalStatus: p.maritalStatus, membershipStatus: p.membershipStatus,
        homePhone: p.contactInfo.homePhone, mobilePhone: p.contactInfo.mobilePhone, workPhone: p.contactInfo.workPhone, email: p.contactInfo.email,
        address1: p.contactInfo.address1, address2: p.contactInfo.address2, city: p.contactInfo.city, state: p.contactInfo.state, zip: p.contactInfo.zip,
        photo: (p.photoUpdated === undefined) ? "" : p.id.toString() + ".png"
      }
      data.push(row);
    });
  });
  return Papa.unparse(data);
}

const exportGroups = async (importData: ImportDataInterface, runImport: (keyName: string, code: () => Promise<void>) => Promise<void>) => {
  const { groups, groupServiceTimes } = importData;
  let data: any[] = [];
  await runImport("Groups", async () => {
    groups.forEach((g) => {
      let serviceTimeIds: string[] = [];
      let gst: ImportGroupServiceTimeInterface[] = ArrayHelper.getAll(groupServiceTimes, "groupId", g.id);
      if (gst.length === 0) serviceTimeIds = [""];
      else gst.forEach((time) => { serviceTimeIds.push(time.serviceTimeId.toString()) });
      serviceTimeIds.forEach((serviceTimeId) => {
        let row = {
          importKey: g.id,
          serviceTimeKey: serviceTimeId,
          categoryName: g.categoryName,
          name: g.name,
          trackAttendance: g.trackAttendance ? "TRUE" : "FALSE"
        }
        data.push(row);
      });
    });
  });
  await runImport("Group Service Times", async () => {
  });
  return Papa.unparse(data);
}

const exportDonations = async (importData: ImportDataInterface, runImport: (keyName: string, code: () => Promise<void>) => Promise<void>) => {
  const { funds, batches, donations } = importData;
  let data: any[] = [];

  await runImport("Funds", async () => {
  });

  await runImport("Donation Batches", async () => {
  });

  await runImport("Donations", async () => {
    donations.forEach((donation) => {
      let fund: ImportFundInterface = ImportHelper.getById(funds, donation.fund?.id);
      let batch: ImportDonationBatchInterface = ImportHelper.getById(batches, donation.batchId);
      let row = {
        batch: batch ? batch.id : "",
        date: donation.donationDate,
        personKey: donation.person?.id,
        method: donation.method,
        methodDetails: donation.methodDetails,
        amount: donation.amount,
        fund: fund ? fund.name : "",
        notes: donation.notes
      }
      data.push(row);
    });
  });

  await runImport("Donation Funds", async () => {
  });
  return Papa.unparse(data);
}

const exportAttendance = async (importData: ImportDataInterface, runImport: (keyName: string, code: () => Promise<void>) => Promise<void>) => {
  const { sessions, visits, visitSessions } = importData;
  let data: any[] = [];
  await runImport("Attendance", async () => {
    visitSessions.forEach((vs) => {
      let visit: ImportVisitInterface = ImportHelper.getById(visits, vs.visitId);
      let session: ImportSessionInterface = ImportHelper.getById(sessions, vs.sessionId);
      if (visit && session) {
        let row = {
          date: visit.visitDate,
          serviceTimeKey: session.serviceTimeId,
          groupKey: session.groupId,
          personKey: visit.personId
        }
        data.push(row);
      }
    });
  });
  return Papa.unparse(data);
}

const exportForms = async (importData: ImportDataInterface, runImport: (keyName: string, code: () => Promise<void>) => Promise<void>) => {
  const { forms } = importData;
  let data: any[] = [];
  await runImport("Forms", async () => {
    forms.forEach((f) => {
      let row = {
        importKey: f.id,
        name: f.name,
        contentType: f.contentType
      }
      data.push(row);
    })
  })
  return Papa.unparse(data);
}
const exportQuestions = async (importData: ImportDataInterface, runImport: (keyName: string, code: () => Promise<void>) => Promise<void>) => {
  const { questions } = importData;
  let data: any[] = [];
  await runImport("Questions", async () => {
    questions.forEach(q => {
      let row = {
        questionKey: q.id,
        formKey: q.formId,
        fieldType: q.fieldType,
        title: q.title
      }
      data.push(row);
    })
  })
  return Papa.unparse(data);
}
const exportAnswers = async (importData: ImportDataInterface, runImport: (keyName: string, code: () => Promise<void>) => Promise<void>) => {
  const { answers } = importData;
  let data: any[] = [];
  await runImport("Answers", async () => {
    answers.forEach(a => {
      let row = {
        questionKey: a.questionId,
        formSubmissionKey: a.formSubmissionId,
        value: a.value
      }
      data.push(row);
    })
  })
  return Papa.unparse(data);
}
const exportFormSubmissions = async (importData: ImportDataInterface, runImport: (keyName: string, code: () => Promise<void>) => Promise<void>) => {
  const { formSubmissions } = importData;
  let data: any[] = [];
  await runImport("Form Submissions", async () => {
    formSubmissions.forEach(fs => {
      let row = {
        formKey: fs.formId,
        personKey: fs.contentId,
        contentType: fs.contentType
      }
      data.push(row);
    })
  })
  return Papa.unparse(data);
}

const exportPhotos = async (people: PersonInterface[], files: { name: string, contents: string | Buffer }[], runImport: (keyName: string, code: () => Promise<void>) => Promise<void>) => {
  await runImport("Photos", async () => {
    let result: Promise<any>[] = [];
    people.forEach(async (p) => {
      if (p.photoUpdated !== undefined) result.push(UploadHelper.downloadImageBytes(files, p.id.toString() + ".png", p.photo));
    })
    Promise.all(result);
  });
}

export default generateB1Zip;
