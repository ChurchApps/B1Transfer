import { UploadHelper, PersonInterface } from "..";
import {
  ImportHelper
  , ImportCampusInterface, ImportServiceInterface
  , ImportGroupServiceTimeInterface
  , ImportVisitInterface, ImportSessionInterface
  , ImportDonationBatchInterface, ImportFundInterface, ImportFundDonationInterface
  , ImportDataInterface
  , ImportHouseholdInterface, ImportPersonInterface
} from "../ImportHelper";
import Papa from "papaparse";
import { runStep, compressZip } from "./RunStep";

const dateOnly = (value: unknown) => ImportHelper.toDateOnly(value as string) || "";

const dateTime = (value: unknown) => {
  if (!value) return "";
  const d = new Date(value as string);
  return isNaN(d.getTime()) ? String(value) : d.toISOString();
};

const yn = (value: unknown) => {
  if (value === undefined || value === null || value === "") return "";
  if (value === true || value === 1 || value === "1" || value === "TRUE" || value === "true") return "TRUE";
  if (value === false || value === 0 || value === "0" || value === "FALSE" || value === "false") return "FALSE";
  return "";
};

const num = (value: unknown) => (value === undefined || value === null || value === "") ? "" : String(value);

const jsonCell = (value: unknown) => {
  if (value === undefined || value === null || value === "") return "";
  return typeof value === "string" ? value : JSON.stringify(value);
};

const campusCells = (campus?: ImportCampusInterface) => ({
  campusAddress1: campus?.address1 || "",
  campusAddress2: campus?.address2 || "",
  campusCity: campus?.city || "",
  campusState: campus?.state || "",
  campusZip: campus?.zip || "",
  campusTimezone: campus?.timezone || "",
  campusWebsite: campus?.website || ""
});

// A blank id or key must not match rows that simply lack that property.
const byIdOrKey = (items: any[], id?: string, key?: string) => (id ? ImportHelper.getById(items, id) : null) || (key ? ImportHelper.getByImportKey(items, key) : null);

const findCampus = (importData: ImportDataInterface, id?: string, key?: string) => {
  if (id) {
    const byId = ImportHelper.getById(importData.campuses, id) as ImportCampusInterface;
    if (byId) return byId;
  }
  if (key) return ImportHelper.getByImportKey(importData.campuses, key) as ImportCampusInterface;
  return undefined;
};

const findFund = (funds: ImportFundInterface[], id?: string) => {
  if (!id) return undefined;
  return byIdOrKey(funds, id, id) as ImportFundInterface;
};

export const buildB1ZipFiles = async (importData: ImportDataInterface, updateProgress: (name: string, status: string) => void) => {
  const files: { name: string, contents: any }[] = [];
  const runImport = (keyName: string, code: () => Promise<void>) => runStep(keyName, updateProgress, code);

  files.push({ name: "services.csv", contents: await exportCampuses(importData, runImport) });
  files.push({ name: "people.csv", contents: await exportPeople(importData, runImport) });
  await exportPhotos(importData.people, files, runImport);
  files.push({ name: "groups.csv", contents: await exportGroups(importData, runImport) });
  files.push({ name: "groupmembers.csv", contents: await exportGroupMembers(importData, runImport) });
  files.push({ name: "donations.csv", contents: await exportDonations(importData, runImport) });
  files.push({ name: "funds.csv", contents: await exportFunds(importData, runImport) });
  files.push({ name: "attendance.csv", contents: await exportAttendance(importData, runImport) });
  files.push({ name: "forms.csv", contents: await exportForms(importData, runImport) });
  files.push({ name: "questions.csv", contents: await exportQuestions(importData, runImport) });
  files.push({ name: "formSubmissions.csv", contents: await exportFormSubmissions(importData, runImport) });
  files.push({ name: "answers.csv", contents: await exportAnswers(importData, runImport) });
  files.push({ name: "personfields.csv", contents: await exportPersonFields(importData, runImport) });
  files.push({ name: "personfieldvalues.csv", contents: await exportPersonFieldValues(importData, runImport) });
  files.push({ name: "householdpickup.csv", contents: await exportHouseholdPickups(importData, runImport) });
  files.push({ name: "lists.csv", contents: await exportLists(importData, runImport) });
  return files;
};

