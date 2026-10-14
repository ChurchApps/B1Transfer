import { UploadHelper } from "../UploadHelper";
import {
  ImportHelper, ImportPersonInterface, ImportHouseholdInterface
  , ImportCampusInterface, ImportServiceInterface, ImportServiceTimeInterface
  , ImportGroupInterface, ImportGroupMemberInterface, ImportGroupServiceTimeInterface
  , ImportVisitInterface, ImportSessionInterface, ImportVisitSessionInterface
  , ImportDonationBatchInterface, ImportFundInterface, ImportDonationInterface
  , ImportFundDonationInterface, ImportDataInterface, ImportFormsInterface
  , ImportQuestionsInterface, ImportFormSubmissions, ImportAnswerInterface
  , ImportPersonFieldInterface, ImportPersonFieldValueInterface
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
let personFields: ImportPersonFieldInterface[] = [];
let personFieldValues: ImportPersonFieldValueInterface[] = [];
let acceptedPeopleRows: any[] = [];

// Columns explicitly consumed by loadPeople (and ExportB1ZipHelper.exportPeople).
// Anything else in people.csv is treated as a custom field and routed to a form.
const KNOWN_PEOPLE_COLUMNS = new Set<string>([
  "importKey",
  "household",
  "householdKey",
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
  "anniversary",
  "grade",
  "school",
  "donorNumber",
  "nametagNotes",
  "optedOut",
  "campus",
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

const resetZipState = () => {
  people = [];
  households = [];
  campuses = [];
  services = [];
  serviceTimes = [];
  groupServiceTimes = [];
  groups = [];
  groupMembers = [];
  sessions = [];
  visits = [];
  visitSessions = [];
  batches = [];
  funds = [];
  donations = [];
  fundDonations = [];
  forms = [];
  questions = [];
  formSubmissions = [];
  answers = [];
  personFields = [];
  personFieldValues = [];
  acceptedPeopleRows = [];
};

const readB1Zip = async (file: File): Promise<ImportDataInterface> => {
  const zip = await JSZip.loadAsync(file);
  resetZipState();

  if (zip.files["people.csv"]) await loadPeople(UploadHelper.readCsvString(await zip.file("people.csv").async("string")), zip);
  const tmpServiceTimes = zip.files["services.csv"] && loadServiceTimes(UploadHelper.readCsvString(await zip.file("services.csv").async("string")));
  linkPeopleToCampuses();
  zip.files["groups.csv"] && loadGroups(UploadHelper.readCsvString(await zip.file("groups.csv").async("string")));
  zip.files["groupmembers.csv"] && loadGroupMembers(UploadHelper.readCsvString(await zip.file("groupmembers.csv").async("string")));
  zip.files["attendance.csv"] && loadAttendance(UploadHelper.readCsvString(await zip.file("attendance.csv").async("string")), tmpServiceTimes);
  zip.files["donations.csv"] && loadDonations(UploadHelper.readCsvString(await zip.file("donations.csv").async("string")));
  zip.files["funds.csv"] && loadFunds(UploadHelper.readCsvString(await zip.file("funds.csv").async("string")));
  zip.files["forms.csv"] && loadForms(UploadHelper.readCsvString(await zip.file("forms.csv").async("string")));
  zip.files["questions.csv"] && loadQuestions(UploadHelper.readCsvString(await zip.file("questions.csv").async("string")));
  zip.files["formSubmissions.csv"] && loadFormSubmissions(UploadHelper.readCsvString(await zip.file("formSubmissions.csv").async("string")));
  zip.files["answers.csv"] && loadAnswers(UploadHelper.readCsvString(await zip.file("answers.csv").async("string")));
  zip.files["personfields.csv"] && loadPersonFields(UploadHelper.readCsvString(await zip.file("personfields.csv").async("string")));
  zip.files["personfieldvalues.csv"] && loadPersonFieldValues(UploadHelper.readCsvString(await zip.file("personfieldvalues.csv").async("string")));

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
    answers: answers,
    personFields: personFields,
    personFieldValues: personFieldValues
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

const csvBool = (value: unknown) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (value === true || value === "TRUE" || value === "true") return true;
  if (value === false || value === "FALSE" || value === "false") return false;
  return undefined;
};

const csvNumber = (value: unknown) => {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const parseChoices = (value: unknown) => {
  if (typeof value !== "string") return value;
  const text = value.trim();
  if (!text.startsWith("[") && !text.startsWith("{")) return value;
  try { return JSON.parse(text); } catch { return value; }
};

const loadFormSubmissions = (data: any) => {
  formSubmissions = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].personKey !== undefined) {
      const row = data[i];
      formSubmissions.push({
        importKey: row.importKey,
        formKey: row.formKey,
        personKey: row.personKey,
        contentType: row.contentType,
        submissionDate: row.submissionDate
      } as ImportFormSubmissions);
    }
  }
};

const loadQuestions = (data: any) => {
  questions = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].title !== undefined) {
      const row = data[i];
      const question = {
        questionKey: row.questionKey,
        formKey: row.formKey,
        parentKey: row.parentKey,
        fieldType: row.fieldType,
        title: row.title,
        description: row.description,
        placeholder: row.placeholder,
        sort: csvNumber(row.sort),
        choices: parseChoices(row.choices)
      } as ImportQuestionsInterface;
      const required = csvBool(row.required);
      if (required !== undefined) question.required = required;
      questions.push(question);
    }
  }
};

