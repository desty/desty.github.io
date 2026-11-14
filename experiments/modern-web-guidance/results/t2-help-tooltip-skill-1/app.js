// --- Hint popovers (tooltips / toggletips) -------------------------------
// Wire ARIA up front, before the interestfor polyfill loads.
const ownedExpanded = new Set();
const normalize = (s) => (s || '').replace(/\s+/g, ' ').trim();
function accessibleName(el) {
  const ids = el.getAttribute('aria-labelledby');
  if (ids) return normalize(ids.split(/\s+/).map((id) => document.getElementById(id)?.textContent).join(' '));
  if (el.hasAttribute('aria-label')) return normalize(el.getAttribute('aria-label'));
  const clone = el.cloneNode(true);
  clone.querySelectorAll('img[alt]').forEach((img) => img.replaceWith(img.alt));
  return normalize(clone.textContent) || normalize(el.title);
}
function isOpen(popover) {
  try { return popover.matches(':popover-open'); } catch { return popover.matches('.\\:popover-open'); }
}
function wireHints(root = document) {
  for (const trigger of root.querySelectorAll('[interestfor]')) {
    const id = trigger.getAttribute('interestfor');
    const hint = document.getElementById(id);
    if (!hint || hint.getAttribute('popover') !== 'hint') continue;
    const name = accessibleName(trigger);
    if (name === normalize(hint.textContent)) continue;
    if (!hint.hasAttribute('role')) hint.setAttribute('role', 'tooltip');
    const opensOnActivation = trigger.getAttribute('popovertarget') === id || trigger.getAttribute('commandfor') === id;
    if (!name) {
      if (!trigger.hasAttribute('aria-labelledby')) trigger.setAttribute('aria-labelledby', id);
    } else if (opensOnActivation) {
      if (!trigger.hasAttribute('aria-expanded')) {
        trigger.setAttribute('aria-expanded', String(isOpen(hint)));
        ownedExpanded.add(trigger);
      }
    } else if (!trigger.hasAttribute('aria-describedby')) {
      trigger.setAttribute('aria-describedby', id);
    }
  }
}
// `toggle` doesn't bubble, so listen in the capture phase.
document.addEventListener('toggle', ({ target, newState }) => {
  for (const trigger of ownedExpanded) {
    if (trigger.getAttribute('interestfor') === target.id) {
      trigger.setAttribute('aria-expanded', String(newState === 'open'));
    }
  }
}, true);
// Where popover="hint" isn't supported it falls back to "manual", so a toggletip
// opened by click would never close; switch it to "auto" as it opens.
const probe = document.createElement('div');
probe.popover = 'hint';
if ('popover' in HTMLElement.prototype && probe.popover !== 'hint') {
  document.addEventListener('beforetoggle', ({ target, newState }) => {
    const toggletip = target.getAttribute('popover') === 'hint'
      && document.querySelector(`[popovertarget="${CSS.escape(target.id)}"]`);
    if (newState === 'open' && toggletip) target.popover = 'auto';
  }, true);
}
wireHints();

// --- Tasks -----------------------------------------------------------------
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
