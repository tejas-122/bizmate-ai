import { activeShop, appState } from '../../app/state.js';
import { formatDate, formatMoney, html } from '../../app/dom.js';

export function dashboardView() {
  const shop = activeShop();

  if (!shop) {
    return html`
      <section class="panel">
        <h2>Create your first shop</h2>
        <p class="muted">
          Add a shop profile to start tracking sales, expenses, staff, and inventory.
        </p>
        <button class="primary-button panel-action" type="button" data-action="create-shop">
          Create shop
        </button>
      </section>
    `;
  }

  const salesTotal = appState.sales.reduce((total, sale) => total + sale.amount, 0);
  const expenseTotal = appState.expenses.reduce(
    (total, expense) => total + expense.amount,
    0,
  );
  const profit = salesTotal - expenseTotal;
  const lowStockItems = appState.inventory.filter(
    (item) => item.reorderLevel != null && item.quantity <= item.reorderLevel,
  );
  const recentActivity = [
    ...appState.sales.map((sale) => ({
      label: `Sale ${sale.invoiceNumber}`,
      detail: sale.customerName ?? sale.paymentMethod,
      amount: sale.amount,
      date: sale.soldAt,
      type: 'sale',
    })),
    ...appState.expenses.map((expense) => ({
      label: expense.category,
      detail: expense.vendor ?? 'Business expense',
      amount: -expense.amount,
      date: expense.spentAt,
      type: 'expense',
    })),
  ]
    .sort((left, right) => right.date - left.date)
    .slice(0, 5);

  return html`
    <section class="dashboard-hero">
      <div>
        <p class="eyebrow">Active shop</p>
        <h2>${shop.name}</h2>
        <p class="muted">${shop.address ?? 'Business workspace ready'}</p>
      </div>
      <div class="quick-actions" aria-label="Quick actions">
        <button class="primary-button" type="button" data-action="record-sale">Add sale</button>
        <button class="secondary-button" type="button" data-action="add-inventory">Add item</button>
        <button class="secondary-button" type="button" data-action="record-expense">Add expense</button>
        <button class="ghost-button" type="button" data-action="add-staff">Add staff</button>
      </div>
    </section>

    <section class="metric-grid">
      ${metricCard('Sales', formatMoney(salesTotal), 'Collected revenue')}
      ${metricCard('Expenses', formatMoney(expenseTotal), 'Recorded costs')}
      ${metricCard('Net', formatMoney(profit), profit >= 0 ? 'Profit snapshot' : 'Loss snapshot')}
      ${metricCard('Low stock', lowStockItems.length, 'Items at reorder level')}
    </section>

    <section class="dashboard-grid">
      <article class="panel">
        <div class="section-header">
          <h2>Recent activity</h2>
          <span class="pill">${recentActivity.length} updates</span>
        </div>
        ${
          recentActivity.length === 0
            ? '<p class="muted">Your newest sales and expenses will appear here.</p>'
            : `<div class="list compact-list">
                ${recentActivity
                  .map(
                    (item) => `
                      <article class="list-item">
                        <div>
                          <strong>${item.label}</strong>
                          <div class="muted">${item.detail} - ${formatDate(item.date)}</div>
                        </div>
                        <strong class="${item.type === 'expense' ? 'danger-text' : 'success-text'}">
                          ${formatMoney(item.amount)}
                        </strong>
                      </article>
                    `,
                  )
                  .join('')}
              </div>`
        }
      </article>
      <article class="panel">
        <div class="section-header">
          <h2>Inventory watch</h2>
          <span class="pill">${appState.inventory.length} SKUs</span>
        </div>
        ${
          lowStockItems.length === 0
            ? '<p class="muted">No items are currently below reorder level.</p>'
            : `<div class="list compact-list">
                ${lowStockItems
                  .slice(0, 5)
                  .map(
                    (item) => `
                      <article class="list-item">
                        <div>
                          <strong>${item.name}</strong>
                          <div class="muted">SKU: ${item.sku}</div>
                        </div>
                        <strong>${item.quantity}</strong>
                      </article>
                    `,
                  )
                  .join('')}
              </div>`
        }
      </article>
    </section>
  `;
}

function metricCard(label, value, caption) {
  return html`
    <article class="metric-card">
      <p>${label}</p>
      <strong>${value}</strong>
      <span>${caption}</span>
    </article>
  `;
}
