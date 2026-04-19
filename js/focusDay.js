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

        this.render();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    FocusDay.init();
});