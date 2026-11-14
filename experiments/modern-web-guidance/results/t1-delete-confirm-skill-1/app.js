const list = document.getElementById('task-list');
const form = document.getElementById('add-form');
const confirmDialog = document.getElementById('confirm-delete');
const confirmName = document.getElementById('confirm-delete-name');
let pendingDelete = null;

list.addEventListener('click', (event) => {
  const button = event.target.closest('button.delete');
  if (!button) return;
  pendingDelete = button.closest('li');
  confirmName.textContent = pendingDelete.querySelector('span').textContent;
  confirmDialog.showModal();
});

confirmDialog.addEventListener('close', () => {
  // Esc / back gesture leave returnValue empty, which counts as "cancel".
  if (confirmDialog.returnValue === 'delete' && pendingDelete) {
    pendingDelete.remove();
  }
  pendingDelete = null;
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
