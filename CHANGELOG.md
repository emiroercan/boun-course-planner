# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.4.0] - 2026-11-02

### Added

- Course data for every semester back to 1999/2000-1, plus the missing 2024/2025-2
- View buttons in the header: BUIS Planner (default), Regular, and Preparation (looks like the registration course schedule page, with numbered conflicts, no section numbers)
- Show/hide classrooms button under the timetable (on by default), works in every view
- Widen view button to give the timetable more of the screen
- Timetables show 9-14 and only add later hours when a course needs them
- Phone layout: header buttons span the width, BUIS Planner and Regular fit the screen, Preparation keeps the registration layout with smaller text
- BUIS Planner: Expand button to show all hours, and a drag handle to resize the schedule
- Semester dates and holidays are read from the official academic calendar automatically
- Daily update runs at 18:00 Istanbul time and opens an issue when it fails or a new semester appears

### Fixed

- Classroom data re-downloaded for 2017-2026 (some semesters had none or only "Online")
- Summer 2023 data was a copy of Spring 2023; replaced with the real summer courses
- Scraper skips a single broken department page instead of stopping
- BUIS Planner: courses keep their color when other courses are added or removed

## [1.3.0] - 2026-11-02

### Added

- Course data for 2025/2026-2, 2025/2026-3 and 2026/2027-1
- Fall 2026 semester dates for calendar export
- `scripts/scrape.mjs` to download the schedule from the public registration pages
- Daily GitHub Action that refreshes course data and deploys the site
- BUIS Planner view: timetable that looks like the BUIS schedule planner (toggle in the header)
- Footer credit: made by kilicbaran, maintained by Emir Ercan

### Changes

- Real classroom names instead of "Online" for 2025/2026-2

## [1.2.0] - 2025-09-06

### Added

- New course data

### Changes

- Update dependencies
- Fix selected course save by changning trigger from beforunload to visibilitychange
- Handle corrupted localstorage

## [1.1.0] - 2022-04-04

### Added

- Course categories as badges below search bar

### Changes

- Update dependencies

## [1.0.2] - 2022-02-05

### Changes

- Update dependencies
- Migrate from Tailwind CSS 2 to 3

## [1.0.1] - 2022-02-05

### Added

- New course data

### Fixed

- Fix bug related to removed courses
- Fix Google Analytics

## [1.0.0] - 2021-10-23

### Added

- Dark theme.

### Changed

- Migrate from Vue to Svelte and from Bootstrap-Vue to Tailwind CSS.
- Change timetable from an auto layout to a fixed layout.

### Fixed

- Fix course detail overflow bug on small screens.

## [0.2.0] - 2020-06-28

### Changed

- Divide the monolithic code in App.vue into components to make it more readable.
- Change course data format. The labs and p.s. are no longer inside their parent course.

### Fixed

- Fix the problem where the course descriptions open wrong link. The reason was some course codes did contain a whitespace and some did not and I was removing the whitespace to make them uniform.
- Fix the problem where the keyboard did not close upon pressing return on mobile.
- The search bar should now not be autocorrected on mobile.

### Removed

- Remove the debounce that was applied to search bar and course hover actions. It only made the UI slow. It did not improved the performance much.

## [0.1.0] - 2019-02-17

### Added

- Add a badge for conflicting courses.

### Changed

- Migrate from React to Vue

## [0.0.0] - 2018-09-11

### Added

- Course search.
- Timetable of selected courses.
- Display individual and total credit of selected courses.

[unreleased]: https://github.com/kilicbaran/boun-course-planner/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/kilicbaran/boun-course-planner/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/kilicbaran/boun-course-planner/compare/v1.0.2...v1.1.0
[1.0.2]: https://github.com/kilicbaran/boun-course-planner/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/kilicbaran/boun-course-planner/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/kilicbaran/boun-course-planner/compare/v0.2.0...v1.0.0
[0.2.0]: https://github.com/kilicbaran/boun-course-planner/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/kilicbaran/boun-course-planner/releases/tag/v0.1.0
