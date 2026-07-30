import { appState } from '../../app/state.js';
import { formatMoney, includesText } from '../../app/dom.js';

export function inventoryView() {
  const inventory = appState.inventory.filter((item) =>
    includesText(item, appState.searchQuery, ['name', 'sku']),
  );

  return `
    <section class="panel">
      <div class="section-header">
        <div>
          <h2>Inventory</h2>
          <p class="muted">${inventory.length} matching items</p>
        </div>
        <button class="primary-button" type="button" data-action="add-inventory">Add item</button>
      </div>
      ${
        inventory.length === 0
          ? '<p class="muted">No inventory items have been added yet.</p>'
          : `<div class="list">
              ${inventory
                .map(
                  (item) => `
                    <article class="list-item">
                      <div>
                        <strong>${item.name}</strong>
                        <div class="muted">SKU: ${item.sku}</div>
                        <small>Sell ${formatMoney(item.sellingPrice)} - Cost ${formatMoney(item.purchasePrice)}</small>
                      </div>
                      <div class="right-stack">
                        <strong>${item.quantity}</strong>
                        <span class="pill ${item.reorderLevel != null && item.quantity <= item.reorderLevel ? 'danger-pill' : ''}">
                          ${item.reorderLevel != null && item.quantity <= item.reorderLevel ? 'Reorder' : 'In stock'}
                        </span>
                        <button
                          class="danger-button compact-button"
                          type="button"
                          data-remove-record="inventory"
                          data-record-id="${item.id}"
                        >
                          Remove
                        </button>
                      </div>
                    </article>
                  `,
                )
                .join('')}
            </div>`
      }
    </section>
  `;
}