const generateB1Zip = async (importData: ImportDataInterface, updateProgress: (name: string, status: string) => void) => {
  const files = await buildB1ZipFiles(importData, updateProgress);
  await runStep("Compressing", updateProgress, () => compressZip(files, "B1Export.zip"));
};

const exportCampuses = async (importData: ImportDataInterface, runImport: (keyName: string, code: () => Promise<void>) => Promise<void>) => {
  const { campuses, services, serviceTimes } = importData;
  const data: any[] = [];
  await runImport("Campuses/Services/Times", async () => {
    const seenServiceIds = new Set<string>();
    const seenCampusIds = new Set<string>();
    serviceTimes.forEach((st) => {
      const service: ImportServiceInterface = byIdOrKey(services, st.serviceId, st.serviceKey);
      const campus: ImportCampusInterface = service ? findCampus(importData, service.campusId, service.campusKey) : undefined;
      if (service?.id) seenServiceIds.add(service.id);
      if (service?.importKey) seenServiceIds.add(service.importKey);
      if (campus?.id) seenCampusIds.add(campus.id);
      if (campus?.importKey) seenCampusIds.add(campus.importKey);
      data.push({
        importKey: st.id || st.importKey || "",
        campus: campus?.name || "",
        service: service?.name || "",
        time: st.name || "",
        ...campusCells(campus),
        dayOfWeek: num(st.dayOfWeek),
        startTime: st.startTime || "",
        endTime: st.endTime || "",
        checkinOpenMinutes: num(st.checkinOpenMinutes),
        checkinCloseMinutes: num(st.checkinCloseMinutes)
      });
    });
    // A campus or service with no service time still has to be in the file, or a restore drops it.
    services.forEach((service) => {
      if (seenServiceIds.has(service.id) || seenServiceIds.has(service.importKey)) return;
      const campus = findCampus(importData, service.campusId, service.campusKey);
      if (campus?.id) seenCampusIds.add(campus.id);
      if (campus?.importKey) seenCampusIds.add(campus.importKey);
      data.push({
        importKey: "",
        campus: campus?.name || "",
        service: service.name || "",
        time: "",
        ...campusCells(campus),
        dayOfWeek: "",
        startTime: "",
        endTime: "",
        checkinOpenMinutes: "",
        checkinCloseMinutes: ""
      });
    });
    campuses.forEach((campus) => {
      if (seenCampusIds.has(campus.id) || seenCampusIds.has(campus.importKey)) return;
      data.push({
        importKey: "",
        campus: campus.name || "",
        service: "",
        time: "",
        ...campusCells(campus),
        dayOfWeek: "",
        startTime: "",
        endTime: "",
        checkinOpenMinutes: "",
        checkinCloseMinutes: ""
      });
    });
  });
  return Papa.unparse(data);
};

const exportGroupMembers = async (importData: ImportDataInterface, runImport: (keyName: string, code: () => Promise<void>) => Promise<void>) => {
  const { groupMembers } = importData;
  const data: any[] = [];
  await runImport("Group Members", async () => {
    groupMembers.forEach((gm) => {
      data.push({
        groupKey: gm.groupId || gm.groupKey,
        personKey: gm.personId || gm.personKey,
        leader: yn(gm.leader)
      });
    });
  });
  return Papa.unparse(data);
};

