const list = document.getElementById('task-list');
const form = document.getElementById('add-form');

list.addEventListener('click', (event) => {
  const button = event.target.closest('button.delete');
  if (!button) return;
  button.closest('li').remove();
});

// Help tooltip: shows above the "?" icon, or below it if there isn't room above.
const helpIcon = document.querySelector('.help-icon');
const tooltip = document.getElementById(helpIcon.getAttribute('aria-describedby'));
const GAP = 6;
const EDGE = 8;
let hideTimer;

function positionTooltip() {
  const icon = helpIcon.getBoundingClientRect();
  const tip = tooltip.getBoundingClientRect();
  let top = icon.top - tip.height - GAP;
  if (top < EDGE) top = icon.bottom + GAP;
  let left = icon.left + icon.width / 2 - tip.width / 2;
  left = Math.max(EDGE, Math.min(left, window.innerWidth - tip.width - EDGE));
  tooltip.style.top = `${top}px`;
  tooltip.style.left = `${left}px`;
}

function showTooltip() {
  clearTimeout(hideTimer);
  tooltip.hidden = false;
  positionTooltip();
}

function hideTooltip() {
  clearTimeout(hideTimer);
  tooltip.hidden = true;
}

// Short delay lets the pointer move from the icon onto the tooltip without it closing.
function hideSoon() {
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    if (document.activeElement !== helpIcon) hideTooltip();
  }, 100);
}

helpIcon.addEventListener('mouseenter', showTooltip);
helpIcon.addEventListener('mouseleave', hideSoon);
tooltip.addEventListener('mouseenter', showTooltip);
tooltip.addEventListener('mouseleave', hideSoon);
helpIcon.addEventListener('focus', showTooltip);
helpIcon.addEventListener('blur', hideTooltip);
// The icon sits inside the label; stop a click from moving focus to the date input.
helpIcon.addEventListener('click', (event) => event.preventDefault());
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !tooltip.hidden) hideTooltip();
});
window.addEventListener('scroll', () => { if (!tooltip.hidden) positionTooltip(); }, { passive: true });
window.addEventListener('resize', () => { if (!tooltip.hidden) positionTooltip(); });

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
