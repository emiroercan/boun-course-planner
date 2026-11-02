<script lang="ts">
  // Timetable styled like the schedule planner in BUIS (registration system)
  import {
    getSelectedCourseNames,
    getHoveredCourse,
    getCurSemesterData,
    getCurrentSemester,
    getShowRooms,
    roomAt,
    lastHourToShow,
    setCourseList,
  } from "./globalState.svelte";

  const DAYS = ["M", "T", "W", "Th", "F", "St"] as const;
  // 9..14, or later if a selected or hovered course needs it
  const HOURS = $derived(
    Array.from({ length: lastHourToShow() - 8 }, (_, i) => i + 9)
  );

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

  // Height of the scrollable timetable area; "expanded" shows all hours
  const MIN_HEIGHT = 200;
  const DEFAULT_HEIGHT = 560;

  function readNumber(key: string, fallback: number) {
    try {
      const v = Number(localStorage.getItem(key));
      return Number.isFinite(v) && v > 0 ? v : fallback;
    } catch {
      return fallback;
    }
  }
  function save(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // storage unavailable; setting lasts for this visit only
    }
  }

  let height = $state(readNumber("buisHeight", DEFAULT_HEIGHT));
  let expanded = $state(readNumber("buisExpanded", 0) === 1);

  function toggleExpanded() {
    expanded = !expanded;
    save("buisExpanded", expanded ? "1" : "0");
  }

  // Drag the bottom bar to resize
  let drag: { startY: number; startHeight: number } | null = null;

  function startResize(e: PointerEvent) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    // Start from the height currently on screen (also when expanded)
    const area = (e.currentTarget as HTMLElement).previousElementSibling;
    drag = {
      startY: e.clientY,
      startHeight: area ? area.getBoundingClientRect().height : height,
    };
    expanded = false;
  }

  function moveResize(e: PointerEvent) {
    if (!drag) return;
    height = Math.max(MIN_HEIGHT, drag.startHeight + e.clientY - drag.startY);
  }

  function endResize() {
    if (!drag) return;
    drag = null;
    save("buisHeight", String(Math.round(height)));
    save("buisExpanded", "0");
  }

  // On phones, hide Saturday unless something is on it
  let areaWidth = $state(0);
  const visibleDays = $derived(
    areaWidth > 0 && areaWidth < 480
      ? DAYS.filter(
          (d) =>
            d !== "St" || HOURS.some((h) => (grid[`St-${h - 8}`] ?? []).length)
        )
      : DAYS
  );

  type Block = {
    name: string;
    color: string;
    preview: boolean;
    room: string;
  };

  // Each course keeps the color it got when it was added, so adding or
  // removing other courses never recolors it. Stored per semester.
  // P.S./LAB sections share the color of their main course.
  const baseOf = (courseName: string) => courseName.split(" ")[0];

  function readColors(): Record<string, Record<string, string>> {
    try {
      const v = JSON.parse(localStorage.getItem("buisColors") || "{}");
      return v && typeof v === "object" ? v : {};
    } catch {
      return {};
    }
  }

  let colorsBySemester = $state(readColors());

  // Assign colors to newly added courses, forget removed ones
  $effect(() => {
    const semester = getCurrentSemester();
    if (!semester) return;
    const bases = [...new Set(getSelectedCourseNames().map(baseOf))];
    const current = colorsBySemester[semester] ?? {};
    const next: Record<string, string> = {};
    for (const b of bases) if (current[b]) next[b] = current[b];
    for (const b of bases) if (!next[b]) next[b] = freeColor(next);
    if (JSON.stringify(next) !== JSON.stringify(current)) {
      colorsBySemester[semester] = next;
      save("buisColors", JSON.stringify(colorsBySemester));
    }
  });

  // First palette color not used yet (least used once all are taken)
  function freeColor(used: Record<string, string>) {
    const counts = new Map(COLORS.map((c) => [c, 0]));
    for (const c of Object.values(used))
      if (counts.has(c)) counts.set(c, counts.get(c)! + 1);
    let best = COLORS[0];
    for (const c of COLORS) if (counts.get(c)! < counts.get(best)!) best = c;
    return best;
  }

  const grid = $derived.by(() => {
    const data = getCurSemesterData();
    const cells: Record<string, Block[]> = {};
    if (!data) return cells;

    const assigned = colorsBySemester[getCurrentSemester()] ?? {};
    const preview = { ...assigned };
    const colorFor = (courseName: string) => {
      const base = baseOf(courseName);
      // Hovered course: show the color it would get if added
      if (!preview[base]) preview[base] = freeColor(preview);
      return preview[base];
    };

    const place = (courseName: string, isPreview: boolean) => {
      const course = data[courseName];
      if (!course?.days || !course?.hours) return;
      const color = colorFor(courseName);
      course.days.forEach((day: string, i: number) => {
        const key = `${day}-${course.hours[i]}`;
        (cells[key] ??= []).push({
          name: courseName,
          color,
          preview: isPreview,
          room: roomAt(course, i),
        });
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
    <div class="flex gap-2">
      <button
        class="rounded bg-white/15 hover:bg-white/25 text-white text-sm px-2.5 py-1"
        title={expanded ? "Limit the height and scroll" : "Show all hours without scrolling"}
        onclick={toggleExpanded}
      >
        {expanded ? "Collapse" : "Expand"}
      </button>
      <button
        class="rounded bg-[#a51d2d] hover:bg-[#8a1825] text-white text-sm px-2.5 py-1 shadow-inner disabled:opacity-60"
        disabled={getSelectedCourseNames().length === 0}
        onclick={() => setCourseList([])}
      >
        Clear
      </button>
    </div>
  </div>

  <div
    class="bg-white overflow-y-auto overflow-x-auto"
    style={expanded ? "" : `max-height: ${height}px`}
    bind:clientWidth={areaWidth}
  >
    <table class="w-full table-fixed border-collapse">
      <thead class="sticky top-0 bg-white z-10">
        <tr class="h-10">
          <th class="w-10 border border-[#ddd]"></th>
          {#each visibleDays as day}
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
            {#each visibleDays as day}
              {@const blocks = grid[`${day}-${hour - 8}`] ?? []}
              <td class="h-14 border border-[#ddd] p-px align-top">
                <div class="flex flex-col h-full min-h-[54px] gap-px">
                  {#each blocks as block}
                    <div
                      class="flex-1 text-[10px] sm:text-[11px] leading-tight py-0.5 sm:pt-1 text-center text-[#444] break-words {block.preview
                        ? 'opacity-60 outline-dashed outline-1 outline-[#555] -outline-offset-2'
                        : ''}"
                      style="background-color: {block.color}"
                      title={block.name}
                    >
                      {label(block.name)}
                      {#if getShowRooms() && block.room}
                        <div class="text-[10px] opacity-75">{block.room}</div>
                      {/if}
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
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="h-12 bg-[#e5e7eb] border-t border-[#ddd] flex items-center justify-center cursor-ns-resize touch-none select-none"
    title="Drag to resize"
    onpointerdown={startResize}
    onpointermove={moveResize}
    onpointerup={endResize}
    onpointercancel={endResize}
    onmousedown={(e) => e.preventDefault()}
    ondblclick={toggleExpanded}
    role="separator"
    aria-orientation="horizontal"
    aria-label="Resize schedule"
  >
    <div class="w-10 h-1 rounded-full bg-[#b5b8bd]"></div>
  </div>
</div>
