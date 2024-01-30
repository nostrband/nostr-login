/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ['./src/components/**/*.{ts,tsx,html}'],
  darkMode: 'class',
  plugins: [
    require('@tailwindcss/forms')
  ],
}

