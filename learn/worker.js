// Shieldio Learn runs as a separate Worker while reusing this repository's assets.
// Public /maturita URLs are mapped to the isolated /learn static tree.
const STATIC_PREFIX = "/learn";
const SHARED_PATHS = ["/assets/", "/favicon.ico"];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "permissions-policy": "camera=(), microphone=(), geolocation=()",
    },
  });
}

function cookieHeader(headers, jar) {
  const values = typeof headers.getSetCookie === "function"
    ? headers.getSetCookie()
    : [headers.get("set-cookie")].filter(Boolean);
  for (const value of values) {
    const pair = value.split(";", 1)[0];
    const separator = pair.indexOf("=");
    if (separator > 0) jar.set(pair.slice(0, separator), pair.slice(separator + 1));
  }
}

function cookies(jar) {
  return [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
}

function jsonArgument(source, marker) {
  const markerAt = source.indexOf(marker);
  if (markerAt < 0) return null;
  const start = source.indexOf("{", markerAt + marker.length);
  if (start < 0) return null;
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') quoted = false;
      continue;
    }
    if (character === '"') quoted = true;
    else if (character === "{") depth += 1;
    else if (character === "}" && --depth === 0) return JSON.parse(source.slice(start, index + 1));
  }
  return null;
}

function balanced(source, openAt) {
  const pairs = { "(": ")", "[": "]", "{": "}" };
  const stack = [];
  let quoted = false, escaped = false;
  for (let index = openAt; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) { if (escaped) escaped = false; else if (character === "\\") escaped = true; else if (character === '"') quoted = false; continue; }
    if (character === '"') quoted = true;
    else if (pairs[character]) stack.push(pairs[character]);
    else if (character === stack.at(-1)) { stack.pop(); if (!stack.length) return source.slice(openAt, index + 1); }
  }
  return null;
}

function callArguments(source, marker, from = 0) {
  const markerAt = source.indexOf(marker, from);
  const openAt = markerAt < 0 ? -1 : source.indexOf("(", markerAt + marker.length);
  const value = openAt < 0 ? null : balanced(source, openAt);
  if (!value) return null;
  const args = []; let start = 1, depth = 0, quoted = false, escaped = false;
  for (let index = 1; index < value.length - 1; index += 1) {
    const character = value[index];
    if (quoted) { if (escaped) escaped = false; else if (character === "\\") escaped = true; else if (character === '"') quoted = false; continue; }
    if (character === '"') quoted = true;
    else if ("([{".includes(character)) depth += 1;
    else if (")]}".includes(character)) depth -= 1;
    else if (character === "," && depth === 0) { args.push(value.slice(start, index).trim()); start = index + 1; }
  }
  args.push(value.slice(start, -1).trim());
  return args;
}

function decodeAscJson(payload) {
  const values = payload[0], library = payload[1], keyCache = []; let pointer = 0;
  const read = () => {
    const token = values[pointer++];
    if (token === -1) return Array.from({ length: values[pointer++] }, read);
    if (token === -2) { const size = values[pointer++], keys = Array.from({ length: size }, read), object = {}; keyCache.push(keys); keys.forEach(key => { object[key] = read(); }); return object; }
    if (token === -3) return [];
    if (token === -4) return [read()];
    if (token === -5) return [read(), read()];
    if (token < 0) { const object = {}; (keyCache[-token - 10] || []).forEach(key => { object[key] = read(); }); return object; }
    const value = library[token]; return Array.isArray(value) ? value.slice() : value;
  };
  return read();
}

function serializedValue(source) {
  const text = String(source || "").trim();
  if (!text.startsWith("ASC.json_dc")) return JSON.parse(text);
  const payload = balanced(text, text.indexOf("("));
  return decodeAscJson(JSON.parse(payload.slice(1, -1)));
}

function attendancePayload(html) {
  const markerAt = html.indexOf("/dashboard/dochadzka.js#initZiak");
  const args = markerAt < 0 ? null : callArguments(html, "return f", markerAt);
  return args?.[2] ? serializedValue(args[2]) : null;
}

