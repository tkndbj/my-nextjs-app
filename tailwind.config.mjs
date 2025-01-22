// tailwind.config.mjs

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'jade-green': '#00A86B',
        background: "var(--background)",
        foreground: "var(--foreground)",
        secondaryBackground: "var(--secondary-background)",
        accent: "var(--accent-color)",
        // Add more if needed
      },
      fontFamily: {
        figtree: ['"Figtree"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
