import { appState } from '../../app/state.js';
import { formatDate, formatMoney, includesText } from '../../app/dom.js';

export function salesView() {
  const sales = appState.sales.filter((sale) =>
    includesText(sale, appState.searchQuery, [
      'invoiceNumber',
      'customerName',
      'paymentMethod',
      'notes',
    ]),
  );

  return listView({
    title: 'Sales',
    count: sales.length,
    action: '<button class="primary-button" type="button" data-action="record-sale">Add sale</button>',
    emptyMessage: 'No sales have been recorded yet.',
    items: sales,
    renderItem: (sale) => `
      <article class="list-item">
        <div>
          <strong>${sale.invoiceNumber}</strong>
          <div class="muted">${sale.customerName ?? 'Walk-in customer'} - ${sale.paymentMethod}</div>
          <small>${sale.itemName ?? 'Manual sale'} x ${sale.quantity}</small>
          <small>${formatDate(sale.soldAt)}</small>
        </div>
        <div class="right-stack">
          <strong>${formatMoney(sale.amount)}</strong>
          <button class="ghost-button compact-button" type="button" data-bill-id="${sale.id}">Bill</button>
        </div>
      </article>
    `,
  });
}

function listView({ title, count, action, emptyMessage, items, renderItem }) {
  return `
    <section class="panel">
      <div class="section-header">
        <div>
          <h2>${title}</h2>
          <p class="muted">${count} matching records</p>
        </div>
        ${action ?? ''}
      </div>
      ${
        items.length === 0
          ? `<p class="muted">${emptyMessage}</p>`
          : `<div class="list">${items.map(renderItem).join('')}</div>`
      }
    </section>
  `;
}
