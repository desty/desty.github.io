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

// Help tooltip: shows on hover and keyboard focus, above the icon,
// flipping below when there isn't enough room above.
const helpIcon = document.querySelector('.help-icon');
const helpTip = document.getElementById('due-help');
const GAP = 8;
const MARGIN = 4;
let hideTimer;

function positionTooltip() {
  const icon = helpIcon.getBoundingClientRect();
  const tip = helpTip.getBoundingClientRect();
  const viewportW = document.documentElement.clientWidth;

  let top = icon.top - tip.height - GAP;
  let placement = 'top';
  if (top < MARGIN) {
    top = icon.bottom + GAP;
    placement = 'bottom';
  }

  const iconCenter = icon.left + icon.width / 2;
  const maxLeft = Math.max(MARGIN, viewportW - tip.width - MARGIN);
  const left = Math.min(Math.max(iconCenter - tip.width / 2, MARGIN), maxLeft);

  helpTip.style.top = `${top}px`;
  helpTip.style.left = `${left}px`;
  helpTip.style.setProperty('--arrow-x', `${iconCenter - left}px`);
  helpTip.dataset.placement = placement;
}

function showTooltip() {
  clearTimeout(hideTimer);
  helpTip.hidden = false;
  positionTooltip();
}

function hideTooltip() {
  clearTimeout(hideTimer);
  helpTip.hidden = true;
}

// Short delay so the pointer can move from the icon onto the tooltip.
function scheduleHide() {
  if (document.activeElement === helpIcon) return;
  clearTimeout(hideTimer);
  hideTimer = setTimeout(hideTooltip, 100);
}

helpIcon.addEventListener('mouseenter', showTooltip);
helpIcon.addEventListener('mouseleave', scheduleHide);
helpIcon.addEventListener('focus', showTooltip);
helpIcon.addEventListener('blur', hideTooltip);
// The icon sits inside the <label>; stop clicks from moving focus to the date input.
helpIcon.addEventListener('click', (event) => event.preventDefault());
helpTip.addEventListener('mouseenter', () => clearTimeout(hideTimer));
helpTip.addEventListener('mouseleave', scheduleHide);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !helpTip.hidden) hideTooltip();
});

window.addEventListener('scroll', () => { if (!helpTip.hidden) positionTooltip(); }, { passive: true });
window.addEventListener('resize', () => { if (!helpTip.hidden) positionTooltip(); });
