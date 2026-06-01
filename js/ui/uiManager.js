export class UIManager {
  static showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container') || this._createToastContainer();
    const toast = document.createElement('div');
    const colors = {
      info: 'bg-blue-600', success: 'bg-green-600',
      error: 'bg-red-600', warning: 'bg-yellow-500'
    };
    toast.className = `${colors[type] || colors.info} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 transition-all duration-300 transform translate-x-full`;
    toast.innerHTML = `<span class="flex-1 text-sm">${message}</span><button class="text-white/70 hover:text-white ml-2 text-lg leading-none">&times;</button>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.remove('translate-x-full'), 10);
    const remove = () => {
      toast.classList.add('translate-x-full', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    };
    toast.querySelector('button').onclick = remove;
    setTimeout(remove, duration);
  }

  static _createToastContainer() {
    const el = document.createElement('div');
    el.id = 'toast-container';
    el.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full';
    document.body.appendChild(el);
    return el;
  }

  static showLoading(containerId, message = 'Loading...') {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `
      <div class="flex flex-col items-center justify-center py-16 gap-4">
        <div class="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        <p class="text-gray-500 text-sm">${message}</p>
      </div>`;
  }

  static showProgress(containerId, current, total, label = '') {
    const el = document.getElementById(containerId);
    if (!el) return;
    const pct = total > 0 ? Math.round((current / total) * 100) : 0;
    el.innerHTML = `
      <div class="flex flex-col items-center justify-center py-16 gap-4 px-8">
        <div class="w-full bg-gray-200 rounded-full h-3">
          <div class="bg-accent h-3 rounded-full transition-all duration-500" style="width:${pct}%"></div>
        </div>
        <p class="text-gray-500 text-sm">${label || `Fetching data... ${current}/${total}`}</p>
      </div>`;
  }

  static showError(containerId, message, retryFn) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `
      <div class="flex flex-col items-center justify-center py-16 gap-4">
        <div class="text-red-400 text-4xl">⚠</div>
        <p class="text-gray-600 text-center">${message}</p>
        ${retryFn ? '<button id="retry-btn" class="btn-primary px-4 py-2 rounded-lg">Retry</button>' : ''}
      </div>`;
    if (retryFn) {
      document.getElementById('retry-btn')?.addEventListener('click', retryFn);
    }
  }

  static showModal(title, content, onClose) {
    let modal = document.getElementById('generic-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'generic-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm';
      document.body.appendChild(modal);
    }
    modal.innerHTML = `
      <div class="bg-white/95 backdrop-blur rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
        <div class="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 class="text-lg font-bold text-gray-800">${title}</h2>
          <button id="modal-close" class="text-gray-400 hover:text-gray-700 text-2xl leading-none" style="min-height:44px;min-width:44px;display:flex;align-items:center;justify-content:center;">&times;</button>
        </div>
        <div class="flex-1 overflow-y-auto p-5">${content}</div>
      </div>`;
    modal.classList.remove('hidden');
    const close = () => { modal.classList.add('hidden'); if (onClose) onClose(); };
    document.getElementById('modal-close').onclick = close;
    modal.onclick = (e) => { if (e.target === modal) close(); };
    return modal;
  }

  static hideModal() {
    document.getElementById('generic-modal')?.classList.add('hidden');
  }

  static formatINR(value) {
    if (value === null || value === undefined) return 'N/A';
    if (Math.abs(value) >= 1e7) return `₹${(value / 1e7).toFixed(2)}Cr`;
    if (Math.abs(value) >= 1e5) return `₹${(value / 1e5).toFixed(1)}L`;
    return `₹${value.toFixed(2)}`;
  }

  static formatMarketCap(value) {
    if (!value) return 'N/A';
    if (value >= 1e12) return `₹${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `₹${(value / 1e9).toFixed(1)}B`;
    return `₹${(value / 1e7).toFixed(0)}Cr`;
  }

  static formatPercent(value, decimals = 2) {
    if (value === null || value === undefined) return 'N/A';
    const cls = value >= 0 ? 'text-green-400' : 'text-red-400';
    return `<span class="${cls}">${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%</span>`;
  }

  static gradeColor(grade) {
    const map = {
      'AAA': 'bg-emerald-500 text-white', 'AA': 'bg-green-500 text-white',
      'A': 'bg-lime-500 text-black', 'BBB': 'bg-yellow-400 text-black',
      'BB': 'bg-orange-400 text-black', 'B': 'bg-red-400 text-white', 'C': 'bg-red-700 text-white'
    };
    return map[grade] || 'bg-gray-300 text-gray-800';
  }

  static scoreBar(score) {
    const w = Math.min(100, Math.max(0, score));
    const color = w >= 75 ? '#10b981' : w >= 55 ? '#f59e0b' : '#ef4444';
    return `<div class="relative h-2 bg-gray-200 rounded-full w-full"><div class="absolute left-0 top-0 h-2 rounded-full" style="width:${w}%;background:${color}"></div></div>`;
  }
}

export default UIManager;
