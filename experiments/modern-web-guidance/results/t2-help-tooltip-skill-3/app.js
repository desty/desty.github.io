// Wire ARIA for [interestfor] hint popovers (tooltips/toggletips).
const ownedExpandedTriggers = new WeakSet();
const normalize = (text) => (text || '').replace(/\s+/g, ' ').trim();

function accessibleName(el) {
  const labelledby = el.getAttribute('aria-labelledby');
  if (labelledby) {
    return normalize(labelledby.split(/\s+/).map((id) => document.getElementById(id)?.textContent).join(' '));
  }
  if (el.hasAttribute('aria-label')) return normalize(el.getAttribute('aria-label'));
  const clone = el.cloneNode(true);
  clone.querySelectorAll('img[alt]').forEach((img) => img.replaceWith(img.alt));
  return normalize(clone.textContent) || normalize(el.getAttribute('title'));
}

// `:popover-open` throws in browsers without the Popover API; the polyfill uses a class instead.
function isOpen(el) {
  try { return el.matches(':popover-open'); } catch { return el.classList.contains(':popover-open'); }
}

function wireHints(root = document) {
  root.querySelectorAll('[interestfor]').forEach((trigger) => {
    const hint = document.getElementById(trigger.getAttribute('interestfor'));
    if (!hint || hint.getAttribute('popover') !== 'hint') return;
    const name = accessibleName(trigger);
    if (name === normalize(hint.textContent)) return;
    if (!hint.hasAttribute('role')) hint.setAttribute('role', 'tooltip');

    const opensOnActivation = [trigger.getAttribute('popovertarget'), trigger.getAttribute('commandfor')].includes(hint.id);
    if (!name) {
      if (!trigger.hasAttribute('aria-labelledby')) trigger.setAttribute('aria-labelledby', hint.id);
    } else if (opensOnActivation) {
      if (!trigger.hasAttribute('aria-expanded')) {
        trigger.setAttribute('aria-expanded', String(isOpen(hint)));
        ownedExpandedTriggers.add(trigger);
      }
    } else if (!trigger.hasAttribute('aria-describedby')) {
      trigger.setAttribute('aria-describedby', hint.id);
    }
  });
}

// `toggle` doesn't bubble, so listen in the capture phase.
document.addEventListener('toggle', ({ target, newState }) => {
  if (!target.id) return;
  document.querySelectorAll(`[interestfor="${CSS.escape(target.id)}"]`).forEach((trigger) => {
    if (ownedExpandedTriggers.has(trigger)) trigger.setAttribute('aria-expanded', String(newState === 'open'));
  });
}, true);

wireHints();

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
