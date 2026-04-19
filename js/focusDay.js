const FocusDay = {
    STORAGE_PREFIX: 'focusDay-',

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
    }
};