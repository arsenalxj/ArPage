/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#111111',
          dark: '#2A2A2A',
          mid: '#444444',
          label: '#555555',
          secondary: '#777777',
          muted: '#999999',
          pale: '#AAAAAA',
        },
        paper: {
          DEFAULT: '#F4F4F2',
          bg: '#E8E8E5',
          section: '#E2E2E2',
        },
        'border-default': '#CCCCCC',
        'border-section': '#BBBBBB',
        'border-divider': '#DDDDDD',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['Lora', 'Georgia', 'serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      boxShadow: {
        'ink-1': '1px 1px 0 #CCCCCC',
        'ink-2': '2px 2px 0 #AAAAAA',
        'ink-2f': '2px 2px 0 #999999',
        'ink-3': '3px 3px 0 #BBBBBB',
        'ink-4': '4px 4px 0 #AAAAAA',
        'ink-5': '5px 5px 0 #BBBBBB',
      },
      borderRadius: {
        xs: '4px',
        sm: '5px',
        md: '6px',
        DEFAULT: '7px',
        lg: '8px',
        xl: '12px',
      },
    },
  },
  plugins: [],
}