const exportPeople = async (importData: ImportDataInterface, runImport: (keyName: string, code: () => Promise<void>) => Promise<void>) => {
  const tmpHouseholds: ImportHouseholdInterface[] = [...importData.households];
  const data: any[] = [];
  const { people } = importData;
  await runImport("People", async () => {
    people.forEach((p) => {
      const household = tmpHouseholds.find(h => p.householdKey === h.importKey || p.householdId === h.importKey);
      const campus = findCampus(importData, p.campusId, p.campusKey);
      const name = p.name || {} as PersonInterface["name"];
      data.push({
        importKey: p.importKey,
        // Two households can share a name, so the key keeps them apart on restore.
        householdKey: p.householdKey || p.householdId || "",
        householdName: household?.name ?? name.last,
        householdRole: p.householdRole ?? "",
        displayName: name.display ?? "",
        lastName: name.last,
        firstName: name.first,
        middleName: name.middle,
        nickName: name.nick,
        prefix: (name as { prefix?: string }).prefix || name.title || "",
        suffix: name.suffix ?? "",
        birthDate: dateOnly(p.birthDate),
        anniversary: dateOnly(p.anniversary),
        gender: p.gender,
        maritalStatus: p.maritalStatus,
        membershipStatus: p.membershipStatus,
        grade: p.grade || "",
        school: p.school || "",
        donorNumber: p.donorNumber || "",
        nametagNotes: p.nametagNotes || "",
        optedOut: yn(p.optedOut),
        campus: campus?.name || "",
        homePhone: p.contactInfo?.homePhone,
        mobilePhone: p.contactInfo?.mobilePhone,
        workPhone: p.contactInfo?.workPhone,
        email: p.contactInfo?.email,
        address1: p.contactInfo?.address1,
        address2: p.contactInfo?.address2,
        city: p.contactInfo?.city,
        state: p.contactInfo?.state,
        zip: p.contactInfo?.zip,
        photo: (p.photoUpdated === undefined) ? "" : (p.id || p.importKey) + ".png"
      });
    });
  });
  return Papa.unparse(data);
};

const exportGroups = async (importData: ImportDataInterface, runImport: (keyName: string, code: () => Promise<void>) => Promise<void>) => {
  const { groups, groupServiceTimes } = importData;
  const data: any[] = [];
  await runImport("Groups", async () => {
    groups.forEach((g) => {
      const groupId = g.id || g.importKey;
      const linked = groupServiceTimes.filter(t => (t.groupId && t.groupId === groupId) || (t.groupKey && t.groupKey === groupId));
      let serviceTimeIds: string[] = [];
      if (linked.length === 0) serviceTimeIds = [g.serviceTimeKey || ""];
      else linked.forEach((time: ImportGroupServiceTimeInterface) => { serviceTimeIds.push((time.serviceTimeId || time.serviceTimeKey || "").toString()); });
      const campus = findCampus(importData, g.campusId, g.campusKey);
      serviceTimeIds.forEach((serviceTimeId) => {
        data.push({
          importKey: g.id || g.importKey,
          serviceTimeKey: serviceTimeId,
          categoryName: g.categoryName,
          name: g.name,
          trackAttendance: g.trackAttendance ? "TRUE" : "FALSE",
          about: g.about || "",
          attendanceReminders: yn(g.attendanceReminders),
          parentPickup: yn(g.parentPickup),
          printNametag: yn(g.printNametag),
          photoUrl: g.photoUrl || "",
          tags: g.tags || "",
          meetingTime: g.meetingTime || "",
          meetingLocation: g.meetingLocation || "",
          labels: g.labelArray?.length ? g.labelArray.join(",") : "",
          campus: campus?.name || "",
          slug: g.slug || "",
          joinPolicy: g.joinPolicy || "",
          discussionsEnabled: yn(g.discussionsEnabled),
          announcementsEnabled: yn(g.announcementsEnabled),
          archived: yn(g.archived),
          publicRoster: yn(g.publicRoster),
          confidential: yn(g.confidential),
          minAgeMonths: num(g.minAgeMonths),
          maxAgeMonths: num(g.maxAgeMonths),
          minGrade: g.minGrade || "",
          maxGrade: g.maxGrade || "",
          capacity: num(g.capacity),
          guestCapacity: num(g.guestCapacity),
          checkinClosed: yn(g.checkinClosed),
          volunteerRatio: num(g.volunteerRatio),
          minVolunteers: num(g.minVolunteers)
        });
      });
    });
  });
  await runImport("Group Service Times", async () => {
  });
  return Papa.unparse(data);
};

