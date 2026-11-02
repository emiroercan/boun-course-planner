let currentSemester = $state(""); // Currently selected semester

export function getCurrentSemester() {
  return currentSemester;
}

export function setCurrentSemester(value: string) {
  currentSemester = value;
}

let semesterData: Record<string, any> = $state({}); // Stores the course data for each downloaded semester

export function getSemesterData() {
  return semesterData;
}

export function setSemesterDataForSemester(semester: string, data: object) {
  semesterData[semester] = data;
}

let searchQuery = $state(""); // Search query for filtering courses by name or instructor

export function getSearchQuery() {
  return searchQuery;
}

export function setSearchQuery(value: string) {
  searchQuery = value;
}

let hoveredCourse = $state(""); // Course currently hovered by mouse

export function getHoveredCourse() {
  return hoveredCourse;
}

export function setHoveredCourse(value: string) {
  // Do not highlight the hovered course on mobile because touch is registed as mouseenter
  // and the course remains still highlighted when user no longer touches
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (!isMobile) {
    hoveredCourse = value;
  }
}

export function resetHoveredCourse() {
  hoveredCourse = "";
}

let selectedCourseNamesAll = $state(readSelectedCourseNames()); // selected course names for all semesters

export function getSelectedCourseNamesAll() {
  return selectedCourseNamesAll;
}

export function addCourse(newCour: string) {
  if (!(currentSemester in selectedCourseNamesAll)) {
    selectedCourseNamesAll[currentSemester] = [];
  }
  selectedCourseNamesAll[currentSemester].push(newCour);
  selectedCourseNamesAll[currentSemester].sort();
  persistSelectedCourseNames();
}

export function delCourse(delCour: string) {
  if (!(currentSemester in selectedCourseNamesAll)) {
    selectedCourseNamesAll[currentSemester] = [];
  }
  const indexArr = selectedCourseNamesAll[currentSemester].indexOf(delCour);
  selectedCourseNamesAll[currentSemester].splice(indexArr, 1);
  selectedCourseNamesAll[currentSemester].sort();
  persistSelectedCourseNames();
}

export function setCourseList(courseList: string[]) {
  selectedCourseNamesAll[currentSemester] = courseList;
  persistSelectedCourseNames();
}

function readSelectedCourseNames() {
  let selectedCoursesForSemesters = localStorage.getItem("semesterSelCourses2");
  if (!selectedCoursesForSemesters) {
    return {};
  }

  let parsedSelectedCoursesForSemesters;
  try {
    parsedSelectedCoursesForSemesters = JSON.parse(selectedCoursesForSemesters);
  } catch (error) {
    parsedSelectedCoursesForSemesters = {};
    // Reset storage if corrupted
    localStorage.setItem("semesterSelCourses2", "{}");
  }

  if (
    typeof parsedSelectedCoursesForSemesters !== "object" ||
    parsedSelectedCoursesForSemesters === null
  ) {
    parsedSelectedCoursesForSemesters = {};
  }
  return parsedSelectedCoursesForSemesters;
}

function persistSelectedCourseNames() {
  localStorage.setItem(
    "semesterSelCourses2",
    JSON.stringify(selectedCourseNamesAll)
  );
}

let selectedDayHourFilter: boolean[][] = $state(initSelectedDayHourFilter());

function initSelectedDayHourFilter(): boolean[][] {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const hours = Array.from({ length: 14 }, (_, i) => i + 9); // 9..22 inclusive

  // selection state: rows = days, cols = hours
  return days.map(() => new Array(hours.length).fill(true));
}

export function getSelectedDayHourFilter() {
  return selectedDayHourFilter;
}

export function setSelectedDayHourFilter(value: boolean[][]) {
  selectedDayHourFilter = value;
}

let showCoursesWithoutSchedule = $state(true); // Whether to show courses without schedule info

export function getShowCoursesWithoutSchedule() {
  return showCoursesWithoutSchedule;
}

export function setShowCoursesWithoutSchedule(value: boolean) {
  showCoursesWithoutSchedule = value;
}

const isDayHourFilterApplied = $derived.by(() => {
  return selectedDayHourFilter.some((day) => day.some((val) => !val));
});

export function getIsDayHourFilterApplied() {
  return isDayHourFilterApplied;
}

