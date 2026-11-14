const list = document.getElementById('task-list');
const form = document.getElementById('add-form');
const confirmDialog = document.getElementById('confirm-delete');
const confirmTask = document.getElementById('confirm-task');
let pendingItem = null;

list.addEventListener('click', (event) => {
  const button = event.target.closest('button.delete');
  if (!button) return;
  pendingItem = button.closest('li');
  confirmTask.textContent = pendingItem.querySelector('span').textContent;
  confirmDialog.returnValue = '';
  confirmDialog.showModal(); // autofocus puts focus on Cancel
});

confirmDialog.addEventListener('close', () => {
  // Only the Delete button sets returnValue to "delete"; Cancel and Esc do not.
  if (confirmDialog.returnValue === 'delete' && pendingItem) {
    pendingItem.remove();
  }
  pendingItem = null;
  confirmDialog.returnValue = '';
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
