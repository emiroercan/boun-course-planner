#!/usr/bin/env node
// Downloads the course schedule from the public BOUN registration pages and
// writes it to public/data/<semester>.json in the format the app expects.
//
// Usage:
//   node scripts/scrape.mjs              # refresh the newest semesters listed by the university
//   node scripts/scrape.mjs 2026/2027-1  # refresh specific semesters
//
// Data source: the per-department pages at /scripts/sch.asp. The newer
// /BUIS/General/schedule.aspx page needs a reCAPTCHA token for every search,
// so it is not used.

import { readFile, writeFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const BASE = "https://registration.bogazici.edu.tr";
const DATA_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "data"
);
// How many of the newest semesters to refresh when none are given.
const DEFAULT_COUNT = Number(process.env.SEMESTER_COUNT || 2);
const DELAY_MS = 300; // pause between requests to be gentle with the server

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, tries = 4) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "boun-course-planner data updater" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Pages are served as windows-1254 (Turkish)
      return new TextDecoder("windows-1254").decode(await res.arrayBuffer());
    } catch (err) {
      if (i >= tries) throw new Error(`${url}: ${err.message}`);
      await sleep(2000 * i);
    }
  }
}

const decodeEntities = (s) =>
  s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));

const cellText = (html) =>
  decodeEntities(html.replace(/<[^>]+>/g, ""))
    .replace(/ /g, " ")
    .trim();

/** Semesters offered by the registration site, newest first. */
async function listSemesters() {
  const html = await get(`${BASE}/BUIS/General/schedule.aspx`);
  const select = html.match(/<select[^>]*ddlSemester[^>]*>([\s\S]*?)<\/select>/);
  if (!select) throw new Error("Semester list not found on schedule.aspx");
  return [...select[1].matchAll(/value="(\d{4}\/\d{4}-\d)"/g)].map((m) => m[1]);
}

