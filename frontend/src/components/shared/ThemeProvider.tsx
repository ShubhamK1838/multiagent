import { useEffect } from 'react'
import { useUiSettings } from '../../hooks/useUiSettings'

export function ThemeProvider() {
  const { settings } = useUiSettings()

  useEffect(() => {
    const activeTheme = settings['ui.theme'] || 'default'
    const themesJson = settings['ui.themes_json']

    if (!themesJson) {
      document.documentElement.removeAttribute('style')
      return
    }

    try {
      const themes = JSON.parse(themesJson)
      const themeConfig = themes[activeTheme] || themes['default'] || {}
      
      const root = document.documentElement
      // Clear existing style to prevent old theme variables from bleeding over
      root.removeAttribute('style')
      
      // Apply new variables
      Object.entries(themeConfig).forEach(([key, value]) => {
        root.style.setProperty(key, value as string)
      })
    } catch (err) {
      console.error('Failed to parse ui.themes_json', err)
      document.documentElement.removeAttribute('style')
    }
  }, [settings])

  return null
}
