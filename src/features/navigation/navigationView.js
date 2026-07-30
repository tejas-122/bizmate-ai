import { appState } from '../../app/state.js';

const items = [
  ['dashboard', 'Home'],
  ['sales', 'Sales'],
  ['inventory', 'Stock'],
  ['expenses', 'Expenses'],
  ['staff', 'Staff'],
];

export function navigationView() {
  return `
    <nav class="bottom-nav" aria-label="Main navigation">
      ${items
        .map(
          ([view, label]) => `
            <button
              class="nav-button ${appState.activeView === view ? 'active' : ''}"
              type="button"
              data-view="${view}"
            >
              ${label}
            </button>
          `,
        )
        .join('')}
    </nav>
  `;
}

export function bindNavigation(root, render) {
  root.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => {
      appState.activeView = button.dataset.view;
      render();
    });
  });
}
