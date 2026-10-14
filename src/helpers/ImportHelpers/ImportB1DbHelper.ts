import { ApiHelper, ArrayHelper } from "@churchapps/apphelper";
import { PersonHelper } from "../PersonHelper";

import Papa from "papaparse";
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

let people: ImportPersonInterface[] = [];
const households: ImportHouseholdInterface[] = [];
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

const getB1Data = async (): Promise<ImportDataInterface> => {
  await Promise.all([
    getPeople(), getCampusServiceTimes(), getGroups(), getGroupMembers(), getAttendance(), getDonations(), getForms(), getQuestions(), getFormSubmissions(), getAnswers(), getPersonFields()
  ]).catch(error => {
    if (error.message.includes("Unauthorized")) alert("Please log in to access B1 data");
  });

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

const getCampusServiceTimes = async () => {
  const promises = [];
  promises.push(ApiHelper.get("/campuses", "MembershipApi").then((data: any) => campuses = data));
  promises.push(ApiHelper.get("/services", "AttendanceApi").then((data: any) => services = data));
  promises.push(ApiHelper.get("/servicetimes", "AttendanceApi").then((data: any) => serviceTimes = data));
  await Promise.all(promises);
  campuses = campuses || [];
  services = services || [];
  serviceTimes = serviceTimes || [];
  campuses.forEach(c => { c.importKey = c.id; });
  services.forEach(s => { s.importKey = s.id; s.campusKey = s.campusId; });
  serviceTimes.forEach(st => { st.importKey = st.id; st.serviceKey = st.serviceId; });
  const data: any[] = [];
  serviceTimes.forEach((st) => {
    const service: ImportServiceInterface = ImportHelper.getById(services, st.serviceId);
    const campus: ImportCampusInterface = service ? ImportHelper.getById(campuses, service.campusId) : null;
    if (!service || !campus) return; // skip orphan service times rather than throwing away the whole load
    const row = { importKey: st.id, campus: campus.name, service: service.name, time: st.name };
    data.push(row);
  });
  return Papa.unparse(data);
};

const getPeople = async () => {
  const [personRows, householdRows] = await Promise.all([
    ApiHelper.get("/people", "MembershipApi"),
    ApiHelper.get("/households", "MembershipApi").catch((): any[] => [])
  ]);
  people = personRows || [];
  const householdNames = new Map<string, string>((householdRows || []).map((h: { id?: string, name?: string }) => [h.id, h.name]));
  people.forEach((p) => {
    p.importKey = p.id;
    p.photo = PersonHelper.getPhotoUrl(p);
    p.householdKey = p.householdId;
    p.campusKey = p.campusId;
    if (p.householdId && households.find(h => h.importKey === p.householdId) === undefined) {
      households.push({ importKey: p.householdId, name: householdNames.get(p.householdId) || p.name?.last });
    }
  });
};

const getGroups = async () => {
  const promises = [];
  promises.push(ApiHelper.get("/groups", "MembershipApi").then((data: any) => groups = data));
  promises.push(ApiHelper.get("/groupserviceTimes", "AttendanceApi").then((data: any) => groupServiceTimes = data));
  await Promise.all(promises);
  groups.forEach((g) => {
    let serviceTimeIds: string[] = [];
    const gst: ImportGroupServiceTimeInterface[] = ArrayHelper.getAll(groupServiceTimes, "groupId", g.id);
    if (gst.length === 0) serviceTimeIds = [""];
    else gst.forEach((time) => { serviceTimeIds.push(time.serviceTimeId.toString()); });
    g.importKey = g.id;
    g.campusKey = g.campusId;
  });
};

const getForms = async () => {
  forms = await ApiHelper.get("/forms", "MembershipApi");
  forms.forEach((f) => {
    f.importKey = f.id;
    f.groupKey = f.groupId;
  });
};

const getQuestions = async () => {
  // GET /questions returns nothing without a formId, so fetch per form or every question is silently dropped.
  questions = [];
  const formList: any[] = await ApiHelper.get("/forms", "MembershipApi");
  const perForm = await Promise.all(formList.map(f => ApiHelper.get(`/questions?formId=${f.id}`, "MembershipApi")));
  perForm.forEach((qs: any[]) => qs.forEach((q) => {
    q.questionKey = q.id;
    q.parentKey = q.parentId;
    questions.push(q);
  }));
};

const getFormSubmissions = async () => {
  formSubmissions = await ApiHelper.get("/formsubmissions", "MembershipApi");
  formSubmissions.forEach((fs) => {
    fs.importKey = fs.id;
    fs.formKey = fs.formId;
    fs.personKey = fs.contentId;
  });
};

const getPersonFields = async () => {
  personFields = (await ApiHelper.get("/personfields", "MembershipApi")) || [];
  personFields.forEach(f => { f.importKey = f.id; });
  const valueGroups = await Promise.all(personFields.map(f => ApiHelper.get(`/personfieldvalues/field/${f.id}`, "MembershipApi").catch((): any[] => [])));
  personFieldValues = [];
  personFields.forEach((field, i) => {
    (valueGroups[i] || []).forEach((v: { personId?: string, value?: string }) => {
      if (v.value === undefined || v.value === null || v.value === "") return;
      personFieldValues.push({ personKey: v.personId, fieldName: field.name, value: String(v.value) });
    });
  });
};

const getAnswers = async () => {
  answers = await ApiHelper.get("/answers", "MembershipApi");
};

const getGroupMembers = async () => {
  groupMembers = await ApiHelper.get("/groupmembers", "MembershipApi");
};

const getDonations = async () => {
  const promises = [];
  promises.push(ApiHelper.get("/funds", "GivingApi").then((data: any) => funds = data));
  promises.push(ApiHelper.get("/donationbatches", "GivingApi").then((data: any) => batches = data));
  promises.push(ApiHelper.get("/donations", "GivingApi").then((data: any) => donations = data));
  promises.push(ApiHelper.get("/funddonations", "GivingApi").then((data: any) => fundDonations = data));
  await Promise.all(promises);
  donations.forEach((d) => {
    const person = people.find(p => p.id === d.personId);
    if (person) d.person = person;
    const fd = fundDonations.find(fd => fd.donationId === d.id);
    if (fd) d.fund = funds.find(f => f.id === fd.fundId);
    d.fundKey = d.fund?.id;
    d.importKey = d.id;
  });
  funds.forEach((f) => {
    f.importKey = f.id;
  });
};

const getAttendance = async () => {
  const promises = [];
  promises.push(ApiHelper.get("/sessions", "AttendanceApi").then((data: any) => sessions = data));
  promises.push(ApiHelper.get("/visits", "AttendanceApi").then((data: any) => visits = data));
  promises.push(ApiHelper.get("/visitsessions", "AttendanceApi").then((data: any) => visitSessions = data));
  await Promise.all(promises);
  const data: any[] = [];
  visitSessions.forEach((vs) => {
    const visit: ImportVisitInterface = ImportHelper.getById(visits, vs.visitId);
    const session: ImportSessionInterface = ImportHelper.getById(sessions, vs.sessionId);
    // Orphan visit/session refs (e.g. a deleted session) must be skipped, not dereferenced —
    // throwing here rejects the whole Promise.all and silently drops every later category.
    if (visit && session) {
      visit.importKey = visit.id;
      session.importKey = session.id;
      const row = { date: visit.visitDate, serviceTimeKey: session.serviceTimeId, groupKey: session.groupId, personKey: visit.personId };
      data.push(row);
    }
  });
  return Papa.unparse(data);
};

export default getB1Data;
