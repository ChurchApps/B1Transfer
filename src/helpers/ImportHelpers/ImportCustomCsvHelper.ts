import {
  ImportPersonInterface, ImportHouseholdInterface,
  ImportDataInterface, ImportFormsInterface, ImportQuestionsInterface,
  ImportFormSubmissions, ImportAnswerInterface
} from "../ImportHelper";
import { ContactInfoInterface, NameInterface } from "..";
import { FieldMapping } from "../../types";

const getNestedValue = (row: any, sourceColumn: string): string => row[sourceColumn]?.toString() ?? "";

const setNestedField = (obj: any, path: string, value: string) => {
  const parts = path.split(".");
  if (parts.length === 1) {
    obj[parts[0]] = value;
  } else {
    if (!obj[parts[0]]) obj[parts[0]] = {};
    obj[parts[0]][parts[1]] = value;
  }
};

const readCustomCsv = (data: any[], mappings: FieldMapping[], formName: string = "Imported Data"): ImportDataInterface => {
  const people: ImportPersonInterface[] = [];
  const households: ImportHouseholdInterface[] = [];
  const householdMap = new Map<string, string>();

  const activeMappings = mappings.filter(m => m.targetField !== "");
  const hasGroupMapping = activeMappings.some(m => m.targetField === "groupName");
  const formAnswerMappings = activeMappings.filter(m => m.targetField === "formAnswer");

  const groupMap = new Map<string, string>();
  const groups: any[] = [];
  const groupMembers: any[] = [];

  const forms: ImportFormsInterface[] = [];
  const questions: ImportQuestionsInterface[] = [];
  const formSubmissions: ImportFormSubmissions[] = [];
  const answers: ImportAnswerInterface[] = [];

  const FORM_KEY = "1";
  if (formAnswerMappings.length > 0) {
    forms.push({ importKey: FORM_KEY, name: formName, contentType: "person" } as ImportFormsInterface);
    formAnswerMappings.forEach((m, idx) => {
      questions.push({
        formKey: FORM_KEY,
        questionKey: m.sourceColumn,
        title: m.sourceColumn,
        fieldType: "text",
        sort: idx + 1,
        required: false
      } as ImportQuestionsInterface);
    });
  }

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const person: any = {
      importKey: (i + 1).toString(),
      name: { first: "", last: "", middle: "", nick: "", display: "", title: "", suffix: "" } as NameInterface,
      contactInfo: { address1: "", address2: "", city: "", state: "", zip: "", homePhone: "", mobilePhone: "", workPhone: "", email: "" } as ContactInfoInterface
    };

    let groupName = "";
    let householdName = "";

    for (const mapping of activeMappings) {
      const value = getNestedValue(row, mapping.sourceColumn);
      if (mapping.targetField === "groupName") {
        groupName = value;
      } else if (mapping.targetField === "householdName") {
        householdName = value;
      } else if (mapping.targetField === "formAnswer") {
        // handled below
      } else {
        setNestedField(person, mapping.targetField, value);
      }
    }

    if (!person.name.last && !person.name.first) continue;

    if (!person.name.display) {
      person.name.display = `${person.name.first} ${person.name.last}`.trim();
    }

    // Household assignment
    if (!householdName) householdName = person.name.last || "Unknown";
    if (!householdMap.has(householdName)) {
      const hKey = (households.length + 1).toString();
      householdMap.set(householdName, hKey);
      households.push({ name: householdName, importKey: hKey } as ImportHouseholdInterface);
    }
    person.householdKey = householdMap.get(householdName);

    people.push(person as ImportPersonInterface);

    // Group assignment
    if (hasGroupMapping && groupName) {
      if (!groupMap.has(groupName)) {
        const gKey = (groups.length + 1).toString();
        groupMap.set(groupName, gKey);
        groups.push({ importKey: gKey, name: groupName, id: gKey, trackAttendance: false, parentPickup: false });
      }
      groupMembers.push({ groupKey: groupMap.get(groupName), personKey: person.importKey, groupId: groupMap.get(groupName), personId: person.importKey });
    }

    // Form submission + answers
    if (formAnswerMappings.length > 0) {
      const rowAnswers: { questionKey: string; value: string }[] = [];
      for (const m of formAnswerMappings) {
        const value = getNestedValue(row, m.sourceColumn).trim();
        if (value !== "") rowAnswers.push({ questionKey: m.sourceColumn, value });
      }
      if (rowAnswers.length > 0) {
        const submissionKey = person.importKey;
        formSubmissions.push({
          importKey: submissionKey,
          formKey: FORM_KEY,
          personKey: person.importKey,
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
      }
    }
  }

  return {
    people,
    households,
    campuses: [],
    services: [],
    serviceTimes: [],
    groupServiceTimes: [],
    groups,
    groupMembers,
    visits: [],
    sessions: [],
    visitSessions: [],
    batches: [],
    donations: [],
    funds: [],
    fundDonations: [],
    forms,
    questions,
    formSubmissions,
    answers
  } as ImportDataInterface;
};

export default readCustomCsv;
