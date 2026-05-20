let tasks = [];
let collapsedGroups = {};

const RecurrenceEngine = {
    calculateNextInstance(task) {
        if (!task.recurrence || !task.recurrence.enabled) return null;
        const { frequency, interval = 1, startDate, currentInstance } = task.recurrence;
        const instance = currentInstance || 1;

        const parseLocalDate = (dateStr) => {
            if (!dateStr) return null;
            const isoDateMatch = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
            if (isoDateMatch) {
                const [y, m, d] = dateStr.split('-').map(Number);
                return new Date(y, m - 1, d);
            }
            const d = new Date(dateStr);
            d.setHours(0, 0, 0, 0);
            return d;
        };

        const formatLocalDate = (dateObj) => {
            const y = dateObj.getFullYear();
            const m = String(dateObj.getMonth() + 1).padStart(2, '0');
            const d = String(dateObj.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        };

        const baseDate = parseLocalDate(startDate || task.dueDate || task.createdAt);
        if (!baseDate) return null;

        switch (frequency) {
            case 'daily':
                baseDate.setDate(baseDate.getDate() + (interval * (instance - 1)));
                break;
            case 'weekly':
                baseDate.setDate(baseDate.getDate() + (interval * 7 * (instance - 1)));
                break;
            case 'monthly':
                baseDate.setMonth(baseDate.getMonth() + (interval * (instance - 1)));
                break;
            case 'yearly':
                baseDate.setFullYear(baseDate.getFullYear() + (interval * (instance - 1)));
                break;
        }

        return formatLocalDate(baseDate);
    },
    isExpired(task) {
        if (!task.recurrence || !task.recurrence.enabled) return false;
        const { expiryType, expiryDate, expiryCount, currentInstance } = task.recurrence;
        const parseLocalDate = (dateStr) => {
            if (!dateStr) return null;
            const isoDateMatch = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
            if (isoDateMatch) {
                const [y, m, d] = dateStr.split('-').map(Number);
                return new Date(y, m - 1, d);
            }
            const d = new Date(dateStr);
            d.setHours(0, 0, 0, 0);
            return d;
        };

        if (expiryType === 'date') {
            if (!expiryDate) return false;
            const nextInstance = currentInstance + 1;
            const baseDate = parseLocalDate(task.recurrence.startDate || task.dueDate || task.createdAt);
            if (!baseDate) return false;
            switch (task.recurrence.frequency) {
                case 'daily':
                    baseDate.setDate(baseDate.getDate() + (task.recurrence.interval * (nextInstance - 1)));
                    break;
                case 'weekly':
                    baseDate.setDate(baseDate.getDate() + (task.recurrence.interval * 7 * (nextInstance - 1)));
                    break;
                case 'monthly':
                    baseDate.setMonth(baseDate.getMonth() + (task.recurrence.interval * (nextInstance - 1)));
                    break;
                case 'yearly':
                    baseDate.setFullYear(baseDate.getFullYear() + (task.recurrence.interval * (nextInstance - 1)));
                    break;
            }
            const nextDateStr = (() => {
                const y = baseDate.getFullYear();
                const m = String(baseDate.getMonth() + 1).padStart(2, '0');
                const d = String(baseDate.getDate()).padStart(2, '0');
                return `${y}-${m}-${d}`;
            })();
            return nextDateStr > expiryDate;
        }
        if (expiryType === 'count') {
            return (currentInstance + 1) >= expiryCount;
        }
        return false;
    },
    advanceToNextInstance(task) {
        if (!task.recurrence || !task.recurrence.enabled) return task;
        const newInstance = task.recurrence.currentInstance + 1;
        if (this.isExpired({ ...task, recurrence: { ...task.recurrence, currentInstance: newInstance } })) {
            return { ...task, completed: true };
        }
        const nextDueDate = this.calculateNextInstance({
            ...task,
            recurrence: { ...task.recurrence, currentInstance: newInstance }
        });
        return {
            ...task,
            dueDate: nextDueDate,
            completed: false,
            recurrence: { ...task.recurrence, currentInstance: newInstance }
        };
    }
};

function saveTasks() {
    tasks.forEach(task => {
        if (!task.subtasks) {
            task.subtasks = [];
        }
    });
    Storage.save({ tasks, collapsedGroups, focusDays: Storage.getFocusDays() });
    if (typeof FocusDay !== 'undefined') FocusDay.render();
}

function saveCollapsedGroups() {
    Storage.save({ tasks, collapsedGroups, focusDays: Storage.getFocusDays() });
}