const list = document.getElementById('task-list');
const form = document.getElementById('add-form');
const confirmDialog = document.getElementById('confirm-delete');
const confirmTaskName = document.getElementById('confirm-delete-task');
const confirmCancelButton = confirmDialog.querySelector('button[value="cancel"]');

let pendingItem = null;

list.addEventListener('click', (event) => {
  const button = event.target.closest('button.delete');
  if (!button) return;
  pendingItem = button.closest('li');
  confirmTaskName.textContent = pendingItem.querySelector('span').textContent;
  // Reset so Esc or any non-confirm close is treated as Cancel.
  confirmDialog.returnValue = '';
  confirmDialog.showModal();
  confirmCancelButton.focus();
});

confirmDialog.addEventListener('close', () => {
  const item = pendingItem;
  pendingItem = null;
  if (!item || confirmDialog.returnValue !== 'confirm') return;

  // Move focus to a sensible place, since the focused item is going away.
  const neighbor = item.nextElementSibling || item.previousElementSibling;
  item.remove();
  const nextFocus = neighbor && neighbor.querySelector('button.delete');
  if (nextFocus) {
    nextFocus.focus();
  } else {
    form.elements.title.focus();
  }
});

// Clicking the dimmed backdrop counts as Cancel.
confirmDialog.addEventListener('click', (event) => {
  if (event.target === confirmDialog) confirmDialog.close('cancel');
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
