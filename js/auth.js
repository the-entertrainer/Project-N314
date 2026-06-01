import State from './state.js';

const PASSCODE = 'thinkmoney';
const AUTH_KEY = 'niftyintel_auth';

export class AuthManager {
  static isAuthenticated() {
    return sessionStorage.getItem(AUTH_KEY) === 'true';
  }

  static initializeAuth(onSuccess) {
    if (this.isAuthenticated()) {
      onSuccess();
      return;
    }
    this._showGate(onSuccess);
  }

  static _showGate(onSuccess) {
    const gate = document.getElementById('auth-gate');
    const app = document.getElementById('app');
    if (gate) gate.classList.remove('hidden');
    if (app) app.classList.add('hidden');

    const form = document.getElementById('passcode-form');
    const input = document.getElementById('passcode-input');
    const error = document.getElementById('passcode-error');

    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (input.value.trim() === PASSCODE) {
        sessionStorage.setItem(AUTH_KEY, 'true');
        if (gate) gate.classList.add('hidden');
        if (app) app.classList.remove('hidden');
        onSuccess();
      } else {
        if (error) {
          error.textContent = 'Incorrect passcode. Try again.';
          error.classList.remove('hidden');
        }
        input.value = '';
        input.focus();
      }
    });
  }

  static showSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    const close = () => modal.classList.add('hidden');
    document.getElementById('settings-close').onclick = close;
    document.getElementById('settings-close-btn').onclick = close;
    modal.onclick = (e) => { if (e.target === modal) close(); };
  }
}

export default AuthManager;
