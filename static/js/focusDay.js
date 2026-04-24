const FocusDay = {
    currentFocusDate: new Date().toISOString().split('T')[0],
    collapsedNotes: {},
    noteHeights: {},

    TIME_SLOTS: ['morning', 'lunch', 'afternoon', 'late', 'unscheduled'],
    TIME_SLOT_LABELS: {
        morning: 'Morning (9-11)',
        lunch: 'Lunch (11-1)',
        afternoon: 'Afternoon (1-3)',
        late: 'Late (3-5)',
        unscheduled: 'Unscheduled'
    },

    get(dateStr) {
        const focusDays = Storage.getFocusDays();
        return focusDays[dateStr] || null;
    },

    save(dateStr, data) {
        const focusDays = Storage.getFocusDays();
        focusDays[dateStr] = data;
        Storage.save({ tasks, collapsedGroups, focusDays });
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
        const taskIdStr = String(taskId);
        const focusDays = Storage.getFocusDays();
        for (const dateStr in focusDays) {
            if (dateStr !== this.currentFocusDate) {
                const focusDay = focusDays[dateStr];
                const taskIds = focusDay?.taskIds?.map(id => String(id)) || [];
                if (taskIds.includes(taskIdStr)) {
                    dates.push(dateStr);
                }
            }
        }
        return dates.sort();
    },

    getOtherNoteDates(taskId) {
        const dates = [];
        const taskIdStr = String(taskId);
        const focusDays = Storage.getFocusDays();
        for (const dateStr in focusDays) {
            if (dateStr !== this.currentFocusDate) {
                const focusDay = focusDays[dateStr];
                const notes = focusDay?.notes || {};
                if (notes[taskIdStr]) {
                    dates.push(dateStr);
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
        const today = new Date().toISOString().split('T')[0];
        if (this.currentFocusDate === today) return;

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

        this.updatePrevButtonState();
        this.renderTasks();
    },

    updatePrevButtonState() {
        const prevBtn = document.getElementById('focus-prev');
        if (!prevBtn) return;
        const today = new Date().toISOString().split('T')[0];
        const isToday = this.currentFocusDate === today;
        prevBtn.disabled = isToday;
    },

    renderTasks() {
        const dropZone = document.getElementById('focus-drop-zone');
        if (!dropZone) return;

        const focusDay = this.getOrCreate(this.currentFocusDate);
        const taskIds = focusDay.taskIds || [];

        const existingSlotsContainer = dropZone.querySelector('.time-slots-container');
        if (existingSlotsContainer) {
            existingSlotsContainer.remove();
        }

        const slotsContainer = document.createElement('div');
        slotsContainer.className = 'time-slots-container';
        slotsContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            const list = e.target.closest('.focus-task-list');
            if (list) {
                e.dataTransfer.dropEffect = 'move';
                list.classList.add('drag-over');
            }
        });
        slotsContainer.addEventListener('dragleave', (e) => {
            const list = e.target.closest('.focus-task-list');
            if (list && e.relatedTarget && !list.contains(e.relatedTarget)) {
                list.classList.remove('drag-over');
            }
        });
        slotsContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            const taskId = e.dataTransfer.getData('text/plain');
            const list = e.target.closest('.focus-task-list');
            if (list && taskId) {
                list.classList.remove('drag-over');
                const slot = list.dataset.slot;
                this.addTaskToSlot(taskId, slot);
            }
        });

        this.TIME_SLOTS.forEach(slot => {
            const section = document.createElement('div');
            section.className = 'time-slot-section';
            section.dataset.slot = slot;

            const header = document.createElement('div');
            header.className = 'time-slot-header';

            const label = document.createElement('span');
            label.className = 'time-slot-label';
            label.textContent = this.TIME_SLOT_LABELS[slot];

            const count = document.createElement('span');
            count.className = 'time-slot-count';
            count.dataset.slot = slot;

            header.appendChild(label);
            header.appendChild(count);

            const taskList = document.createElement('div');
            taskList.className = 'focus-task-list';
            taskList.dataset.slot = slot;

            section.appendChild(header);
            section.appendChild(taskList);
            slotsContainer.appendChild(section);
        });

        dropZone.appendChild(slotsContainer);

        taskIds.forEach(taskId => {
            const task = tasks.find(t => String(t.id) === taskId);
            if (!task) return;

            const slot = focusDay.timeSlots?.[taskId] || 'unscheduled';
            const taskList = slotsContainer.querySelector(`.focus-task-list[data-slot="${slot}"]`);
            if (!taskList) return;

            const notes = focusDay.notes || {};
            const taskNote = notes[taskId] || '';

            const card = document.createElement('div');
            card.className = 'focus-task-card';
            card.draggable = true;
            card.dataset.taskId = taskId;
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', taskId);
                e.dataTransfer.effectAllowed = 'move';
                card.classList.add('dragging');
            });
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });

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
            if (this.collapsedNotes[taskId] !== false) collapseBtn.classList.add('collapsed');
            collapseBtn.innerHTML = '<span class="note-icon-text">📝 Notes</span><span class="note-icon-arrow">▼</span>';
            collapseBtn.onclick = () => this.toggleNoteCollapse(taskId);

            titleRow.appendChild(titleWrapper);
            titleRow.appendChild(collapseBtn);
            titleRow.appendChild(moveBtn);
            titleRow.appendChild(removeBtn);

            const notesWrapper = document.createElement('div');
            notesWrapper.className = 'note-collapse-wrapper';
            if (this.collapsedNotes[taskId] !== false) notesWrapper.classList.add('collapsed');
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

        this.updateSlotCounts();
    },

    addTaskToSlot(taskId, slot) {
        const taskIdStr = String(taskId);
        const focusDay = this.getOrCreate(this.currentFocusDate);

        if (!focusDay.taskIds.includes(taskIdStr)) {
            const otherDates = this.getOtherActivePinnedDates(taskId);
            if (otherDates.length > 0) {
                this.moveTaskToCurrentDate(taskId, otherDates[0]);
                if (!focusDay.timeSlots) focusDay.timeSlots = {};
                focusDay.timeSlots[taskIdStr] = slot;
                this.save(this.currentFocusDate, focusDay);
                this.render();
                this.triggerDataChange();
                return;
            }

            const otherNoteDates = this.getOtherNoteDates(taskId);
            if (otherNoteDates.length > 0) {
                this.moveTaskToCurrentDate(taskId, otherNoteDates[0]);
                if (!focusDay.timeSlots) focusDay.timeSlots = {};
                focusDay.timeSlots[taskIdStr] = slot;
                this.save(this.currentFocusDate, focusDay);
                this.render();
                this.triggerDataChange();
                return;
            }

            focusDay.taskIds.push(taskIdStr);
        }

        if (!focusDay.timeSlots) focusDay.timeSlots = {};
        focusDay.timeSlots[taskIdStr] = slot;
        this.save(this.currentFocusDate, focusDay);
        this.render();
        this.triggerDataChange();
    },

    updateSlotCounts() {
        const focusDay = this.get(this.currentFocusDate);
        if (!focusDay) return;

        this.TIME_SLOTS.forEach(slot => {
            let count = 0;
            focusDay.taskIds.forEach(taskId => {
                const task = tasks.find(t => String(t.id) === taskId);
                if (!task) return;
                const slotForTask = focusDay.timeSlots?.[taskId] || 'unscheduled';
                if (slotForTask === slot) {
                    count++;
                }
            });
            const countEl = document.querySelector(`.time-slot-count[data-slot="${slot}"]`);
            if (countEl) {
                countEl.textContent = count > 0 ? count : '';
            }
        });
    },

    addTask(taskId) {
        const existingActiveDates = this.getOtherActivePinnedDates(taskId);
        const otherNoteDates = this.getOtherNoteDates(taskId);

        if (existingActiveDates.length > 0) {
            this.moveTaskToCurrentDate(taskId, existingActiveDates[0]);
            this.setTimeSlot(taskId, 'unscheduled');
            return;
        }

        if (otherNoteDates.length > 0 && existingActiveDates.length === 0) {
            this.moveTaskToCurrentDate(taskId, otherNoteDates[0]);
            this.setTimeSlot(taskId, 'unscheduled');
            return;
        }

        const focusDay = this.getOrCreate(this.currentFocusDate);
        const taskIdStr = String(taskId);
        if (!focusDay.taskIds.includes(taskIdStr)) {
            focusDay.taskIds.push(taskIdStr);
            this.setTimeSlot(taskId, 'unscheduled');
            this.save(this.currentFocusDate, focusDay);
            this.render();
            this.triggerDataChange();
        }
    },

