# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Collapsible notes section in Daily Focus cards:
  - 📝 Notes button in title row to collapse/expand notes
  - Rotating arrow indicator shows collapsed/expanded state
  - Accent color indicates when a note exists (visible at a glance)
  - Collapse state stored in memory only (resets on page refresh)
- Auto-expanding textarea for notes:
  - Textarea grows automatically as you type
  - Height persisted in memory during session
  - Minimum height of 36px ensures placeholder visibility
  - No scrollbar needed - content flows naturally

### Changed
- Task name font size in Daily Focus cards increased to match task list (1rem)
- Prev/Next navigation buttons styled to match Add Task button
- Notes textarea uses auto-expanding height with no scrollbar

### Fixed
- N/A

## [1.4.0] - 2026-04-21

### Added
- Daily Focus feature (data layer implemented, UI built)
  - FocusDay storage module with localStorage persistence keyed by date (YYYY-MM-DD)
  - FocusDay data structure: taskIds, notes (keyed by taskId), timeSlots (keyed by taskId)
  - FocusDay.get(dateStr), FocusDay.save(dateStr, data), FocusDay.getOrCreate(dateStr) functions
  - FocusDay.render(), FocusDay.navigatePrev(), FocusDay.navigateNext() for UI updates
  - FocusDay.addTask(taskId), FocusDay.removeTask(taskId), FocusDay.renderTasks() for task management
  - FocusDay.setupDragListeners() for drag and drop handling
  - FocusDay.init() for initializing date navigation and render
- Daily Focus panel in UI with:
  - "Daily Focus" sub-heading with accent border
  - Date navigator (< Prev | Today | Next >)
  - Drop zone for dragged tasks (empty state: "No tasks yet / Drag tasks here to add to your daily focus")
  - Date display format: Today/Tomorrow or weekday short month day (e.g., "Wed Apr 23")
- Draggable task elements with dragstart handler storing task ID in dataTransfer
- Focus drop functionality:
  - dragover/dragleave/drop event listeners on focus drop zone
  - Add task to Daily Focus on drop (if not already present)
  - Remove task from Daily Focus via × button (task remains in task list)
  - Task cards rendered as styled elements with remove button
  - Visual drag-over feedback (dashed border)
- Task recurrence engine - set tasks to recur daily, weekly, monthly, or yearly
- Recurrence frequency options: Daily, Weekly, Monthly, Yearly
- Recurrence interval - set tasks to repeat every N periods (e.g., every 2 weeks)
- Recurrence start date tracking for accurate future date calculation
- Recurrence icon (🔄) displayed on recurring tasks
- Recurrence expiry options: Never, On date, After X times
- Expiry by date - task expires when next occurrence exceeds the expiry date
- Expiry by count - task expires after specified number of completions
- Edit mode for recurrence settings - modify frequency, interval, and expiry
- Recurrence editing adjusts expiry count based on current instance
- Modern toggle switch for repeat option (replaces checkbox)
- Recurrence options moved into same container as task creation fields
- Two-row edit layout - text and due date on first row, recurrence options on second row
- Toggle switch for repeat in task edit mode with "Repeat" label
- Uniform heights (38px) for edit inputs
- Custom modal dialog system:
  - showModal(message) for alerts with single OK button
  - showConfirmModal(message, onConfirm) for confirmations with Confirm/Cancel buttons
  - Styled to match app theme with dark background and accent borders
  - Closes on Escape key or clicking outside modal
  - Replaced native alert() and confirm() dialogs with custom styled modals
- Daily Focus task notes:
  - Per-task textarea below task title in focus cards
  - Saved on blur to focusDay.notes[taskId]
  - Persists when task is removed from focus
- Daily Focus pin indicator in task list:
  - Tasks show 📌 + date when pinned to any focus day
  - Uses getPinnedDates() to check all focus dates
  - Shows most imminent pinned date
- One focus day per task:
  - getOtherPinnedDates() checks all focus days
  - On drag: shows confirmation modal if task pinned elsewhere
  - On remove + re-add: transfers note behind-the-scenes
  - moveTaskToCurrentDate() moves task and notes
  - getOtherActivePinnedDates() / getOtherNoteDates() separate checks
- Task updates reflect in Daily Focus:
  - saveTasks() calls FocusDay.render() on task changes
  - Due date shown in focus cards (📅 format)
  - formatDueDate() helper for displaying due dates
- Move button (→) on focus task cards:
  - Opens floating "Move to..." dropdown menu
  - Today, Tomorrow, and custom date picker options
  - Task can be moved directly between days without removing first
  - Task name and due date update immediately on target day
