<script lang="ts">
  // Timetable styled like the schedule planner in BUIS (registration system)
  import {
    getSelectedCourseNames,
    getHoveredCourse,
    getCurSemesterData,
    setCourseList,
  } from "./globalState.svelte";

  const DAYS = ["M", "T", "W", "Th", "F", "St"] as const;
  const HOURS = Array.from({ length: 14 }, (_, i) => i + 9); // 9..22

  // Same pastel colors BUIS uses, cycled per selected course
  const COLORS = [
    "#f87171",
    "#d4fc79",
    "#66dd99",
    "#feeb7a",
    "#8ecbf5",
    "#fdba74",
    "#c4b5fd",
    "#f9a8d4",
    "#5eead4",
    "#d6d3d1",
  ];

  // "CMPE101.01" / "AD  101.01" -> "CMPE 101.01" / "AD 101.01"
  const label = (courseName: string) =>
    courseName.replace(/^([A-Z$]+)\s*/, "$1 ");

  type Block = { name: string; color: string; preview: boolean };

  const grid = $derived.by(() => {
    const data = getCurSemesterData();
    const cells: Record<string, Block[]> = {};
    if (!data) return cells;

    // P.S./LAB sections share the color of their main course
    const colorOf: Record<string, string> = {};
    let next = 0;
    const colorFor = (courseName: string) => {
      const base = courseName.split(" ")[0];
      if (!(base in colorOf)) colorOf[base] = COLORS[next++ % COLORS.length];
      return colorOf[base];
    };

    const place = (courseName: string, preview: boolean) => {
      const course = data[courseName];
      if (!course?.days || !course?.hours) return;
      const color = colorFor(courseName);
      course.days.forEach((day: string, i: number) => {
        const key = `${day}-${course.hours[i]}`;
        (cells[key] ??= []).push({ name: courseName, color, preview });
      });
    };

    const selected = getSelectedCourseNames();
    selected.forEach((c) => place(c, false));
    const hovered = getHoveredCourse();
    if (hovered && !selected.includes(hovered)) place(hovered, true);
    return cells;
  });
</script>

<div
  class="w-full shrink-0 rounded-md border border-[#1f5c99] bg-[#f3f4f6] overflow-hidden text-[#555] font-sans"
>
  <div class="flex items-center justify-between bg-[#1f5c99] px-3 py-1.5">
    <span class="text-white font-bold">Schedule</span>
    <button
      class="rounded bg-[#a51d2d] hover:bg-[#8a1825] text-white text-sm px-2.5 py-1 shadow-inner disabled:opacity-60"
      disabled={getSelectedCourseNames().length === 0}
      onclick={() => setCourseList([])}
    >
      Clear
    </button>
  </div>

  <div class="bg-white max-h-[420px] overflow-y-auto overflow-x-auto">
    <table class="w-full table-fixed border-collapse min-w-[420px]">
      <thead class="sticky top-0 bg-white z-10">
        <tr class="h-10">
          <th class="w-10 border border-[#ddd]"></th>
          {#each DAYS as day}
            <th class="border border-[#ddd] font-bold text-[#555]">{day}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each HOURS as hour}
          <tr>
            <th class="h-14 border border-[#ddd] font-bold text-[#555]">
              {hour}
            </th>
            {#each DAYS as day}
              {@const blocks = grid[`${day}-${hour - 8}`] ?? []}
              <td class="h-14 border border-[#ddd] p-px align-top">
                <div class="flex flex-col h-full gap-px">
                  {#each blocks as block}
                    <div
                      class="flex-1 min-h-0 text-[11px] leading-tight pt-1 text-center text-[#444] overflow-hidden {block.preview
                        ? 'opacity-60 outline-dashed outline-1 outline-[#555] -outline-offset-2'
                        : ''}"
                      style="background-color: {block.color}"
                      title={block.name}
                    >
                      {label(block.name)}
                    </div>
                  {/each}
                </div>
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <div class="h-12 bg-[#e5e7eb] border-t border-[#ddd]"></div>
</div>
