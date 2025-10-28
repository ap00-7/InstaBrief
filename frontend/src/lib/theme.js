// Global theme utility for InstaBrief
export function applyTheme(selectedTheme) {
  const root = document.documentElement
  if (selectedTheme === 'Dark') {
    root.classList.add('dark')
    localStorage.setItem('theme', 'Dark')
  } else if (selectedTheme === 'Light') {
    root.classList.remove('dark')
    localStorage.setItem('theme', 'Light')
  } else if (selectedTheme === 'System') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', 'System')
  }
}

// Initialize theme on app startup
export function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'Light'
  applyTheme(savedTheme)
  return savedTheme
}

// Get current theme
export function getCurrentTheme() {
  return localStorage.getItem('theme') || 'Light'
}
