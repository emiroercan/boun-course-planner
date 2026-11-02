#!/usr/bin/env node
// Fills public/data/semester-dates.json (used by the calendar export) from the
// official academic calendar at akademiktakvim.bogazici.edu.tr.
//
// Usage:
//   node scripts/semester-dates.mjs              # semesters from the last ~2 years that have course data
//   node scripts/semester-dates.mjs 2026/2027-1  # specific semesters
//
// Exits with an error if the newest fall/spring semester with course data
// still has no dates, so the scheduled workflow reports it.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const DATA_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "data"
);
const DATES_FILE = path.join(DATA_DIR, "semester-dates.json");
const CALENDAR = "https://akademiktakvim.bogazici.edu.tr/en/json?type=4";

async function events(from, to) {
  const url = `${CALENDAR}&date=${from}&last_date=${to}`;
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()).map((e) => {
        const start = e.start_date.slice(0, 10);
        let end = e.end_date.slice(0, 10);
        if (end < start) end = start; // the calendar has a few typos
        return { name: e.adi.trim(), start, end };
      });
    } catch (err) {
      if (i >= 4) throw new Error(`${url}: ${err.message}`);
      await new Promise((r) => setTimeout(r, 2000 * i));
    }
  }
}

function eachDay(start, end) {
  const days = [];
  for (
    let d = new Date(start + "T00:00:00Z");
    d <= new Date(end + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

/** "2026/2027-1" -> { start, end, holidays } or null if the calendar has no dates */
async function datesFor(semester) {
  const [, y1, y2, term] = semester.match(/^(\d{4})\/(\d{4})-(\d)$/) ?? [];
  if (!y1) throw new Error(`Bad semester name: ${semester}`);

  // Window in which classes begin / end for each term
  let from, to, beginRe, endRe;
  if (term === "1") {
    [from, to] = [`${y1}-08-01`, `${y2}-02-15`];
    beginRe = /^classes begin/i;
    endRe = /^classes end/i;
  } else if (term === "2") {
    [from, to] = [`${y1}-12-15`, `${y2}-07-15`];
    beginRe = /^classes begin/i;
    endRe = /^classes end/i;
  } else {
    // Summer term, run by the Summer Term Office; only filled in when the
    // calendar has explicit summer term class dates
    [from, to] = [`${y2}-06-01`, `${y2}-09-15`];
    beginRe = /^summer term classes begin/i;
    endRe = /^summer term classes end/i;
  }

  const list = (await events(from, to)).sort((a, b) =>
    a.start.localeCompare(b.start)
  );
  const begin = list.find(
    (e) =>
      beginRe.test(e.name) &&
      // Spring classes start in Jan-Mar; skip a stray fall-term match
      (term !== "2" || e.start >= `${y2}-01-01`)
  );
  if (!begin) return null;
  const end = list.find((e) => endRe.test(e.name) && e.start > begin.start);
  if (!end) return null;

  const holidays = [];
  const seen = new Set();
  for (const e of list) {
    if (!/holiday|bayram|break|vacation/i.test(e.name)) continue;
    if (/\bSFL\b/.test(e.name)) continue; // English prep school only
    if (e.end < begin.start || e.start > end.start) continue;
    const halfDay = /after (1 p\.?m\.?|13[:.]00)/i.test(e.name);
    const name = e.name
      .replace(/\s*\(holiday\)/i, "")
      .replace(/\s*\(?after (1 p\.?m\.?|13[:.]00)\)?/i, " (half day)")
      .trim();
    for (const date of eachDay(e.start, e.end)) {
      if (date < begin.start || date > end.start) continue;
      if (seen.has(date + name)) continue;
      seen.add(date + name);
      holidays.push(
        halfDay
          ? { date, name, timeType: "after", time: "13:00" }
          : { date, name }
      );
    }
  }
  holidays.sort((a, b) => a.date.localeCompare(b.date));
  return { start: begin.start, end: end.start, holidays };
}

async function main() {
  const all = JSON.parse(await readFile(DATES_FILE, "utf8"));
  const semesters = JSON.parse(
    await readFile(path.join(DATA_DIR, "semesters.json"), "utf8")
  ); // newest first

  let targets = process.argv.slice(2);
  if (targets.length === 0) {
    // The calendar only covers recent years; look at roughly the last 2 years
    targets = semesters.slice(0, 6);
  }

  for (const semester of targets) {
    const key = semester.replace("/", "-");
    const dates = await datesFor(semester);
    if (dates) {
      all[key] = dates;
      console.log(
        `${semester}: ${dates.start} to ${dates.end}, ${dates.holidays.length} holiday entries`
      );
    } else {
      console.log(`${semester}: no class dates in the academic calendar`);
    }
  }

  const sorted = Object.fromEntries(
    Object.entries(all).sort(([a], [b]) => a.localeCompare(b))
  );
  await writeFile(DATES_FILE, JSON.stringify(sorted, null, 4) + "\n");

  // The newest fall/spring semester must have dates for the calendar export
  const newest = semesters.find((s) => !s.endsWith("-3"));
  if (newest && !sorted[newest.replace("/", "-")]) {
    throw new Error(
      `${newest} has course data but no semester dates. ` +
        `Check https://akademiktakvim.bogazici.edu.tr/en and add them to public/data/semester-dates.json.`
    );
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
