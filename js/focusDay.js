const FocusDay = {
    STORAGE_PREFIX: 'focusDay-',
    currentFocusDate: new Date().toISOString().split('T')[0],
    onDataChange: null,

    getKey(dateStr) {
        return `${this.STORAGE_PREFIX}${dateStr}`;
    },

    get(dateStr) {
        const key = this.getKey(dateStr);
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    },

    save(dateStr, data) {
        const key = this.getKey(dateStr);
        localStorage.setItem(key, JSON.stringify(data));
    },

    getOrCreate(dateStr) {
        const existing = this.get(dateStr);
        if (existing) {
            return existing;
        }
        const newFocusDay = {
            taskIds: [],
            notes: {},
            timeSlots: {}
        };
        this.save(dateStr, newFocusDay);
        return newFocusDay;
    },

    formatDateDisplay(dateStr) {
        const date = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dateOnly = new Date(date);
        dateOnly.setHours(0, 0, 0, 0);

        if (dateOnly.getTime() === today.getTime()) {
            return 'Today';
        }
        if (dateOnly.getTime() === tomorrow.getTime()) {
            return 'Tomorrow';
        }

        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    },

    formatDueDate(dateStr) {
        const date = new Date(dateStr);
        const options = { month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    },

    navigatePrev() {
        const current = new Date(this.currentFocusDate);
        current.setDate(current.getDate() - 1);
        this.currentFocusDate = current.toISOString().split('T')[0];
        this.render();
    },

    getOtherActivePinnedDates(taskId) {
        const dates = [];
        const currentKey = this.getKey(this.currentFocusDate);
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('focusDay-') && key !== currentKey) {
                const focusDay = JSON.parse(localStorage.getItem(key));
                if (focusDay?.taskIds?.includes(taskId)) {
                    dates.push(key.replace('focusDay-', ''));
                }
            }
        }
        return dates.sort();
    },

    getOtherNoteDates(taskId) {
        const dates = [];
        const currentKey = this.getKey(this.currentFocusDate);
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('focusDay-') && key !== currentKey) {
                const focusDay = JSON.parse(localStorage.getItem(key));
                if (focusDay?.notes?.[taskId]) {
                    dates.push(key.replace('focusDay-', ''));
                }
            }
        }
        return dates.sort();
    },

    navigateNext() {
        const current = new Date(this.currentFocusDate);
        current.setDate(current.getDate() + 1);
        this.currentFocusDate = current.toISOString().split('T')[0];
        this.render();
    },

    render() {
        const dateDisplay = document.getElementById('focus-date');
        if (dateDisplay) {
            dateDisplay.textContent = this.formatDateDisplay(this.currentFocusDate);
        }

        this.renderTasks();
    },

    renderTasks() {
        const dropZone = document.getElementById('focus-drop-zone');
        const emptyState = document.getElementById('focus-empty');
        if (!dropZone) return;

        const focusDay = this.getOrCreate(this.currentFocusDate);
        const taskIds = focusDay.taskIds || [];

        const existingTaskList = dropZone.querySelector('.focus-task-list');
        if (existingTaskList) {
            existingTaskList.remove();
        }

        if (taskIds.length === 0) {
            if (emptyState) {
                emptyState.style.display = 'flex';
            }
            return;
        }

        if (emptyState) {
            emptyState.style.display = 'none';
        }

        const taskList = document.createElement('div');
        taskList.className = 'focus-task-list';

        taskIds.forEach(taskId => {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;

            const focusDay = this.getOrCreate(this.currentFocusDate);
            const notes = focusDay.notes || {};
            const taskNote = notes[taskId] || '';

            const card = document.createElement('div');
            card.className = 'focus-task-card';

            const titleSpan = document.createElement('span');
            titleSpan.className = 'focus-task-title';
            titleSpan.textContent = task.text;
            if (task.completed) {
                titleSpan.classList.add('completed');
            }

            const titleRow = document.createElement('div');
            titleRow.className = 'focus-task-title-row';

            const titleWrapper = document.createElement('div');
            titleWrapper.className = 'focus-task-title-wrapper';
            titleWrapper.appendChild(titleSpan);

            if (task.dueDate) {
                const dueDateSpan = document.createElement('span');
                dueDateSpan.className = 'focus-task-due-date';
                dueDateSpan.textContent = '📅 ' + this.formatDueDate(task.dueDate);
                titleWrapper.appendChild(dueDateSpan);
            }

            const removeBtn = document.createElement('button');
            removeBtn.className = 'focus-task-remove';
            removeBtn.innerHTML = '&times;';
            removeBtn.setAttribute('aria-label', `Remove "${task.text}" from daily focus`);
            removeBtn.onclick = () => this.removeTask(taskId);

            titleRow.appendChild(titleWrapper);
            titleRow.appendChild(removeBtn);

            const noteTextarea = document.createElement('textarea');
            noteTextarea.className = 'focus-task-note';
            noteTextarea.placeholder = 'Add notes...';
            noteTextarea.value = taskNote;
            noteTextarea.rows = 2;
            noteTextarea.addEventListener('blur', () => {
                this.saveNote(taskId, noteTextarea.value);
            });

            card.appendChild(titleRow);
            card.appendChild(noteTextarea);
            taskList.appendChild(card);
        });

        dropZone.appendChild(taskList);
    },

    addTask(taskId, needsConfirmation = false) {
        const otherActiveDates = this.getOtherActivePinnedDates(taskId);
        const otherNoteDates = this.getOtherNoteDates(taskId);

        if (otherActiveDates.length > 0 && needsConfirmation) {
            const oldDateStr = otherActiveDates[0];
            const oldDateDisplay = this.formatDateDisplay(oldDateStr);
            const newDateDisplay = this.formatDateDisplay(this.currentFocusDate);
            const message = `Task is pinned to ${oldDateDisplay}. Move to ${newDateDisplay}?`;

            showConfirmModal(message, () => {
                this.moveTaskToCurrentDate(taskId, oldDateStr);
            });
            return;
        }

        if (otherNoteDates.length > 0 && otherActiveDates.length === 0) {
            this.moveTaskToCurrentDate(taskId, otherNoteDates[0]);
            return;
        }

        const focusDay = this.getOrCreate(this.currentFocusDate);
        if (!focusDay.taskIds.includes(taskId)) {
            focusDay.taskIds.push(taskId);
            this.save(this.currentFocusDate, focusDay);
            this.render();
            this.triggerDataChange();
        }
    },

    getOtherActivePinnedDates(taskId) {
        const dates = [];
        const currentKey = this.getKey(this.currentFocusDate);
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('focusDay-') && key !== currentKey) {
                const focusDay = JSON.parse(localStorage.getItem(key));
                if (focusDay?.taskIds?.includes(taskId)) {
                    dates.push(key.replace('focusDay-', ''));
                }
            }
        }
        return dates.sort();
    },

    getOtherNoteDates(taskId) {
        const dates = [];
        const currentKey = this.getKey(this.currentFocusDate);
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('focusDay-') && key !== currentKey) {
                const focusDay = JSON.parse(localStorage.getItem(key));
                if (focusDay?.notes?.[taskId]) {
                    dates.push(key.replace('focusDay-', ''));
                }
            }
        }
        return dates.sort();
    },

    moveTaskToCurrentDate(taskId, fromDateStr) {
        const fromFocus = this.get(fromDateStr);
        const note = fromFocus?.notes?.[taskId] || '';

        if (fromFocus && fromFocus.taskIds) {
            fromFocus.taskIds = fromFocus.taskIds.filter(id => id !== taskId);
            if (note && fromFocus.notes) {
                delete fromFocus.notes[taskId];
            }
            this.save(fromDateStr, fromFocus);
        }

        const toFocus = this.getOrCreate(this.currentFocusDate);
        if (!toFocus.taskIds.includes(taskId)) {
            toFocus.taskIds.push(taskId);
            if (note) {
                if (!toFocus.notes) toFocus.notes = {};
                toFocus.notes[taskId] = note;
            }
            this.save(this.currentFocusDate, toFocus);
            this.render();
            this.triggerDataChange();
        }
    },

    removeTask(taskId) {
        const focusDay = this.get(this.currentFocusDate);
        if (focusDay && focusDay.taskIds) {
            focusDay.taskIds = focusDay.taskIds.filter(id => id !== taskId);
            this.save(this.currentFocusDate, focusDay);
            this.render();
            this.triggerDataChange();
        }
    },

    saveNote(taskId, noteText) {
        const focusDay = this.getOrCreate(this.currentFocusDate);
        if (!focusDay.notes) {
            focusDay.notes = {};
        }
        if (noteText.trim()) {
            focusDay.notes[taskId] = noteText;
        } else {
            delete focusDay.notes[taskId];
        }
        this.save(this.currentFocusDate, focusDay);
    },

    triggerDataChange() {
        if (this.onDataChange) {
            this.onDataChange();
        }
    },

    setupDragListeners() {
        const dropZone = document.getElementById('focus-drop-zone');
        if (!dropZone) return;

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const taskId = parseInt(e.dataTransfer.getData('text/plain'));
            if (taskId) {
                this.addTask(taskId, true);
            }
        });
    },

    init() {
        const prevBtn = document.getElementById('focus-prev');
        const nextBtn = document.getElementById('focus-next');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.navigatePrev());
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.navigateNext());
        }

        this.setupDragListeners();
        this.render();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    FocusDay.init();
});