/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F1F0EC",
        panel: "#E8E5DA",
        panel2: "#DFDBCC",
        ink: "#1C2333",
        inkmuted: "#63677A",
        line: "#D3CFC2",
        flag: "#AD3A2C",
        flagsoft: "#F1DAD3",
        clear: "#3E6355",
        clearsoft: "#DCE6DE",
      },
      fontFamily: {
        serif: ["'Source Serif 4'", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
}