const exportDonations = async (importData: ImportDataInterface, runImport: (keyName: string, code: () => Promise<void>) => Promise<void>) => {
  const { funds, batches, donations, fundDonations } = importData;
  const data: any[] = [];

  await runImport("Funds", async () => {
  });

  await runImport("Donation Batches", async () => {
  });

  await runImport("Donations", async () => {
    donations.forEach((donation) => {
      const batch: ImportDonationBatchInterface = byIdOrKey(batches, donation.batchId, donation.batchKey);
      const splits = donation.id
        ? fundDonations.filter(fd => fd.donationId === donation.id)
        : fundDonations.filter(fd => fd.donationKey === donation.importKey);
      const writeRow = (fund: ImportFundInterface | undefined, fundAmount: unknown) => {
        data.push({
          donationKey: donation.id || donation.importKey || "",
          batch: batch?.id || batch?.importKey || "",
          batchName: batch?.name || "",
          batchDate: dateOnly(batch?.batchDate),
          date: dateOnly(donation.donationDate),
          personKey: donation.person?.id || donation.personKey || donation.personId || "",
          method: donation.method || "",
          methodDetails: donation.methodDetails || "",
          amount: donation.amount ?? "",
          currency: donation.currency || "",
          status: donation.status || "",
          fund: fund?.name || "",
          fundAmount: fundAmount ?? "",
          taxDeductible: yn(fund?.taxDeductible),
          visible: fund ? yn(fund.visible) : "",
          notes: donation.notes || "",
          transactionId: donation.transactionId || ""
        });
      };
      if (splits.length === 0) writeRow(donation.fund as ImportFundInterface, "");
      else splits.forEach((fd: ImportFundDonationInterface) => writeRow(findFund(funds, fd.fundId || fd.fundKey), fd.amount ?? ""));
    });
  });

  await runImport("Donation Funds", async () => {
  });
  return Papa.unparse(data);
};

const exportAttendance = async (importData: ImportDataInterface, runImport: (keyName: string, code: () => Promise<void>) => Promise<void>) => {
  const { sessions, visits, visitSessions } = importData;
  const data: any[] = [];
  await runImport("Attendance", async () => {
    visitSessions.forEach((vs) => {
      const visit: ImportVisitInterface = byIdOrKey(visits, vs.visitId, vs.visitKey);
      const session: ImportSessionInterface = byIdOrKey(sessions, vs.sessionId, vs.sessionKey);
      if (visit && session) {
        data.push({
          date: dateOnly(visit.visitDate) || visit.visitDate,
          serviceTimeKey: session.serviceTimeId || session.serviceTimeKey || "",
          groupKey: session.groupId || session.groupKey || "",
          personKey: visit.personId || visit.personKey || "",
          checkinType: visit.checkinType || "",
          checkinTime: visit.checkinTime ? dateTime(visit.checkinTime) : ""
        });
      }
    });
  });
  return Papa.unparse(data);
};

const exportForms = async (importData: ImportDataInterface, runImport: (keyName: string, code: () => Promise<void>) => Promise<void>) => {
  const { forms } = importData;
  const data: any[] = [];
  await runImport("Forms", async () => {
    forms.forEach((f) => {
      data.push({
        importKey: f.id || f.importKey,
        name: f.name,
        contentType: f.contentType,
        description: f.description || "",
        restricted: yn(f.restricted),
        accessStartTime: f.accessStartTime ? dateTime(f.accessStartTime) : "",
        accessEndTime: f.accessEndTime ? dateTime(f.accessEndTime) : "",
        archived: yn(f.archived),
        thankYouMessage: f.thankYouMessage || "",
        displayMode: f.displayMode || "",
        autoCreatePerson: yn(f.autoCreatePerson),
        groupKey: f.groupId || f.groupKey || "",
        followUpSubject: f.followUpSubject || "",
        followUpBody: f.followUpBody || ""
      });
    });
  });
  return Papa.unparse(data);
};

const exportQuestions = async (importData: ImportDataInterface, runImport: (keyName: string, code: () => Promise<void>) => Promise<void>) => {
  const { questions } = importData;
  const data: any[] = [];
  await runImport("Questions", async () => {
    questions.forEach(q => {
      data.push({
        questionKey: q.id || q.questionKey,
        formKey: q.formId || q.formKey,
        parentKey: q.parentId || q.parentKey || "",
        fieldType: q.fieldType,
        title: q.title,
        description: q.description || "",
        placeholder: q.placeholder || "",
        sort: num(q.sort),
        required: yn(q.required),
        choices: jsonCell(q.choices)
      });
    });
  });
  return Papa.unparse(data);
};

const exportAnswers = async (importData: ImportDataInterface, runImport: (keyName: string, code: () => Promise<void>) => Promise<void>) => {
  const { answers } = importData;
  const data: any[] = [];
  await runImport("Answers", async () => {
    answers.forEach(a => {
      data.push({
        questionKey: a.questionId || a.questionKey,
        formSubmissionKey: a.formSubmissionId || a.formSubmissionKey,
        value: a.value
      });
    });
  });
  return Papa.unparse(data);
};

