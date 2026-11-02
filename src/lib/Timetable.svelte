<script lang="ts">
  import {
    getSelectedCourseNames,
    getHoveredCourse,
    getCurSemesterData,
    getCurrentSemester,
    getShowRooms,
    roomAt,
  } from "./globalState.svelte";

  // Classroom of a course at a given day and clock hour (9..22)
  function roomFor(courseName: string, day: string, hour: number) {
    const course = getCurSemesterData()?.[courseName];
    if (!course?.days) return "";
    const i = course.days.findIndex(
      (d: string, j: number) => d === day && course.hours[j] === hour - 8
    );
    return i === -1 ? "" : roomAt(course, i);
  }

  const calculateTable = $derived(
    getCurrentSemester() != "" &&
      getCurSemesterData() !== undefined &&
      getCurSemesterData() !== null
  );

  const courseOnSaturday = $derived(
    getCourseOnSaturday(
      calculateTable,
      getSelectedCourseNames(),
      getCurSemesterData(),
      getHoveredCourse()
    )
  );

  const tableItems = $derived(
    getTableItems(
      calculateTable,
      getSelectedCourseNames(),
      getHoveredCourse(),
      getCurSemesterData()
    )
  );

  function getCourseOnSaturday(
    calculateTable: boolean,
    selectedCourseNames: string[],
    curSemesterData: any,
    hoveredCourse: string
  ) {
    if (!calculateTable) {
      return false;
    }

    for (let i = 0; i < selectedCourseNames.length; i++) {
      const courseName = selectedCourseNames[i];
      if (courseName in curSemesterData) {
        const days = curSemesterData[courseName].days;
        if (days) {
          for (let j = 0; j < days.length; j++) {
            if (days[j] == "St") {
              return true;
            }
          }
        }
      }
    }
    if (hoveredCourse != "") {
      const days = curSemesterData[hoveredCourse].days;
      if (days) {
        for (let j = 0; j < days.length; j++) {
          if (days[j] == "St") {
            return true;
          }
        }
      }
    }
    return false;
  }

  type HourData = {
    hour: number;
    M: string[];
    T: string[];
    W: string[];
    Th: string[];
    F: string[];
    St: string[];
  };

  type Days = "M" | "T" | "W" | "Th" | "F" | "St";

  function getTableItems(
    calculateTable: boolean,
    selectedCourseNames: string[],
    hoveredCourse: string,
    curSemesterData: any
  ) {
    let table: HourData[] = [];
    let latestCourseHour;
    for (let i = 9; i < 23; i++) {
      table.push({
        hour: i,
        M: [],
        T: [],
        W: [],
        Th: [],
        F: [],
        St: [],
      });
    }
    latestCourseHour = 14;
    if (calculateTable) {
      for (let i = 0; i < selectedCourseNames.length; i++) {
        const courseName = selectedCourseNames[i];
        if (!(courseName in curSemesterData)) {
          continue;
        }
        const { hours, days }: { hours: number[]; days: Days[] } =
          curSemesterData[courseName];
        if (days) {
          for (let j = 0; j < days.length; j++) {
            latestCourseHour = Math.max(latestCourseHour, hours[j] + 8);
            table[Number(hours[j]) - 1][days[j]].push(courseName);
          }
        }
      }
      if (hoveredCourse != "" && !selectedCourseNames.includes(hoveredCourse)) {
        const { hours, days }: { hours: number[]; days: Days[] } =
          curSemesterData[hoveredCourse];
        if (days) {
          for (let j = 0; j < days.length; j++) {
            latestCourseHour = Math.max(latestCourseHour, hours[j] + 8);
            table[Number(hours[j]) - 1][days[j]].push(hoveredCourse);
          }
        }
      }
    }

    for (let i = latestCourseHour + 1; i < 23; i++) {
      table.pop();
    }
    return table;
  }
</script>

<div
  class="bg-white dark:bg-gray-800 dark:text-white shadow rounded-lg w-full shrink-0 overflow-x-auto"
