tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#50c2f7",
                "background-light": "#f5f7f8",
                "background-dark": "#121212",
                "console-bg": "#000000",
                "success": "#2e7d32",
                "danger": "#c62828",
                "status-text": "#4fc3f7",
                "log-text": "#b0b0b0",
                "surface-dark": "#1e292e",
            },
            fontFamily: {
                "display": ["Inter", "sans-serif"],
                "mono": ["JetBrains Mono", "monospace"],
            },
            borderRadius: { "DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px" },
        },
    },
}
