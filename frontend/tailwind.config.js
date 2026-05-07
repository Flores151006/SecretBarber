/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        background:   '#0C0C0C',
        surface:      '#141414',
        'surface-2':  '#1A1A1A',
        'surface-3':  '#212121',
        gold:         '#C4943A',
        'gold-light': '#D4A84E',
        'gold-dim':   '#C4943A1A',
        foreground:   '#F0EBE3',
        muted:        '#6B6460',
        border:       '#252525',
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        mono:  ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem', letterSpacing: '0.08em' }],
      },
      letterSpacing: {
        widest2: '0.2em',
        widest3: '0.3em',
      },
      boxShadow: {
        'gold':       '0 0 24px rgba(196,148,58,0.22)',
        'gold-lg':    '0 0 48px rgba(196,148,58,0.3)',
        'gold-inner': 'inset 0 0 16px rgba(196,148,58,0.08)',
        'card':       '0 4px 32px rgba(0,0,0,0.6)',
        'card-hover': '0 20px 60px rgba(196,148,58,0.15), 0 8px 24px rgba(0,0,0,0.6)',
        'subtle':     '0 1px 3px rgba(0,0,0,0.4)',
      },
      animation: {
        'shimmer':    'shimmer 1.6s ease-in-out infinite',
        'pulse-gold': 'pulse-gold 3s ease-in-out infinite',
        'float':      'float 7s ease-in-out infinite',
        'fade-in':    'fadeInUp 0.5s ease-out forwards',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'pulse-gold': {
          '0%, 100%': { opacity: '0.3' },
          '50%':      { opacity: '0.7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
