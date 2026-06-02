const TYPES = {
  success: {
    icon: '🟢',
  },
  danger: {
    icon: '🔴',
  },
  warning: {
    icon: '🟡',
  },
  info: {
    icon: '🔵',
  },
};

let container = null;

function ensureContainer() {
  if (!container || !document.body.contains(container)) {
    container = document.createElement('div');
    container.id = 'global-alert-container';
    document.body.appendChild(container);
  }
  return container;
}

export function showAlert(message, type = 'success') {
  const config = TYPES[type] || TYPES.success;
  const el = document.createElement('div');
  el.className = 'global-alert-card';

  el.innerHTML = `
    <span class="global-alert-icon">${config.icon}</span>
    <span class="global-alert-msg">${message}</span>
    <button class="global-alert-close" aria-label="Dismiss">&times;</button>
  `;

  el.querySelector('.global-alert-close').addEventListener('click', (e) => {
    e.stopPropagation();
    dismiss(el);
  });

  ensureContainer().appendChild(el);

  requestAnimationFrame(() => el.classList.add('global-alert-visible'));

  setTimeout(() => dismiss(el), 4000);
}

function dismiss(el) {
  if (!el.parentNode) return;
  el.classList.remove('global-alert-visible');
  el.classList.add('global-alert-hiding');
  el.addEventListener('transitionend', () => el.remove(), { once: true });
}

window.showAlert = showAlert;
