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
} from "../ImportHelper";

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

const getB1Data = async (): Promise<ImportDataInterface> => {
  await Promise.all([getPeople(), getCampusServiceTimes(), getGroups(), getGroupMembers(), getAttendance(), getDonations(), getForms(), getQuestions(), getFormSubmissions(), getAnswers()]).catch(error => {
    if (error.message.includes("Unauthorized")) alert("Please log in to access B1 data")
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
    answers: answers
  } as ImportDataInterface;

}

const getCampusServiceTimes = async () => {
  let promises = []
  promises.push(ApiHelper.get("/campuses", "AttendanceApi").then((data: any) => campuses = data));
  promises.push(ApiHelper.get("/services", "AttendanceApi").then((data: any) => services = data));
  promises.push(ApiHelper.get("/servicetimes", "AttendanceApi").then((data: any) => serviceTimes = data));
  await Promise.all(promises)
  let data: any[] = [];
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
  return Papa.unparse(data);
}

const getPeople = async () => {
  people = await ApiHelper.get("/people", "MembershipApi");
  people.forEach((p) => {
    p.importKey = p.id
    p.photo = PersonHelper.getPhotoUrl(p);
    p.householdKey = p.householdId
    if (households.find(h => h.importKey === p.householdId) === undefined) households.push({ importKey: p.householdId, name: p.name.last })
  });
}

const getGroups = async () => {
  let promises = []
  promises.push(ApiHelper.get("/groups", "MembershipApi").then((data: any) => groups = data));
  promises.push(ApiHelper.get("/groupserviceTimes", "AttendanceApi").then((data: any) => groupServiceTimes = data));
  await Promise.all(promises);
  groups.forEach((g) => {
    let serviceTimeIds: string[] = [];
    let gst: ImportGroupServiceTimeInterface[] = ArrayHelper.getAll(groupServiceTimes, "groupId", g.id);
    if (gst.length === 0) serviceTimeIds = [""];
    else gst.forEach((time) => { serviceTimeIds.push(time.serviceTimeId.toString()) });
    g.importKey = g.id;
  });
}

const getForms = async () => {
  forms = await ApiHelper.get("/forms", "MembershipApi");
  forms.forEach((f) => {
    f.importKey = f.id;
  });
}

const getQuestions = async () => {
  questions = await ApiHelper.get("/questions", "MembershipApi");
  questions.forEach((q) => {
    q.questionKey = q.id;
  });
}

const getFormSubmissions = async () => {
  formSubmissions = await ApiHelper.get("/formsubmissions", "MembershipApi");
  formSubmissions.forEach((fs) => {
    fs.formKey = fs.id;
  });
}

const getAnswers = async () => {
  answers = await ApiHelper.get("/answers", "MembershipApi");
}

const getGroupMembers = async () => {
  groupMembers = await ApiHelper.get("/groupmembers", "MembershipApi");
}

const getDonations = async () => {
  let promises = []
  promises.push(ApiHelper.get("/funds", "GivingApi").then((data: any) => funds = data));
  promises.push(ApiHelper.get("/donationbatches", "GivingApi").then((data: any) => batches = data));
  promises.push(ApiHelper.get("/donations", "GivingApi").then((data: any) => donations = data));
  promises.push(ApiHelper.get("/funddonations", "GivingApi").then((data: any) => fundDonations = data));
  await Promise.all(promises);
  donations.forEach((d) => {
    let person = people.find(p => p.id === d.personId)
    if (person) d.person = person;
    let fd = fundDonations.find(fd => fd.donationId === d.id)
    if (fd) d.fund = funds.find(f => f.id === fd.fundId)
    d.fundKey = d.fund?.id;
    d.importKey = d.id;
  });
  funds.forEach((f) => {
    f.importKey = f.id
  });
}

const getAttendance = async () => {
  let promises = []
  promises.push(ApiHelper.get("/sessions", "AttendanceApi").then((data: any) => sessions = data));
  promises.push(ApiHelper.get("/visits", "AttendanceApi").then((data: any) => visits = data));
  promises.push(ApiHelper.get("/visitsessions", "AttendanceApi").then((data: any) => visitSessions = data));
  await Promise.all(promises);
  let data: any[] = [];
  visitSessions.forEach((vs) => {
    let visit: ImportVisitInterface = ImportHelper.getById(visits, vs.visitId);
    visit.importKey = visit.id;
    let session: ImportSessionInterface = ImportHelper.getById(sessions, vs.sessionId);
    session.importKey = session.id;
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
  return Papa.unparse(data);
}

export default getB1Data;
