<script lang="ts">
  import SemesterSelect from "./SemesterSelect.svelte";
  import {
    getViewMode,
    setViewMode,
    type ViewMode,
  } from "./globalState.svelte";

  const VIEWS: [ViewMode, string, string][] = [
    ["buis", "BUIS Planner", "Timetable like the BUIS schedule planner"],
    ["regular", "Regular", "Simple timetable"],
    ["prep", "Preparation", "Timetable like the registration course schedule page"],
  ];

  const base =
    "px-2 py-0.5 text-sm transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500";
  const on = "bg-white text-black";
  const off = "bg-transparent text-zinc-300 hover:bg-white/15 hover:text-white";
</script>

<!-- Phone: title + semester on top, view buttons across the full width below.
     Wider screens: everything on one line. -->
<div
  class="shrink-0 grow-0 bg-black dark:bg-zinc-800 text-white min-h-10 flex flex-wrap items-center gap-x-3 gap-y-1.5 px-2 py-1.5"
>
  <h1 class="order-1">BOUN Course Planner</h1>
  <div class="order-2 sm:order-3 ml-auto sm:ml-0">
    <SemesterSelect />
  </div>
  <div
    class="order-3 sm:order-2 w-full sm:w-auto sm:ml-auto flex rounded border border-white/40 overflow-hidden"
    role="group"
    aria-label="Timetable view"
  >
    {#each VIEWS as [mode, name, hint], i}
      <button
        class="{base} flex-1 sm:flex-none {getViewMode() === mode
          ? on
          : off} {i > 0 ? 'border-l border-white/40' : ''}"
        aria-pressed={getViewMode() === mode}
        title={hint}
        onclick={() => setViewMode(mode)}
      >
        {name}
      </button>
    {/each}
  </div>
</div>
