export class AuthManager {
  static CORRECT_PASSCODE = 'thinkmoney';
  static AUTH_KEY = 'n314_auth';
  static GEMINI_API_KEY = 'n314_gemini_key';
  static FINANCIAL_API_KEY = 'n314_financial_key';

  static initializeAuth() {
    const isAuthenticated = sessionStorage.getItem(this.AUTH_KEY);
    if (!isAuthenticated) {
      this.showAuthGate();
    } else {
      this.hideAuthGate();
    }
  }

  static showAuthGate() {
    const gate = document.getElementById('auth-gate');
    if (!gate) return;

    gate.classList.remove('hidden');
    gate.innerHTML = `
      <div class="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div class="bg-gray-900 p-8 rounded-lg shadow-2xl max-w-md w-full mx-4">
          <div class="text-center mb-6">
            <h1 class="text-3xl font-bold text-white mb-2">N314</h1>
            <p class="text-gray-400">Quantitative Trading Sentinel</p>
          </div>

          <div class="mb-6">
            <input
              type="password"
              id="passcode-input"
              placeholder="Enter Passcode"
              class="w-full px-4 py-3 rounded bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            id="auth-submit-btn"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition"
          >
            Authenticate
          </button>

          <p id="auth-error" class="text-red-500 text-sm mt-4 text-center hidden"></p>
        </div>
      </div>
    `;

    const submitBtn = document.getElementById('auth-submit-btn');
    const passcodeInput = document.getElementById('passcode-input');
    const errorMsg = document.getElementById('auth-error');

    const handleAuth = () => {
      const passcode = passcodeInput.value.trim();
      if (passcode === this.CORRECT_PASSCODE) {
        sessionStorage.setItem(this.AUTH_KEY, 'true');
        gate.classList.add('hidden');
        this.hideAuthGate();
      } else {
        errorMsg.textContent = 'Invalid passcode';
        errorMsg.classList.remove('hidden');
        passcodeInput.value = '';
      }
    };

    submitBtn.addEventListener('click', handleAuth);
    passcodeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleAuth();
    });

    passcodeInput.focus();
  }

  static hideAuthGate() {
    const gate = document.getElementById('auth-gate');
    if (gate) gate.classList.add('hidden');
  }

  static initializeSettingsModal() {
    this.createSettingsModal();
    this.attachSettingsButton();
  }

  static createSettingsModal() {
    const settingsContainer = document.createElement('div');
    settingsContainer.id = 'settings-modal';
    settingsContainer.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 hidden';

    settingsContainer.innerHTML = `
      <div class="bg-gray-900 p-8 rounded-lg shadow-2xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-white">Settings</h2>
          <button id="settings-close-btn" class="text-gray-400 hover:text-white text-2xl">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-gray-400 text-sm mb-2">Gemini API Key</label>
            <input
              type="password"
              id="gemini-key-input"
              placeholder="Enter your Gemini API key"
              class="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
            />
            <p class="text-gray-500 text-xs mt-1">Get from https://aistudio.google.com/app/apikeys</p>
          </div>

          <div>
            <label class="block text-gray-400 text-sm mb-2">Financial API Key</label>
            <input
              type="password"
              id="financial-key-input"
              placeholder="Enter your Alpha Vantage API key"
              class="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
            />
            <p class="text-gray-500 text-xs mt-1">Get from https://www.alphavantage.co/</p>
          </div>

          <button
            id="settings-save-btn"
            class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded transition mt-6"
          >
            Save Settings
          </button>

          <p id="settings-message" class="text-center text-sm hidden"></p>
        </div>
      </div>
    `;

    document.body.appendChild(settingsContainer);
    this.attachSettingsModalListeners();
  }

  static attachSettingsButton() {
    const headerBtn = document.getElementById('settings-btn');
    if (headerBtn) {
      headerBtn.addEventListener('click', () => {
        this.openSettingsModal();
      });
    }
  }

  static attachSettingsModalListeners() {
    const modal = document.getElementById('settings-modal');
    const closeBtn = document.getElementById('settings-close-btn');
    const saveBtn = document.getElementById('settings-save-btn');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveSettings();
      });
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  }

  static openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;

    const geminiInput = document.getElementById('gemini-key-input');
    const financialInput = document.getElementById('financial-key-input');

    if (geminiInput) {
      geminiInput.value = localStorage.getItem(this.GEMINI_API_KEY) || '';
    }
    if (financialInput) {
      financialInput.value = localStorage.getItem(this.FINANCIAL_API_KEY) || '';
    }

    modal.classList.remove('hidden');
  }

  static saveSettings() {
    const geminiInput = document.getElementById('gemini-key-input');
    const financialInput = document.getElementById('financial-key-input');
    const message = document.getElementById('settings-message');

    const geminiKey = geminiInput?.value.trim() || '';
    const financialKey = financialInput?.value.trim() || '';

    if (!geminiKey || !financialKey) {
      if (message) {
        message.textContent = 'All fields are required';
        message.classList.remove('hidden', 'text-green-400');
        message.classList.add('text-red-400');
      }
      return;
    }

    localStorage.setItem(this.GEMINI_API_KEY, geminiKey);
    localStorage.setItem(this.FINANCIAL_API_KEY, financialKey);

    if (message) {
      message.textContent = 'Settings saved successfully';
      message.classList.remove('hidden', 'text-red-400');
      message.classList.add('text-green-400');
    }

    setTimeout(() => {
      document.getElementById('settings-modal').classList.add('hidden');
      if (message) message.classList.add('hidden');
    }, 2000);
  }

  static getGeminiApiKey() {
    return localStorage.getItem(this.GEMINI_API_KEY) || '';
  }

  static getFinancialApiKey() {
    return localStorage.getItem(this.FINANCIAL_API_KEY) || '';
  }

  static isAuthenticated() {
    return sessionStorage.getItem(this.AUTH_KEY) !== null;
  }
}
