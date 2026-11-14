const list = document.getElementById('task-list');
const form = document.getElementById('add-form');

list.addEventListener('click', (event) => {
  const button = event.target.closest('button.delete');
  if (!button) return;
  button.closest('li').remove();
});

// --- Field error display -------------------------------------------------
// CSS shows a field's error only once it matches :user-invalid (edited, then left)
// or after a submit attempt (.was-submitted). This keeps aria-invalid and
// aria-describedby in step with what is shown, so screen readers don't report
// untouched fields as invalid on page load.
const fields = [...form.querySelectorAll('input[data-error]')];

const isErrorShown = (el) =>
  !el.validity.valid && (el.matches(':user-invalid') || form.classList.contains('was-submitted'));

// Reference the error text only while it's shown: aria-describedby text is read even when hidden.
const linkError = (el, shown) => {
  const errorId = el.dataset.error;
  const ids = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter((id) => id && id !== errorId);
  if (shown) ids.push(errorId);
  if (ids.length) el.setAttribute('aria-describedby', ids.join(' '));
  else el.removeAttribute('aria-describedby');
};

// One polite live region announces an error when the user leaves a field.
const announcer = document.createElement('div');
announcer.setAttribute('aria-live', 'polite');
announcer.className = 'visually-hidden';
document.body.append(announcer);
let announceTimer;

const announceError = (el) => {
  const label = el.labels[0].firstChild.textContent.trim();
  const message = document.getElementById(el.dataset.error).textContent.replace(/\s+/g, ' ').trim();
  clearTimeout(announceTimer);
  announcer.textContent = '';
  // Wait so it doesn't talk over the next field being focused.
  announceTimer = setTimeout(() => { announcer.textContent = `${label}: Error: ${message.replace(/^\W+/, '')}`; }, 500);
};

const announced = new WeakSet();
const syncField = (el, announce = false) => {
  const shown = isErrorShown(el);
  el.setAttribute('aria-invalid', String(shown));
  linkError(el, shown);
  if (shown && announce && !announced.has(el)) {
    announced.add(el);
    announceError(el);
  } else if (!shown) {
    announced.delete(el);
  }
};

fields.forEach((el) => {
  syncField(el);
  el.addEventListener('blur', () => syncField(el, true));
  el.addEventListener('input', () => syncField(el));
  el.addEventListener('change', () => syncField(el, true));
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.checkValidity()) {
    // A submit attempt reveals every remaining error; focusing the first one
    // makes screen readers read its error (novalidate means the browser won't).
    form.classList.add('was-submitted');
    fields.forEach((el) => { announced.add(el); syncField(el); });
    fields.find((el) => !el.validity.valid)?.focus();
    return;
  }
  const title = form.elements.title.value.trim();
  const li = document.createElement('li');
  const id = String(Date.now());
  li.dataset.id = id;
  li.innerHTML = `<span></span> <button class="delete" data-id="${id}">Delete</button>`;
  li.querySelector('span').textContent = title;
  list.append(li);
  form.reset();
  form.classList.remove('was-submitted');
  fields.forEach((el) => syncField(el));
});
