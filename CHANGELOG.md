# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Planned features for future releases

### Changed
- Improvements to existing functionality

### Fixed
- Bug fixes

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
| 1.3.0 | 2026-04-17 | Added task editing, dark mode only, optimized colors |
| 1.2.0 | 2026-03-19 | Added drag and drop task reordering with sorting functionality |
| 1.1.0 | 2026-03-19 | Added due date functionality with overdue highlighting |
| 1.0.0 | 2026-03-19 | Initial release |