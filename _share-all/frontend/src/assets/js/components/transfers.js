import { Events } from '@wailsio/runtime';

globalThis.Components.Transfers = {
    STORAGE_KEY: 'ftp_transfer_history',
    LIMIT: 1000,
    isSubscribed: false,

    init() {
        if (this.isSubscribed) return;
        this.isSubscribed = true;
        
        // Listen for real-time transfer updates via Wails events
        Events.On('transfers', (event) => {
            const data = event && event.data ? event.data : event;
            this.handleTransferEvent(data);
        });
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

    handleTransferEvent(item) {
        if (!item || !item.Name) return;

        let lastState = this.getTracking();

        if (item.IsComplete) {
            this.addCompleted({
                ...item,
                Timestamp: Date.now()
            });
            // Immediately remove from tracking since it's confirmed finished
            const updated = lastState.filter(s => s.Name !== item.Name);
            sessionStorage.setItem('ftp_active_tracking', JSON.stringify(updated));
            return;
        }

        const index = lastState.findIndex(s => s.Name === item.Name);

        // Data from Wails event matches config.TransferInfo
        const updatedItem = {
            ...item,
            Timestamp: Date.now(),
            _seenActive: true
        };

        if (index > -1) {
            lastState[index] = { ...lastState[index], ...updatedItem };
        } else {
            lastState.push(updatedItem);
        }

        sessionStorage.setItem('ftp_active_tracking', JSON.stringify(lastState));
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
            const trackedItem = lastState.find(s => s.Name === name) || {};

            this.addCompleted({
                ...trackedItem,
                Name: name,
                IsDownload: trackedItem.IsDownload !== undefined ? trackedItem.IsDownload : true,
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
        const existingIndex = lastState.findIndex(s => s.Name === item.Name);

        if (existingIndex > -1) {
            // Update existing entry with any new metadata (like Size)
            lastState[existingIndex] = {
                ...lastState[existingIndex],
                TotalSize: lastState[existingIndex].TotalSize || item.TotalSize || item.Size || 0,
                IsDownload: item.IsDownload !== undefined ? item.IsDownload : lastState[existingIndex].IsDownload
            };
        } else {
            lastState.push({
                Name: item.Name,
                TotalSize: item.TotalSize || item.Size || 0,
                Written: 0,
                Percent: 0,
                IsDownload: item.IsDownload !== undefined ? item.IsDownload : true,
                Timestamp: Date.now(),
                _manual: true,
                _seenActive: false
            });
        }

        sessionStorage.setItem('ftp_active_tracking', JSON.stringify(lastState));
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
