const list = document.getElementById('task-list');
const form = document.getElementById('add-form');
const confirmDialog = document.getElementById('confirm-delete');
const confirmTaskName = document.getElementById('confirm-task-name');
let pendingDelete = null;

list.addEventListener('click', (event) => {
  const button = event.target.closest('button.delete');
  if (!button) return;
  pendingDelete = button.closest('li');
  confirmTaskName.textContent = pendingDelete.querySelector('span').textContent;
  confirmDialog.returnValue = 'cancel';
  confirmDialog.showModal();
});

// Escape, Cancel, or anything other than an explicit "Delete" keeps the task.
confirmDialog.addEventListener('close', () => {
  const item = pendingDelete;
  pendingDelete = null;
  if (confirmDialog.returnValue === 'delete' && item) {
    item.remove();
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
