const list = document.getElementById('task-list');
const form = document.getElementById('add-form');

list.addEventListener('click', (event) => {
  const button = event.target.closest('button.delete');
  if (!button) return;
  button.closest('li').remove();
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

// Help tooltips: show on hover/focus, above the icon unless there's no room.
document.querySelectorAll('.help').forEach((wrapper) => {
  const icon = wrapper.querySelector('.help-icon');
  const tip = wrapper.querySelector('.tooltip');
  const GAP = 8;

  const show = () => {
    tip.classList.remove('below');
    tip.classList.add('visible');
    // Flip below if the tooltip would be clipped by the top of the viewport.
    if (icon.getBoundingClientRect().top - tip.offsetHeight - GAP < 0) {
      tip.classList.add('below');
    }
  };
  const hide = () => {
    // Stay open while the icon is still hovered or focused.
    if (wrapper.matches(':hover') || document.activeElement === icon) return;
    tip.classList.remove('visible');
  };

  wrapper.addEventListener('mouseenter', show);
  wrapper.addEventListener('mouseleave', hide);
  icon.addEventListener('focus', show);
  icon.addEventListener('blur', hide);
  icon.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') tip.classList.remove('visible');
  });
});
