import { UploadHelper } from "..";
import {
  ImportHelper
  , ImportDonationBatchInterface
  , ImportDataInterface
  , ImportHouseholdInterface
} from "../ImportHelper";
import Papa from "papaparse";

const generateTithelyZip = async (importData: ImportDataInterface, updateProgress: (name: string, status: string) => void) => {

  const sleep = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));

  const runImport = async (keyName: string, code: () => void) => {
    updateProgress(keyName, "running");
    try {
      await sleep(100);
      await code();
      updateProgress(keyName, "complete");
    } catch (_e) {
      updateProgress(keyName, "error");
    }
  };

  const files: { name: string, contents: string | Buffer }[] = [];

  const peopleCsv = await exportPeople(importData, runImport);
  files.push({ name: "people.csv", contents: peopleCsv });

  if (importData.donations.length > 0) {
    const givingCsv = await exportDonations(importData, runImport);
    files.push({ name: "giving.csv", contents: givingCsv });
  }

  if (importData.groups.length > 0) {
    const groupsCsv = await exportGroups(importData, runImport);
    files.push({ name: "groups.csv", contents: groupsCsv });
  }

  await runImport("Compressing", async () => {
    UploadHelper.zipFiles(files, "TithelyExport.zip");
  });
};

const exportPeople = async (importData: ImportDataInterface, runImport: (keyName: string, code: () => void) => Promise<void>) => {
  const { people } = importData;
  const tmpHouseholds: ImportHouseholdInterface[] = [...importData.households];
  const data: any[] = [];
  await runImport("People", async () => {
    people.forEach((p) => {
      const household = tmpHouseholds.find(h => p.householdKey === h.importKey);
      const row: Record<string, string> = {
        individual_id: p.importKey ?? "",
        first_name: p.name?.first ?? "",
        last_name: p.name?.last ?? "",
        middle_name: p.name?.middle ?? "",
        nickname: p.name?.nick ?? "",
        prefix: (p.name as any)?.title ?? "",
        suffix: p.name?.suffix ?? "",
        email_address: p.contactInfo?.email ?? "",
        mobile_phone: p.contactInfo?.mobilePhone ?? "",
        home_phone: p.contactInfo?.homePhone ?? "",
        work_phone: p.contactInfo?.workPhone ?? "",
        address_line_1: p.contactInfo?.address1 ?? "",
        address_line_2: p.contactInfo?.address2 ?? "",
        city: p.contactInfo?.city ?? "",
        state: p.contactInfo?.state ?? "",
        zip: p.contactInfo?.zip ?? "",
        birthday: p.birthDate ? p.birthDate.toString() : "",
        gender: p.gender ?? "",
        marital_status: p.maritalStatus ?? "",
        membership_status: p.membershipStatus ?? "",
        family_id: household?.importKey ?? "",
        family_role: p.householdRole ?? ""
      };
      data.push(row);
    });
  });
  return Papa.unparse(data);
};

const exportDonations = async (importData: ImportDataInterface, runImport: (keyName: string, code: () => void) => Promise<void>) => {
  const { batches, donations } = importData;
  const data: any[] = [];

  await runImport("Donations", async () => {
    donations.forEach((donation) => {
      const batch: ImportDonationBatchInterface = ImportHelper.getByImportKey(batches, donation.batchKey);
      const row: Record<string, string> = {
        date: batch?.batchDate ? batch.batchDate.toString() : (donation.donationDate ? donation.donationDate.toString() : ""),
        amount: donation.amount?.toString() ?? "",
        fund_name: donation.fund?.name ?? "",
        payment_method: donation.method ?? "",
        notes: donation.notes ?? "",
        batch_name: batch?.name ?? "",
        individual_id: donation.personKey ?? donation.person?.id ?? ""
      };
      data.push(row);
    });
  });

  return Papa.unparse(data);
};

const exportGroups = async (importData: ImportDataInterface, runImport: (keyName: string, code: () => void) => Promise<void>) => {
  const { groups, groupMembers } = importData;
  const data: any[] = [];

  await runImport("Groups", async () => {
    groupMembers.forEach((gm) => {
      const group = groups.find(g => g.importKey === gm.groupKey || g.id === gm.groupId);
      const row: Record<string, string> = {
        group_name: group?.name ?? "",
        individual_id: gm.personKey ?? gm.personId ?? ""
      };
      data.push(row);
    });
  });

  return Papa.unparse(data);
};

export default generateTithelyZip;
