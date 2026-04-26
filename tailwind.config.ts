import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'crt-blue': '#5cd9ff',
        'crt-amber': '#ffb347',
        'crt-green': '#6cff9c',
        'crt-red': '#ff5566',
      },
      fontFamily: {
        vt323: ['VT323', 'monospace'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
