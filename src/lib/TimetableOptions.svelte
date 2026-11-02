<script lang="ts">
  import {
    getShowRooms,
    setShowRooms,
    getWideView,
    setWideView,
  } from "./globalState.svelte";

  const base =
    "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500";
  const on =
    "bg-blue-600 border-blue-600 text-white hover:bg-blue-700";
  const off =
    "bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700";
</script>

<div class="flex flex-wrap gap-2 mt-2">
  <button
    class="{base} {getShowRooms() ? on : off}"
    aria-pressed={getShowRooms()}
    title="Show or hide the classroom of each class in the timetable"
    onclick={() => setShowRooms(!getShowRooms())}
  >
    🏠 {getShowRooms() ? "Hide classrooms" : "Show classrooms"}
  </button>
  <button
    class="{base} hidden md:flex {getWideView() ? on : off}"
    aria-pressed={getWideView()}
    title="Give the timetable more of the screen width"
    onclick={() => setWideView(!getWideView())}
  >
    ↔ {getWideView() ? "Narrow view" : "Widen view"}
  </button>
</div>
