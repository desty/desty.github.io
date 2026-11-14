const list = document.getElementById('task-list');
const form = document.getElementById('add-form');
const confirmDialog = document.getElementById('confirm-delete');
const confirmName = document.getElementById('confirm-delete-name');
const cancelButton = confirmDialog.querySelector('button[value="cancel"]');
let pendingItem = null;

list.addEventListener('click', (event) => {
  const button = event.target.closest('button.delete');
  if (!button) return;
  pendingItem = button.closest('li');
  confirmName.textContent = pendingItem.querySelector('span').textContent;
  confirmDialog.returnValue = '';
  confirmDialog.showModal();
  cancelButton.focus(); // Cancel is the safe default
});

// Fires for Cancel, Delete, and Escape (Escape leaves returnValue empty).
confirmDialog.addEventListener('close', () => {
  const item = pendingItem;
  pendingItem = null;
  if (!item) return;

  if (confirmDialog.returnValue === 'delete') {
    const next = item.nextElementSibling || item.previousElementSibling;
    item.remove();
    // Move focus somewhere sensible since the triggering button is gone.
    const target = next ? next.querySelector('button.delete') : form.elements.title;
    target.focus();
  } else {
    item.querySelector('button.delete').focus();
  }
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
