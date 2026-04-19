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
- ✅ **Due Dates** - Optional due dates for tasks with calendar picker
- ✅ **Edit Tasks** - Edit task text and due date by clicking the edit button
- ✅ **Overdue Highlighting** - Tasks past due date are highlighted
- ✅ **Date Headers** - Tasks are grouped under date headers (Today, Tomorrow, specific dates)
- ✅ **Collapsible Groups** - Date sections can be expanded/collapsed
- ✅ **Task Recurring** - Set tasks to recur daily, weekly, monthly, or yearly with customizable intervals
- ✅ **Recurrence Expiry** - Set tasks to expire after a specific date or number of completions
- 🚧 **Daily Focus** - Plan your daily focus with draggable tasks, notes, and time slots (coming soon)

## Demo

Open `index.html` in your browser to see Skeduel in action.

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- No server required - runs entirely in the browser

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/milarous/skeduel.git
   ```

2. Navigate to the project directory:
   ```bash
   cd skeduel
   ```

3. Open `index.html` in your browser:
   ```bash
   # On macOS
   open index.html
   
   # On Linux
   xdg-open index.html
   
   # On Windows
   start index.html
   ```

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

## Technologies

- **HTML5** - Semantic markup structure
- **CSS3** - Modern styling with CSS variables for theming
- **JavaScript (ES6+)** - Dynamic functionality and local storage
- **No external dependencies** - Pure vanilla implementation

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