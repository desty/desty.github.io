const list = document.getElementById('task-list');
const form = document.getElementById('add-form');

list.addEventListener('click', (event) => {
  const button = event.target.closest('button.delete');
  if (!button) return;
  button.closest('li').remove();
});

// --- Field error state -------------------------------------------------------
// An error is shown once the user has interacted with a field (:user-invalid) or
// tried to submit the form (.submitted). The CSS uses the same rule; this keeps
// aria-invalid and aria-describedby in step with what is visible.
const fields = [...form.querySelectorAll('input[data-error]')];
const errorShown = (el) =>
  el.matches(':user-invalid') || (form.classList.contains('submitted') && !el.validity.valid);

// List the error message in aria-describedby only while it is shown: text that
// aria-describedby references is announced even when hidden.
const linkError = (el, shown) => {
  const errorId = el.dataset.error;
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
const announced = new WeakSet();

const spokenText = (node) => {
  const copy = node.cloneNode(true);
  copy.querySelectorAll('[aria-hidden="true"], .help-icon').forEach((n) => n.remove());
  copy.querySelectorAll('[role="img"][aria-label]').forEach((n) => n.replaceWith(`${n.getAttribute('aria-label')}: `));
  return copy.textContent.replace(/\s+/g, ' ').trim();
};
const announceError = (el) => {
  const error = document.getElementById(el.dataset.error);
  const label = el.labels?.[0] ? `${spokenText(el.labels[0])}: ` : '';
  clearTimeout(announceTimer);
  announcer.textContent = '';
  announcedField = el;
  // Wait until the screen reader has announced the next focused field.
  announceTimer = setTimeout(() => { announcer.textContent = label + spokenText(error); }, 500);
};

const syncField = (el, announce = false) => {
  const shown = errorShown(el);
  el.setAttribute('aria-invalid', String(shown));
  linkError(el, shown);
  if (shown) {
    if (announce && !announced.has(el)) announceError(el);
    announced.add(el);
  } else {
    announced.delete(el);
    if (announcedField === el) {
      clearTimeout(announceTimer);
      announcer.textContent = '';
    }
  }
};

fields.forEach((el) => syncField(el));
form.addEventListener('blur', (e) => { if (fields.includes(e.target)) syncField(e.target, true); }, true);
form.addEventListener('change', (e) => { if (fields.includes(e.target)) syncField(e.target, true); });
form.addEventListener('input', (e) => { if (fields.includes(e.target)) syncField(e.target); });
form.addEventListener('reset', () => {
  form.classList.remove('submitted');
  // :user-invalid is cleared after the reset event, so sync afterwards.
  setTimeout(() => fields.forEach((el) => syncField(el)));
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.checkValidity()) {
    // A submit attempt reveals every field's error. Focus the first invalid
    // field so screen readers read its error (novalidate skips this natively).
    form.classList.add('submitted');
    fields.forEach((el) => {
      announced.add(el);
      syncField(el);
    });
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
});