>
  <table
    class="table-fixed text-center w-full text-[11px] sm:text-sm lg:text-base antialiased tracking-tight sm:tracking-normal"
  >
    <thead>
      <tr>
        <th class="w-6"></th>
        <th> Mon </th>
        <th> Tue </th>
        <th> Wed </th>
        <th> Thu </th>
        <th> Fri </th>
        <th class="{courseOnSaturday ? '' : 'hidden'}"> Sat </th>
      </tr>
    </thead>
    <tbody>
      {#each tableItems as row, i}
        <tr class={i % 2 == 0 ? "bg-gray-50 dark:bg-gray-700" : ""}>
          <th class="md:p-1"> {row["hour"]} </th>
          <td class={row["M"].length > 1 ? "bg-red-100 dark:bg-red-900" : ""}
            >{#each row["M"] as course}<div
                class="leading-tight p-px {course == getHoveredCourse()
                  ? 'bg-green-200 text-green-700 dark:bg-green-800 dark:text-green-300 rounded'
                  : ''}"
              >
                {course.split(".")[0]}<wbr />.{course.split(".").slice(1).join(".")}
                {#if getShowRooms() && roomFor(course, "M", row.hour)}
                  <div class="text-[10px] leading-none opacity-70">
                    {roomFor(course, "M", row.hour)}
                  </div>
                {/if}
              </div>{/each}</td
          >
          <td class={row["T"].length > 1 ? "bg-red-100 dark:bg-red-900" : ""}
            >{#each row["T"] as course}<div
                class="leading-tight p-px {course == getHoveredCourse()
                  ? 'bg-green-200 text-green-700 dark:bg-green-800 dark:text-green-300 rounded'
                  : ''}"
              >
                {course.split(".")[0]}<wbr />.{course.split(".").slice(1).join(".")}
                {#if getShowRooms() && roomFor(course, "T", row.hour)}
                  <div class="text-[10px] leading-none opacity-70">
                    {roomFor(course, "T", row.hour)}
                  </div>
                {/if}
              </div>{/each}</td
          >
          <td class={row["W"].length > 1 ? "bg-red-100 dark:bg-red-900" : ""}
            >{#each row["W"] as course}<div
                class="leading-tight p-px {course == getHoveredCourse()
                  ? 'bg-green-200 text-green-700 dark:bg-green-800 dark:text-green-300 rounded'
                  : ''}"
              >
                {course.split(".")[0]}<wbr />.{course.split(".").slice(1).join(".")}
                {#if getShowRooms() && roomFor(course, "W", row.hour)}
                  <div class="text-[10px] leading-none opacity-70">
                    {roomFor(course, "W", row.hour)}
                  </div>
                {/if}
              </div>{/each}</td
          >
          <td class={row["Th"].length > 1 ? "bg-red-100 dark:bg-red-900" : ""}
            >{#each row["Th"] as course}<div
                class="leading-tight p-px {course == getHoveredCourse()
                  ? 'bg-green-200 text-green-700 dark:bg-green-800 dark:text-green-300 rounded'
                  : ''}"
              >
                {course.split(".")[0]}<wbr />.{course.split(".").slice(1).join(".")}
                {#if getShowRooms() && roomFor(course, "Th", row.hour)}
                  <div class="text-[10px] leading-none opacity-70">
                    {roomFor(course, "Th", row.hour)}
                  </div>
                {/if}
              </div>{/each}</td
          >
          <td class={row["F"].length > 1 ? "bg-red-100 dark:bg-red-900" : ""}
            >{#each row["F"] as course}<div
                class="leading-tight p-px {course == getHoveredCourse()
                  ? 'bg-green-200 text-green-700 dark:bg-green-800 dark:text-green-300 rounded'
                  : ''}"
              >
                {course.split(".")[0]}<wbr />.{course.split(".").slice(1).join(".")}
                {#if getShowRooms() && roomFor(course, "F", row.hour)}
                  <div class="text-[10px] leading-none opacity-70">
                    {roomFor(course, "F", row.hour)}
                  </div>
                {/if}
              </div>{/each}</td
          >
          <td
            class="{courseOnSaturday ? '' : 'hidden'} {row['St'].length > 1
              ? 'bg-red-100 dark:bg-red-900'
              : ''}"
            >{#each row["St"] as course}<div
                class="leading-tight p-px {course == getHoveredCourse()
                  ? 'bg-green-200 text-green-700 dark:bg-green-800 dark:text-green-300 rounded'
                  : ''}"
              >
                {course.split(".")[0]}<wbr />.{course.split(".").slice(1).join(".")}
                {#if getShowRooms() && roomFor(course, "St", row.hour)}
                  <div class="text-[10px] leading-none opacity-70">
                    {roomFor(course, "St", row.hour)}
                  </div>
                {/if}
              </div>{/each}</td
          >
        </tr>
      {/each}
    </tbody>
  </table>
</div>