function publicGrades(gradeData, userData) {
  const details = gradeData?.vsetkyUdalosti?.edupage || {};
  const subjects = userData?.dbi?.subjects || {};
  return (Array.isArray(gradeData?.vsetkyZnamky) ? gradeData.vsetkyZnamky : [])
    .slice(0, 200)
    .flatMap(grade => {
      const detail = details[String(grade?.udalostid)] || {};
      const subjectId = String(detail.PredmetID || "");
      if (!subjectId || subjectId === "vsetky") return [];
      const type = String(detail.p_typ_udalosti || "");
      const rawValue = String(grade.data || "").split(" (", 1)[0].trim();
      if (!rawValue) return [];
      const numeric = value => Number.isFinite(Number(value)) ? Number(value) : null;
      return [{
        subject: String(subjects[subjectId]?.short || subjects[subjectId]?.name || `Předmět ${subjectId}`),
        value: rawValue,
        date: String(grade.datum || "").slice(0, 10),
        kind: type === "2" ? "points" : type === "3" ? "percent" : "grade",
        weight: type === "1" || type === "3" ? (numeric(detail.p_vaha) === null ? null : numeric(detail.p_vaha) / 20) : null,
        maxPoints: type === "2" ? numeric(detail.p_vaha) : type === "3" ? numeric(detail.p_vaha_body) : null,
      }];
    });
}

function gradeAverages(grades) {
  const groups = new Map([["__all__", []]]);
  for (const grade of grades) {
    const value = Number(grade.value);
    if (grade.kind !== "grade" || !Number.isInteger(value) || value < 1 || value > 5) continue;
    const item = { value, weight: Number.isFinite(grade.weight) && grade.weight > 0 ? grade.weight : 1 };
    groups.get("__all__").push(item);
    if (!groups.has(grade.subject)) groups.set(grade.subject, []);
    groups.get(grade.subject).push(item);
  }
  const average = items => {
    const weight = items.reduce((sum, item) => sum + item.weight, 0);
    return weight ? Math.round((items.reduce((sum, item) => sum + item.value * item.weight, 0) / weight) * 100) / 100 : null;
  };
  return {
    overall: average(groups.get("__all__")),
    counted: groups.get("__all__").length,
    subjects: [...groups].filter(([name]) => name !== "__all__").map(([subject, items]) => ({ subject, average: average(items), counted: items.length })),
  };
}

function attendanceSummary(html) {
  const halfStats = jsonArgument(html, '"halfStats":');
  const halves = jsonArgument(html, '"halves":') || { "1": "1. pololetí", "2": "2. pololetí" };
  const studentIds = Object.keys(halfStats || {});
  if (studentIds.length !== 1) return null;
  const periods = Object.entries(halfStats[studentIds[0]] || {}).flatMap(([key, values]) => {
    const present = Number(values?.present) || 0;
    const absent = Number(values?.absent) || 0;
    const distant = Number(values?.distant) || 0;
    const total = present + absent;
    if (total <= 0 && distant <= 0) return [];
    return [{ key, label: String(halves[key] || `${key}. pololetí`), absent, total, distant, percent: total > 0 ? Math.round((absent / total) * 10000) / 100 : null }];
  });
  if (!periods.length) return null;
  const preferred = new Date().getUTCMonth() >= 1 && new Date().getUTCMonth() <= 7 ? "2" : "1";
  const current = periods.find(period => period.key === preferred) || periods.at(-1);
  return { current, periods };
}

function localToday() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Prague", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function lessonSubject(item) { return String(item?.subjectid || item?.flags?.dp0?.subjectid || ""); }
function lessonPeriods(item) {
  const value = String(item?.uniperiod || item?.period || item?.periodorbreak || "");
  const range = value.match(/^(\d+)-(\d+)$/);
  if (range) return Array.from({ length: Number(range[2]) - Number(range[1]) + 1 }, (_, index) => Number(range[1]) + index);
  return /^\d+$/.test(value) ? [Number(value)] : [];
}

