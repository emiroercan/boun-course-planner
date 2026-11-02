<script lang="ts">
  import Header from "./lib/Header.svelte";
  import CourseCatalogue from "./lib/CourseCatalogue.svelte";
  import Timetable from "./lib/Timetable.svelte";
  import CourseList from "./lib/CourseList.svelte";
  import GoogleAnalytics from "./lib/GoogleAnalytics.svelte";
  import BuisTimetable from "./lib/BuisTimetable.svelte";
  import { getBuisMode } from "./lib/globalState.svelte";
</script>

<main
  class="md:max-h-screen min-h-screen md:h-screen flex flex-col bg-zinc-100 dark:bg-black"
>
  <Header />

  <div class="flex flex-col md:flex-row grow md:overflow-hidden">
    <div
      class="w-full md:w-5/12 p-2 flex flex-col shrink-0 md:grow md:overflow-y-auto md:min-h-0"
    >
      {#if getBuisMode()}
        <BuisTimetable />
      {:else}
        <Timetable />
      {/if}
      <CourseList />
    </div>
    <div class="w-full md:w-7/12 p-2 flex flex-col grow h-full">
      <CourseCatalogue />
    </div>
  </div>
</main>

<GoogleAnalytics />
