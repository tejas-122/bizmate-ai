import { appState } from '../../app/state.js';
import { formatDate, formatMoney, includesText } from '../../app/dom.js';

export function expensesView() {
  const expenses = appState.expenses.filter((expense) =>
    includesText(expense, appState.searchQuery, ['category', 'vendor', 'notes']),
  );

  return `
    <section class="panel">
      <div class="section-header">
        <div>
          <h2>Expenses</h2>
          <p class="muted">${expenses.length} matching records</p>
        </div>
        <button class="primary-button" type="button" data-action="record-expense">Add expense</button>
      </div>
      ${
        expenses.length === 0
          ? '<p class="muted">No expenses have been recorded yet.</p>'
          : `<div class="list">
              ${expenses
                .map(
                  (expense) => `
                    <article class="list-item">
                      <div>
                        <strong>${expense.category}</strong>
                        <div class="muted">${expense.vendor ?? 'Business expense'}</div>
                        <small>${formatDate(expense.spentAt)}</small>
                      </div>
                      <strong class="danger-text">${formatMoney(expense.amount)}</strong>
                    </article>
                  `,
                )
                .join('')}
            </div>`
      }
    </section>
  `;
}
