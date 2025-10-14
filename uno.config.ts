import { defineConfig } from 'unocss'
import { presetUno } from '@unocss/preset-uno'
import { presetWind } from '@unocss/preset-wind'
import { presetAttributify } from '@unocss/preset-attributify'

export default defineConfig({
  presets: [
    presetUno(),
    presetWind(),
    presetAttributify(),
  ],
  // Specify the output file for UnoCSS
  outFile: './src/styles/uno.css',
  theme: {
    colors: {
      primary: '#17739A',      // Main brand color from logo
      'primary-light': '#3BA9C6', // Accent color from logo
      secondary: '#6B7280',
      success: '#10B981',
      danger: '#EF4444',
      warning: '#F59E0B',
      info: '#3BA9C6',         // Using lighter brand color for info
      light: '#F3F4F6',
      dark: '#1F2937',
    },
  },
  shortcuts: {
    'btn': 'py-2 px-4 font-semibold rounded-lg shadow-md transition-colors duration-200',
    'btn-primary': 'bg-primary text-white hover:bg-[#1a8ab5]',
    'btn-secondary': 'bg-secondary text-white hover:bg-gray-600',
    'btn-danger': 'bg-danger text-white hover:bg-red-600',
    'input': 'px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary',
    'card': 'bg-white rounded-xl shadow-md p-6',
  },
})