const loadForms = (data: any) => {
  forms = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].name !== undefined) {
      const row = data[i];
      const form = {
        importKey: row.importKey,
        name: row.name,
        contentType: row.contentType,
        description: row.description,
        thankYouMessage: row.thankYouMessage,
        displayMode: row.displayMode,
        groupKey: row.groupKey,
        followUpSubject: row.followUpSubject,
        followUpBody: row.followUpBody,
        accessStartTime: row.accessStartTime ? new Date(row.accessStartTime) : undefined,
        accessEndTime: row.accessEndTime ? new Date(row.accessEndTime) : undefined
      } as ImportFormsInterface;
      const restricted = csvBool(row.restricted);
      const archived = csvBool(row.archived);
      const autoCreatePerson = csvBool(row.autoCreatePerson);
      if (restricted !== undefined) form.restricted = restricted;
      if (archived !== undefined) form.archived = archived;
      if (autoCreatePerson !== undefined) form.autoCreatePerson = autoCreatePerson;
      forms.push(form);
    }
  }
};

const loadPersonFields = (data: any) => {
  personFields = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].name === undefined) continue;
    personFields.push({
      importKey: data[i].importKey || (personFields.length + 1).toString(),
      name: data[i].name,
      fieldType: data[i].fieldType,
      choices: data[i].choices,
      sort: csvNumber(data[i].sort)
    });
  }
};

const loadPersonFieldValues = (data: any) => {
  personFieldValues = [];
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row.fieldName || row.value === undefined) continue;
    personFieldValues.push({ personKey: row.personKey?.toString() ?? "", fieldName: row.fieldName, value: row.value.toString() });
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
      const hasBatchDate = d.batchDate !== undefined && d.batchDate !== "";
      const batchName = (d.batchName && d.batchName.toString().trim()) || d.batch || "";
      const batch = ImportHelper.getOrCreateBatch(batches, batchName, hasBatchDate ? d.batchDate : new Date(d.date), hasBatchDate);
      const fund = d.fund ? ImportHelper.getOrCreateFund(funds, d.fund, { taxDeductible: csvBool(d.taxDeductible), visible: csvBool(d.visible) }) : null;
      const explicitKey = d.donationKey?.toString().trim();
      let donation = explicitKey ? donations.find(x => x.importKey === explicitKey) : undefined;
      if (!donation) {
        donation = {
          importKey: explicitKey || (donations.length + 1).toString(),
          batchKey: batch.importKey,
          personKey: d.personKey,
          personId: d.personKey,
          donationDate: ImportHelper.toDateOnly(d.date) || new Date(d.date).toISOString(),
          amount: Number.parseFloat(d.amount),
          method: d.method,
          methodDetails: d.methodDetails,
          notes: d.notes,
          transactionId: d.transactionId || undefined,
          currency: d.currency || undefined,
          status: d.status || undefined,
          fund: fund || undefined,
          fundKey: fund?.importKey
        } as ImportDonationInterface;
        const donationPerson = people.find(p => p.importKey === donation.personKey);
        if (donationPerson) donation.person = donationPerson;
        donations.push(donation);
      }
      if (fund) {
        const fundAmount = d.fundAmount !== undefined && d.fundAmount !== "" ? Number.parseFloat(d.fundAmount) : Number.parseFloat(d.amount);
        fundDonations.push({ donationKey: donation.importKey, fundKey: fund.importKey, amount: fundAmount } as ImportFundDonationInterface);
      }
    }
  }
};

