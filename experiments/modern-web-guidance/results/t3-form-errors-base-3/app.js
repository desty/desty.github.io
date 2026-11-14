const list = document.getElementById('task-list');
const form = document.getElementById('add-form');

list.addEventListener('click', (event) => {
  const button = event.target.closest('button.delete');
  if (!button) return;
  button.closest('li').remove();
});

// Fields whose errors may be shown: the user has left them, or tried to submit.
const touched = new Set();
const fields = Array.from(form.querySelectorAll('input'));

function errorMessage(input) {
  // A title of only spaces passes `required`/`minlength`, but trims to nothing.
  if (input.name === 'title') {
    const length = input.value.trim().length;
    input.setCustomValidity(
      length === 0 && input.value !== '' ? 'Enter a task title.' :
      length > 0 && length < 3 ? 'Title must be at least 3 characters.' : ''
    );
  }

  const v = input.validity;
  if (v.valid) return '';
  if (v.customError) return input.validationMessage;
  if (v.badInput) return 'Enter a complete, valid date.';
  if (v.valueMissing) {
    if (input.name === 'title') return 'Enter a task title.';
    if (input.name === 'owner') return "Enter the owner's email address.";
    if (input.name === 'due') return 'Choose a due date.';
  }
  if (v.tooShort) return 'Title must be at least 3 characters.';
  if (v.typeMismatch) return 'Enter a valid email address, like name@example.com.';
  return input.validationMessage;
}

function updateError(input) {
  const message = errorMessage(input);
  const show = touched.has(input) && message !== '';
  const errorEl = document.getElementById(`${input.id}-error`);
  errorEl.textContent = show ? message : '';
  errorEl.hidden = !show;
  if (show) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
}

fields.forEach((input) => {
  input.addEventListener('blur', () => {
    touched.add(input);
    updateError(input);
  });
  // Once an error is visible, update it live so it clears as soon as it's fixed.
  input.addEventListener('input', () => updateError(input));
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  fields.forEach((input) => {
    touched.add(input);
    updateError(input);
  });
  if (!form.checkValidity()) {
    form.querySelector('[aria-invalid="true"]')?.focus();
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
  // Start fresh for the next task: no errors until the user interacts again.
  touched.clear();
  fields.forEach(updateError);
});
