import { defineConfig, presetUno, presetTypography, presetIcons } from 'unocss';

export default defineConfig({
  presets: [
    presetUno(),
    presetTypography(),
    presetIcons()
  ],
  theme: {
    colors: {
      bg: '#0f1115',
      panel: '#1b1e26',
      accent: '#1e88e5',
      text: '#e7e9ee',
      sub: '#98a2b3',
      good: '#22c55e',
      warn: '#f59e0b',
      bad: '#ef4444'
    },
    borderRadius: {
      xl: '14px',
      '2xl': '20px'
    }
  }
});