- Task card styling in Daily Focus:
  - Title row with task name, due date, move button, and remove button
  - Notes textarea below title row
  - Styled to match app theme

### Changed
- Refactored codebase into modular structure:
  - js/data.js - shared data layer (tasks, collapsedGroups, RecurrenceEngine, save functions)
  - js/focusDay.js - Daily Focus storage module
  - js/taskList.js - task list UI/rendering logic
- Two-column layout: task input/list on left, Daily Focus on right
- "Skeduel" header centered with flexbox spacers
- "Task Manager" sub-heading above task column with accent border and padding
- "Daily Focus" sub-heading above focus panel with accent border and padding
- Responsive: focus column moves to top on mobile (≤900px)
- Tasks now store recurrence metadata (frequency, interval, startDate, currentInstance, expiryType, expiryDate, expiryCount)
- Date and recurrence icon display on same line
- Collapsible date groups remain functional
- Container max-width increased to accommodate recurrence options
- Uniform height (46px) for task input, due date, and Add Task button
- Improved color contrast for "every" and "Ends:" labels in task creation and edit areas
- Removed manual sorting (drag/drop and sort dropdown)

### Fixed
- Recurrence interval/frequency change now resets start date and current instance
- Expiry by count now expires on the correct completion (not one extra)
- Expiry by date now checks the next occurrence's date, not today's date
- Type mismatch bug with taskIds (string vs number) causing move between days to fail
- Initial render not displaying tasks - added render() call in FocusDay.init()
- Pin indicator not showing - fixed taskIds comparison to use string conversion
- Move button onclick handler - ensure taskId is passed correctly via closure
- Task card styling issues - added proper CSS class structure (title-row, title-wrapper)
- Due date display in focus cards - formatted to match task list style (e.g., "Apr 21")

## [1.3.0] - 2026-04-17

### Added
- Task editing functionality - edit task text and due date inline
- Edit button (✎) appears on task hover
- Save (✓) and cancel (×) buttons in edit mode
- Keyboard support: Enter to save, Escape to cancel
- New dark mode color scheme with indigo accent (#818cf8)
- Larger buttons (2.25rem) with glow effects on hover
- Task count centering in date headers
- `--success` and `--danger` CSS custom properties

### Changed
- Dark mode is now the exclusive theme - light mode removed
- Theme toggle button removed from header
- Accent color changed from blue to indigo for modern look
- Focus rings updated to use indigo glow
- Task count now absolutely centered in date headers regardless of title length

### Fixed
- N/A

## [1.2.0] - 2026-03-19

### Added
- Drag and drop functionality to reorder tasks
- Sorting dropdown for due date/manual sorting
- Date headers with collapsible sections
- Overdue tasks always visible
- Automatic switch to manual mode on drag-and-drop
- Persistent task order saved to local storage
- Persistent collapse state saved to local storage
- Persistent sorting mode saved to local storage
- Visual drag handle indicator on hover
- Touch event support for mobile drag and drop
- Visual feedback during drag operations (opacity, scale, shadow)
- Drop target indicator with blue border

### Changed
- Enhanced task items with draggable attribute
- Updated CSS with drag and drop styles for both light and dark themes

### Fixed
- N/A

## [1.1.0] - 2026-03-19

### Added
- Optional due date field for tasks
- Visual due date display with calendar icon
- Automatic overdue detection for tasks past their due date
- Red highlighting for overdue tasks (background and left border)
- Overdue styling support for both light and dark themes
- Responsive due date input for mobile devices

### Changed
- Updated task input section to include due date picker
- Enhanced task rendering to display due dates
- Improved task item layout with content container

### Fixed
- N/A

## [1.0.0] - 2026-03-19

### Added
- Initial release of Skeduel task manager
- Add new tasks with input field and button
- Mark tasks as complete by clicking on them
- Clear all completed tasks with one click
- Dark mode toggle for comfortable viewing
- Task counter showing remaining tasks
- Responsive design for desktop and mobile
- Local storage persistence for tasks
- Empty state display when no tasks exist
- Accessible UI with ARIA labels

### Changed
- N/A (Initial release)

### Deprecated
- N/A (Initial release)

### Removed
- N/A (Initial release)

### Fixed
- N/A (Initial release)

### Security
- N/A (Initial release)

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.4.0 | 2026-04-21 | Added Daily Focus panel with drag-and-drop task pinning, recurrence, and modals |
| 1.3.0 | 2026-04-17 | Added task editing, dark mode only, optimized colors |
| 1.2.0 | 2026-03-19 | Added drag and drop task reordering with sorting functionality |
| 1.1.0 | 2026-03-19 | Added due date functionality with overdue highlighting |
| 1.0.0 | 2026-03-19 | Initial release |