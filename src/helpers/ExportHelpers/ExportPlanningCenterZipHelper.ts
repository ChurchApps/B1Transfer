import { ImportDataInterface, ImportHouseholdInterface } from "../ImportHelper";
import Papa from "papaparse";
import { runStep, compressZip } from "./RunStep";

const generatePlanningCenterZip = async (importData: ImportDataInterface, updateProgress: (name: string, status: string) => void) => {
  const files: { name: string, contents: any }[] = [];

  const runImport = (keyName: string, code: () => void) => runStep(keyName, updateProgress, code);

  exportCampuses(importData, runImport);

  files.push({ name: "people.csv", contents: await exportPeople(importData, runImport) });

  exportPhotos(files, runImport);

  exportGroups(importData, runImport);

  exportGroupMembers(importData, runImport);

  exportDonations(importData, runImport);

  exportAttendance(importData, runImport);

  exportForms(importData, runImport);

  exportQuestions(importData, runImport);

  exportFormSubmissions(importData, runImport);

  exportAnswers(importData, runImport);

  runStep("Compressing", updateProgress, () => compressZip(files, "PlanningCenterExport.zip"));
};

const exportCampuses = async (_importData : ImportDataInterface, runImport: (keyName: string, code: () => void) => Promise<void>) => {
  await runImport("Campuses/Services/Times", async () => {
  });
};

const exportGroupMembers = async (_importData : ImportDataInterface, runImport: (keyName: string, code: () => void) => Promise<void>) => {
  await runImport("Group Members", async () => {
  });
};

const exportPeople = async (importData: ImportDataInterface, runImport: (keyName: string, code: () => void) => Promise<void>) => {
  const { people } = importData;
  const tmpHouseholds: ImportHouseholdInterface[] = [...importData.households];
  const data: any[] = [];
  await runImport("People", async () => {
    people.forEach((p) => {
      const household = tmpHouseholds.find(h => p.householdKey === h.importKey);
      const row = {
        "Person ID": p.importKey ?? "",
        "Name Prefix": p.name.title ?? "",
        "Given Name": p.name.first ?? "",
        "First Name": p.name.first ?? "",
        Nickname: p.name.nick ?? "",
        "Middle Name": p.name.middle ?? "",
        "Last Name": p.name.last ?? "",
        "Name Suffix": p.name.suffix ?? "",
        Birthdate: p.birthDate ?? "",
        Anniversary: p.anniversary ?? "",
        Gender: p.gender ?? "",
        Grade: p.grade ?? "",
        School: p.school ?? "",
        "Medical Notes": "",
        Child: p.child ?? "",
        "Marital Status": p.maritalStatus ?? "",
        Status: p.membershipStatus ?? "",
        Membership: p.membershipStatus ?? "",
        "Inactive Reason": p.inactiveReason ?? "",
        "Inactive Date": p.inactiveDate ?? "",
        "Services User": p.servicesUser ?? "",
        "Calendar User": p.calendarUser ?? "",
        "Check-Ins User": p.checkInsUser ?? "",
        "Registrations User": p.registrationsUser ?? "",
        "Giving User": p.givingUser ?? "",
        "Groups User": p.groupsUser ?? "",
        "Home Address Street Line 1": p.contactInfo.address1 ?? "",
        "Home Address Street Line 2": p.contactInfo.address2 ?? "",
        "Home Address City": p.contactInfo.city ?? "",
        "Home Address State": p.contactInfo.state ?? "",
        "Home Address Zip Code": p.contactInfo.zip ?? "",
        "Work Address Street Line 1": "",
        "Work Address Street Line 2": "",
        "Work Address City": "",
        "Work Address State": "",
        "Work Address Zip Code": "",
        "Other Address Street Line 1": "",
        "Other Address Street Line 2": "",
        "Other Address City": "",
        "Other Address State": "",
        "Other Address Zip Code": "",
        "Mobile Phone Number": p.contactInfo.mobilePhone ?? "",
        "Home Phone Number": p.contactInfo.homePhone ?? "",
        "Work Phone Number": p.contactInfo.workPhone ?? "",
        "Pager Phone Number": p.contactInfo.pager ?? "",
        "Fax Phone Number": p.contactInfo.fax ?? "",
        "Skype Phone Number": p.contactInfo.skype ?? "",
        "Other Phone Number": "",
        "Home Email": p.contactInfo.email ?? "",
        "Work Email": p.contactInfo.workEmail ?? "",
        "Other Email": "",
        "Household ID": household.id ?? "",
        "Household Name": household.name ?? p.name.last,
        "Household Primary Contact": "",
        "Background Check Cleared": "",
        "Background Check Created At": "",
        "Background Check Expires On": "",
        "Background Check Note": "",
        "Created At": "",
        "Updated At": ""
      };
      data.push(row);
    });
  });
  return Papa.unparse(data);
};

const exportGroups = async (_importData : ImportDataInterface, runImport: (keyName: string, code: () => void) => Promise<void>) => {

  await runImport("Groups", async () => {

  });
  await runImport("Group Service Times", async () => {
  });
};

const exportDonations = async (_importData : ImportDataInterface, runImport: (keyName: string, code: () => void) => Promise<void>) => {

  await runImport("Funds", async () => {
  });

  await runImport("Donation Batches", async () => {
  });

  await runImport("Donations", async () => {
  });

  await runImport("Donation Funds", async () => {
  });
};

const exportAttendance = async (_importData : ImportDataInterface, runImport: (keyName: string, code: () => void) => Promise<void>) => {
  await runImport("Attendance", async () => {
  });
};

const exportForms = async (_importData : ImportDataInterface, runImport: (keyName: string, code: () => void) => Promise<void>) => {
  await runImport("Forms", async () => {
  });
};
const exportQuestions = async (_importData : ImportDataInterface, runImport: (keyName: string, code: () => void) => Promise<void>) => {
  await runImport("Questions", async () => {
  });
};
const exportAnswers = async (_importData : ImportDataInterface, runImport: (keyName: string, code: () => void) => Promise<void>) => {
  await runImport("Answers", async () => {
  });
};
const exportFormSubmissions = async (_importData : ImportDataInterface, runImport: (keyName: string, code: () => void) => Promise<void>) => {
  await runImport("Form Submissions", async () => {
  });
};

const exportPhotos = async (_files: { name: string, contents: string | Buffer }[], runImport: (keyName: string, code: () => void) => Promise<void>) => {
  await runImport("Photos", async () => {
  });
};

export default generatePlanningCenterZip;
