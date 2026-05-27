import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({ scale: 1.2 })
  ],
  theme: {
    colors: {
      brand: {
        orange: '#FF6B35',
        yellow: '#FFD166',
        coral:  '#FF4D6D',
        peach:  '#FFAB76',
        cream:  '#FFF8F0',
        warm:   '#FFF0E0',
        brown:  '#5C3D2E',
        dark:   '#1A0A00',
      }
    },
    fontFamily: {
      display: ['Fraunces', 'serif'],
      body:    ['Plus Jakarta Sans', 'sans-serif'],
      mono:    ['JetBrains Mono', 'monospace'],
    },
    borderRadius: {
      xl:  '1rem',
      '2xl': '1.5rem',
      '3xl': '2rem',
    }
  },
  shortcuts: {
    'btn-primary': 'bg-brand-orange text-white font-body font-600 px-6 py-3 rounded-2xl hover:bg-orange-600 transition-all duration-200 active:scale-95 cursor-pointer border-none',
    'btn-ghost':   'bg-transparent text-brand-brown font-body font-500 px-6 py-3 rounded-2xl hover:bg-brand-warm transition-all duration-200 cursor-pointer border-2 border-brand-orange/30',
    'card':        'bg-white rounded-3xl p-6 shadow-sm border border-orange-100',
    'tag':         'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-500',
  }
})
