// Authentication Management (Frontend Only)
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isSignInMode = true;
        this.init();
    }

    init() {
        this.initEventListeners();
        this.updateAuthUI();
    }

    initEventListeners() {
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.addEventListener('show.bs.modal', (event) => {
                const btn = event.relatedTarget;
                this.setAuthMode(btn.getAttribute('data-mode'));
            });
        }

        const authForm = document.getElementById('authForm');
        if (authForm) {
            authForm.addEventListener('submit', (e) => this.handleAuthSubmit(e));
        }

        const authSwitchBtn = document.getElementById('authSwitchBtn');
        if (authSwitchBtn) {
            authSwitchBtn.addEventListener('click', () => this.toggleAuthMode());
        }

        document.addEventListener('logout', () => this.logout());
    }

    setAuthMode(mode) {
        this.isSignInMode = (mode === 'signin');
        this.updateAuthModal();
    }

    toggleAuthMode() {
        this.isSignInMode = !this.isSignInMode;
        this.updateAuthModal();
    }

    updateAuthModal() {
        const title       = document.getElementById('authModalTitle');
        const nameField   = document.getElementById('nameField');
        const submitBtn   = document.getElementById('authSubmitBtn');
        const switchText  = document.querySelector('.auth-switch-text');
        const switchBtn   = document.getElementById('authSwitchBtn');

        if (this.isSignInMode) {
            title.textContent     = 'Sign In';
            nameField.style.display = 'none';
            submitBtn.textContent = 'Sign In';
            switchText.textContent= "Don't have an account?";
            switchBtn.textContent = 'Sign Up';
            document.getElementById('name').removeAttribute('required');
        } else {
            title.textContent     = 'Sign Up';
            nameField.style.display = 'block';
            submitBtn.textContent = 'Sign Up';
            switchText.textContent= 'Already have an account?';
            switchBtn.textContent = 'Sign In';
            document.getElementById('name').setAttribute('required', 'true');
        }
    }

    async handleAuthSubmit(event) {
        event.preventDefault();
        const fd       = new FormData(event.target);
        const rawName  = fd.get('name')     || '';
        const rawEmail = fd.get('email')    || '';
        const rawPass  = fd.get('password') || '';

        // Normalize
        const name     = rawName.trim();
        const email    = rawEmail.trim().toLowerCase();
        const password = rawPass.trim();

        // Show loading
        const btn = document.getElementById('authSubmitBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';

        try {
            await this.delay(1500);

            if (this.isSignInMode) {
                await this.signIn(email, password);
            } else {
                await this.signUp(name, email, password);
            }

            event.target.reset();
            const modal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
            modal.hide();
        } catch (err) {
            this.showMessage(err.message, 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = this.isSignInMode ? 'Sign In' : 'Sign Up';
        }
    }

    async signIn(email, password) {
        if (email.endsWith('@gmail.com')) {
            this.showMessage('Signed in successfully! Welcome.', 'success');
            this.currentUser = { name: email.split('@')[0], email };
            this.updateAuthUI();
            document.dispatchEvent(new CustomEvent('userLoggedIn', { detail: this.currentUser }));
        } else {
            throw new Error('Email must end with @gmail.com');
        }
    }

    async signUp(name, email, password) {
        if (email.endsWith('@gmail.com')) {
            this.showMessage('Signed up successfully! Welcome.', 'success');
            this.currentUser = { name, email };
            this.updateAuthUI();
            document.dispatchEvent(new CustomEvent('userSignedUp', { detail: this.currentUser }));
        } else {
            throw new Error('Email must end with @gmail.com');
        }
    }

    logout() {
        this.currentUser = null;
        this.updateAuthUI();
        this.showMessage('Signed out successfully', 'info');
        document.dispatchEvent(new CustomEvent('userLoggedOut'));
    }

    updateAuthUI() {
        const authBtns = document.querySelectorAll('[data-bs-target="#authModal"]');
        if (this.currentUser) {
            authBtns.forEach(b => b.style.display = 'none');
            if (!document.getElementById('userMenu')) this.addUserMenu();
        } else {
            authBtns.forEach(b => b.style.display = 'inline-block');
            const m = document.getElementById('userMenu');
            if (m) m.remove();
        }
    }

    addUserMenu() {
        const nav = document.querySelector('.navbar-nav');
        if (!nav) return;
        const li = document.createElement('li');
        li.id = 'userMenu';
        li.className = 'nav-item dropdown';
        li.innerHTML = `
            <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
              <i class="fas fa-user-circle me-1"></i>${this.currentUser.name}
            </a>
            <ul class="dropdown-menu dropdown-menu-end">
              <li><a class="dropdown-item" href="#" onclick="auth.viewProfile()">
                <i class="fas fa-user me-2"></i>Profile
              </a></li>
              <li><a class="dropdown-item" href="#" onclick="auth.viewOrders()">
                <i class="fas fa-shopping-bag me-2"></i>My Orders
              </a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item" href="#" onclick="auth.logout()">
                <i class="fas fa-sign-out-alt me-2"></i>Sign Out
              </a></li>
            </ul>`;
        nav.appendChild(li);
    }

    viewProfile() { this.showMessage('Profile coming soon!', 'info'); }
    viewOrders()  { this.showMessage('Orders coming soon!', 'info'); }

    delay(ms) { return new Promise(r => setTimeout(r, ms)); }
    showMessage(msg,type='info') {
        if (window.app) window.app.showToast(msg,type);
        else console.log(`${type.toUpperCase()}: ${msg}`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.auth = new AuthManager();
});
