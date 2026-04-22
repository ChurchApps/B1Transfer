import { UploadHelper } from "../UploadHelper";
import {
  ImportHelper, ImportPersonInterface, ImportHouseholdInterface
  , ImportCampusInterface, ImportServiceInterface, ImportServiceTimeInterface
  , ImportGroupInterface, ImportGroupMemberInterface, ImportGroupServiceTimeInterface
  , ImportVisitInterface, ImportSessionInterface, ImportVisitSessionInterface
  , ImportDonationBatchInterface, ImportFundInterface, ImportDonationInterface
  , ImportFundDonationInterface, ImportDataInterface, ImportFormsInterface
  , ImportQuestionsInterface, ImportFormSubmissions, ImportAnswerInterface
} from "../ImportHelper";
import JSZip from "jszip";

let people: ImportPersonInterface[] = [];
let households: ImportHouseholdInterface[] = [];
let campuses: ImportCampusInterface[] = [];
let services: ImportServiceInterface[] = [];
let serviceTimes: ImportServiceTimeInterface[] = [];
let groupServiceTimes: ImportGroupServiceTimeInterface[] = [];
let groups: ImportGroupInterface[] = [];
let groupMembers: ImportGroupMemberInterface[] = [];
let sessions: ImportSessionInterface[] = [];
let visits: ImportVisitInterface[] = [];
let visitSessions: ImportVisitSessionInterface[] = [];
let batches: ImportDonationBatchInterface[] = [];
let funds: ImportFundInterface[] = [];
let donations: ImportDonationInterface[] = [];
let fundDonations: ImportFundDonationInterface[] = [];
let forms: ImportFormsInterface[] = [];
let questions: ImportQuestionsInterface[] = [];
let formSubmissions: ImportFormSubmissions[] = [];
let answers: ImportAnswerInterface[] = [];
let acceptedPeopleRows: any[] = [];

// Columns explicitly consumed by loadPeople (and ExportB1ZipHelper.exportPeople).
// Anything else in people.csv is treated as a custom field and routed to a form.
const KNOWN_PEOPLE_COLUMNS = new Set<string>([
  "importKey",
  "household",
  "householdName",
  "householdRole",
  "displayName",
  "lastName",
  "firstName",
  "middleName",
  "nickName",
  "prefix",
  "suffix",
  "birthDate",
  "gender",
  "maritalStatus",
  "membershipStatus",
  "homePhone",
  "mobilePhone",
  "workPhone",
  "email",
  "address1",
  "address2",
  "city",
  "state",
  "zip",
  "photo"
]);

const readB1Zip = async (file: File): Promise<ImportDataInterface> => {
  const zip = await JSZip.loadAsync(file);

  zip.files["people.csv"] && loadPeople(UploadHelper.readCsvString(await zip.file("people.csv").async("string")), zip);
  const tmpServiceTimes = zip.files["services.csv"] && loadServiceTimes(UploadHelper.readCsvString(await zip.file("services.csv").async("string")));
  zip.files["groups.csv"] && loadGroups(UploadHelper.readCsvString(await zip.file("groups.csv").async("string")));
  zip.files["groupmembers.csv"] && loadGroupMembers(UploadHelper.readCsvString(await zip.file("groupmembers.csv").async("string")));
  zip.files["attendance.csv"] && loadAttendance(UploadHelper.readCsvString(await zip.file("attendance.csv").async("string")), tmpServiceTimes);
  zip.files["donations.csv"] && loadDonations(UploadHelper.readCsvString(await zip.file("donations.csv").async("string")));
  zip.files["forms.csv"] && loadForms(UploadHelper.readCsvString(await zip.file("forms.csv").async("string")));
  zip.files["questions.csv"] && loadQuestions(UploadHelper.readCsvString(await zip.file("questions.csv").async("string")));
  zip.files["formSubmissions.csv"] && loadFormSubmissions(UploadHelper.readCsvString(await zip.file("formSubmissions.csv").async("string")));
  zip.files["answers.csv"] && loadAnswers(UploadHelper.readCsvString(await zip.file("answers.csv").async("string")));

  extractPeopleCustomFieldsAsForm();

  return {
    people: people,
    households: households,
    campuses: campuses,
    services: services,
    serviceTimes: serviceTimes,
    groupServiceTimes: groupServiceTimes,
    groups: groups,
    groupMembers: groupMembers,
    visits: visits,
    sessions: sessions,
    visitSessions: visitSessions,
    batches: batches,
    donations: donations,
    funds: funds,
    fundDonations: fundDonations,
    forms: forms,
    questions: questions,
    formSubmissions: formSubmissions,
    answers: answers
  } as ImportDataInterface;

};

