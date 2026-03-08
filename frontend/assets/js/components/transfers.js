/**
 * Transfer Service Logic
 */

Components.Transfers = {
    STORAGE_KEY: 'ftp_transfer_history',
    LIMIT: 1000,
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

        // Check for duplicates within a small time window
        const isDup = history.some(h =>
            h.Name === item.Name &&
            Math.abs((h.Timestamp || 0) - (item.Timestamp || Date.now())) < 5000
        );
        if (isDup) return;

        item.Timestamp = item.Timestamp || Date.now();
        item.Status = 'Completed';
        item.Percent = 100;

        // Ensure IsDownload is boolean and properly set
        if (item.IsDownload === undefined) item.IsDownload = true;

        history.unshift(item);
        if (history.length > this.LIMIT) {
            history = history.slice(0, this.LIMIT);
        }

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));

        // Dispatch events for UI updates
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

            setTimeout(() => poll(), 500);
        };

        poll();
    },

    extractFileName(line) {
        if (!line) return null;
        // Strip [LOGS]: prefix and any leading timestamps or system tags
        let clean = line.replace(/^\[.*?\]:\s*/, '')
            .replace(/^.*?\d{2}:\d{2}:\d{2}\s*/, '')
            .trim();

        // Match "Downloading NAME..." or "Uploading NAME..."
        const startMatch = clean.match(/^(?:Downloading|Uploading)\s+(.+?)(?:\.\.\.)?$/);
        if (startMatch) return startMatch[1].trim();

        // Match "NAME completed!"
        const endMatch = clean.match(/^(.+?)\s+completed!$/);
        if (endMatch) return endMatch[1].trim();

        return null;
    },

    handleLog(line) {
        if (!line) return;

        const name = this.extractFileName(line);
        if (!name) return;

        if (line.includes('Downloading ') || line.includes('Uploading ')) {
            this.startTracking({
                Name: name,
                IsDownload: line.includes('Downloading')
            });
        } else if (line.includes(' completed!') && !line.includes('ERROR')) {
            const lastState = this.getTracking();
            const trackedItem = lastState.find(s => s.Name === name);
            const isDownload = trackedItem ? trackedItem.IsDownload : true;

            this.addCompleted({
                Name: name,
                IsDownload: isDownload,
                Timestamp: Date.now()
            });

            // Immediately remove from tracking since it's confirmed finished
            const updated = lastState.filter(s => s.Name !== name);
            sessionStorage.setItem('ftp_active_tracking', JSON.stringify(updated));
        }
    },

    getActive() {
        return this.getTracking();
    },

    getTracking() {
        try {
            const input = sessionStorage.getItem('ftp_active_tracking');
            const parsed = JSON.parse(input || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    },

    startTracking(item) {
        if (!item || !item.Name) return;
        let lastState = this.getTracking();

        if (lastState.some(s => s.Name === item.Name)) return;

        lastState.push({
            Name: item.Name,
            TotalSize: item.TotalSize || 0,
            Written: 0,
            Percent: 0,
            IsDownload: item.isDownload === undefined ? item.IsDownload : item.isDownload,
            Timestamp: Date.now(),
            _manual: true,
            _seenActive: false
        });

        sessionStorage.setItem('ftp_active_tracking', JSON.stringify(lastState));
    },

    processActiveTransfers(activeData) {
        if (!activeData || activeData === "null") activeData = [];
        const lastState = this.getTracking();
        const liveMap = new Map(activeData.map(d => [d.Name, d]));

        const stillInState = [];

        lastState.forEach(prev => {
            const liveItem = liveMap.get(prev.Name);

            if (liveItem) {
                // Merge live metrics (Percent, Written, TotalSize) into Tracking
                const updated = {
                    ...prev,
                    ...liveItem,
                    _seenActive: true
                };
                stillInState.push(updated);

                // Remove from liveMap so we don't add it as "brand new" later
                liveMap.delete(prev.Name);
            } else {
                // Trigger completion if it disappeared from active list
                const age = Date.now() - (prev.Timestamp || 0);
                if (prev._seenActive || age > 30000) {
                    this.addCompleted({
                        ...prev,
                        Percent: 100,
                        Timestamp: Date.now()
                    });
                } else {
                    // Keep waiting for it to appear in API or log
                    stillInState.push(prev);
                }
            }
        });

        // Add brand new items from API that weren't in tracking yet
        liveMap.forEach(liveItem => {
            stillInState.push({
                ...liveItem,
                _seenActive: true,
                _manual: false,
                Timestamp: Date.now()
            });
        });

        sessionStorage.setItem('ftp_active_tracking', JSON.stringify(stillInState));
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