// Adds funds nobody has given to yet. Funds already named in donations.csv are kept as they are.
const loadFunds = (data: any) => {
  for (let i = 0; i < data.length; i++) {
    const name = data[i].name?.toString().trim();
    if (name) ImportHelper.getOrCreateFund(funds, name, { taxDeductible: csvBool(data[i].taxDeductible), visible: csvBool(data[i].visible) });
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

const campusDetails = (row: any) => ({
  address1: row.campusAddress1,
  address2: row.campusAddress2,
  city: row.campusCity,
  state: row.campusState,
  zip: row.campusZip,
  timezone: row.campusTimezone,
  website: row.campusWebsite
});

const loadServiceTimes = (data: any) => {
  campuses = [];
  services = [];
  serviceTimes = [];
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row.campus === undefined && row.time === undefined) continue;
    const campus = ImportHelper.getOrCreateCampus(campuses, row.campus, campusDetails(row));
    if (row.service === undefined && row.time === undefined) continue;
    const service = ImportHelper.getOrCreateService(services, row.service, campus);
    if (row.time !== undefined) ImportHelper.getOrCreateServiceTime(serviceTimes, row, service);
  }
  return serviceTimes;
};

const applyGroupFields = (group: ImportGroupInterface, row: any) => {
  const text = (key: string, prop: keyof ImportGroupInterface) => {
    if (row[key] !== undefined) (group as any)[prop] = row[key];
  };
  text("about", "about");
  text("photoUrl", "photoUrl");
  text("tags", "tags");
  text("meetingTime", "meetingTime");
  text("meetingLocation", "meetingLocation");
  text("slug", "slug");
  text("joinPolicy", "joinPolicy");
  text("minGrade", "minGrade");
  text("maxGrade", "maxGrade");
  const flags: [string, keyof ImportGroupInterface][] = [
    ["attendanceReminders", "attendanceReminders"],
    ["parentPickup", "parentPickup"],
    ["printNametag", "printNametag"],
    ["discussionsEnabled", "discussionsEnabled"],
    ["announcementsEnabled", "announcementsEnabled"],
    ["archived", "archived"],
    ["publicRoster", "publicRoster"],
    ["confidential", "confidential"],
    ["checkinClosed", "checkinClosed"]
  ];
  flags.forEach(([key, prop]) => {
    const value = csvBool(row[key]);
    if (value !== undefined) (group as any)[prop] = value;
  });
  (["minAgeMonths", "maxAgeMonths", "capacity", "guestCapacity", "volunteerRatio", "minVolunteers"] as const).forEach((key) => {
    const value = csvNumber(row[key]);
    if (value !== undefined) group[key] = value;
  });
  if (row.labels !== undefined) group.labelArray = row.labels.split(",").map((label: string) => label.trim()).filter(Boolean);
  if (row.campus) {
    const campus = campuses.find(c => c.name === row.campus);
    if (campus) group.campusKey = campus.importKey;
  }
};

const loadGroups = (data: any) => {
  groups = [];
  groupServiceTimes = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].name !== undefined) {
      const group = ImportHelper.getOrCreateGroup(groups, data[i]);
      applyGroupFields(group, data[i]);
      if (group !== null && group.serviceTimeKey !== undefined && group.serviceTimeKey !== null && group.serviceTimeKey !== "") {
        const gst = { groupKey: group.importKey, groupId: group.importKey, serviceTimeKey: group.serviceTimeKey } as ImportGroupServiceTimeInterface;
        if (!groupServiceTimes.find(existing => existing.groupKey === gst.groupKey && existing.serviceTimeKey === gst.serviceTimeKey)) groupServiceTimes.push(gst);
      }
    }
  }
  return groups;
};