function timetableFromClassbook(classbook, userData) {
  const range = weekBounds();
  const subjects = { ...(userData?.dbi?.subjects || {}), ...(classbook?.dbi?.subjects || {}) };
  const classrooms = { ...(userData?.dbi?.classrooms || {}), ...(classbook?.dbi?.classrooms || {}) };
  const lessons = [];
  for (const [date, day] of Object.entries(classbook?.dates || {})) {
    if (date < range.monday || date > range.friday) continue;
    for (const item of Array.isArray(day?.plan) ? day.plan : []) {
      const subjectId = lessonSubject(item);
      if (!subjectId || item?.header || item?.type === "absent" || item?.removed) continue;
      const roomIds = Array.isArray(item.classroomids) ? item.classroomids : [];
      lessons.push({
        date,
        period: String(item.uniperiod || item.period || item.periodorbreak || ""),
        start: String(item.starttime || "").replace("24:00", "23:59"),
        end: String(item.endtime || "").replace("24:00", "23:59"),
        subject: String(subjects[subjectId]?.short || subjects[subjectId]?.name || "Předmět"),
        room: roomIds.map(id => classrooms[String(id)]?.short || classrooms[String(id)]?.name).filter(Boolean).join(", "),
        cancelled: Boolean(item?.cancelled || item?.flags?.dp0?.cancelled || item?.type === ""),
      });
    }
  }
  lessons.sort((a, b) => `${a.date} ${a.start} ${a.period}`.localeCompare(`${b.date} ${b.start} ${b.period}`));
  return { ...range, lessons };
}

async function subjectAttendanceSummary(base, jar, userData, attendanceHtml) {
  const payload = attendancePayload(attendanceHtml);
  const absenceTypes = jsonArgument(attendanceHtml, '"ciselnik0":') || jsonArgument(attendanceHtml, '"studentabsent_types":') || {};
  const countsAsAbsence = record => {
    if (String(record?.presence || "") !== "A") return false;
    const type = absenceTypes[String(record?.studentabsent_typeid || "")];
    if (!type) return true;
    const category = String(type.et || "").toLowerCase();
    if (category) return category === "o" || category === "n";
    const label = `${type.short || ""} ${type.name || ""}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return !/(^|\s)r($|\s)|reprezent/.test(label);
  };
  const today = localToday();
  const month = Number(today.slice(5, 7));
  const year = Number(today.slice(0, 4));
  const start = month >= 2 && month <= 8 ? `${year}-02-01` : `${month >= 9 ? year : year - 1}-09-01`;
  const page = await edupageFetch(`${base}/dashboard/eb.php?mode=ttday&date=${today}`, { method: "GET" }, jar);
  if (!page.ok) return null;
  const html = await page.text();
  const gpid = html.match(/gpid=(\d+)&/)?.[1], gsh = html.match(/gsh=([^"&]+)/)?.[1], user = String(userData?.userid || "");
  if (!gpid || !gsh || !user) return null;
  const form = new URLSearchParams({ gpid: String(Number(gpid) + 1), gsh, action: "loadData", user, changes: "{}", date: start, datefrom: start, dateto: today, _LJSL: "4096" });
  const response = await edupageFetch(`${base}/gcall`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: form.toString() }, jar);
  if (!response.ok) return null;
  const classbook = jsonArgument(await response.text(), `${user}",`);
  if (!classbook?.dates) return null;
  const timetable = timetableFromClassbook(classbook, userData);
  const order = Array.isArray(payload?.order) ? payload.order : [];
  const studentKeys = Object.keys(payload?.students || {});
  if (order.length > 1 || studentKeys.length > 1) return { attendance: null, timetable };
  const studentId = String(order[0] || studentKeys[0] || "");
  if (!studentId) return { attendance: null, timetable };
  const subjects = { ...(userData?.dbi?.subjects || {}), ...(classbook?.dbi?.subjects || {}) };
  const stats = new Map();
  const entry = id => { if (!stats.has(id)) stats.set(id, { subject: String(subjects[id]?.short || subjects[id]?.name || `Předmět ${id}`), absent: 0, total: 0 }); return stats.get(id); };
  for (const day of Object.values(classbook.dates)) for (const item of Array.isArray(day?.plan) ? day.plan : []) {
    const id = lessonSubject(item);
    if (item?.type !== "lesson" || !id || item?.removed || item?.cancelled || item?.flags?.dp0?.cancelled) continue;
    entry(id).total += Math.max(1, Number(item.durationperiods) || lessonPeriods(item).length || 1);
  }
  for (const [date, records] of Object.entries(payload.students[studentId] || {})) {
    if (date < start || date > today) continue;
    const plan = Array.isArray(classbook.dates[date]?.plan) ? classbook.dates[date].plan : [];
    for (const [periodKey, record] of Object.entries(records || {})) {
      if (periodKey === "ad" || !countsAsAbsence(record)) continue;
      const direct = String(record?.subjectid || "");
      const period = Number(periodKey);
      const id = direct || lessonSubject(plan.find(item => lessonPeriods(item).includes(period)));
      if (id) entry(id).absent += 1;
    }
    const allDay = records?.ad;
    if (countsAsAbsence(allDay) && !Object.keys(records).some(key => key !== "ad" && countsAsAbsence(records[key]))) {
      for (const item of plan) { const id = lessonSubject(item); if (item?.type === "lesson" && id) entry(id).absent += Math.max(1, Number(item.durationperiods) || lessonPeriods(item).length || 1); }
    }
  }
  const attendance = [...stats.values()].filter(item => item.total > 0).map(item => ({ ...item, percent: Math.round((item.absent / item.total) * 10000) / 100 })).sort((a, b) => a.subject.localeCompare(b.subject, "cs"));
  return { attendance, timetable };
}

function weekBounds() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Prague", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()).map(part => [part.type, part.value]));
  const today = new Date(`${parts.year}-${parts.month}-${parts.day}T12:00:00Z`);
  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() - ((today.getUTCDay() + 6) % 7));
  const friday = new Date(monday);
  friday.setUTCDate(monday.getUTCDate() + 4);
  const iso = date => date.toISOString().slice(0, 10);
  return { monday: iso(monday), friday: iso(friday) };
}

