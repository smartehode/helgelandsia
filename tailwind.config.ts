import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/app/(frontend)/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Helgeland-paletten: hav, fjell og midnattssol
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          500: '#1f6feb',
          600: '#1858c4',
          700: '#13449a',
          900: '#0b2a63',
        },
        sea: '#0d4f6c',
        sand: '#f5f1e8',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
      maxWidth: {
        prose: '70ch',
      },
    },
  },
  plugins: [],
}

export default config
