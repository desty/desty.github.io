// --- Theme toggle: cycles System → Light → Dark, remembered in localStorage ---
const THEME_KEY = 'theme';
const THEMES = ['system', 'light', 'dark'];
const THEME_INFO = {
  system: { label: 'System', icon: '🖥️' },
  light: { label: 'Light', icon: '☀️' },
  dark: { label: 'Dark', icon: '🌙' },
};
const themeToggle = document.getElementById('theme-toggle');

function getSavedTheme() {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return THEMES.includes(value) ? value : 'system';
  } catch {
    return 'system';
  }
}

function applyTheme(theme) {
  if (theme === 'system') {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = theme;
  }
  const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
  themeToggle.querySelector('.theme-toggle-icon').textContent = THEME_INFO[theme].icon;
  themeToggle.querySelector('.theme-toggle-label').textContent = THEME_INFO[theme].label;
  themeToggle.setAttribute('aria-label', `Theme: ${THEME_INFO[theme].label}. Click to switch to ${THEME_INFO[next].label}.`);
  themeToggle.title = `Theme: ${THEME_INFO[theme].label} (click for ${THEME_INFO[next].label})`;
}

themeToggle.addEventListener('click', () => {
  const next = THEMES[(THEMES.indexOf(currentTheme) + 1) % THEMES.length];
  try {
    if (next === 'system') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, next);
  } catch {
    // Storage unavailable (e.g. private mode); the choice still applies for this page view.
  }
  currentTheme = next;
  applyTheme(next);
});

let currentTheme = getSavedTheme();
applyTheme(currentTheme);

const list = document.getElementById('task-list');
const form = document.getElementById('add-form');

list.addEventListener('click', (event) => {
  const button = event.target.closest('button.delete');
  if (!button) return;
  button.closest('li').remove();
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.checkValidity()) return;
  const title = form.elements.title.value.trim();
  const li = document.createElement('li');
  const id = String(Date.now());
  li.dataset.id = id;
  li.innerHTML = `<span></span> <button class="delete" data-id="${id}">Delete</button>`;
  li.querySelector('span').textContent = title;
  list.append(li);
  form.reset();
});