async function timetableSummary(base, jar, userData, gsecHash) {
  const range = weekBounds();
  const user = String(userData?.userid || "");
  const studentId = user.match(/^Student(?:Only)?(\d+)$/)?.[1];
  const year = userData?.dp?.year;
  if (!studentId || !year || !gsecHash) return null;
  const monday = new Date(`${range.monday}T12:00:00Z`);
  const dates = Array.from({ length: 5 }, (_, index) => {
    const date = new Date(monday);
    date.setUTCDate(monday.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
  const dayResults = await Promise.all(dates.map(async date => {
    const body = { __args: [null, { year, datefrom: date, dateto: date, table: "students", id: studentId, showColors: true, showIgroupsInClasses: true, showOrig: true, log_module: "CurrentTTView" }], __gsh: gsecHash };
    const response = await edupageFetch(`${base}/timetable/server/currenttt.js?__func=curentttGetData`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }, jar);
    if (!response.ok) return { date, items: [] };
    const payload = await response.json();
    return { date, items: Array.isArray(payload?.r?.ttitems) ? payload.r.ttitems : [] };
  }));
  const subjects = userData?.dbi?.subjects || {};
  const classrooms = userData?.dbi?.classrooms || {};
  const lessons = [];
  for (const day of dayResults) {
    for (const item of day.items) {
      if (item?.removed || !item?.subjectid || item?.type === "absent") continue;
      const roomIds = Array.isArray(item.classroomids) ? item.classroomids : [];
      lessons.push({
        date: day.date,
        period: String(item.uniperiod || item.period || ""),
        start: String(item.starttime || ""),
        end: String(item.endtime || ""),
        subject: String(subjects[String(item.subjectid)]?.short || subjects[String(item.subjectid)]?.name || "Předmět"),
        room: roomIds.map(id => classrooms[String(id)]?.short || classrooms[String(id)]?.name).filter(Boolean).join(", "),
        cancelled: Boolean(item?.flags?.dp0?.cancelled || item?.cancelled),
      });
    }
  }
  lessons.sort((a, b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`));
  return { ...range, lessons };
}

async function edupageFetch(url, options, jar) {
  const headers = new Headers(options?.headers || {});
  const currentCookies = cookies(jar);
  if (currentCookies) headers.set("cookie", currentCookies);
  const response = await fetch(url, { ...options, headers, redirect: "manual" });
  cookieHeader(response.headers, jar);
  return response;
}

async function followEdupage(response, jar, limit = 5) {
  let current = response;
  for (let index = 0; index < limit && current.status >= 300 && current.status < 400; index += 1) {
    const location = current.headers.get("location");
    if (!location) break;
    current = await edupageFetch(new URL(location, current.url), { method: "GET" }, jar);
  }
  return current;
}

async function probeEdupage(request, env) {
  if (env.EDUPAGE_ENABLED !== "true") return json({ ok: false, code: "disabled", message: "Test připojení není zapnutý." }, 503);
  const origin = request.headers.get("origin");
  if (origin !== `https://${env.PUBLIC_HOST}`) return json({ ok: false, code: "origin", message: "Požadavek přišel z nepovolené stránky." }, 403);
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, code: "input", message: "Neplatná data formuláře." }, 400); }
  const school = String(body.school || "").trim().toLowerCase().replace(/\.edupage\.org\/?$/, "");
  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  if (body.privacyConsent !== true) return json({ ok: false, code: "consent", message: "Pro jednorázové zpracování údajů je potřeba potvrdit souhlas." }, 400);
  if (!/^[a-z0-9-]{1,63}$/.test(school) || !username || username.length > 160 || !password || password.length > 300) {
    return json({ ok: false, code: "input", message: "Zkontrolujte adresu školy, uživatelské jméno a heslo." }, 400);
  }
  if (!env.EDUPAGE_RATE_LIMITER) return json({ ok: false, code: "rate-config", message: "Ochrana přihlášení není dostupná." }, 503);
  const rateMaterial = `${request.headers.get("cf-connecting-ip") || "unknown"}|${school}|${username.toLowerCase()}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(rateMaterial));
  const rateKey = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
  if (!(await env.EDUPAGE_RATE_LIMITER.limit({ key: rateKey })).success) return json({ ok: false, code: "rate", message: "Příliš mnoho pokusů. Zkuste to znovu za minutu." }, 429);

  const base = `https://${school}.edupage.org`;
  const jar = new Map();
  try {
    const loginPage = await edupageFetch(`${base}/login/?cmd=MainLogin`, { method: "GET" }, jar);
    if (!loginPage.ok) return json({ ok: false, code: "school", message: "Přihlašovací stránka školy neodpověděla." }, 502);
    const html = await loginPage.text();
    const csrf = html.match(/"csrftoken"\s*:\s*"([^"]+)"/)?.[1];
    if (!csrf) return json({ ok: false, code: "protocol", message: "EduPage změnil přihlašovací stránku. Připojení je potřeba aktualizovat." }, 502);

    const form = new URLSearchParams({ csrfauth: csrf, username, password });
    let result = await edupageFetch(`${base}/login/edubarLogin.php`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    }, jar);
    result = await followEdupage(result, jar);
    const finalUrl = result.url || "";
    const resultHtml = await result.text();
    if (finalUrl.includes("twofactor")) return json({ ok: false, code: "twofactor", message: "Účet vyžaduje druhý faktor. První krok přihlášení funguje; podporu 2FA doplníme zvlášť." }, 409);
    if (finalUrl.includes("cap=1") || finalUrl.includes("lerr=b43b43")) return json({ ok: false, code: "captcha", message: "EduPage vyžádal CAPTCHA. Automatické připojení pro tento účet nyní nelze dokončit." }, 409);
    if (finalUrl.includes("bad=1")) return json({ ok: false, code: "credentials", message: "EduPage přihlášení odmítl. Zkontrolujte údaje." }, 401);
    if (!resultHtml.includes("userhome(") || !jar.has("PHPSESSID")) return json({ ok: false, code: "protocol", message: "Přihlášení nebylo potvrzeno. EduPage mohl změnit svůj postup." }, 502);
    const userData = jsonArgument(resultHtml, "userhome(");
    const gradesPage = await edupageFetch(`${base}/znamky/`, { method: "GET" }, jar);
    if (!gradesPage.ok) return json({ ok: false, code: "grades", message: "Přihlášení funguje, ale stránku se známkami se nepodařilo načíst." }, 502);
    const gradeData = jsonArgument(await gradesPage.text(), ".znamkyStudentViewer(");
    if (!gradeData) return json({ ok: false, code: "grades-format", message: "Přihlášení funguje, ale formát známek tento účet neposkytl v očekávané podobě." }, 502);
    const grades = publicGrades(gradeData, userData);
    const attendancePage = await edupageFetch(`${base}/dashboard/eb.php?mode=attendance`, { method: "GET" }, jar);
    const attendanceHtml = attendancePage.ok ? await attendancePage.text() : "";
    const [timetableResult, attendanceResult] = await Promise.allSettled([
      timetableSummary(base, jar, userData, resultHtml.match(/ASC\.gsechash="([^"]+)"/)?.[1]),
      subjectAttendanceSummary(base, jar, userData, attendanceHtml),
    ]);
    const attendanceDetail = attendanceResult.status === "fulfilled" ? attendanceResult.value : null;
    const currentTimetable = timetableResult.status === "fulfilled" ? timetableResult.value : null;
    const timetable = currentTimetable?.lessons?.length ? currentTimetable : attendanceDetail?.timetable || currentTimetable;
    const subjectAttendance = attendanceDetail?.attendance || null;
    const attendance = attendanceHtml ? attendanceSummary(attendanceHtml) : null;
    return json({ ok: true, message: `Načteno známek: ${grades.length}.`, grades, averages: gradeAverages(grades), attendance, subjectAttendance, timetable });
  } catch {
    return json({ ok: false, code: "network", message: "Spojení s EduPage se nepodařilo dokončit. Zkuste to znovu později." }, 502);
  }
}

