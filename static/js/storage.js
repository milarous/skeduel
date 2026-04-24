const Storage = {
    API_URL: '/api/data',
    LOCAL_KEYS: {
        tasks: 'tasks',
        collapsedGroups: 'collapsedGroups',
        focusDays: 'focusDays',
        migrationFlag: 'storage_migrated_v1'
    },

    migrate() {
        const flag = localStorage.getItem(this.LOCAL_KEYS.migrationFlag);
        if (flag === 'true') return;

        const focusDays = {};
        let hasLegacyData = false;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('focusDay-')) {
                const dateStr = key.replace('focusDay-', '');
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data) {
                        focusDays[dateStr] = data;
                        hasLegacyData = true;
                    }
                } catch (e) {
                    console.warn('Failed to parse legacy focusDay data:', key);
                }
            }
        }

        if (hasLegacyData) {
            const existingFocusDays = JSON.parse(localStorage.getItem(this.LOCAL_KEYS.focusDays)) || {};
            const merged = { ...existingFocusDays, ...focusDays };
            localStorage.setItem(this.LOCAL_KEYS.focusDays, JSON.stringify(merged));

            for (const key in focusDays) {
                localStorage.removeItem('focusDay-' + key);
            }
        }

        localStorage.setItem(this.LOCAL_KEYS.migrationFlag, 'true');
    },

    setStatus(state) {
        let el = document.getElementById('save-status');
        if (!el) {
            el = document.createElement('div');
            el.id = 'save-status';
            const header = document.querySelector('.app-header');
            if (header) {
                header.appendChild(el);
            }
        }

        el.className = 'save-status save-status-' + state;

        if (state === 'saved') {
            el.innerHTML = '<span class="save-status-dot"></span> Saved';
            setTimeout(() => {
                el.style.opacity = '0';
            }, 3000);
        } else if (state === 'saving') {
            el.innerHTML = '<span class="save-status-dot"></span> Saving...';
            el.style.opacity = '1';
        } else if (state === 'failed') {
            el.innerHTML = '<span class="save-status-dot"></span> Save failed';
            el.style.opacity = '1';
        }
    },

    getFocusDays() {
        return JSON.parse(localStorage.getItem(this.LOCAL_KEYS.focusDays)) || {};
    },

    load() {
        this.migrate();

        return fetch(this.API_URL)
            .then(r => r.json())
            .then(data => {
                localStorage.setItem(this.LOCAL_KEYS.tasks, JSON.stringify(data.tasks || []));
                localStorage.setItem(this.LOCAL_KEYS.collapsedGroups, JSON.stringify(data.collapsedGroups || {}));
                localStorage.setItem(this.LOCAL_KEYS.focusDays, JSON.stringify(data.focusDays || {}));
                return data;
            })
            .catch(() => {
                return {
                    tasks: JSON.parse(localStorage.getItem(this.LOCAL_KEYS.tasks) || '[]'),
                    collapsedGroups: JSON.parse(localStorage.getItem(this.LOCAL_KEYS.collapsedGroups) || '{}'),
                    focusDays: this.getFocusDays()
                };
            });
    },

    save(data) {
        localStorage.setItem(this.LOCAL_KEYS.tasks, JSON.stringify(data.tasks || []));
        localStorage.setItem(this.LOCAL_KEYS.collapsedGroups, JSON.stringify(data.collapsedGroups || {}));
        localStorage.setItem(this.LOCAL_KEYS.focusDays, JSON.stringify(data.focusDays || {}));

        this.setStatus('saving');

        fetch(this.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(() => {
            this.setStatus('saved');
        }).catch(() => {
            this.setStatus('failed');
        });
    }
};