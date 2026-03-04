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
import Papa from "papaparse";
import { ContactInfoInterface, NameInterface } from "..";

const getCol = (row: any, ...candidates: string[]) => {
  for (const c of candidates) {
    if (row[c] !== undefined && row[c] !== null) return row[c];
  }
  return "";
};

const readTithelyCsv = async (file: File): Promise<ImportDataInterface> => {
  const people: ImportPersonInterface[] = [];
  const households: ImportHouseholdInterface[] = [];
  const campuses: ImportCampusInterface[] = [];
  const services: ImportServiceInterface[] = [];
  const serviceTimes: ImportServiceTimeInterface[] = [];
  const groupServiceTimes: ImportGroupServiceTimeInterface[] = [];
  const groups: ImportGroupInterface[] = [];
  const groupMembers: ImportGroupMemberInterface[] = [];
  const sessions: ImportSessionInterface[] = [];
  const visits: ImportVisitInterface[] = [];
  const visitSessions: ImportVisitSessionInterface[] = [];
  const batches: ImportDonationBatchInterface[] = [];
  const funds: ImportFundInterface[] = [];
  const donations: ImportDonationInterface[] = [];
  const fundDonations: ImportFundDonationInterface[] = [];
  const forms: ImportFormsInterface[] = [];
  const questions: ImportQuestionsInterface[] = [];
  const formSubmissions: ImportFormSubmissions[] = [];
  const answers: ImportAnswerInterface[] = [];

  const ext = file.name.split(".").pop()?.toLowerCase();
  let data: any[];

  if (ext === "xlsx" || ext === "xls") {
    const reader = new FileReader();
    const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(new DOMException("Could not read file"));
      reader.readAsArrayBuffer(file);
    });
    const sheets = UploadHelper.readXlsx(buffer);
    const sheetNames = Object.keys(sheets);

    // Look for people sheet first
    const peopleSheet = sheetNames.find(s => s.toLowerCase().includes("people") || s.toLowerCase().includes("member") || s.toLowerCase().includes("contact")) ?? sheetNames[0];
    if (peopleSheet) loadPeople(sheets[peopleSheet], people, households);

    // Look for giving sheet
    const givingSheet = sheetNames.find(s => s.toLowerCase().includes("giving") || s.toLowerCase().includes("donation") || s.toLowerCase().includes("contribution"));
    if (givingSheet) loadDonations(sheets[givingSheet], people, batches, funds, donations, fundDonations);

    // Look for groups sheet
    const groupsSheet = sheetNames.find(s => s.toLowerCase().includes("group") || s.toLowerCase().includes("tag"));
    if (groupsSheet) loadGroups(sheets[groupsSheet], groups, groupMembers);
  } else {
    const text = await file.text();
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
    data = parsed.data as any[];

    if (data.length > 0) {
      const cols = Object.keys(data[0]).map(c => c.toLowerCase());
      const isPeople = cols.some(c => c.includes("first_name") || c.includes("last_name") || c.includes("first name"));
      const isGiving = cols.some(c => c.includes("amount") || c.includes("giving_date") || c.includes("transaction"));

      if (isPeople) {
        loadPeople(data, people, households);
      } else if (isGiving) {
        loadDonations(data, people, batches, funds, donations, fundDonations);
      }
    }
  }

  return {
    people,
    households,
    campuses,
    services,
    serviceTimes,
    groupServiceTimes,
    groups,
    groupMembers,
    visits,
    sessions,
    visitSessions,
    batches,
    donations,
    funds,
    fundDonations,
    forms,
    questions,
    formSubmissions,
    answers
  } as ImportDataInterface;
};

const assignHousehold = (households: ImportHouseholdInterface[], person: ImportPersonInterface) => {
  const familyId = (person as any).tithelyFamilyId;
  const householdName: string = familyId || person.name.last || "";

  if (familyId) {
    const existing = households.find(h => h.importKey === familyId);
    if (existing) {
      person.householdKey = existing.importKey;
      return;
    }
  }

  if (households.length === 0 || households[households.length - 1].name !== householdName) {
    households.push({ name: person.name.last || householdName, importKey: familyId || (households.length + 1).toString() } as ImportHouseholdInterface);
  }
  person.householdKey = households[households.length - 1].importKey;
};

