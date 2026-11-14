const list = document.getElementById('task-list');
const form = document.getElementById('add-form');

list.addEventListener('click', (event) => {
  const button = event.target.closest('button.delete');
  if (!button) return;
  button.closest('li').remove();
});

// --- Field error state -------------------------------------------------------
// The visible error comes from CSS (:user-invalid, or .was-submitted after a submit
// attempt). This keeps aria-invalid / aria-describedby in step with what is shown,
// so screen readers don't hear "invalid" on fields the user hasn't touched yet.

const fields = [...form.querySelectorAll('input, select, textarea')];
const errorShown = (el) =>
  el.matches(':user-invalid') || (form.classList.contains('was-submitted') && !el.validity.valid);

// Reference the error text only while it's visible: aria-describedby text is read even when hidden.
const linkError = (el, shown) => {
  const errorId = el.dataset.error;
  if (!errorId) return;
  const ids = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter((id) => id && id !== errorId);
  if (shown) ids.push(errorId);
  if (ids.length) el.setAttribute('aria-describedby', ids.join(' '));
  else el.removeAttribute('aria-describedby');
};

// One polite live region announces an error that appears when the user leaves a field.
const announcer = document.createElement('div');
announcer.setAttribute('aria-live', 'polite');
announcer.classList.add('visually-hidden');
document.body.append(announcer);
let announceTimer;
let announcedField;

const spokenText = (node) => {
  const copy = node.cloneNode(true);
  copy.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
  copy.querySelectorAll('[role="img"][aria-label]').forEach((n) => n.replaceWith(`${n.getAttribute('aria-label')}: `));
  return copy.textContent.replace(/\s+/g, ' ').trim();
};

const announceError = (el) => {
  const error = document.getElementById(el.dataset.error);
  if (!error) return;
  const label = el.labels?.[0] ? `${spokenText(el.labels[0])}: ` : '';
  clearTimeout(announceTimer);
  announcer.textContent = '';
  announcedField = el;
  // Wait until the next focused field has been read out.
  announceTimer = setTimeout(() => { announcer.textContent = label + spokenText(error); }, 500);
};

const announced = new WeakSet();
const syncField = (el, announce = false) => {
  if (!fields.includes(el)) return;
  const shown = errorShown(el);
  if (shown && announce && !announced.has(el)) {
    announceError(el);
    announced.add(el);
  }
  if (!shown) {
    announced.delete(el);
    if (announcedField === el) {
      clearTimeout(announceTimer);
      announcer.textContent = '';
    }
  }
  el.setAttribute('aria-invalid', String(shown));
  linkError(el, shown);
};

fields.forEach((el) => syncField(el));
form.addEventListener('blur', (e) => syncField(e.target, true), true);
form.addEventListener('change', (e) => syncField(e.target, true));
form.addEventListener('input', (e) => syncField(e.target));
form.addEventListener('reset', () => {
  form.classList.remove('was-submitted');
  // :user-invalid is cleared after the reset event, so sync afterwards.
  setTimeout(() => fields.forEach((el) => syncField(el)));
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  // A submit attempt counts as interaction: reveal errors on every invalid field.
  form.classList.add('was-submitted');
  if (!form.checkValidity()) {
    const invalid = fields.filter((el) => !el.validity.valid);
    invalid.forEach((el) => { announced.add(el); syncField(el); });
    // novalidate stops the browser from focusing the first invalid field, so do it here;
    // focusing it reads out its error.
    invalid[0]?.focus();
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
});
