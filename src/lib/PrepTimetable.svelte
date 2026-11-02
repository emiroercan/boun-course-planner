<script lang="ts">
  // Timetable styled like the "Course Schedule" page of the registration
  // system: days as rows, time slots as columns, clashes listed below.
  import {
    getSelectedCourseNames,
    getHoveredCourse,
    getCurSemesterData,
    getShowRooms,
    roomAt,
    lastHourToShow,
  } from "./globalState.svelte";

  const DAYS = [
    ["M", "Monday"],
    ["T", "Tuesday"],
    ["W", "Wednesday"],
    ["Th", "Thursday"],
    ["F", "Friday"],
    ["St", "Saturday"],
  ] as const;
  // Slot 1 = 09:00; show until 14:50 unless a course goes later
  const SLOTS = $derived(
    Array.from({ length: lastHourToShow() - 8 }, (_, i) => i + 1)
  );
  const pad = (n: number) => String(n).padStart(2, "0");
  const slotTime = (slot: number) =>
    `${pad(slot + 8)}:00-${pad(slot + 8)}:50`;

  // Registration style code without the section:
  // "GR  201.01" -> "GR 201", "CMPE101.01 LAB 1" -> "CMPE101 LAB"
  function label(courseName: string) {
    const course = getCurSemesterData()?.[courseName];
    const code = (course?.code ?? courseName.split(" ")[0])
      .replace(/\s+/g, " ")
      .replace(/\.\w+$/, "");
    const extra = courseName.split(" ").slice(1, 2).join(" ");
    // Non-breaking space inside the code so it never splits across lines
    const whole = code.replace(/ /g, "\u00a0");
    return extra ? `${whole} ${extra}` : whole;
  }

  type Entry = { name: string; room: string };


  const table = $derived.by(() => {
    const data = getCurSemesterData();
    const cells: Record<string, Entry[]> = {};
    const preview: Record<string, Entry> = {};
    if (!data) return { cells, preview, conflicts: [] as string[][], conflictNo: {} };

    const add = (courseName: string, target: "cells" | "preview") => {
      const course = data[courseName];
      if (!course?.days || !course?.hours) return;
      course.days.forEach((day: string, i: number) => {
        const key = `${day}-${course.hours[i]}`;
        const entry = { name: courseName, room: roomAt(course, i) };
        if (target === "cells") (cells[key] ??= []).push(entry);
        else preview[key] = entry;
      });
    };

    const selected = getSelectedCourseNames();
    selected.forEach((c) => add(c, "cells"));
    const hovered = getHoveredCourse();
    if (hovered && !selected.includes(hovered)) add(hovered, "preview");

    // Number each distinct clash in reading order, like the registration page
    const conflicts: string[][] = [];
    const conflictNo: Record<string, number> = {};
    const seen: Record<string, number> = {};
    for (const [day] of DAYS) {
      for (const slot of SLOTS) {
        const key = `${day}-${slot}`;
        const list = cells[key];
        if (!list || list.length < 2) continue;
        const names = list.map((e) => label(e.name)).sort();
        const id = names.join("|");
        if (!(id in seen)) {
          conflicts.push(names);
          seen[id] = conflicts.length;
        }
        conflictNo[key] = seen[id];
      }
    }
    return { cells, preview, conflicts, conflictNo };
  });

</script>

<div class="w-full shrink-0 bg-[#c8c8c8] text-black rounded-sm p-2 font-sans">
  <h2
    class="text-center text-[#000080] font-bold text-base sm:text-lg tracking-wide pb-1.5 mb-2 border-b-2 border-black"
  >
    COURSE SCHEDULE
  </h2>

  <div class="overflow-x-auto @container">
      <table class="border-collapse w-full text-[10px] sm:text-xs">
        <thead>
          <tr>
            <th class="bg-[#73b9fb] border border-[#333]"></th>
            {#each SLOTS as slot}
              <th
                class="bg-[#73b9fb] border border-[#333] font-normal leading-tight px-px py-1"
              >
                {slotTime(slot).split("-")[0]}-<wbr />{slotTime(slot).split("-")[1]}
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each DAYS as [day, dayName]}
            <tr>
              <th class="bg-[#73b9fb] border border-[#333] font-normal px-0.5 sm:px-1 py-1.5 sm:py-2">
                <!-- Short day names when the panel is narrow -->
                <span class="@2xl:hidden">{dayName.slice(0, 3)}</span>
                <span class="hidden @2xl:inline">{dayName}</span>
              </th>
              {#each SLOTS as slot}
                {@render cell(`${day}-${slot}`)}
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
  </div>

  {#snippet cell(key: string)}
    {@const list = table.cells[key] ?? []}
    {@const hover = table.preview[key]}
    <td class="bg-white border border-[#333] align-middle px-0.5 py-0.5 leading-tight">
      {#if list.length > 1}
        <span class="text-red-600">Conflict{table.conflictNo[key]}</span>
      {:else if list.length === 1}
        <div>{label(list[0].name)}</div>
        {#if getShowRooms() && list[0].room}
          <div class="text-[8px] sm:text-[10px]">{list[0].room}</div>
        {/if}
      {/if}
      {#if hover}
        <div class="text-[#666] italic">
          {label(hover.name)}
          {#if getShowRooms() && hover.room}
            <div class="text-[8px] sm:text-[10px]">{hover.room}</div>
          {/if}
        </div>
      {/if}
    </td>
  {/snippet}

  {#if table.conflicts.length > 0}
    <div class="text-center font-serif mt-3">
      <div class="text-red-600">Weekly Schedule Conflict(s)</div>
      {#each table.conflicts as names, i}
        <div>
          <span class="text-red-600">Conflict{i + 1} :</span>
          {names.join(" and ")}
        </div>
      {/each}
    </div>
  {/if}
</div>
