import type { APIRequestContext } from "@playwright/test";

const API = "http://localhost:8084";
const GRACE = "CHU00000001";

export async function graceJwt(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${API}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } });
  const body = await res.json();
  const uc = (body.userChurches || []).find((c: any) => c.church?.id === GRACE) || body.userChurches?.[0];
  return uc.jwt;
}

async function count(request: APIRequestContext, jwt: string, base: string, path: string): Promise<number> {
  const res = await request.get(`${API}/${base}/${path}`, { headers: { Authorization: `Bearer ${jwt}` } });
  const data = await res.json();
  return Array.isArray(data) ? data.length : 0;
}

// Questions are only returned per-form, so sum across every form.
async function questionCount(request: APIRequestContext, jwt: string): Promise<number> {
  const forms = await request.get(`${API}/membership/forms`, { headers: { Authorization: `Bearer ${jwt}` } }).then(r => r.json());
  let total = 0;
  for (const f of forms) {
    const qs = await request.get(`${API}/membership/questions?formId=${f.id}`, { headers: { Authorization: `Bearer ${jwt}` } }).then(r => r.json());
    total += Array.isArray(qs) ? qs.length : 0;
  }
  return total;
}

export interface Counts {
  people: number;
  groupMembers: number;
  donations: number;
  funds: number;
  forms: number;
  questions: number;
  formSubmissions: number;
  answers: number;
  visitSessions: number;
  visits: number;
  sessions: number;
  // visitSessions whose visit AND session both still exist — i.e. the attendance
  // rows that can actually be exported (orphans referencing deleted rows can't).
  exportableAttendance: number;
}

async function list(request: APIRequestContext, jwt: string, base: string, path: string): Promise<any[]> {
  const res = await request.get(`${API}/${base}/${path}`, { headers: { Authorization: `Bearer ${jwt}` } });
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function getCounts(request: APIRequestContext): Promise<Counts> {
  const jwt = await graceJwt(request);
  const [
    people,
    groupMembers,
    donations,
    funds,
    forms,
    formSubmissions,
    answers,
    visitSessionList,
    visitList,
    sessionList,
    questions
  ] = await Promise.all([
    count(request, jwt, "membership", "people"),
    count(request, jwt, "membership", "groupmembers"),
    count(request, jwt, "giving", "donations"),
    count(request, jwt, "giving", "funds"),
    count(request, jwt, "membership", "forms"),
    count(request, jwt, "membership", "formsubmissions"),
    count(request, jwt, "membership", "answers"),
    list(request, jwt, "attendance", "visitsessions"),
    list(request, jwt, "attendance", "visits"),
    list(request, jwt, "attendance", "sessions"),
    questionCount(request, jwt)
  ]);
  const visitIds = new Set(visitList.map((v) => v.id));
  const sessionIds = new Set(sessionList.map((s) => s.id));
  const exportableAttendance = visitSessionList.filter((vs) => visitIds.has(vs.visitId) && sessionIds.has(vs.sessionId)).length;
  return {
    people,
    groupMembers,
    donations,
    funds,
    forms,
    questions,
    formSubmissions,
    answers,
    visitSessions: visitSessionList.length,
    visits: visitList.length,
    sessions: sessionList.length,
    exportableAttendance
  };
}