const loadAnswers = (data: any) => {
  answers = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].value !== undefined) {
      answers.push(data[i]);
    }
  }
};

const loadFormSubmissions = (data: any) => {
  formSubmissions = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].personKey !== undefined) {
      formSubmissions.push(data[i]);
    }
  }
};

const loadQuestions = (data: any) => {
  questions = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].title !== undefined) {
      questions.push(data[i]);
    }
  }
};

const loadForms = (data: any) => {
  forms = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].name !== undefined) {
      forms.push(data[i]);
    }
  }
};

const loadDonations = (data: any) => {
  batches = [];
  funds = [];
  donations = [];
  fundDonations = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].amount !== undefined) {
      const d = data[i];
      const batch = ImportHelper.getOrCreateBatch(batches, d.batch, new Date(d.date));
      const fund = ImportHelper.getOrCreateFund(funds, d.fund);
      const donation = {
        importKey: (donations.length + 1).toString(),
        batchKey: batch.importKey,
        personKey: d.personKey,
        personId: d.personKey,
        donationDate: new Date(d.date).toISOString(),
        amount: Number.parseFloat(d.amount),
        method: d.method,
        methodDetails: d.methodDetails,
        notes: d.notes,
        fund: fund,
        fundKey: fund.importKey
      } as ImportDonationInterface;
      const fundDonation = { donationKey: donation.importKey, fundKey: fund.importKey, amount: Number.parseFloat(d.amount) } as ImportFundDonationInterface;
      const donationPerson = people.find(p => p.importKey === donation.personKey);
      if (donationPerson) donation.person = donationPerson;
      donations.push(donation);
      fundDonations.push(fundDonation);
    }
  }
};

const loadAttendance = (data: any, tmpServiceTimes: ImportServiceTimeInterface[]) => {
  sessions = [];
  visits = [];
  visitSessions = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].personKey !== undefined && data[i].groupKey !== undefined) {
      const session = ImportHelper.getOrCreateSession(sessions, new Date(data[i].date), data[i].groupKey, data[i].serviceTimeKey);
      const visit = ImportHelper.getOrCreateVisit(visits, data[i], tmpServiceTimes);
      const visitSession = { visitKey: visit.importKey, sessionKey: session.importKey } as ImportVisitSessionInterface;
      visitSessions.push(visitSession);

      const group = groups.find(group => group.importKey === data[i].groupKey);
      if (group !== null && group.serviceTimeKey !== undefined && group.serviceTimeKey !== null) {
        const gst = { groupKey: group.importKey, groupId: group.importKey, serviceTimeKey: group.serviceTimeKey } as ImportGroupServiceTimeInterface;
        if (groupServiceTimes.find(gst => gst.groupKey === group.importKey && gst.serviceTimeKey === group.serviceTimeKey) === undefined) groupServiceTimes.push(gst);
      }
    }
  }
};

const loadServiceTimes = (data: any) => {
  campuses = [];
  services = [];
  serviceTimes = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].time !== undefined) {
      const campus = ImportHelper.getOrCreateCampus(campuses, data[i].campus);
      const service = ImportHelper.getOrCreateService(services, data[i].service, campus);
      ImportHelper.getOrCreateServiceTime(serviceTimes, data[i], service);
    }
  }
  return serviceTimes;
};

const loadGroups = (data: any) => {
  groups = [];
  groupServiceTimes = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].name !== undefined) {
      const group = ImportHelper.getOrCreateGroup(groups, data[i]);
      if (group !== null && group.serviceTimeKey !== undefined && group.serviceTimeKey !== null) {
        const gst = { groupKey: group.importKey, groupId: group.importKey, serviceTimeKey: group.serviceTimeKey } as ImportGroupServiceTimeInterface;
        groupServiceTimes.push(gst);
      }
    }
  }
  return groups;
};

