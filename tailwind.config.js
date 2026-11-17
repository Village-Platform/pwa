// Colours are CSS variables (src/index.css) so light / dark switch without re-rendering classes.
// Token names match the Android app's Aghour.colors (ui/theme/Theme.kt).
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        page: token("page"),
        surface: token("surface"),
        surface2: token("surface2"),
        ink: token("ink"),
        muted: token("muted"),
        line: token("line"),
        gold: token("gold"),
        goldInk: token("goldInk"),
        brand: token("brand"),
        ok: token("ok"),
        bad: token("bad"),
      },
      fontFamily: { sans: ["Cairo", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