const loadPeople = (data: any[], people: ImportPersonInterface[], households: ImportHouseholdInterface[]) => {
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const firstName = getCol(row, "first_name", "First Name", "FirstName", "first");
    const lastName = getCol(row, "last_name", "Last Name", "LastName", "last");
    if (!lastName && !firstName) continue;

    const p = {
      importKey: getCol(row, "individual_id", "id", "person_id", "Individual ID") || (i + 1).toString(),
      name: {
        first: firstName,
        last: lastName,
        middle: getCol(row, "middle_name", "Middle Name", "middle"),
        nick: getCol(row, "nickname", "Nickname", "nick_name"),
        display: `${firstName} ${lastName}`.trim(),
        title: getCol(row, "prefix", "Prefix", "title"),
        suffix: getCol(row, "suffix", "Suffix")
      } as NameInterface,
      contactInfo: {
        email: getCol(row, "email_address", "email", "Email", "primary_email"),
        mobilePhone: getCol(row, "phone", "mobile_phone", "Mobile Phone", "mobile", "cell_phone"),
        homePhone: getCol(row, "home_phone", "Home Phone", "home"),
        workPhone: getCol(row, "work_phone", "Work Phone", "work"),
        address1: getCol(row, "address_line_1", "address", "Address", "street_address"),
        address2: getCol(row, "address_line_2", "Address Line 2", "address2"),
        city: getCol(row, "city", "City"),
        state: getCol(row, "state", "State", "province"),
        zip: getCol(row, "zip", "Zip", "postal_code", "zip_code")
      } as ContactInfoInterface,
      birthDate: getCol(row, "birthday", "birthdate", "Birthdate", "Birth Date", "date_of_birth"),
      gender: getCol(row, "gender", "Gender"),
      maritalStatus: getCol(row, "marital_status", "Marital Status"),
      membershipStatus: getCol(row, "membership_status", "status", "Status", "member_status"),
      householdRole: getCol(row, "family_role", "Family Role", "household_role"),
      householdId: getCol(row, "family_id", "Family ID", "household_id")
    } as ImportPersonInterface;

    (p as any).tithelyFamilyId = getCol(row, "family_id", "Family ID", "household_id");
    assignHousehold(households, p);
    delete (p as any).tithelyFamilyId;
    people.push(p);
  }
};

const loadDonations = (data: any[], people: ImportPersonInterface[], batches: ImportDonationBatchInterface[], funds: ImportFundInterface[], donations: ImportDonationInterface[], fundDonations: ImportFundDonationInterface[]) => {
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const amountStr = getCol(row, "amount", "Amount", "total", "Total");
    if (!amountStr) continue;

    const amount = Number.parseFloat(amountStr.toString().replace(/[^0-9.-]/g, ""));
    if (isNaN(amount)) continue;

    const dateStr = getCol(row, "date", "giving_date", "Date", "Giving Date", "transaction_date", "Transaction Date");
    const donationDate = dateStr ? new Date(dateStr) : new Date();
    const batchName = getCol(row, "batch", "batch_name", "Batch", "Batch Name") || "Tithe.ly Import";
    const fundName = getCol(row, "fund", "fund_name", "Fund", "Fund Name") || "General";
    const method = getCol(row, "method", "payment_method", "Method", "Payment Method", "type");
    const notes = getCol(row, "note", "notes", "Note", "Notes", "memo");
    const personKey = getCol(row, "individual_id", "person_id", "Person ID", "donor_id");

    const batch = ImportHelper.getOrCreateBatch(batches, batchName, donationDate);
    const fund = ImportHelper.getOrCreateFund(funds, fundName);

    const donation = {
      importKey: (donations.length + 1).toString(),
      batchKey: batch.importKey,
      personKey: personKey,
      personId: personKey,
      donationDate: donationDate,
      amount: amount,
      method: method,
      notes: notes,
      fund: fund,
      fundKey: fund.importKey
    } as ImportDonationInterface;
    donation.person = people.find(p => p.importKey === donation.personKey);

    const fundDonation = { donationKey: donation.importKey, fundKey: fund.importKey, amount: amount } as ImportFundDonationInterface;
    donations.push(donation);
    fundDonations.push(fundDonation);
  }
};

const loadGroups = (data: any[], groups: ImportGroupInterface[], groupMembers: ImportGroupMemberInterface[]) => {
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const groupName = getCol(row, "group_name", "Group Name", "group", "Group", "name", "Name");
    const personKey = getCol(row, "individual_id", "person_id", "Person ID", "member_id");
    if (!groupName) continue;

    let group = groups.find(g => g.name === groupName);
    if (!group) {
      group = { importKey: (groups.length + 1).toString(), name: groupName, trackAttendance: false, parentPickup: false, serviceTimeKey: null, startDate: null, endDate: null, id: (groups.length + 1).toString() } as ImportGroupInterface;
      groups.push(group);
    }

    if (personKey) {
      groupMembers.push({ groupKey: group.importKey, personKey: personKey, groupId: group.importKey, personId: personKey } as ImportGroupMemberInterface);
    }
  }
};

export default readTithelyCsv;
