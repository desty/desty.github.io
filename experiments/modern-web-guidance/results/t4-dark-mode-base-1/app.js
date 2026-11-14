// --- Theme: 'light' | 'dark' | 'system' (default). 'system' follows the OS
// via the prefers-color-scheme media query in style.css.
const THEME_KEY = 'theme';
const themeToggle = document.getElementById('theme-toggle');

function readTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'system';
  } catch {
    return 'system';
  }
}

function applyTheme(choice) {
  const root = document.documentElement;
  if (choice === 'system') delete root.dataset.theme;
  else root.dataset.theme = choice;
  themeToggle.querySelectorAll('button[data-theme-choice]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.themeChoice === choice));
  });
}

themeToggle.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-theme-choice]');
  if (!button) return;
  const choice = button.dataset.themeChoice;
  try {
    if (choice === 'system') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, choice);
  } catch {
    // Storage unavailable (e.g. private mode): theme still applies for this visit.
  }
  applyTheme(choice);
});

applyTheme(readTheme());

// --- Tasks
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
