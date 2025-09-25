// Theme persistence with localStorage
export function initThemePersistence() {
  const themeController = document.querySelector('.theme-controller');

  if (!themeController) return;

  const savedTheme = localStorage.getItem('theme');

  // Set initial theme from localStorage
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeController.checked = true;
  } else if (savedTheme === 'light' || savedTheme === 'islamic') {
    document.documentElement.setAttribute('data-theme', 'islamic');
    themeController.checked = false;
  } else {
    // Default to light theme if no saved preference
    document.documentElement.setAttribute('data-theme', 'islamic');
    localStorage.setItem('theme', 'islamic');
  }

  // Save theme preference when changed
  themeController.addEventListener('change', (event) => {
    const target = event.target;
    const theme = target.checked ? 'dark' : 'islamic';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  });
}

// Initialize theme on page load
export function initTheme() {
  document.addEventListener('DOMContentLoaded', initThemePersistence);
}