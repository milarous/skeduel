# Skeduel

A modern, intuitive task manager application to help you stay organized and productive.

![Skeduel Logo](css/images/logo.png)

## Table of Contents

- [About](#about)
- [Features](#features)
- [Demo](#demo)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Technologies](#technologies)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## About

Skeduel is a lightweight, browser-based task management application designed to help individuals and teams track their daily tasks efficiently. With a clean, modern interface and support for dark mode, Skeduel makes task management a breeze.

## Features

- ✅ **Add Tasks** - Quickly add new tasks with a simple input interface
- ✅ **Mark Complete** - Toggle task completion status with a single click
- ✅ **Clear Completed** - Remove all completed tasks at once
- ✅ **Dark Mode** - Exclusive dark mode with optimized colors for modern UI
- ✅ **Task Counter** - Real-time count of remaining tasks
- ✅ **Responsive Design** - Works seamlessly on desktop and mobile devices
- ✅ **Local Storage** - Tasks persist across browser sessions
- ✅ **Server Sync** - Tasks sync to server file (`skeduel-data.json`) in background
- ✅ **Save Status** - Subtle indicator shows saving/saved/failed state in header
- ✅ **Due Dates** - Optional due dates for tasks with calendar picker
- ✅ **Edit Tasks** - Edit task text and due date by clicking the edit button
- ✅ **Overdue Highlighting** - Tasks past due date are highlighted
- ✅ **Date Headers** - Tasks are grouped under date headers (Today, Tomorrow, specific dates)
- ✅ **Collapsible Groups** - Date sections can be expanded/collapsed
- ✅ **Task Recurring** - Set tasks to recur daily, weekly, monthly, or yearly with customizable intervals
- ✅ **Recurrence Expiry** - Set tasks to expire after a specific date or number of completions
- ✅ **Daily Focus** - Daily focus panel with date navigation, drag tasks to add, remove from focus, notes, and move between days
  - **Cannot View Past** - Navigation restricted to today and future dates only
  - **Find Pinned Task** - Click the 📌 pin indicator in task list to jump to that task in Daily Focus
  - **Time Slots** - Tasks grouped into Morning, Lunch, Afternoon, Late, and Unscheduled sessions
  - **Collapsible Notes** - Each task card has a collapsible notes section with 📝 Notes button
  - **Auto-Expanding Notes** - Notes textarea grows automatically as you type

## Demo

Run the Flask server and open `http://localhost:5000` in your browser.

## Project Structure

```
skeduel/
├── server.py              # Flask application
├── skeduel-data.json      # Task data storage (gitignored)
├── templates/
│   └── index.html         # Main HTML template
└── static/
    ├── css/
    │   └── styles.css     # Application styles
    └── js/
        ├── storage.js     # Storage module (server sync + localStorage cache)
        ├── data.js        # Data layer (tasks, collapsedGroups, RecurrenceEngine)
        ├── focusDay.js    # Daily Focus module
        └── taskList.js    # Task list UI
```

## Getting Started

### Prerequisites

- Python 3.8+
- Flask (see requirements.txt)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/milarous/skeduel.git
   ```

2. Navigate to the project directory:
   ```bash
   cd skeduel
   ```

3. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Linux/macOS
   .venv\Scripts\activate     # Windows
   ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Run the server:
   ```bash
   flask run --app server.py
   # or
   python server.py
   ```

6. Open http://localhost:5000 in your browser

## Usage

1. **Adding a Task**: Type your task in the input field and click "Add Task" or press Enter
2. **Setting a Due Date**: Use the date picker to optionally set a due date for your task
3. **Completing a Task**: Click the checkbox to mark a task as complete
4. **Editing a Task**: Click the pencil (✎) button on a task to edit its text or due date
5. **Saving Edits**: Press Enter or click the checkmark (✓) to save, Escape or × to cancel
6. **Viewing Due Dates**: Tasks with due dates display the date below the task text
7. **Overdue Tasks**: Tasks past their due date are highlighted for easy identification
8. **Clearing Tasks**: Click "Clear Completed" to remove all finished tasks
9. **Date Groups**: Tasks are grouped by due date with collapsible sections
10. **Recurring Tasks**: Toggle the "Repeat" switch to set a task to recur daily, weekly, monthly, or yearly
11. **Recurrence Interval**: Set how often the task repeats (e.g., every 2 weeks)
12. **Recurrence Expiry**: Set when the recurrence ends - "Never", "On date", or "After X times"
13. **Editing Recurrence**: Click the edit button on a recurring task to modify its recurrence settings
14. **Daily Focus**: Navigate to view tasks for specific days using prev/next buttons
15. **Add to Focus**: Drag a task from the task list to the Daily Focus panel to pin it for the day
16. **Remove from Focus**: Click the × button on a focused task to remove it from the daily focus
17. **Task Notes**: Add notes to pinned tasks in Daily Focus (saved on blur)
18. **Pinned Indicator**: Tasks pinned to Daily Focus show a 📌 indicator in the task list
19. **One Focus Day**: Task can only be pinned to one day - moving to another day transfers without confirmation
20. **Duplicate Alert**: Tasks already pinned to another day show confirmation modal before moving
21. **Daily Focus Updates**: Task name and due date changes reflect immediately in Daily Focus
22. **Modal Dialogs**: Custom-styled modals for confirmations and alerts instead of browser dialogs
23. **Move Task**: Click the → button on a focused task to move it to a different day
24. **Move Options**: Choose Today, Tomorrow, or pick a custom date from the dropdown
25. **Move Between Days**: Move a task directly from one focus day to another without removing first
26. **Time Slots**: Tasks in Daily Focus are organized into Morning, Lunch, Afternoon, Late, and Unscheduled sections
27. **Drag to Time Slot**: Drag tasks between time slot sections to reorganize your day
28. **Collapse Notes**: Click the 📝 Notes button on a focus card to collapse/expand the notes section
29. **Note Indicator**: When a note exists, the Notes button shows in accent color so you can see it without expanding

## Storage

Task data is stored in a local JSON file (`skeduel-data.json`) on the server, with browser localStorage as a cache for offline access. On first load after server restart, data is synced from the server to localStorage. All writes go to both the server and localStorage.

## Technologies

- **Python** - Flask web framework
- **HTML5** - Semantic markup structure
- **CSS3** - Modern styling with CSS variables for theming
- **JavaScript (ES6+)** - Dynamic functionality
- **JSON** - Local file storage

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE.md` for more information.

## Contact

Project Link: [https://github.com/milarous/skeduel](https://github.com/milarous/skeduel)

---

Stay organized, stay productive ✨