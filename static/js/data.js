let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let collapsedGroups = JSON.parse(localStorage.getItem('collapsedGroups')) || {};

const RecurrenceEngine = {
    calculateNextInstance(task) {
        if (!task.recurrence || !task.recurrence.enabled) return null;
        const { frequency, interval, startDate, currentInstance } = task.recurrence;
        const baseDate = new Date(startDate || task.dueDate || task.createdAt);
        baseDate.setHours(0, 0, 0, 0);
        const instance = currentInstance || 1;
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
        return baseDate.toISOString().split('T')[0];
    },
    isExpired(task) {
        if (!task.recurrence || !task.recurrence.enabled) return false;
        const { expiryType, expiryDate, expiryCount, currentInstance } = task.recurrence;
        if (expiryType === 'date') {
            if (!expiryDate) return false;
            const nextInstance = currentInstance + 1;
            const baseDate = new Date(task.recurrence.startDate || task.dueDate || task.createdAt);
            baseDate.setHours(0, 0, 0, 0);
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
            const nextDate = baseDate.toISOString().split('T')[0];
            return nextDate > expiryDate;
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
    localStorage.setItem('tasks', JSON.stringify(tasks));
    if (typeof FocusDay !== 'undefined') FocusDay.render();
}

function saveCollapsedGroups() {
    localStorage.setItem('collapsedGroups', JSON.stringify(collapsedGroups));
}