moveTaskToCurrentDate(taskId, fromDateStr) {
        const taskIdStr = String(taskId);
        const fromFocus = this.get(fromDateStr);
        const note = fromFocus?.notes?.[taskIdStr] || '';
        const timeSlot = fromFocus?.timeSlots?.[taskIdStr] || 'unscheduled';

        if (fromFocus && fromFocus.taskIds) {
            fromFocus.taskIds = fromFocus.taskIds.filter(id => String(id) !== taskIdStr);
            if (note && fromFocus.notes) {
                delete fromFocus.notes[taskIdStr];
            }
            if (fromFocus.timeSlots) {
                delete fromFocus.timeSlots[taskIdStr];
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
            if (!toFocus.timeSlots) toFocus.timeSlots = {};
            toFocus.timeSlots[taskIdStr] = timeSlot;
            this.save(this.currentFocusDate, toFocus);
        }
        this.render();
        this.triggerDataChange();
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
        const timeSlot = fromFocus?.timeSlots?.[taskIdStr] || 'unscheduled';

        if (fromFocus && fromFocus.taskIds) {
            fromFocus.taskIds = fromFocus.taskIds.filter(id => String(id) !== taskIdStr);
            if (note && fromFocus.notes) {
                delete fromFocus.notes[taskIdStr];
            }
            if (fromFocus.timeSlots) {
                delete fromFocus.timeSlots[taskIdStr];
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
            if (!toFocus.timeSlots) toFocus.timeSlots = {};
            toFocus.timeSlots[taskIdStr] = timeSlot;
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

    getTimeSlot(taskId) {
        const focusDay = this.getOrCreate(this.currentFocusDate);
        return focusDay?.timeSlots?.[String(taskId)] || 'unscheduled';
    },

    setTimeSlot(taskId, slot) {
        const focusDay = this.getOrCreate(this.currentFocusDate);
        if (!focusDay.timeSlots) focusDay.timeSlots = {};
        focusDay.timeSlots[String(taskId)] = slot;
        this.save(this.currentFocusDate, focusDay);
    },

    updateNoteIndicator(taskId) {
        const icon = document.querySelector(`.note-collapse-icon[data-task-id="${taskId}"]`);
        if (icon) {
            const hasNote = Boolean(this.getNote(taskId));
            icon.classList.toggle('has-note', hasNote);
        }
    },

    toggleNoteCollapse(taskId) {
        const isCurrentlyCollapsed = this.collapsedNotes[taskId] !== false;
        this.collapsedNotes[taskId] = !isCurrentlyCollapsed;
        const wrapper = document.querySelector(`.note-collapse-wrapper[data-task-id="${taskId}"]`);
        const icon = document.querySelector(`.note-collapse-icon[data-task-id="${taskId}"]`);
        const textarea = document.querySelector(`.focus-task-note[data-task-id="${taskId}"]`);
        wrapper?.classList.toggle('collapsed', !isCurrentlyCollapsed);
        icon?.classList.toggle('collapsed', !isCurrentlyCollapsed);
        if (textarea && isCurrentlyCollapsed && textarea.value.trim()) {
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
