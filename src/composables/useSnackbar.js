import { onBeforeUnmount } from 'vue';

const TYPE_COLORS = {
  success: '#67c23a',
  error: '#f56565',
  warning: '#e6a23c',
  info: '#409eff',
};

export function useSnackbar(defaultOptions = {}) {
  const timers = new Set();
  const elements = new Set();

  const hideSnackbar = (element, immediate = false) => {
    if (immediate) {
      element.remove();
      return;
    }
    element.style.top = '-60px';
    element.style.opacity = '0';
    const removeTimer = window.setTimeout(() => {
      element.remove();
      timers.delete(removeTimer);
      elements.delete(element);
    }, 300);
    timers.add(removeTimer);
  };

  const showMessage = (message, options = {}) => {
    const { type = 'info', duration = 3000 } = {
      ...defaultOptions,
      ...options,
    };
    const accentColor = TYPE_COLORS[type] || TYPE_COLORS.info;

    const element = document.createElement('div');
    element.innerText = message;
    element.style.cssText = `
      position: fixed;
      top: -60px;
      left: 50%;
      transform: translateX(-50%);
      background: #fff;
      color: #333;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      transition: top 0.3s ease, opacity 0.3s ease;
      opacity: 0;
      min-width: 250px;
      text-align: center;
      font-weight: 500;
      border-left: 4px solid ${accentColor};
    `;

    document.body.appendChild(element);
    elements.add(element);

    requestAnimationFrame(() => {
      element.style.top = '20px';
      element.style.opacity = '1';
    });

    const timer = window.setTimeout(() => hideSnackbar(element), duration);
    timers.add(timer);
  };

  onBeforeUnmount(() => {
    elements.forEach((el) => hideSnackbar(el, true));
    elements.clear();
    timers.forEach((timer) => {
      window.clearTimeout(timer);
    });
    timers.clear();
  });

  return { showMessage };
}