const loadGroupMembers = (data: any) => {
  groupMembers = [];
  for (let i = 0; i < data.length; i++) if (data[i].groupKey !== undefined) groupMembers.push(data[i] as ImportGroupMemberInterface);
};

const loadPeople = (data: any, zip: any) => {
  people = [];
  households = [];
  acceptedPeopleRows = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].lastName !== undefined) {
      const rawRow = { ...data[i] };
      const p = data[i] as ImportPersonInterface;
      p.name = { first: data[i].firstName ?? "", last: data[i].lastName ?? "", middle: data[i].middleName ?? "", nick: data[i].nickName ?? "", display: data[i].displayName ?? "", title: data[i].prefix ?? "", suffix: data[i].suffix ?? "" };
      p.contactInfo = { address1: data[i].address1 ?? "", address2: data[i].address2 ?? "", city: data[i].city ?? "", state: data[i].state ?? "", zip: data[i].zip ?? "", homePhone: data[i].homePhone ?? "", mobilePhone: data[i].mobilePhone ?? "", workPhone: data[i].workPhone ?? "", email: data[i].email ?? "" };
      if (data[i].householdRole) p.householdRole = data[i].householdRole;
      assignHousehold(households, data[i]);
      if (p.photo !== undefined) {
        zip?.file(p.photo)?.async("base64").then((data: any) => {
          if (data) {
            p.photo = "data:image/png;base64," + data;
          }
        });
      }
      people.push(p);
      acceptedPeopleRows.push(rawRow);
    }
  }
  return people;
};

const extractPeopleCustomFieldsAsForm = () => {
  if (acceptedPeopleRows.length === 0) return;

  const customColumns: string[] = [];
  const seen = new Set<string>();
  acceptedPeopleRows.forEach(row => {
    Object.keys(row).forEach(col => {
      const trimmed = col.trim();
      if (trimmed === "" || KNOWN_PEOPLE_COLUMNS.has(trimmed) || seen.has(col)) return;
      seen.add(col);
      customColumns.push(col);
    });
  });
  if (customColumns.length === 0) return;

  const hasAnyValue = acceptedPeopleRows.some(row =>
    customColumns.some(c => (row[c] ?? "").toString().trim() !== ""));
  if (!hasAnyValue) return;

  const FORM_KEY = "custom_people_form";
  forms.push({ importKey: FORM_KEY, name: "Imported Data", contentType: "person" } as ImportFormsInterface);
  customColumns.forEach((col, idx) => {
    questions.push({
      formKey: FORM_KEY,
      questionKey: `cq_${col}`,
      title: col,
      fieldType: "text",
      sort: idx + 1,
      required: false
    } as ImportQuestionsInterface);
  });

  acceptedPeopleRows.forEach(row => {
    const personImportKey = row.importKey?.toString() ?? "";
    if (!personImportKey) return;
    const rowAnswers: { questionKey: string; value: string }[] = [];
    customColumns.forEach(col => {
      const value = (row[col] ?? "").toString().trim();
      if (value !== "") rowAnswers.push({ questionKey: `cq_${col}`, value });
    });
    if (rowAnswers.length === 0) return;

    const submissionKey = `cs_${personImportKey}`;
    formSubmissions.push({
      importKey: submissionKey,
      formKey: FORM_KEY,
      personKey: personImportKey,
      contentType: "person",
      submissionDate: new Date()
    } as unknown as ImportFormSubmissions);
    rowAnswers.forEach(a => {
      answers.push({
        questionKey: a.questionKey,
        formSubmissionKey: submissionKey,
        value: a.value
      } as ImportAnswerInterface);
    });
  });
};

const assignHousehold = (households: ImportHouseholdInterface[], person: any) => {
  const householdName: string = person.householdName || person.household;
  if (households.length === 0 || households[households.length - 1].name !== householdName) {
    households.push({ name: householdName, importKey: (households.length + 1).toString() } as ImportHouseholdInterface);
  }
  person.householdKey = households[households.length - 1].importKey;
};

export default readB1Zip;
