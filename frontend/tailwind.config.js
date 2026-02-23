/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a365d',
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#1a365d',
        },
        secondary: {
          DEFAULT: '#d4af37',
          50: '#fffdf5',
          100: '#fff7e0',
          200: '#ffebb3',
          300: '#ffdd80',
          400: '#ffce4d',
          500: '#d4af37',
          600: '#b8962e',
          700: '#937925',
          800: '#6e5c1c',
          900: '#4a3f13',
        },
        background: '#fdfcf8',
        surface: '#ffffff',
        muted: '#6b7280',
        success: '#2d6a4f',
        danger: '#b91c1c',
        warning: '#c2410c',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        serif: ['Playfair Display', 'Times New Roman', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
      },
      boxShadow: {
        soft: '0 12px 30px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        DEFAULT: '10px',
        sm: '6px',
      },
    },
  },
  plugins: [],
}