const exportFormSubmissions = async (importData: ImportDataInterface, runImport: (keyName: string, code: () => Promise<void>) => Promise<void>) => {
  const { formSubmissions } = importData;
  const data: any[] = [];
  await runImport("Form Submissions", async () => {
    formSubmissions.forEach(fs => {
      // importKey carries the submission id so answers.csv (which references it) can be
      // matched back to the right submission on re-import instead of leaking across the form.
      data.push({
        importKey: fs.id || fs.importKey,
        formKey: fs.formId || fs.formKey,
        personKey: fs.contentId || fs.personKey,
        contentType: fs.contentType,
        submissionDate: fs.submissionDate ? dateTime(fs.submissionDate) : ""
      });
    });
  });
  return Papa.unparse(data);
};

// donations.csv only names funds that were given to, so every fund is listed here too.
const exportFunds = async (importData: ImportDataInterface, runImport: (keyName: string, code: () => Promise<void>) => Promise<void>) => {
  const data: any[] = [];
  await runImport("Fund List", async () => {
    importData.funds.forEach(f => {
      data.push({ name: f.name, taxDeductible: yn(f.taxDeductible), visible: yn(f.visible) });
    });
  });
  return Papa.unparse(data);
};

const exportPersonFields = async (importData: ImportDataInterface, runImport: (keyName: string, code: () => Promise<void>) => Promise<void>) => {
  const data: any[] = [];
  await runImport("Custom Field Definitions", async () => {
    (importData.personFields || []).forEach(f => {
      data.push({
        importKey: f.importKey || f.name,
        name: f.name,
        fieldType: f.fieldType || "",
        choices: f.choices || "",
        sort: num(f.sort)
      });
    });
  });
  return Papa.unparse(data);
};

const exportPersonFieldValues = async (importData: ImportDataInterface, runImport: (keyName: string, code: () => Promise<void>) => Promise<void>) => {
  const data: any[] = [];
  await runImport("Custom Field Values", async () => {
    (importData.personFieldValues || []).forEach(v => {
      data.push({ personKey: v.personKey, fieldName: v.fieldName, value: v.value });
    });
  });
  return Papa.unparse(data);
};

const exportHouseholdPickups = async (importData: ImportDataInterface, runImport: (keyName: string, code: () => Promise<void>) => Promise<void>) => {
  const data: any[] = [];
  await runImport("Household Pickup Contacts", async () => {
    (importData.householdPickupPeople || []).forEach(p => {
      data.push({
        householdKey: p.householdKey,
        personKey: p.personKey || "",
        name: p.name,
        relationship: p.relationship || "",
        status: p.status || "",
        notes: p.notes || "",
        photoUrl: p.photoUrl || ""
      });
    });
  });
  return Papa.unparse(data);
};

// Rules and actions keep the source church's ids; the database writer remaps them on restore.
const exportLists = async (importData: ImportDataInterface, runImport: (keyName: string, code: () => Promise<void>) => Promise<void>) => {
  const data: any[] = [];
  await runImport("Lists", async () => {
    (importData.lists || []).forEach(l => {
      data.push({
        importKey: l.importKey || l.id,
        name: l.name,
        category: l.category || "",
        scope: l.scope || "",
        householdInclusion: l.householdInclusion || "",
        autoRefresh: yn(l.autoRefresh),
        notifyOnChange: yn(l.notifyOnChange),
        rules: jsonCell(l.rules),
        actions: jsonCell(l.actions),
        conditions: jsonCell(l.conditions)
      });
    });
  });
  return Papa.unparse(data);
};

const exportPhotos = async (people: ImportPersonInterface[], files: { name: string, contents: string | Buffer }[], runImport: (keyName: string, code: () => Promise<void>) => Promise<void>) => {
  await runImport("Photos", async () => {
    const result: Promise<any>[] = [];
    for (const p of people) {
      if (p.photoUpdated !== undefined && p.photo) result.push(UploadHelper.downloadImageBytes(files, (p.id || p.importKey) + ".png", p.photo));
    }
    await Promise.all(result);
  });
};

export default generateB1Zip;
