const list = document.getElementById('task-list');
const form = document.getElementById('add-form');

list.addEventListener('click', (event) => {
  const button = event.target.closest('button.delete');
  if (!button) return;
  button.closest('li').remove();
});

// Help tooltips: place above the icon, or below if there isn't room above.
// Escape hides the tooltip until the pointer leaves / focus moves away.
document.querySelectorAll('.help-icon').forEach((icon) => {
  const tip = icon.querySelector('.tooltip');
  if (!tip) return;
  const GAP = 8;

  const place = () => {
    icon.classList.remove('tooltip-dismissed');
    const roomAbove = icon.getBoundingClientRect().top;
    icon.classList.toggle('tooltip-below', roomAbove < tip.offsetHeight + GAP);
  };
  const reset = () => icon.classList.remove('tooltip-dismissed');

  icon.addEventListener('mouseenter', place);
  icon.addEventListener('focus', place);
  icon.addEventListener('mouseleave', reset);
  icon.addEventListener('blur', reset);
  icon.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') icon.classList.add('tooltip-dismissed');
  });
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
