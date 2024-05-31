export default {
  content: ['./src/**/*.jsx'],
  theme: {
    fontFamily: {
      serif: ['Vollkorn'],
      sans: ['IBM\\ Plex\\ Sans'],
      mono: ['JetBrains\\ Mono']
    },
    extend: {
      colors: {
        // Based on https://uicolors.app/create
        // hsl(270, 100%, 50%)
        iris: {
          50: 'hsl(270, 70%, 98%)',
          75: 'hsl(270, 70%, 97%)',
          100: 'hsl(270, 70%, 95%)',
          150: 'hsl(270, 70%, 93%)',
          200: 'hsl(270, 70%, 90%)',
          300: 'hsl(270, 70%, 85%)',
          400: 'hsl(270, 70%, 75%)',
          500: 'hsl(270, 70%, 65%)',
          600: 'hsl(270, 70%, 55%)',
          700: 'hsl(270, 70%, 50%)',
          800: 'hsl(270, 70%, 45%)',
          900: 'hsl(270, 70%, 35%)',
          950: 'hsl(270, 70%, 25%)'
        }
      },
      listStyleType: {
        circle: 'circle',
        'lower-alpha': 'lower-alpha',
        'lower-roman': 'lower-roman'
      }
    }
  },
  plugins: []
}