/** All department links: [{ kisaadi, bolum }] */
async function listDepartments() {
  const html = await get(`${BASE}/scripts/schdepsel.asp`);
  const seen = new Set();
  const deps = [];
  for (const m of html.matchAll(/sch\.asp\?donem=[^&"]*&kisaadi=([^&"]+)&bolum=([^"&]+)/g)) {
    const key = m[1] + "|" + m[2];
    if (seen.has(key)) continue;
    seen.add(key);
    deps.push({ kisaadi: m[1], bolum: m[2] });
  }
  if (deps.length === 0) throw new Error("Department list not found on schdepsel.asp");
  return deps;
}

const DAY_RE = /Th|St|Su|M|T|W|F/g;

/**
 * Splits an hours string like "3434" or "91011" into slot numbers (1-14),
 * using the number of days to resolve two-digit slots. Prefers a split where
 * slots on the same day go up, which is how the registration site lists them.
 */
function parseHours(str, days) {
  const n = days.length;
  const results = [];
  const walk = (i, acc) => {
    if (results.length > 20) return;
    if (acc.length === n) {
      if (i === str.length) results.push(acc);
      return;
    }
    for (const len of [1, 2]) {
      const part = str.slice(i, i + len);
      if (part.length !== len || part[0] === "0") continue;
      const v = Number(part);
      if (v >= 1 && v <= 14) walk(i + len, [...acc, v]);
    }
  };
  walk(0, []);
  if (results.length === 0) return null;
  const score = (hrs) =>
    hrs.reduce(
      (s, h, i) => s + (i > 0 && days[i] === days[i - 1] && h <= hrs[i - 1] ? 1 : 0),
      0
    );
  results.sort((a, b) => score(a) - score(b));
  return results[0];
}

function parseDepartmentPage(html, courses) {
  // Map columns by header text, because the layout changes between semesters
  const header = html.match(/<tr class="schtitle">([\s\S]*?)<\/tr>/);
  if (!header) return 0;
  const titles = [...header[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) =>
    cellText(m[1])
  );
  const col = (re) => titles.findIndex((t) => re.test(t));
  const C = {
    code: col(/^Code/),
    name: col(/^Name/),
    credits: col(/^Cr/),
    ects: col(/^Ects/),
    instructor: col(/^Instr/),
    days: col(/^Days/),
    hours: col(/^Hours/),
    rooms: col(/^Rooms/),
    dept: col(/^Required/),
  };

  let parent = null; // last regular course row, for P.S./LAB rows below it
  let added = 0;
  const rows = html.matchAll(/<tr class="(schtd2?(?: labps)?)">([\s\S]*?)<\/tr>/g);
  for (const [, cls, rowHtml] of rows) {
    const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
    const text = (i) => (i >= 0 && i < cells.length ? cellText(cells[i]) : "");

    const course = {};
    let key;
    const code = text(C.code);
    if (code && !cls.includes("labps")) {
      course.code = code;
      course.name = text(C.name);
      key = code.replace(/\s+/g, "");
      parent = { key, code, name: course.name, extra: {} };
    } else {
      if (!parent) continue;
      const type = text(C.name) || "P.S."; // "P.S." or "LAB"
      parent.extra[type] = (parent.extra[type] || 0) + 1;
      course.code = parent.code;
      course.name = `${parent.name} ${type}`;
      key = `${parent.key} ${type} ${parent.extra[type]}`;
    }

    const credits = text(C.credits);
    if (credits !== "" && !isNaN(credits)) course.credits = Number(credits);
    const ects = text(C.ects);
    if (ects !== "" && !isNaN(ects)) course.ects = Number(ects);

    const days = text(C.days).match(DAY_RE);
    const hours = days && parseHours(text(C.hours).replace(/\s/g, ""), days);
    if (days && hours) {
      course.days = days;
      course.hours = hours;
    }

    const dept = text(C.dept);
    if (dept) course.dept = dept.split(/\s*,\s*/).filter(Boolean);

    course.instructor = text(C.instructor);

    const rooms = text(C.rooms)
      .split("|")
      .map((r) => r.trim())
      .filter(Boolean);
    if (rooms.length) course.rooms = rooms; // one entry per time slot

    courses[key] = course;
    added++;
  }
  return added;
}

async function scrapeSemester(semester, departments) {
  const courses = {};
  for (const { kisaadi, bolum } of departments) {
    const url = `${BASE}/scripts/sch.asp?donem=${semester}&kisaadi=${kisaadi}&bolum=${bolum}`;
    const html = await get(url);
    parseDepartmentPage(html, courses);
    await sleep(DELAY_MS);
  }
  // Sort keys so diffs between runs stay small
  return Object.fromEntries(
    Object.entries(courses).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  );
}

async function updateSemesterList() {
  const files = (await readdir(DATA_DIR))
    .map((f) => f.match(/^(\d{4})-(\d{4})-(\d)\.json$/))
    .filter(Boolean)
    .map((m) => `${m[1]}/${m[2]}-${m[3]}`)
    .sort()
    .reverse();
  await writeFile(
    path.join(DATA_DIR, "semesters.json"),
    JSON.stringify(files, null, 4) + "\n"
  );
  return files;
}

async function main() {
  let semesters = process.argv.slice(2);
  if (semesters.length === 0) {
    semesters = (await listSemesters()).slice(0, DEFAULT_COUNT);
  }
  const departments = await listDepartments();
  console.log(`${departments.length} departments, semesters: ${semesters.join(", ")}`);

  for (const semester of semesters) {
    const data = await scrapeSemester(semester, departments);
    const count = Object.keys(data).length;
    const file = path.join(DATA_DIR, `${semester.replace("/", "-")}.json`);
    if (count === 0) {
      console.log(`${semester}: no courses published yet, skipping`);
      continue;
    }
    // Guard against a broken page wiping out good data
    try {
      const old = JSON.parse(await readFile(file, "utf8"));
      const oldCount = Object.keys(old).length;
      if (count < oldCount * 0.5) {
        throw new Error(
          `${semester}: only ${count} courses vs ${oldCount} before; not overwriting`
        );
      }
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }
    await writeFile(file, JSON.stringify(data));
    console.log(`${semester}: ${count} entries -> ${path.relative(process.cwd(), file)}`);
  }

  const list = await updateSemesterList();
  console.log(`semesters.json: ${list.length} semesters`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
