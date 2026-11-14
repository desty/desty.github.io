const list = document.getElementById('task-list');
const form = document.getElementById('add-form');
const fields = Array.from(form.querySelectorAll('input'));

list.addEventListener('click', (event) => {
  const button = event.target.closest('button.delete');
  if (!button) return;
  button.closest('li').remove();
});

// Short, field-specific explanations of what is wrong.
function errorMessage(input) {
  const v = input.validity;
  if (v.valueMissing) {
    if (input.type === 'date') return 'Please choose a due date.';
    if (input.type === 'email') return 'Please enter the owner’s email.';
    return 'Please enter a title.';
  }
  if (v.badInput && input.type === 'date') return 'Please enter a valid date.';
  if (v.typeMismatch && input.type === 'email') return 'Enter an email like name@example.com.';
  if (v.tooShort) return `Use at least ${input.minLength} characters.`;
  if (v.customError) return input.validationMessage;
  return input.validity.valid ? '' : 'Please check this field.';
}

function validateField(input) {
  // Treat whitespace-only titles as empty.
  if (input.name === 'title') {
    const trimmed = input.value.trim();
    input.setCustomValidity(
      input.value && !trimmed ? 'Please enter a title.'
        : trimmed && trimmed.length < input.minLength ? `Use at least ${input.minLength} characters.`
        : ''
    );
  }
  return input.validity.valid;
}

function showError(input) {
  const errorEl = document.getElementById(input.getAttribute('aria-describedby'));
  const valid = validateField(input);
  const touched = input.classList.contains('touched');
  const show = touched && !valid;
  errorEl.textContent = show ? errorMessage(input) : '';
  if (show) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
}

fields.forEach((input) => {
  // Mark a field as interacted with once the user leaves it after focusing.
  input.addEventListener('blur', () => {
    input.classList.add('touched');
    showError(input);
  });
  // Once touched, update the message live as the user fixes the value.
  input.addEventListener('input', () => showError(input));
  input.addEventListener('change', () => showError(input));
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  fields.forEach((input) => {
    input.classList.add('touched');
    showError(input);
  });
  if (!form.checkValidity()) {
    fields.find((input) => !input.validity.valid)?.focus();
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
  // Start fresh: no errors on the emptied form until the next interaction.
  fields.forEach((input) => {
    input.classList.remove('touched');
    input.setCustomValidity('');
    showError(input);
  });
});
