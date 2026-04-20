const FocusDay = {
    STORAGE_PREFIX: 'focusDay-',
    currentFocusDate: new Date().toISOString().split('T')[0],

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

    navigatePrev() {
        const current = new Date(this.currentFocusDate);
        current.setDate(current.getDate() - 1);
        this.currentFocusDate = current.toISOString().split('T')[0];
        this.render();
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

            const card = document.createElement('div');
            card.className = 'focus-task-card';

            const title = document.createElement('span');
            title.className = 'focus-task-title';
            title.textContent = task.text;
            if (task.completed) {
                title.classList.add('completed');
            }

            const removeBtn = document.createElement('button');
            removeBtn.className = 'focus-task-remove';
            removeBtn.innerHTML = '&times;';
            removeBtn.setAttribute('aria-label', `Remove "${task.text}" from daily focus`);
            removeBtn.onclick = () => this.removeTask(taskId);

            card.appendChild(title);
            card.appendChild(removeBtn);
            taskList.appendChild(card);
        });

        dropZone.appendChild(taskList);
    },

    addTask(taskId) {
        const focusDay = this.getOrCreate(this.currentFocusDate);
        if (!focusDay.taskIds.includes(taskId)) {
            focusDay.taskIds.push(taskId);
            this.save(this.currentFocusDate, focusDay);
            this.render();
        }
    },

    removeTask(taskId) {
        const focusDay = this.get(this.currentFocusDate);
        if (focusDay && focusDay.taskIds) {
            focusDay.taskIds = focusDay.taskIds.filter(id => id !== taskId);
            this.save(this.currentFocusDate, focusDay);
            this.render();
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
                this.addTask(taskId);
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