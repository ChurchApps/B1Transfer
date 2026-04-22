export enum DataSourceType {
    B1_DB = "b1Db",
    B1_ZIP = "b1Zip",
    BREEZE_ZIP = "breezeZip",
    PLANNING_CENTER_ZIP = "planingCenterZip",
    CUSTOM_CSV = "customCsv",
    TITHELY_CSV = "tithelyCsv",
    CCB_CSV = "ccbCsv"
  }

export interface FieldMapping {
  sourceColumn: string;
  targetField: string;
}

export const B1_PEOPLE_FIELDS = [
  { value: "", label: "(Skip)" },
  { value: "name.first", label: "First Name" },
  { value: "name.last", label: "Last Name" },
  { value: "name.middle", label: "Middle Name" },
  { value: "name.nick", label: "Nickname" },
  { value: "name.display", label: "Display Name" },
  { value: "name.title", label: "Title/Prefix" },
  { value: "name.suffix", label: "Suffix" },
  { value: "contactInfo.email", label: "Email" },
  { value: "contactInfo.homePhone", label: "Home Phone" },
  { value: "contactInfo.mobilePhone", label: "Mobile Phone" },
  { value: "contactInfo.workPhone", label: "Work Phone" },
  { value: "contactInfo.address1", label: "Address Line 1" },
  { value: "contactInfo.address2", label: "Address Line 2" },
  { value: "contactInfo.city", label: "City" },
  { value: "contactInfo.state", label: "State" },
  { value: "contactInfo.zip", label: "Zip Code" },
  { value: "birthDate", label: "Birth Date" },
  { value: "gender", label: "Gender" },
  { value: "maritalStatus", label: "Marital Status" },
  { value: "membershipStatus", label: "Membership Status" },
  { value: "householdName", label: "Household/Family Name" },
  { value: "groupName", label: "Group Name" },
  { value: "formAnswer", label: "Form Answer (custom field)" }
] as const;
