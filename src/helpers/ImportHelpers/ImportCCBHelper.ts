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

const readCCBCsv = async (file: File): Promise<ImportDataInterface> => {
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

  const text = await file.text();
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  const data = parsed.data as any[];

  if (data.length > 0) {
    const cols = Object.keys(data[0]);
    const colsLower = cols.map(c => c.toLowerCase());
    const isPeople = colsLower.some(c => c.includes("first name") || c.includes("last name") || c.includes("individual id"));
    const isGiving = colsLower.some(c => c.includes("amount") || c.includes("transaction date") || c.includes("coa category"));

    if (isPeople) {
      loadPeople(data, people, households);
    } else if (isGiving) {
      loadDonations(data, people, batches, funds, donations, fundDonations);
    }
  }

  return {
    people, households, campuses, services, serviceTimes, groupServiceTimes,
    groups, groupMembers, visits, sessions, visitSessions,
    batches, donations, funds, fundDonations,
    forms, questions, formSubmissions, answers
  } as ImportDataInterface;
};

const assignHousehold = (households: ImportHouseholdInterface[], person: ImportPersonInterface) => {
  const familyId = (person as any).ccbFamilyId;
  const householdName: string = person.name.last || "";

  if (familyId) {
    const existing = households.find(h => h.importKey === familyId);
    if (existing) {
      person.householdKey = existing.importKey;
      return;
    }
    households.push({ name: householdName, importKey: familyId } as ImportHouseholdInterface);
    person.householdKey = familyId;
    return;
  }

  if (households.length === 0 || households[households.length - 1].name !== householdName) {
    households.push({ name: householdName, importKey: (households.length + 1).toString() } as ImportHouseholdInterface);
  }
  person.householdKey = households[households.length - 1].importKey;
};

const loadPeople = (data: any[], people: ImportPersonInterface[], households: ImportHouseholdInterface[]) => {
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const firstName = getCol(row, "First Name", "first_name", "FirstName");
    const lastName = getCol(row, "Last Name", "last_name", "LastName");
    if (!lastName && !firstName) continue;

    const p = {
      importKey: getCol(row, "Individual ID", "individual_id", "ID", "Person ID") || (i + 1).toString(),
      name: {
        first: firstName,
        last: lastName,
        middle: getCol(row, "Middle Name", "middle_name"),
        nick: getCol(row, "Nickname", "Nick Name", "nickname"),
        display: `${firstName} ${lastName}`.trim(),
        title: getCol(row, "Prefix", "Salutation", "prefix"),
        suffix: getCol(row, "Suffix", "suffix")
      } as NameInterface,
      contactInfo: {
        email: getCol(row, "Email", "Primary Email", "email", "E-Mail"),
        homePhone: getCol(row, "Home Phone", "home_phone"),
        mobilePhone: getCol(row, "Mobile Phone", "Cell Phone", "mobile_phone", "cell_phone"),
        workPhone: getCol(row, "Work Phone", "work_phone"),
        address1: getCol(row, "Mailing Street", "Street Address", "Address", "mailing_street"),
        address2: getCol(row, "Mailing Street 2", "Address Line 2", "address2"),
        city: getCol(row, "Mailing City", "City", "city"),
        state: getCol(row, "Mailing State", "State", "state"),
        zip: getCol(row, "Mailing Zip", "Zip", "zip", "Postal Code")
      } as ContactInfoInterface,
      birthDate: getCol(row, "Birthday", "Date of Birth", "Birthdate", "birth_date"),
      gender: getCol(row, "Gender", "gender"),
      maritalStatus: getCol(row, "Marital Status", "marital_status"),
      membershipStatus: getCol(row, "Membership Type", "Member Status", "membership_type", "Status"),
      householdRole: getCol(row, "Family Position", "Family Role", "family_position"),
      householdId: getCol(row, "Family ID", "family_id", "Household ID")
    } as ImportPersonInterface;

    (p as any).ccbFamilyId = getCol(row, "Family ID", "family_id", "Household ID");
    assignHousehold(households, p);
    delete (p as any).ccbFamilyId;
    people.push(p);
  }
};

const loadDonations = (data: any[], people: ImportPersonInterface[], batches: ImportDonationBatchInterface[], funds: ImportFundInterface[], donations: ImportDonationInterface[], fundDonations: ImportFundDonationInterface[]) => {
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const amountStr = getCol(row, "Amount", "amount", "Total");
    if (!amountStr) continue;

    const amount = Number.parseFloat(amountStr.toString().replace(/[^0-9.-]/g, ""));
    if (isNaN(amount)) continue;

    const dateStr = getCol(row, "Transaction Date", "Date", "date", "Received Date");
    const donationDate = dateStr ? new Date(dateStr) : new Date();
    const batchName = getCol(row, "Batch", "batch", "Batch Name") || "CCB Import";
    const fundName = getCol(row, "Fund", "COA Category", "fund", "Fund Name", "Category") || "General";
    const method = getCol(row, "Payment Type", "Method", "method", "Type");
    const checkNumber = getCol(row, "Check Number", "check_number");
    const notes = getCol(row, "Memo", "Note", "Notes", "memo", "notes");
    const personKey = getCol(row, "Individual ID", "Person ID", "individual_id", "Giver ID");

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
      methodDetails: checkNumber,
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

export default readCCBCsv;
