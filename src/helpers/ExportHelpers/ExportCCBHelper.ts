import { UploadHelper } from "..";
import {
  ImportHelper
  , ImportDonationBatchInterface
  , ImportDataInterface
  , ImportHouseholdInterface
} from "../ImportHelper";
import Papa from "papaparse";

const generateCCBZip = async (importData: ImportDataInterface, updateProgress: (name: string, status: string) => void) => {

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

  await runImport("Compressing", async () => {
    UploadHelper.zipFiles(files, "CCBExport.zip");
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
        "Individual ID": p.importKey ?? "",
        "Family ID": household?.importKey ?? "",
        "First Name": p.name?.first ?? "",
        "Last Name": p.name?.last ?? "",
        "Middle Name": p.name?.middle ?? "",
        "Nickname": p.name?.nick ?? "",
        "Prefix": (p.name as any)?.title ?? "",
        "Suffix": p.name?.suffix ?? "",
        "Email": p.contactInfo?.email ?? "",
        "Home Phone": p.contactInfo?.homePhone ?? "",
        "Mobile Phone": p.contactInfo?.mobilePhone ?? "",
        "Work Phone": p.contactInfo?.workPhone ?? "",
        "Mailing Street": p.contactInfo?.address1 ?? "",
        "Mailing City": p.contactInfo?.city ?? "",
        "Mailing State": p.contactInfo?.state ?? "",
        "Mailing Zip": p.contactInfo?.zip ?? "",
        "Birthday": p.birthDate ? p.birthDate.toString() : "",
        "Gender": p.gender ?? "",
        "Marital Status": p.maritalStatus ?? "",
        "Family Position": p.householdRole ?? "",
        "Membership Type": p.membershipStatus ?? ""
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
        "Individual ID": donation.personKey ?? donation.person?.id ?? "",
        "Transaction Date": batch?.batchDate ? batch.batchDate.toString() : (donation.donationDate ? donation.donationDate.toString() : ""),
        "Amount": donation.amount?.toString() ?? "",
        "Fund": donation.fund?.name ?? "",
        "Payment Type": donation.method ?? "",
        "Check Number": donation.methodDetails ?? "",
        "Memo": donation.notes ?? ""
      };
      data.push(row);
    });
  });

  return Papa.unparse(data);
};

export default generateCCBZip;
