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

  const iconSpan = document.createElement('span');
  iconSpan.className = 'global-alert-icon';
  iconSpan.textContent = config.icon;
  const msgSpan = document.createElement('span');
  msgSpan.className = 'global-alert-msg';
  msgSpan.textContent = message;
  const closeBtn = document.createElement('button');
  closeBtn.className = 'global-alert-close';
  closeBtn.setAttribute('aria-label', 'Dismiss');
  closeBtn.innerHTML = '&times;';
  el.appendChild(iconSpan);
  el.appendChild(msgSpan);
  el.appendChild(closeBtn);

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


