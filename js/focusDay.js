const FocusDay = {
    currentFocusDate: new Date().toISOString().split('T')[0],
    collapsedNotes: {},
    noteHeights: {},

    getKey(dateStr) {
        return 'focusDay-' + dateStr;
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
            existing.taskIds = existing.taskIds.map(id => String(id));
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

    formatDate(dateStr) {
        const date = new Date(dateStr);
        const options = { month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
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
        } else if (dateOnly.getTime() === tomorrow.getTime()) {
            return 'Tomorrow';
        }

        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    },

    getOtherActivePinnedDates(taskId) {
        const dates = [];
        const currentKey = this.getKey(this.currentFocusDate);
        const taskIdStr = String(taskId);
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('focusDay-') && key !== currentKey) {
                const focusDay = JSON.parse(localStorage.getItem(key));
                const taskIds = focusDay?.taskIds?.map(id => String(id)) || [];
                if (taskIds.includes(taskIdStr)) {
                    dates.push(key.replace('focusDay-', ''));
                }
            }
        }
        return dates.sort();
    },

    getOtherNoteDates(taskId) {
        const dates = [];
        const currentKey = this.getKey(this.currentFocusDate);
        const taskIdStr = String(taskId);
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('focusDay-') && key !== currentKey) {
                const focusDay = JSON.parse(localStorage.getItem(key));
                const notes = focusDay?.notes || {};
                if (notes[taskIdStr]) {
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

    navigatePrev() {
        const current = new Date(this.currentFocusDate);
        current.setDate(current.getDate() - 1);
        this.currentFocusDate = current.toISOString().split('T')[0];
        this.render();
    },

    navigateToday() {
        const current = new Date();
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
            const task = tasks.find(t => String(t.id) === taskId);
            if (!task) return;

            const focusDay = this.getOrCreate(this.currentFocusDate);
            const notes = focusDay.notes || {};
            const taskNote = notes[taskId] || '';

            const card = document.createElement('div');
            card.className = 'focus-task-card';

            const titleRow = document.createElement('div');
            titleRow.className = 'focus-task-title-row';

            const titleWrapper = document.createElement('div');
            titleWrapper.className = 'focus-task-title-wrapper';

            const titleSpan = document.createElement('span');
            titleSpan.className = 'focus-task-title';
            titleSpan.textContent = task.text;
            if (task.completed) {
                titleSpan.classList.add('completed');
            }

            const moveBtn = document.createElement('button');
            moveBtn.className = 'focus-task-move';
            moveBtn.innerHTML = '&#10140;';
            moveBtn.setAttribute('aria-label', 'Move to date');
            moveBtn.dataset.taskId = taskId;
            moveBtn.onclick = (e) => this.showMoveDialog(taskId, e);

            const removeBtn = document.createElement('button');
            removeBtn.className = 'focus-task-remove';
            removeBtn.innerHTML = '&times;';
            removeBtn.setAttribute('aria-label', 'Remove from focus');
            removeBtn.onclick = () => this.removeTask(taskId);

            titleWrapper.appendChild(titleSpan);
            if (task.dueDate) {
                const dueSpan = document.createElement('span');
                dueSpan.className = 'due-date';
                dueSpan.textContent = this.formatDate(task.dueDate);
                titleWrapper.appendChild(dueSpan);
            }

            const collapseBtn = document.createElement('button');
            collapseBtn.className = 'note-collapse-icon';
            collapseBtn.setAttribute('aria-label', 'Toggle notes');
            collapseBtn.dataset.taskId = taskId;
            const hasNote = Boolean(taskNote);
            if (hasNote) collapseBtn.classList.add('has-note');
            if (this.collapsedNotes[taskId]) collapseBtn.classList.add('collapsed');
            collapseBtn.innerHTML = '<span class="note-icon-text">📝 Notes</span><span class="note-icon-arrow">▼</span>';
            collapseBtn.onclick = () => this.toggleNoteCollapse(taskId);

            titleRow.appendChild(titleWrapper);
            titleRow.appendChild(collapseBtn);
            titleRow.appendChild(moveBtn);
            titleRow.appendChild(removeBtn);

            const notesWrapper = document.createElement('div');
            notesWrapper.className = 'note-collapse-wrapper';
            if (this.collapsedNotes[taskId]) notesWrapper.classList.add('collapsed');
            notesWrapper.dataset.taskId = taskId;

            const notesTextarea = document.createElement('textarea');
            notesTextarea.className = 'focus-task-note';
            notesTextarea.placeholder = 'Notes...';
            notesTextarea.value = taskNote;
            notesTextarea.dataset.taskId = taskId;
            notesTextarea.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = this.scrollHeight + 'px';
                FocusDay.noteHeights[taskId] = this.scrollHeight;
            });
            notesTextarea.addEventListener('blur', (e) => {
                this.saveNote(taskId, e.target.value);
                if (!e.target.value.trim()) {
                    delete FocusDay.noteHeights[taskId];
                }
            });

            notesWrapper.appendChild(notesTextarea);
            card.appendChild(titleRow);
            card.appendChild(notesWrapper);

            taskList.appendChild(card);

            setTimeout(() => {
                const storedHeight = FocusDay.noteHeights[taskId];
                if (storedHeight) {
                    notesTextarea.style.height = storedHeight + 'px';
                } else if (taskNote.trim()) {
                    notesTextarea.style.height = 'auto';
                    notesTextarea.style.height = notesTextarea.scrollHeight + 'px';
                    FocusDay.noteHeights[taskId] = notesTextarea.scrollHeight;
                }
            }, 0);
        });

        dropZone.appendChild(taskList);
    },

    addTask(taskId) {
        const existingActiveDates = this.getOtherActivePinnedDates(taskId);
        const otherNoteDates = this.getOtherNoteDates(taskId);
        const otherActiveDates = existingActiveDates;

        if (otherActiveDates.length > 0) {
            this.moveTaskToCurrentDate(taskId, otherActiveDates[0]);
            return;
        }

        if (otherNoteDates.length > 0 && otherActiveDates.length === 0) {
            this.moveTaskToCurrentDate(taskId, otherNoteDates[0]);
            return;
        }

        const focusDay = this.getOrCreate(this.currentFocusDate);
        const taskIdStr = String(taskId);
        if (!focusDay.taskIds.includes(taskIdStr)) {
            focusDay.taskIds.push(taskIdStr);
            this.save(this.currentFocusDate, focusDay);
            this.render();
            this.triggerDataChange();
        }
    },

    moveTaskToCurrentDate(taskId, fromDateStr) {
        const taskIdStr = String(taskId);
        const fromFocus = this.get(fromDateStr);
        const note = fromFocus?.notes?.[taskIdStr] || '';

        if (fromFocus && fromFocus.taskIds) {
            fromFocus.taskIds = fromFocus.taskIds.filter(id => String(id) !== taskIdStr);
            if (note && fromFocus.notes) {
                delete fromFocus.notes[taskIdStr];
            }
            this.save(fromDateStr, fromFocus);
        }

        const toFocus = this.getOrCreate(this.currentFocusDate);
        if (!toFocus.taskIds.includes(taskIdStr)) {
            toFocus.taskIds.push(taskIdStr);
            if (note) {
                if (!toFocus.notes) toFocus.notes = {};
                toFocus.notes[taskIdStr] = note;
            }
            this.save(this.currentFocusDate, toFocus);
            this.render();
            this.triggerDataChange();
        }
    },

    moveTaskToDate(taskId, newDateStr) {
        const currentDate = this.currentFocusDate;
        const taskIdStr = String(taskId);

        if (newDateStr === currentDate) {
            this.closeMoveDialog();
            return;
        }

        const fromFocus = this.getOrCreate(currentDate);
        const note = fromFocus?.notes?.[taskIdStr] || '';

        if (fromFocus && fromFocus.taskIds) {
            fromFocus.taskIds = fromFocus.taskIds.filter(id => String(id) !== taskIdStr);
            if (note && fromFocus.notes) {
                delete fromFocus.notes[taskIdStr];
            }
            this.save(currentDate, fromFocus);
        }

        const toFocus = this.getOrCreate(newDateStr);
        const toTaskIdsStr = toFocus.taskIds.map(id => String(id));
        if (!toTaskIdsStr.includes(taskIdStr)) {
            toFocus.taskIds.push(taskIdStr);
            if (note) {
                if (!toFocus.notes) toFocus.notes = {};
                toFocus.notes[taskIdStr] = note;
            }
            this.save(newDateStr, toFocus);
        }

        this.closeMoveDialog();
        this.render();
        this.triggerDataChange();
    },

    showMoveDialog(taskId, event) {
        const btn = event.target.closest('.focus-task-move');
        if (!btn) return;

        const rect = btn.getBoundingClientRect();
        let topPos = rect.bottom + 5;
        let rightPos = window.innerWidth - rect.right;

        const existingDropdown = document.getElementById('move-dropdown-global');
        if (existingDropdown) {
            existingDropdown.remove();
        }

        const moveDropdown = document.createElement('div');
        moveDropdown.className = 'focus-task-move-dropdown';
        moveDropdown.id = 'move-dropdown-global';
        moveDropdown.style.top = topPos + 'px';
        moveDropdown.style.right = rightPos + 'px';
        moveDropdown.dataset.taskId = taskId;

        const dropdownHeader = document.createElement('div');
        dropdownHeader.className = 'move-dropdown-header';
        dropdownHeader.textContent = 'Move to...';

        const dateOptions = document.createElement('div');
        dateOptions.className = 'move-dropdown-options';

        const todayBtn = document.createElement('button');
        todayBtn.className = 'move-date-btn selected';
        todayBtn.textContent = 'Today';
        todayBtn.dataset.date = new Date().toISOString().split('T')[0];
        todayBtn.onclick = () => {
            document.querySelectorAll('#move-dropdown-global .move-date-btn').forEach(b => b.classList.remove('selected'));
            todayBtn.classList.add('selected');
            customDateInput.value = '';
        };

        const tomorrowBtn = document.createElement('button');
        tomorrowBtn.className = 'move-date-btn';
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrowBtn.textContent = 'Tomorrow';
        tomorrowBtn.dataset.date = tomorrow.toISOString().split('T')[0];
        tomorrowBtn.onclick = () => {
            document.querySelectorAll('#move-dropdown-global .move-date-btn').forEach(b => b.classList.remove('selected'));
            tomorrowBtn.classList.add('selected');
            customDateInput.value = '';
        };

        const customDateInput = document.createElement('input');
        customDateInput.type = 'date';
        customDateInput.className = 'move-date-input';
        customDateInput.addEventListener('click', () => {
            document.querySelectorAll('#move-dropdown-global .move-date-btn').forEach(b => b.classList.remove('selected'));
        });

        const confirmMoveBtn = document.createElement('button');
        confirmMoveBtn.className = 'move-confirm-btn';
        confirmMoveBtn.innerHTML = '&#10003;';
        confirmMoveBtn.setAttribute('aria-label', 'Confirm move');
        confirmMoveBtn.onclick = () => {
            const taskId = document.getElementById('move-dropdown-global').dataset.taskId;
            const selectedBtn = document.querySelector('#move-dropdown-global .move-date-btn.selected');
            if (selectedBtn) {
                this.moveTaskToDate(taskId, selectedBtn.dataset.date);
            } else if (customDateInput.value) {
                this.moveTaskToDate(taskId, customDateInput.value);
            }
            this.closeMoveDialog();
        };

        const cancelMoveBtn = document.createElement('button');
        cancelMoveBtn.className = 'move-cancel-btn';
        cancelMoveBtn.innerHTML = '&#10005;';
        cancelMoveBtn.setAttribute('aria-label', 'Cancel move');
        cancelMoveBtn.onclick = () => this.closeMoveDialog();

        dateOptions.appendChild(todayBtn);
        dateOptions.appendChild(tomorrowBtn);
        dateOptions.appendChild(customDateInput);
        dateOptions.appendChild(confirmMoveBtn);
        dateOptions.appendChild(cancelMoveBtn);

        moveDropdown.appendChild(dropdownHeader);
        moveDropdown.appendChild(dateOptions);

        document.body.appendChild(moveDropdown);

        const closeMoveDialogHandler = (e) => {
            if (moveDropdown.contains(e.target) || btn.contains(e.target)) {
                return;
            }
            this.closeMoveDialog();
        };

        moveDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        setTimeout(() => {
            document.addEventListener('click', closeMoveDialogHandler);
        }, 0);

        moveDropdown._closeHandler = closeMoveDialogHandler;
    },

    closeMoveDialog() {
        const dropdown = document.getElementById('move-dropdown-global');
        if (dropdown && dropdown._closeHandler) {
            document.removeEventListener('click', dropdown._closeHandler);
        }
        if (dropdown) {
            dropdown.remove();
        }
    },

    removeTask(taskId) {
        const taskIdStr = String(taskId);
        const focusDay = this.get(this.currentFocusDate);
        if (focusDay && focusDay.taskIds) {
            focusDay.taskIds = focusDay.taskIds.filter(id => String(id) !== taskIdStr);
            this.save(this.currentFocusDate, focusDay);
            delete this.collapsedNotes[taskId];
            delete this.noteHeights[taskId];
            this.render();
            this.triggerDataChange();
        }
    },

    saveNote(taskId, noteText) {
        const taskIdStr = String(taskId);
        const focusDay = this.getOrCreate(this.currentFocusDate);
        if (!focusDay.notes) {
            focusDay.notes = {};
        }
        if (noteText.trim()) {
            focusDay.notes[taskIdStr] = noteText;
        } else {
            delete focusDay.notes[taskIdStr];
        }
        this.save(this.currentFocusDate, focusDay);
        this.updateNoteIndicator(taskId);
    },

    getNote(taskId) {
        const focusDay = this.get(this.currentFocusDate);
        return focusDay?.notes?.[String(taskId)] || '';
    },

    updateNoteIndicator(taskId) {
        const icon = document.querySelector(`.note-collapse-icon[data-task-id="${taskId}"]`);
        if (icon) {
            const hasNote = Boolean(this.getNote(taskId));
            icon.classList.toggle('has-note', hasNote);
        }
    },

    toggleNoteCollapse(taskId) {
        this.collapsedNotes[taskId] = !this.collapsedNotes[taskId];
        const wrapper = document.querySelector(`.note-collapse-wrapper[data-task-id="${taskId}"]`);
        const icon = document.querySelector(`.note-collapse-icon[data-task-id="${taskId}"]`);
        const textarea = document.querySelector(`.focus-task-note[data-task-id="${taskId}"]`);
        if (wrapper) {
            wrapper.classList.toggle('collapsed', this.collapsedNotes[taskId]);
        }
        if (icon) {
            icon.classList.toggle('collapsed', this.collapsedNotes[taskId]);
        }
        if (textarea && !this.collapsedNotes[taskId] && textarea.value.trim()) {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        }
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
            const taskId = e.dataTransfer.getData('text/plain');
            if (taskId) {
                this.addTask(taskId);
            }
        });

        const prevBtn = document.getElementById('focus-prev');
        if (prevBtn) {
            prevBtn.onclick = () => this.navigatePrev();
        }

        const nextBtn = document.getElementById('focus-next');
        if (nextBtn) {
            nextBtn.onclick = () => this.navigateNext();
        }
    },

    init() {
        this.setupDragListeners();
        this.render();
    }
};
