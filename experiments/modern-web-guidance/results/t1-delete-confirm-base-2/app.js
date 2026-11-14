const list = document.getElementById('task-list');
const form = document.getElementById('add-form');
const confirmDialog = document.getElementById('confirm-delete');
const confirmMessage = document.getElementById('confirm-delete-message');
let pendingItem = null;

list.addEventListener('click', (event) => {
  const button = event.target.closest('button.delete');
  if (!button) return;
  pendingItem = button.closest('li');
  const title = pendingItem.querySelector('span').textContent;
  confirmMessage.textContent = `"${title}" will be permanently removed.`;
  confirmDialog.returnValue = '';
  confirmDialog.showModal();
});

// Clicking the backdrop (outside the box) counts as Cancel.
confirmDialog.addEventListener('click', (event) => {
  if (event.target === confirmDialog) confirmDialog.close('cancel');
});

// Escape, backdrop click and the Cancel button all leave the task in place;
// only an explicit "Delete" removes it.
confirmDialog.addEventListener('close', () => {
  const item = pendingItem;
  pendingItem = null;
  if (!item || confirmDialog.returnValue !== 'delete') return;

  // Keep keyboard focus somewhere sensible once the item is gone.
  const neighbor = item.nextElementSibling || item.previousElementSibling;
  item.remove();
  const nextFocus = neighbor ? neighbor.querySelector('button.delete') : form.elements.title;
  nextFocus.focus();
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
