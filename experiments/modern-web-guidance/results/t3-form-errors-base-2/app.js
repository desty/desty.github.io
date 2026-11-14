const list = document.getElementById('task-list');
const form = document.getElementById('add-form');
const fields = Array.from(form.querySelectorAll('input'));

// Fields the user has interacted with (blurred or changed) — only these show errors.
const touched = new Set();

list.addEventListener('click', (event) => {
  const button = event.target.closest('button.delete');
  if (!button) return;
  button.closest('li').remove();
});

function errorMessage(input) {
  // Treat whitespace-only titles as empty / too short.
  if (input.name === 'title') {
    const length = input.value.trim().length;
    if (length === 0) return 'Enter a title for the task.';
    if (length < 3) return 'Title must be at least 3 characters.';
    return '';
  }

  const v = input.validity;
  if (v.valid) return '';
  if (input.name === 'owner') {
    if (v.valueMissing) return 'Enter the owner’s email address.';
    return 'Enter a valid email address, like name@example.com.';
  }
  if (input.name === 'due') {
    if (v.badInput) return 'Enter a complete, valid date.';
    return 'Choose a due date.';
  }
  return input.validationMessage;
}

function validateField(input) {
  // Clear any previous custom error so `validity` reflects the current value.
  input.setCustomValidity('');
  const message = errorMessage(input);
  input.setCustomValidity(message);
  const show = touched.has(input) && message !== '';
  const errorEl = document.getElementById(`${input.id}-error`);
  errorEl.textContent = show ? message : '';
  if (show) {
    input.setAttribute('aria-invalid', 'true');
  } else {
    input.removeAttribute('aria-invalid');
  }
  return message === '';
}

for (const input of fields) {
  input.addEventListener('blur', () => {
    touched.add(input);
    validateField(input);
  });
  input.addEventListener('change', () => {
    touched.add(input);
    validateField(input);
  });
  // Once a field is showing feedback, keep it in sync as the user types.
  input.addEventListener('input', () => validateField(input));
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  fields.forEach((input) => touched.add(input));
  const invalid = fields.filter((input) => !validateField(input));
  if (invalid.length > 0) {
    invalid[0].focus();
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
  touched.clear();
  fields.forEach(validateField);
});
