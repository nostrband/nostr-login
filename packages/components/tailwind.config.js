/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ['./src/components/**/*.{ts,tsx,html}'],
  darkMode: 'class',
  plugins: [
    require('@tailwindcss/forms')
  ],
  theme: {
    fontSize: {
      sm: ['14px', '20px'],
      xs: ['12px', '16px'],
      base: ['16px', '24px'],
      lg: ['18px', '28px'],
      xl: ['20px', '28px'],
      "2xl": ['24px', '32px'],
      "3xl": ['30px', '36px'],
      "4xl": ['36px', '40px'],
      "5xl": ['48px', '1'],
      "6xl": ['60px', '1'],
      "7xl": ['72px', '1'],
      "8xl": ['96px', '1'],
      "9xl": ['128px', '1'],
    },
    extend: {
      maxWidth: {
        "lg": "512px",
      },
      spacing: {
        "0": "0px",
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "5": "20px",
        "6": "24px",
        "7": "28px",
        "8": "32px",
        "9": "36px",
        "10": "40px",
        "11": "44px",
        "12": "48px",
        "14": "56px",
        "16": "64px",
        "20": "80px",
        "24": "96px",
        "28": "112px",
        "32": "128px",
        "36": "144px",
        "40": "160px",
        "44": "176px",
        "48": "192px",
        "52": "208px",
        "56": "224px",
        "60": "240px",
        "64": "256px",
        "72": "288px",
        "80": "320px",
        "96": "384px",
        "px": "1px",
        "0.5": "2px",
        "1.5": "6px",
        "2.5": "10px",
        "3.5": "14px"
      }
    }
  }
}
