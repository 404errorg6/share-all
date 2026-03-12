/**
 * Utility Functions (Single Source of Truth)
 */

const Utils = {
    /**
     * Format bytes to human-readable size
     */
    formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '—';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    },

    /**
     * Format date
     */
    formatDate(dateString) {
        if (!dateString) return '—';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '—';
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch(e) { return '—'; }
    },

    /**
     * Check if file is hidden (starts with dot)
     */
    isHiddenFile(name) {
        return name.startsWith('.');
    },

    /**
     * Get file type icon
     */
    getFileIcon(name, isFolder) {
        if (isFolder) return 'folder';
        const lowerName = name.toLowerCase();
        if (lowerName.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
        if (lowerName.match(/\.(mp4|mov|avi|mkv|flv|wmv)$/)) return 'movie';
        if (lowerName.match(/\.(mp3|wav|flac|aac|ogg)$/)) return 'audio_file';
        if (lowerName.match(/\.(pdf|doc|docx|txt|xlsx|xls|ppt|pptx)$/)) return 'article';
        if (lowerName.match(/\.(zip|rar|7z|tar|gz|bz2)$/)) return 'folder_zip';
        if (lowerName.match(/\.(exe|msi|dmg|pkg|deb|rpm)$/)) return 'install_desktop';
        if (lowerName.match(/\.(html|css|js|json|xml|yaml|py|go|java|cpp)$/)) return 'code';
        return 'description';
    },

    /**
     * Get color class for file icon
     */
    getColorClass(name, isFolder) {
        if (isFolder) return 'bg-primary/10 text-primary';
        const lowerName = name.toLowerCase();
        if (lowerName.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'bg-purple-500/10 text-purple-500';
        if (lowerName.match(/\.(mp4|mov|avi|mkv)$/)) return 'bg-red-500/10 text-red-500';
        if (lowerName.match(/\.(mp3|wav|flac)$/)) return 'bg-green-500/10 text-green-500';
        if (lowerName.match(/\.(pdf|doc|docx)$/)) return 'bg-orange-500/10 text-orange-500';
        if (lowerName.match(/\.(zip|rar|7z)$/)) return 'bg-yellow-500/10 text-yellow-500';
        return 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400';
    }
};

window.Utils = Utils;
