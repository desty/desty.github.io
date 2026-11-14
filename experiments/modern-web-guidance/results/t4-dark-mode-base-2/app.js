// --- Theme toggle: cycles System -> Light -> Dark, persisted in localStorage ---
const THEMES = ['system', 'light', 'dark'];
const THEME_LABELS = { system: 'System', light: 'Light', dark: 'Dark' };
const themeToggle = document.getElementById('theme-toggle');

function readTheme() {
  try {
    const saved = localStorage.getItem('theme');
    return THEMES.includes(saved) ? saved : 'system';
  } catch {
    return 'system';
  }
}

function applyTheme(theme) {
  if (theme === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;

  const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
  themeToggle.textContent = `Theme: ${THEME_LABELS[theme]}`;
  themeToggle.setAttribute('aria-label', `Theme: ${THEME_LABELS[theme]}. Switch to ${THEME_LABELS[next]}`);
  themeToggle.title = `Switch to ${THEME_LABELS[next]} theme`;
}

let currentTheme = readTheme();
applyTheme(currentTheme);

themeToggle.addEventListener('click', () => {
  currentTheme = THEMES[(THEMES.indexOf(currentTheme) + 1) % THEMES.length];
  try {
    if (currentTheme === 'system') localStorage.removeItem('theme');
    else localStorage.setItem('theme', currentTheme);
  } catch {
    // Storage unavailable (e.g. privacy mode): theme still applies for this visit.
  }
  applyTheme(currentTheme);
});

// --- Tasks ---
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
