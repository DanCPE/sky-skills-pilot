/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontSize: {
        xs: ['calc(0.75rem * var(--font-scale, 1.5))', { lineHeight: 'calc(1rem * var(--font-scale, 1.5))' }],
        sm: ['calc(0.875rem * var(--font-scale, 1.5))', { lineHeight: 'calc(1.25rem * var(--font-scale, 1.5))' }],
        base: ['calc(1rem * var(--font-scale, 1.5))', { lineHeight: 'calc(1.5rem * var(--font-scale, 1.5))' }],
        lg: ['calc(1.125rem * var(--font-scale, 1.5))', { lineHeight: 'calc(1.75rem * var(--font-scale, 1.5))' }],
        xl: ['calc(1.25rem * var(--font-scale, 1.5))', { lineHeight: 'calc(1.75rem * var(--font-scale, 1.5))' }],
        '2xl': ['calc(1.5rem * var(--font-scale, 1.5))', { lineHeight: 'calc(2rem * var(--font-scale, 1.5))' }],
        '3xl': ['calc(1.875rem * var(--font-scale, 1.5))', { lineHeight: 'calc(2.25rem * var(--font-scale, 1.5))' }],
        '4xl': ['calc(2.25rem * var(--font-scale, 1.5))', { lineHeight: 'calc(2.5rem * var(--font-scale, 1.5))' }],
        '5xl': ['calc(3rem * var(--font-scale, 1.5))', { lineHeight: '1' }],
        '6xl': ['calc(3.75rem * var(--font-scale, 1.5))', { lineHeight: '1' }],
        '7xl': ['calc(4.5rem * var(--font-scale, 1.5))', { lineHeight: '1' }],
        '8xl': ['calc(6rem * var(--font-scale, 1.5))', { lineHeight: '1' }],
        '9xl': ['calc(8rem * var(--font-scale, 1.5))', { lineHeight: '1' }],
      },
    },
  },
};
