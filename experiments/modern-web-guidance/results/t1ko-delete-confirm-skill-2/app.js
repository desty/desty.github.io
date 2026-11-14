const list = document.getElementById('task-list');
const form = document.getElementById('add-form');
const confirmDialog = document.getElementById('confirm-delete');
const confirmName = document.getElementById('confirm-delete-name');
let pendingItem = null;

list.addEventListener('click', (event) => {
  const button = event.target.closest('button.delete');
  if (!button) return;
  pendingItem = button.closest('li');
  confirmName.textContent = pendingItem.querySelector('span').textContent;
  confirmDialog.returnValue = '';
  confirmDialog.showModal();
});

confirmDialog.addEventListener('close', () => {
  // Only an explicit click on "Delete" removes the task; Cancel, Esc, etc. leave it alone.
  if (confirmDialog.returnValue === 'delete' && pendingItem) {
    pendingItem.remove();
  }
  confirmDialog.returnValue = '';
  pendingItem = null;
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
