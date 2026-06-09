import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/app/(frontend)/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        fjord: '#0C2733',
        sea: '#103743',
        fog: '#EEF1EF',
        paper: '#FBFCFC',
        sun: '#DDA13A',
        ink: '#16242B',
        muted: '#5C6F77',
        sand: '#f3efe6',
        brand: {
          50: '#eaf3f5', 100: '#cfe6eb', 200: '#a7d2da', 300: '#74b6c3',
          400: '#3f93a6', 500: '#1f6276', 600: '#1a5364', 700: '#173f4c', 900: '#0c2733',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
      maxWidth: { prose: '68ch' },
      letterSpacing: { eyebrow: '0.18em' },
    },
  },
  plugins: [],
}
export default config
