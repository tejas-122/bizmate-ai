import { register, signIn } from './authService.js';
import { setError } from '../../app/dom.js';
import { appState } from '../../app/state.js';

export function renderAuthView(root, onStartDemo = () => {}) {
  root.innerHTML = `
    <main class="auth-page">
      <section class="auth-card">
        <h1 class="brand">Bizmate AI</h1>
        <p class="subtitle">Manage your shop, sales, expenses, staff, and inventory.</p>

        <form class="form" data-auth-form>
          <label class="field" data-name-field hidden>
            <span>Full name</span>
            <input name="fullName" autocomplete="name" />
          </label>
          <label class="field">
            <span>Email</span>
            <input name="email" type="email" autocomplete="email" required />
          </label>
          <label class="field" data-phone-field hidden>
            <span>Phone number</span>
            <input name="phoneNumber" type="tel" autocomplete="tel" />
          </label>
          <label class="field">
            <span>Password</span>
            <input name="password" type="password" autocomplete="current-password" minlength="8" required />
          </label>
          <p class="error" data-error></p>
          <button class="primary-button" type="submit">Sign in</button>
        </form>

        <button class="secondary-button auth-demo-button" type="button" data-start-demo>
          Try demo
        </button>
        <button class="text-button" type="button" data-toggle-auth>
          Create an account
        </button>
        <button class="ghost-button auth-theme-toggle" type="button" data-auth-theme-toggle>
          ${appState.isDarkMode ? 'Light mode' : 'Dark mode'}
        </button>
      </section>
    </main>
  `;

  let isRegistering = false;
  const form = root.querySelector('[data-auth-form]');
  const nameField = root.querySelector('[data-name-field]');
  const phoneField = root.querySelector('[data-phone-field]');
  const submitButton = form.querySelector('button[type="submit"]');
  const toggleButton = root.querySelector('[data-toggle-auth]');
  const themeButton = root.querySelector('[data-auth-theme-toggle]');
  const demoButton = root.querySelector('[data-start-demo]');

  toggleButton.addEventListener('click', () => {
    isRegistering = !isRegistering;
    nameField.hidden = !isRegistering;
    phoneField.hidden = !isRegistering;
    submitButton.textContent = isRegistering ? 'Create account' : 'Sign in';
    toggleButton.textContent = isRegistering
      ? 'Already have an account? Sign in'
      : 'Create an account';
    root.querySelector('[data-error]').textContent = '';
  });

  demoButton.addEventListener('click', onStartDemo);

  themeButton.addEventListener('click', () => {
    appState.isDarkMode = !appState.isDarkMode;
    document.documentElement.dataset.theme = appState.isDarkMode ? 'dark' : 'light';
    try {
      localStorage.setItem('bizmate-theme', appState.isDarkMode ? 'dark' : 'light');
    } catch {
      // Ignore storage failures; the current page can still switch themes.
    }
    themeButton.textContent = appState.isDarkMode ? 'Light mode' : 'Dark mode';
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    submitButton.disabled = true;
    root.querySelector('[data-error]').textContent = '';

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      if (isRegistering) {
        await register(payload);
      } else {
        await signIn(payload);
      }
    } catch (error) {
      setError(root, authErrorMessage(error));
    } finally {
      submitButton.disabled = false;
    }
  });
}

function authErrorMessage(error) {
  if (error?.code === 'auth/configuration-not-found') {
    return new Error(
      'Firebase Authentication is not enabled yet. In Firebase Console, open Authentication, click Get started, and enable Email/Password sign-in.',
    );
  }

  if (error?.code === 'auth/email-already-in-use') {
    return new Error('An account already exists for this email.');
  }

  if (error?.code === 'auth/invalid-credential') {
    return new Error('The email or password is incorrect.');
  }

  if (error?.code === 'auth/weak-password') {
    return new Error('Use a stronger password.');
  }

  return error;
}
