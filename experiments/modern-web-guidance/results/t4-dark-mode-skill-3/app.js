// ---------- Theme switch ----------
const THEME_KEY = 'color-scheme';
const schemeMeta = document.querySelector('meta[name="color-scheme"]');
const themeSwitch = document.querySelector('.theme-switch');

function readStoredScheme() {
  try { return localStorage.getItem(THEME_KEY); } catch { return null; }
}

function applyScheme(value) {
  // value: 'light' | 'dark' | 'light dark' (system)
  schemeMeta.content = value;
  const radio = themeSwitch.querySelector(`input[value="${value}"]`);
  if (radio) radio.checked = true;
}

applyScheme(readStoredScheme() ?? 'light dark');

themeSwitch.addEventListener('change', (event) => {
  const value = event.target.value;
  applyScheme(value);
  try {
    if (value === 'light dark') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, value);
  } catch {
    // Storage unavailable: theme still applies for this visit.
  }
});

// Keep other open tabs in sync.
window.addEventListener('storage', (event) => {
  if (event.key === THEME_KEY || event.key === null) applyScheme(readStoredScheme() ?? 'light dark');
});

// ---------- Tasks ----------
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
