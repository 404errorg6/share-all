/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./frontend/pages/**/*.{html,js}",
        "./frontend/assets/js/**/*.js",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                "primary": "#50c2f7",
                "background-light": "#f5f7f8",
                "background-dark": "#101c22",
                "surface-dark": "#1b2327",
                "danger": "#ff4d4d",
                "success": "#22c55e",
                "warning": "#f59e0b",
            },
            fontFamily: {
                "display": ["Inter", "sans-serif"],
            },
            borderRadius: {
                "DEFAULT": "0.25rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "2xl": "1rem",
                "3xl": "1.5rem",
                "full": "9999px",
            }
        },
    },
    plugins: [],
}
