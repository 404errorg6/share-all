/**
 * Transfer Service Logic
 */

Components.Transfers = {
    STORAGE_KEY: 'ftp_transfer_history',
    LIMIT: 50,
    isPolling: false,

    init() {
        if (this.isPolling) return;
        this.isPolling = true;
        this.startBackgroundPolling();
    },

    getHistory() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
        } catch (e) {
            return [];
        }
    },

    addCompleted(item) {
        if (!item || !item.Name) return;
        let history = this.getHistory();

        // Check for duplicates
        const isDup = history.some(h =>
            h.Name === item.Name &&
            Math.abs((h.Timestamp || 0) - (item.Timestamp || Date.now())) < 10000
        );

        if (isDup) return;

        item.Timestamp = item.Timestamp || Date.now();
        item.Status = 'Completed';
        item.Percent = 100;

        history.unshift(item);
        if (history.length > this.LIMIT) {
            history = history.slice(0, this.LIMIT);
        }

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));

        // Dispatch event
        window.dispatchEvent(new CustomEvent('transfer-completed', { detail: item }));
    },

    startBackgroundPolling() {
        const poll = async () => {
            try {
                const response = await fetch('/api/ftp/transfers');
                if (response.ok) {
                    const data = await response.json();
                    this.processActiveTransfers(data || []);
                }
            } catch (e) { }

            setTimeout(() => poll(), 1000);
        };

        poll();
    },

    processActiveTransfers(activeData) {
        if (!activeData || activeData === "null") activeData = [];

        const lastStateInput = sessionStorage.getItem('ftp_active_tracking');
        let lastState = [];
        try {
            const parsed = JSON.parse(lastStateInput || '[]');
            lastState = Array.isArray(parsed) ? parsed : [];
        } catch (e) { }

        const activeNames = new Set(activeData.map(d => d.Name));

        lastState.forEach(prev => {
            if (!activeNames.has(prev.Name) && (prev.Percent > 0 || prev.Written > 0)) {
                this.addCompleted({
                    ...prev,
                    Percent: 100,
                    Timestamp: Date.now()
                });
            }
        });

        sessionStorage.setItem('ftp_active_tracking', JSON.stringify(activeData));
    },

    clearHistory() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
        window.dispatchEvent(new CustomEvent('transfer-completed')); // Trigger re-render
    },

    clearItems(names) {
        if (!names || names.length === 0) return;
        let history = this.getHistory();
        history = history.filter(h => !names.includes(h.Name));
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
        window.dispatchEvent(new CustomEvent('transfer-completed')); // Trigger re-render
    }
};
