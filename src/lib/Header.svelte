<script>
  import SemesterSelect from "./SemesterSelect.svelte";
  import { getBuisMode, setBuisMode } from "./globalState.svelte";
</script>

<div
  class="shrink-0 grow-0 bg-black dark:bg-zinc-800 text-white h-10 flex items-center"
>
  <div class="mx-2 my-1"><h1>BOUN Course Planner</h1></div>
  <label
    class="ml-auto mr-3 my-1 flex items-center gap-1.5 text-sm cursor-pointer select-none"
    title="Show the timetable like the BUIS registration system"
  >
    <input
      type="checkbox"
      class="accent-blue-500"
      checked={getBuisMode()}
      onchange={(e) => setBuisMode(e.currentTarget.checked)}
    />
    BUIS mode
  </label>
  <div class="mr-2 my-1">
    <SemesterSelect />
  </div>
</div>
