/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1200px',
        '2xl': '1320px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'system-ui', 'sans-serif'],
        rounded: ['Nunito', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',

        primary: {
          DEFAULT: '#4A90E2',
          50:  '#EBF3FC',
          100: '#D7E7F9',
          200: '#AFCFF3',
          300: '#87B7EC',
          400: '#5FA0E6',
          500: '#4A90E2',
          600: '#2674C9',
          700: '#1D589A',
          800: '#143C6B',
          900: '#0B203C',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#50E3C2',
          50:  '#E6FBF7',
          100: '#CDF7EE',
          200: '#9CEFDD',
          300: '#6AE6CC',
          400: '#50E3C2',
          500: '#27CFA8',
          600: '#1FA686',
          700: '#177D65',
          800: '#0F5343',
          900: '#082A22',
          foreground: '#0F5343',
        },
        accent: {
          DEFAULT: '#FFB84D',
          50:  '#FFF6E6',
          100: '#FFEDCC',
          200: '#FFDB99',
          300: '#FFC966',
          400: '#FFB84D',
          500: '#FFA31A',
          600: '#E68A00',
          700: '#B36B00',
          800: '#804D00',
          900: '#4D2E00',
          foreground: '#4D2E00',
        },

        sun: '#FFD93D',
        coral: '#FF6B9D',
        mint: '#95E1D3',
        lavender: '#C39BD3',
        cream: '#FFF9F0',
        sky: '#A8DAFF',

        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(74, 144, 226, 0.12)',
        'soft-lg': '0 10px 40px -10px rgba(74, 144, 226, 0.25)',
        'glow': '0 0 30px rgba(80, 227, 194, 0.35)',
        'card': '0 2px 12px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 12px 32px -8px rgba(74, 144, 226, 0.25)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'wiggle': {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'float': 'float 4s ease-in-out infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #4A90E2 0%, #50E3C2 100%)',
        'gradient-warm': 'linear-gradient(135deg, #FFB84D 0%, #FF6B9D 100%)',
        'gradient-sky': 'linear-gradient(135deg, #A8DAFF 0%, #4A90E2 100%)',
        'gradient-soft': 'linear-gradient(180deg, #FFF9F0 0%, #FFFFFF 100%)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