const searchedCourseNames: string[] = $derived.by(() => {
  if (!currentSemester || !semesterData[currentSemester]) {
    return [];
  }

  const data = semesterData[currentSemester];
  const allCourseEntries = Object.entries(data);

  if (allCourseEntries.length === 0) {
    return [];
  }

  // Perform search filtering
  const regexString = searchQuery
    .trim()
    .split(" ")
    .filter((str) => str.length >= 2)
    .join("|");

  let searchedCourses: [string, any][];

  if (regexString) {
    const regex = new RegExp(regexString, "i");

    // First, try searching by the course code (the object key)
    searchedCourses = allCourseEntries.filter(([courseName, _]) =>
      regex.test(courseName)
    );

    // If no results, fall back to searching the full name and instructor
    if (searchedCourses.length === 0) {
      searchedCourses = allCourseEntries.filter(
        ([_, courseInfo]: [string, any]) =>
          regex.test(courseInfo.name) || regex.test(courseInfo.instructor)
      );
    }
  } else {
    // If no search query, all courses are included
    searchedCourses = allCourseEntries;
  }

  // Apply day/hour filter on the *already filtered* search results
  const finalFilteredCourses = isDayHourFilterApplied
    ? searchedCourses.filter(([_, courseInfo]) => {
        if (!courseInfo.days || !courseInfo.hours) {
          return showCoursesWithoutSchedule;
        }

        // Use .every() to ensure ALL of the course's time slots fit the filter.
        return courseInfo.days.every((day: string, i: number) => {
          const hour = courseInfo.hours[i];
          const dayIdx = ["M", "T", "W", "Th", "F", "St"].indexOf(day);
          const hourIdx = hour - 1;

          // Ensure indices are valid before checking the filter array
          if (dayIdx === -1 || hourIdx < 0) return false;

          return selectedDayHourFilter[dayIdx][hourIdx];
        });
      })
    : searchedCourses; // If filter is off, just use the search results

  // Return only the course names (the keys)
  return finalFilteredCourses.map(([courseName, _]) => courseName);
});

export function getSearchedCourseNames() {
  return searchedCourseNames;
}

// Only the course data for currently selected semester
const curSemesterData = $derived.by(() => {
  return semesterData[currentSemester] || null;
});

export function getCurSemesterData() {
  return curSemesterData;
}

const selectedCourseNames: string[] = $derived.by(() => {
  return selectedCourseNamesAll[currentSemester] || [];
});

export function getSelectedCourseNames() {
  return selectedCourseNames;
}

const curSemCategories = $derived.by(() => {
  if (!curSemesterData) {
    return [];
  }
  const cat: Set<string> = new Set();
  for (const [courseName, courseInfo] of Object.entries(curSemesterData)) {
    // Get course category by matching the longest letter sequence
    const re = /[$A-Za-z]+/g;
    const matchArray = courseName.match(re);
    if (matchArray && matchArray.length > 0) {
      cat.add(matchArray[0]);
    }
  }
  return Array.from(cat);
});

export function getCurSemCategories() {
  return curSemCategories;
}

// Timetable view: "buis" (BUIS Planner, default), "regular" or "prep" (registration page)
export type ViewMode = "regular" | "buis" | "prep";
const VIEW_MODES: ViewMode[] = ["regular", "buis", "prep"];

function readSetting(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSetting(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage unavailable; setting lasts for this visit only
  }
}

function readViewMode(): ViewMode {
  const v = readSetting("viewMode") as ViewMode | null;
  if (v && VIEW_MODES.includes(v)) return v;
  if ((v as string) === "native") return "regular"; // renamed
  return "buis";
}

let viewMode: ViewMode = $state(readViewMode());

export function getViewMode() {
  return viewMode;
}

export function setViewMode(value: ViewMode) {
  viewMode = value;
  writeSetting("viewMode", value);
}

let showRooms = $state(readSetting("showRooms") !== "0"); // on by default

export function getShowRooms() {
  return showRooms;
}

export function setShowRooms(value: boolean) {
  showRooms = value;
  writeSetting("showRooms", value ? "1" : "0");
}

// Give the timetable more of the screen width
let wideView = $state(readSetting("wideView") === "1");

export function getWideView() {
  return wideView;
}

export function setWideView(value: boolean) {
  wideView = value;
  writeSetting("wideView", value ? "1" : "0");
}

/**
 * Last clock hour to show: 14, or later if a selected or hovered course needs it
 */
export function lastHourToShow(): number {
  const data = getCurSemesterData();
  let last = 14;
  if (!data) return last;
  const names = [...getSelectedCourseNames()];
  if (hoveredCourse) names.push(hoveredCourse);
  for (const name of names) {
    for (const h of data[name]?.hours ?? []) last = Math.max(last, h + 8);
  }
  return Math.min(last, 22);
}

/** Classroom of a course's i-th time slot ("" if unknown) */
export function roomAt(course: any, i: number): string {
  const rooms: string[] | undefined = course?.rooms;
  if (!rooms || rooms.length === 0) return "";
  if (rooms.length === course.days?.length) return rooms[i] ?? "";
  return rooms.length === 1 ? rooms[0] : "";
}
