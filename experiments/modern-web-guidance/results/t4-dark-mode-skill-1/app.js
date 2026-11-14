// ---------- Theme switch ----------
// Stored values: "light" | "dark"; no entry = follow the system ("light dark").
const schemeMeta = document.querySelector('meta[name="color-scheme"]');
const schemeRadios = document.querySelectorAll('input[name="color-scheme"]');

function readStoredScheme() {
  try { return localStorage.getItem('color-scheme') ?? 'light dark'; } catch { return 'light dark'; }
}

function applyScheme(value) {
  schemeMeta.content = value;
  for (const radio of schemeRadios) radio.checked = radio.value === value;
}

applyScheme(readStoredScheme());

for (const radio of schemeRadios) {
  radio.addEventListener('change', () => {
    applyScheme(radio.value);
    try {
      if (radio.value === 'light dark') localStorage.removeItem('color-scheme');
      else localStorage.setItem('color-scheme', radio.value);
    } catch { /* storage blocked: theme still applies for this visit */ }
  });
}

// Keep other open tabs in sync.
window.addEventListener('storage', (event) => {
  if (event.key === 'color-scheme' || event.key === null) applyScheme(readStoredScheme());
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
