// Theme switch: "light", "dark", or "light dark" (system, stored as no value)
const SCHEME_KEY = 'color-scheme';
const schemeMeta = document.querySelector('meta[name="color-scheme"]');
const schemeRadios = document.querySelectorAll('input[name="color-scheme"]');

function applyScheme(scheme) {
  schemeMeta.content = scheme;
  for (const radio of schemeRadios) radio.checked = radio.value === scheme;
}

function readStoredScheme() {
  try { return localStorage.getItem(SCHEME_KEY) ?? 'light dark'; } catch { return schemeMeta.content; }
}

applyScheme(readStoredScheme());

for (const radio of schemeRadios) {
  radio.addEventListener('change', () => {
    const scheme = radio.value;
    applyScheme(scheme);
    try {
      if (scheme === 'light dark') localStorage.removeItem(SCHEME_KEY);
      else localStorage.setItem(SCHEME_KEY, scheme);
    } catch {}
  });
}

// Keep other open tabs in sync
window.addEventListener('storage', (event) => {
  if (event.key === SCHEME_KEY || event.key === null) applyScheme(readStoredScheme());
});

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
