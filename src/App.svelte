<script lang="ts">
  import Header from "./lib/Header.svelte";
  import CourseCatalogue from "./lib/CourseCatalogue.svelte";
  import Timetable from "./lib/Timetable.svelte";
  import CourseList from "./lib/CourseList.svelte";
  import GoogleAnalytics from "./lib/GoogleAnalytics.svelte";
  import BuisTimetable from "./lib/BuisTimetable.svelte";
  import PrepTimetable from "./lib/PrepTimetable.svelte";
  import TimetableOptions from "./lib/TimetableOptions.svelte";
  import { getViewMode, getWideView } from "./lib/globalState.svelte";
</script>

<main
  class="md:max-h-screen min-h-screen md:h-screen flex flex-col bg-zinc-100 dark:bg-black"
>
  <Header />

  <div class="flex flex-col md:flex-row grow md:overflow-hidden">
    <div
      class="w-full {getWideView()
        ? 'md:w-8/12'
        : 'md:w-5/12'} p-2 flex flex-col shrink-0 md:grow md:overflow-y-auto md:min-h-0"
    >
      {#if getViewMode() === "buis"}
        <BuisTimetable />
      {:else if getViewMode() === "prep"}
        <PrepTimetable />
      {:else}
        <Timetable />
      {/if}
      <TimetableOptions />
      <CourseList />
    </div>
    <div class="w-full {getWideView() ? 'md:w-4/12' : 'md:w-7/12'} p-2 flex flex-col grow h-full">
      <CourseCatalogue />
    </div>
  </div>
</main>

<GoogleAnalytics />