const loadGroupMembers = (data: any) => {
  groupMembers = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].groupKey === undefined) continue;
    const leader = csvBool(data[i].leader);
    groupMembers.push({ groupKey: data[i].groupKey, personKey: data[i].personKey, leader: leader === true } as ImportGroupMemberInterface);
  }
};

const loadPeople = async (data: any, zip: any) => {
  people = [];
  households = [];
  acceptedPeopleRows = [];
  const photoPromises: Promise<void>[] = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].lastName !== undefined) {
      const rawRow = { ...data[i] };
      const p = data[i] as ImportPersonInterface;
      p.name = { first: data[i].firstName ?? "", last: data[i].lastName ?? "", middle: data[i].middleName ?? "", nick: data[i].nickName ?? "", display: data[i].displayName ?? "", title: data[i].prefix ?? "", suffix: data[i].suffix ?? "" };
      if (data[i].prefix !== undefined) (p.name as { prefix?: string }).prefix = data[i].prefix;
      p.contactInfo = { address1: data[i].address1 ?? "", address2: data[i].address2 ?? "", city: data[i].city ?? "", state: data[i].state ?? "", zip: data[i].zip ?? "", homePhone: data[i].homePhone ?? "", mobilePhone: data[i].mobilePhone ?? "", workPhone: data[i].workPhone ?? "", email: data[i].email ?? "" };
      if (data[i].householdRole) p.householdRole = data[i].householdRole;
      if (data[i].anniversary) p.anniversary = ImportHelper.toDateOnly(data[i].anniversary) || data[i].anniversary;
      if (data[i].grade !== undefined) p.grade = data[i].grade;
      if (data[i].school !== undefined) p.school = data[i].school;
      if (data[i].donorNumber !== undefined) p.donorNumber = data[i].donorNumber;
      if (data[i].nametagNotes !== undefined) p.nametagNotes = data[i].nametagNotes;
      const optedOut = csvBool(data[i].optedOut);
      if (optedOut !== undefined) p.optedOut = optedOut;
      if (data[i].campus) (p as ImportPersonInterface & { campusName?: string }).campusName = data[i].campus;
      if (data[i].birthDate) p.birthDate = ImportHelper.toDateOnly(data[i].birthDate) || data[i].birthDate;
      assignHousehold(households, data[i]);
      if (p.photo !== undefined) {
        const photoFile = zip?.file(p.photo);
        if (photoFile) {
          photoPromises.push(
            photoFile.async("base64").then((base64: string) => {
              if (base64) p.photo = "data:image/png;base64," + base64;
            }).catch((e: unknown) => {
              console.error(`Failed to load photo ${p.photo}`, e);
            })
          );
        }
      }
      people.push(p);
      acceptedPeopleRows.push(rawRow);
    }
  }
  await Promise.all(photoPromises);
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

const linkPeopleToCampuses = () => {
  people.forEach(p => {
    const campusName = (p as ImportPersonInterface & { campusName?: string }).campusName;
    delete (p as ImportPersonInterface & { campusName?: string }).campusName;
    if (!campusName) return;
    const campus = campuses.find(c => c.name === campusName);
    if (campus) p.campusKey = campus.importKey;
  });
};

const assignHousehold = (households: ImportHouseholdInterface[], person: any) => {
  const householdName: string = person.householdName || person.household;
  const householdKey = person.householdKey?.toString().trim();
  if (householdKey) {
    // Exported zips key each household, so same-named households stay apart and split rows stay together.
    const key = "hh_" + householdKey;
    if (!households.find(h => h.importKey === key)) households.push({ name: householdName, importKey: key } as ImportHouseholdInterface);
    person.householdKey = key;
    return;
  }
  if (households.length === 0 || households[households.length - 1].name !== householdName) {
    households.push({ name: householdName, importKey: (households.length + 1).toString() } as ImportHouseholdInterface);
  }
  person.householdKey = households[households.length - 1].importKey;
};

export default readB1Zip;
