import { UploadHelper, PersonHelper, PersonInterface, DownloadHelper } from "..";
import { ArrayHelper } from "@churchapps/apphelper";
import {
  ImportHelper
  , ImportGroupServiceTimeInterface
  , ImportDonationBatchInterface
  , ImportDataInterface
  , ImportHouseholdInterface
} from "../ImportHelper";

const generateBreezeZip = async (importData: ImportDataInterface, updateProgress: (name: string, status: string) => void) => {

  const sleep = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds))

  const runImport = async (keyName: string, code: () => void) => {
    updateProgress(keyName, "running");
    try{
      await sleep(100);
      await code();
      updateProgress(keyName, "complete");
    }catch(e){
      updateProgress(keyName, "error");
    }
  }

  let files = [];

  exportCampuses(importData, runImport)

  let peopleFileName = `people-${new Date().toISOString().split("T")[0]}.xlsx`;
  let peopleData = await exportPeople(importData, runImport);
  let peopleXlxsBuffer = DownloadHelper.createXlxs(peopleData)
  files.push({ name: peopleFileName, contents: peopleXlxsBuffer });

  exportPhotos(importData.people, files, runImport);

  let groupsFileName = `events-${new Date().toISOString().split("T")[0]}.xlsx`;
  let eventData = await exportGroups(importData, runImport);
  let eventXlxsBuffer = DownloadHelper.createXlxs(eventData)
  files.push({ name: groupsFileName, contents: eventXlxsBuffer });

  let donationsFileName = `giving-${new Date().toISOString().split("T")[0]}.xlsx`;
  let dontationData = await exportDonations(importData, runImport);
  let donationXlxsBuffer = DownloadHelper.createXlxs(dontationData)
  files.push({ name: donationsFileName, contents: donationXlxsBuffer });

  exportAttendance(importData, runImport)

  exportForms(importData, runImport)

  compressZip(files, runImport);

}
const compressZip = async (files: {name: string, contents: any}[], runImport: (keyName: string, code: () => void) => Promise<void>) => {
  await runImport("Compressing", async () => {
    UploadHelper.zipFiles(files, "BreezeExport.zip");
  });
}
const exportCampuses = async (_importData: ImportDataInterface, runImport: (keyName: string, code: () => void) => Promise<void>) => {
  let data: any[] = [];
  await runImport("Campuses/Services/Times", async () => {
  });
  return data;
}

const exportPeople = async (importData: ImportDataInterface, runImport: (keyName: string, code: () => void) => Promise<void>) => {
  const { people } = importData;
  let tmpHouseholds: ImportHouseholdInterface[] = [...importData.households];
  let data: any[] = [];
  await runImport("People", async () => {
    people.forEach((p) => {
      let household = tmpHouseholds.find(h => p.householdKey === h.importKey)
      let row = {
        "Breeze ID": p.importKey,
        "First Name": p.name.first,
        "Last Name": p.name.last,
        "Middle Name": p.name.middle,
        Nickname: p.name.nick,
        "Maiden Name": "",
        Gender: p.gender,
        Status: p.membershipStatus,
        "Marital Status": p.maritalStatus,
        Birthdate: p.birthDate,
        "Birthdate Month/Day": new Date(p.birthDate).getMonth() + "/" + new Date(p.birthDate).getDay(),
        Age: PersonHelper.calculateAge(p.birthDate),
        Family: household.name ?? p.name.last,
        "Family Role": p.householdRole,
        School: p.school,
        "Graduation Year": p.graduationDate,
        Grade: p.grade,
        Employer: p.employer,
        Mobile: p.contactInfo.mobilePhone,
        Home: p.contactInfo.homePhone,
        Work: p.contactInfo.workPhone,
        Campus: "",
        Email: p.contactInfo.email,
        "Street Address": p.contactInfo.address1,
        City: p.contactInfo.city,
        State: p.contactInfo.state,
        Zip: p.contactInfo.zip,
        "Added Date": ""
      }
      data.push(row);
    });
  });
  return data;

}

const exportGroups = async (importData : ImportDataInterface, runImport: (keyName: string, code: () => void) => Promise<void>) => {
  const {groups, groupServiceTimes} = importData;
  let data: any[] = [];
  await runImport("Groups", async () => {
    groups.forEach((g) => {
      let serviceTimeIds: string[] = [];
      let gst: ImportGroupServiceTimeInterface[] = ArrayHelper.getAll(groupServiceTimes, "groupId", g.id);
      if (gst.length === 0) serviceTimeIds = [""];
      else gst.forEach((time) => time?.serviceTimeId ? serviceTimeIds.push(time?.serviceTimeId?.toString()) : null );
      serviceTimeIds.forEach((_serviceTimeId) => {
        let row = {
          "Event ID": g.importKey,
          "Instance ID": g.id,
          Name: g.name,
          "Start Date": g.startDate,
          "End Date": g.endDate
        }
        data.push(row);
      });
    });
  });
  await runImport("Group Service Times", async () => {
  });

  await runImport("Group Members", async () => {
  });

  return data;
}

const exportDonations = async (importData : ImportDataInterface, runImport: (keyName: string, code: () => void) => Promise<void>) => {
  const {batches, donations} = importData;
  let data: any[] = [];

  await runImport("Funds", async () => {
  });

  await runImport("Donation Batches", async () => {
  });

  await runImport("Donations", async () => {
    donations.forEach((donation) => {
      let batch: ImportDonationBatchInterface = ImportHelper.getByImportKey(batches, donation.batchKey);
      let row = {
        Date: batch.batchDate,
        Batch: donation.batchKey,
        "Payment ID": "",
        "Person ID": donation.person?.id,
        "First Name": donation.person?.name.first,
        "Last Name": donation.person?.name.last,
        Amount: donation.amount,
        "Fund(s)": donation.fund?.name,
        "Method ID": donation.method,
        "Account Number": "",
        "Check Number": "",
        Card: donation.methodDetails,
        Note: donation.notes
      }
      data.push(row);
    });
  });

  await runImport("Donation Funds", async () => {
  });
  return data;
}

const exportAttendance = async (_importData : ImportDataInterface, runImport: (keyName: string, code: () => void) => Promise<void>) => {
  await runImport("Attendance", async () => {
  });
}

const exportForms = async (_importData : ImportDataInterface, runImport: (keyName: string, code: () => void) => Promise<void>) => {
  await runImport("Forms", async () => {
  })
  await runImport("Questions", async () => {
  })
  await runImport("Answers", async () => {
  })
  await runImport("Form Submissions", async () => {
  })
}

const exportPhotos = async (people: PersonInterface[], files: { name: string, contents: string | Buffer }[], runImport: (keyName: string, code: () => void) => Promise<void>) => {
  await runImport("Photos", async () => {
    let result: Promise<any>[] = [];
    people.forEach(async (p) => {
      if (p.photoUpdated !== undefined) result.push(UploadHelper.downloadImageBytes(files, p.id.toString() + ".png", p.photo));
    })
    Promise.all(result);
  });
}

export default generateBreezeZip;