function seoTransform(response, page) {
  if (!page) return response;
  return new HTMLRewriter()
    .on("title", { element(element) { element.setInnerContent(`${page.title} | Shieldio Learn`); } })
    .on('meta[name="robots"]', { element(element) { element.remove(); } })
    .on("head", { element(element) {
      element.append(`<meta name="description" content="${page.description}"><link rel="canonical" href="${page.url}"><meta property="og:type" content="article"><meta property="og:site_name" content="Shieldio Learn"><meta property="og:title" content="${page.title}"><meta property="og:description" content="${page.description}"><meta property="og:url" content="${page.url}"><meta property="og:image" content="https://shieldio.cz/assets/images/og-image.png"><meta name="twitter:card" content="summary_large_image">`, { html: true });
    } })
    .transform(response);
}

function assetRequest(request, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  return new Request(url, request);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/edupage/probe" && request.method === "POST") {
      return probeEdupage(request, env);
    }

    if (url.pathname === "/sitemap.xml") {
      const dataResponse = await env.ASSETS.fetch(assetRequest(request, "/assets/data/learn-questions.json"));
      const data = await dataResponse.json();
      const fixedPaths = ["/", "/maturita/", "/maturita/elektronika/", "/maturita/automatizace/"];
      const topicPaths = data.questions.map(topic => `/maturita/otazka/${topic.slug}/`);
      const urls = [...fixedPaths, ...topicPaths].map(path => `  <url><loc>https://learn.shieldio.cz${path}</loc><changefreq>${path.includes("/otazka/") ? "weekly" : "monthly"}</changefreq></url>`).join("\n");
      return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
        headers: { "content-type": "application/xml; charset=UTF-8", "cache-control": "public, max-age=3600" }
      });
    }

    if (SHARED_PATHS.some(prefix => url.pathname.startsWith(prefix))) {
      return env.ASSETS.fetch(request);
    }

    let publicPath = url.pathname.replace(/\/index\.html$/, "/");
    if (!publicPath.endsWith("/") && !publicPath.split("/").pop().includes(".")) {
      return Response.redirect(`${url.origin}${publicPath}/${url.search}`, 308);
    }

    let assetPath;
    let seoPage = null;
    const topicMatch = publicPath.match(/^\/maturita\/otazka\/([^/]+)\/$/);
    if (topicMatch) {
      assetPath = `${STATIC_PREFIX}/maturita/otazka/`;
      const dataResponse = await env.ASSETS.fetch(assetRequest(request, "/assets/data/learn-questions.json"));
      if (dataResponse.ok) {
        const data = await dataResponse.json();
        const topic = data.questions.find(item => item.slug === topicMatch[1]);
        if (topic) seoPage = {
          title: topic.title,
          description: `Maturitní okruh ${topic.number}: ${topic.title}. Výklad, názorné prvky, vzorce, příklady a ověření znalostí.`,
          url: `https://learn.shieldio.cz${publicPath}`
        };
      }
    } else if (publicPath.endsWith("/")) {
      assetPath = `${STATIC_PREFIX}${publicPath}`;
    } else {
      assetPath = `${STATIC_PREFIX}${publicPath}`;
    }

    const response = await env.ASSETS.fetch(assetRequest(request, assetPath));
    if (response.status !== 404) return seoTransform(response, seoPage);
    const notFound = await env.ASSETS.fetch(assetRequest(request, `${STATIC_PREFIX}/404.html`));
    return new Response(notFound.body, { status: 404, headers: notFound.headers });
  },
};
