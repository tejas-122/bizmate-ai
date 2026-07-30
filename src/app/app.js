import { initializeFirebase } from '../core/firebase/firebaseClient.js';
import { renderAuthView } from '../features/auth/authView.js';
import { loadCurrentUserProfile, logout, watchAuthState } from '../features/auth/authService.js';
import { formValues, formatMoney } from './dom.js';
import { dashboardView } from '../features/dashboard/dashboardView.js';
import { expensesView } from '../features/expenses/expensesView.js';
import { recordExpense, watchExpenses } from '../features/expenses/expenseRepository.js';
import { inventoryView } from '../features/inventory/inventoryView.js';
import {
  saveInventoryItem,
  watchInventory,
} from '../features/inventory/inventoryRepository.js';
import { bindNavigation, navigationView } from '../features/navigation/navigationView.js';
import { salesView } from '../features/sales/salesView.js';
import { recordSale, watchSales } from '../features/sales/salesRepository.js';
import { createShop, removeShop, watchOwnedShops } from '../features/shops/shopRepository.js';
import { staffView } from '../features/staff/staffView.js';
import { markAttendance, watchAttendance } from '../features/staff/attendanceRepository.js';
import { addStaffMember, watchStaff } from '../features/staff/staffRepository.js';
import {
  activeShop,
  appState,
  clearActiveShopSubscriptions,
  clearSubscriptions,
  resetBusinessState,
} from './state.js';

export function initializeApp(root) {
  applyTheme();

  if (appState.isDemoMode) {
    startDemoMode(root);
    return;
  }

  try {
    initializeFirebase();
  } catch (error) {
    renderFirebaseSetup(root, error);
    root.querySelector('[data-start-demo]')?.addEventListener('click', () => startDemoMode(root));
    return;
  }

  renderLoading(root);

  watchAuthState(
    async (user) => {
      appState.user = user;

      if (!user) {
        appState.profile = null;
        resetBusinessState();
        renderAuthView(root, () => startDemoMode(root));
        return;
      }

      try {
        appState.profile = await loadCurrentUserProfile(user.uid);
        appState.errors = [];
        subscribeToBusinessData(root);
        renderApp(root);
      } catch (error) {
        appState.errors = [firebaseErrorMessage(error)];
        renderApp(root);
      }
    },
    (error) => {
      renderFirebaseSetup(root, error);
    },
  );
}

function subscribeToBusinessData(root) {
  clearSubscriptions();

  const shopSubscription = watchOwnedShops(
    appState.user.uid,
    (shops) => {
      appState.shops = shops;
      const activeShopStillExists = shops.some(
        (shop) => shop.id === appState.activeShopId,
      );
      appState.activeShopId = activeShopStillExists
        ? appState.activeShopId
        : shops[0]?.id ?? null;
      appState.errors = [];
      subscribeToActiveShopCollections(root);
      renderApp(root);
    },
    (error) => {
      appState.errors = [firebaseErrorMessage(error)];
      renderApp(root);
    },
  );

  appState.subscriptions.push(shopSubscription);
}

function subscribeToActiveShopCollections(root) {
  clearActiveShopSubscriptions();
  appState.sales = [];
  appState.expenses = [];
  appState.staff = [];
  appState.attendance = [];
  appState.inventory = [];

  const shop = activeShop();
  if (!shop) return;

  const subscriptions = [
    watchSales(shop.id, (items) => {
      appState.sales = items;
      renderApp(root);
    }),
    watchExpenses(shop.id, (items) => {
      appState.expenses = items;
      renderApp(root);
    }),
    watchStaff(shop.id, (items) => {
      appState.staff = items;
      renderApp(root);
    }),
    watchAttendance(shop.id, (items) => {
      appState.attendance = items;
      renderApp(root);
    }),
    watchInventory(shop.id, (items) => {
      appState.inventory = items;
      renderApp(root);
    }),
  ];

  appState.activeShopSubscriptions.push(...subscriptions);
}

function startDemoMode(root) {
  clearSubscriptions();
  appState.isDemoMode = true;
  appState.user = { uid: 'demo-user', displayName: 'Demo Owner' };
  appState.profile = {
    id: 'demo-user',
    fullName: 'Demo Owner',
    email: 'demo@bizmate.ai',
  };
  appState.errors = [];
  loadDemoData();
  saveDemoMode(true);
  renderApp(root);
}

function exitDemoMode(root) {
  appState.isDemoMode = false;
  saveDemoMode(false);
  resetBusinessState();
  renderAuthView(root, () => startDemoMode(root));
}

function loadDemoData() {
  const stored = readDemoData();
  const demoData = stored ?? createDemoData();
  Object.assign(appState, demoData);
  appState.activeShopId = demoData.activeShopId ?? demoData.shops[0]?.id ?? null;
  saveDemoData();
}

function readDemoData() {
  try {
    const raw = localStorage.getItem('bizmate-demo-data');
    if (!raw) return null;
    return reviveDemoDates(JSON.parse(raw));
  } catch {
    return null;
  }
}

function saveDemoData() {
  if (!appState.isDemoMode) return;

  try {
    localStorage.setItem(
      'bizmate-demo-data',
      JSON.stringify({
        shops: appState.shops,
        sales: appState.sales,
        expenses: appState.expenses,
        staff: appState.staff,
        attendance: appState.attendance,
        inventory: appState.inventory,
        activeShopId: appState.activeShopId,
      }),
    );
  } catch {
    // Demo mode can still work in memory if storage is unavailable.
  }
}

function saveDemoMode(isEnabled) {
  try {
    localStorage.setItem('bizmate-demo-mode', String(isEnabled));
  } catch {
    // Ignore storage failures; the current page can still run demo mode.
  }
}

function reviveDemoDates(data) {
  return {
    ...data,
    shops: (data.shops ?? []).map((shop) => ({
      ...shop,
      createdAt: new Date(shop.createdAt),
    })),
    sales: (data.sales ?? []).map((sale) => ({
      ...sale,
      soldAt: new Date(sale.soldAt),
    })),
    expenses: (data.expenses ?? []).map((expense) => ({
      ...expense,
      spentAt: new Date(expense.spentAt),
    })),
    staff: data.staff ?? [],
    attendance: (data.attendance ?? []).map((attendance) => ({
      ...attendance,
      markedAt: new Date(attendance.markedAt),
    })),
    inventory: (data.inventory ?? []).map((item) => ({
      ...item,
      updatedAt: new Date(item.updatedAt),
    })),
  };
}

function createDemoData() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  return {
    shops: [
      {
        id: 'demo-shop-1',
        ownerId: 'demo-user',
        name: 'Abdul Mart',
        address: 'Main Market Road',
        phoneNumber: '+91 98765 43210',
        taxId: 'GST-DEMO-001',
        createdAt: new Date(now.getTime() - 12 * 86400000),
      },
    ],
    sales: [
      {
        id: 'demo-sale-1',
        shopId: 'demo-shop-1',
        invoiceNumber: 'INV-1001',
        itemId: 'demo-item-1',
        itemName: 'Premium Rice 5kg',
        quantity: 2,
        unitPrice: 420,
        amount: 840,
        paymentMethod: 'upi',
        customerName: 'Walk-in customer',
        notes: null,
        soldAt: new Date(now.getTime() - 2 * 3600000),
      },
    ],
    expenses: [
      {
        id: 'demo-expense-1',
        shopId: 'demo-shop-1',
        category: 'Supplier payment',
        amount: 3200,
        vendor: 'City Wholesale',
        notes: null,
        spentAt: new Date(now.getTime() - 86400000),
      },
    ],
    staff: [
      {
        id: 'demo-staff-1',
        shopId: 'demo-shop-1',
        fullName: 'Ayesha Khan',
        role: 'cashier',
        email: 'ayesha@example.com',
        phoneNumber: '+91 90000 11111',
        dailyWage: 650,
        joinedAt: new Date(now.getTime() - 20 * 86400000),
        isActive: true,
      },
      {
        id: 'demo-staff-2',
        shopId: 'demo-shop-1',
        fullName: 'Rahul Verma',
        role: 'inventoryManager',
        email: 'rahul@example.com',
        phoneNumber: '+91 90000 22222',
        dailyWage: 750,
        joinedAt: new Date(now.getTime() - 18 * 86400000),
        isActive: true,
      },
    ],
    attendance: [
      {
        id: 'demo-attendance-1',
        shopId: 'demo-shop-1',
        staffId: 'demo-staff-1',
        staffName: 'Ayesha Khan',
        status: 'present',
        note: null,
        markedAt: now,
        attendanceDate: today,
      },
    ],
    inventory: [
      {
        id: 'demo-item-1',
        shopId: 'demo-shop-1',
        name: 'Premium Rice 5kg',
        sku: 'RICE-5KG',
        quantity: 24,
        purchasePrice: 350,
        sellingPrice: 420,
        reorderLevel: 8,
        updatedAt: now,
      },
      {
        id: 'demo-item-2',
        shopId: 'demo-shop-1',
        name: 'Tea Pack 500g',
        sku: 'TEA-500',
        quantity: 5,
        purchasePrice: 180,
        sellingPrice: 240,
        reorderLevel: 6,
        updatedAt: now,
      },
    ],
    activeShopId: 'demo-shop-1',
  };
}

function renderApp(root) {
  root.innerHTML = `
    <div class="app-shell">
      <main class="page">
        <header class="topbar">
          <div>
            <h1>Bizmate AI</h1>
            <p class="muted">Small business command center</p>
          </div>
          <div class="topbar-actions">
            ${renderShopSelector()}
            <button class="secondary-button" type="button" data-action="create-shop">New shop</button>
            ${activeShop() ? '<button class="danger-button" type="button" data-remove-shop>Remove shop</button>' : ''}
            ${appState.isDemoMode ? '<span class="pill">Demo mode</span>' : ''}
            <button class="ghost-button theme-toggle" type="button" data-theme-toggle>
              ${appState.isDarkMode ? 'Light mode' : 'Dark mode'}
            </button>
            <button class="ghost-button" type="button" data-logout>Sign out</button>
          </div>
        </header>
        ${renderUtilityBar()}
        ${renderActiveView()}
      </main>
      ${navigationView()}
      ${renderModal()}
      ${renderBill()}
    </div>
  `;

  root.querySelector('[data-logout]').addEventListener('click', () => {
    if (appState.isDemoMode) {
      exitDemoMode(root);
      return;
    }

    logout();
  });
  bindShellControls(root);
  bindActions(root);
  bindModal(root);
  bindNavigation(root, () => renderApp(root));
}

function renderShopSelector() {
  if (appState.shops.length === 0) return '';

  return `
    <label class="shop-select">
      <span>Shop</span>
      <select data-shop-select>
        ${appState.shops
          .map(
            (shop) => `
              <option value="${shop.id}" ${shop.id === appState.activeShopId ? 'selected' : ''}>
                ${shop.name}
              </option>
            `,
          )
          .join('')}
      </select>
    </label>
  `;
}

function renderUtilityBar() {
  const shop = activeShop();
  if (!shop || appState.errors.length > 0) return '';

  return `
    <section class="utility-bar" aria-label="Workspace tools">
      <label class="search-field">
        <span>Search</span>
        <input
          type="search"
          placeholder="Find records..."
          value="${escapeAttribute(appState.searchQuery)}"
          data-search-input
        />
      </label>
      <div class="utility-actions">
        <button class="secondary-button" type="button" data-export-view>
          Export ${viewTitle(appState.activeView)}
        </button>
        <button class="ghost-button" type="button" data-print-page>Print</button>
      </div>
    </section>
  `;
}

function bindShellControls(root) {
  root.querySelector('[data-shop-select]')?.addEventListener('change', (event) => {
    appState.activeShopId = event.currentTarget.value;
    subscribeToActiveShopCollections(root);
    renderApp(root);
  });

  root.querySelector('[data-search-input]')?.addEventListener('input', (event) => {
    const cursorPosition = event.currentTarget.selectionStart;
    appState.searchQuery = event.currentTarget.value;
    renderApp(root);
    const input = root.querySelector('[data-search-input]');
    input?.focus();
    input?.setSelectionRange(cursorPosition, cursorPosition);
  });

  root.querySelector('[data-export-view]')?.addEventListener('click', exportActiveView);
  root.querySelector('[data-print-page]')?.addEventListener('click', () => window.print());
  root.querySelectorAll('[data-attendance]').forEach((button) => {
    button.addEventListener('click', async () => {
      const shop = activeShop();
      const staffMember = appState.staff.find(
        (item) => item.id === button.dataset.staffId,
      );
      if (!shop || !staffMember) return;

      button.disabled = true;
      try {
        if (appState.isDemoMode) {
          markDemoAttendance({
            shopId: shop.id,
            staffId: staffMember.id,
            staffName: staffMember.fullName,
            status: button.dataset.attendance,
          });
          saveDemoData();
          renderApp(root);
        } else {
          await markAttendance({
            shopId: shop.id,
            staffId: staffMember.id,
            staffName: staffMember.fullName,
            status: button.dataset.attendance,
          });
        }
      } catch (error) {
        window.alert(error.message ?? String(error));
      } finally {
        button.disabled = false;
      }
    });
  });
  root.querySelectorAll('[data-bill-id]').forEach((button) => {
    button.addEventListener('click', () => {
      appState.activeBill = appState.sales.find((sale) => sale.id === button.dataset.billId);
      renderApp(root);
    });
  });
  root.querySelector('[data-close-bill]')?.addEventListener('click', () => {
    appState.activeBill = null;
    renderApp(root);
  });
  root.querySelector('[data-print-bill]')?.addEventListener('click', () => window.print());
  root.querySelector('[data-remove-shop]')?.addEventListener('click', async (event) => {
    const shop = activeShop();
    if (!shop) return;

    const confirmed = window.confirm(
      `Remove "${shop.name}" and all of its sales, expenses, staff, and inventory records? This cannot be undone.`,
    );
    if (!confirmed) return;

    event.currentTarget.disabled = true;
    try {
      if (appState.isDemoMode) {
        removeDemoShop(shop.id);
        saveDemoData();
        renderApp(root);
      } else {
        await removeShop(shop.id);
      }
    } catch (error) {
      window.alert(error.message ?? String(error));
      event.currentTarget.disabled = false;
    }
  });
  root.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
    appState.isDarkMode = !appState.isDarkMode;
    try {
      localStorage.setItem('bizmate-theme', appState.isDarkMode ? 'dark' : 'light');
    } catch {
      // Ignore storage failures; the current page can still switch themes.
    }
    applyTheme();
    renderApp(root);
  });
}

function applyTheme() {
  document.documentElement.dataset.theme = appState.isDarkMode ? 'dark' : 'light';
}

function renderActiveView() {
  if (appState.errors.length > 0) {
    return `
      <section class="panel error-panel">
        <h2>Could not reach your business data</h2>
        <p class="error">${appState.errors[0]}</p>
        <button class="secondary-button panel-action" type="button" data-retry-app>
          Retry
        </button>
      </section>
    `;
  }

  const views = {
    dashboard: dashboardView,
    sales: salesView,
    inventory: inventoryView,
    expenses: expensesView,
    staff: staffView,
  };

  return views[appState.activeView]();
}

function bindActions(root) {
  root.querySelector('[data-retry-app]')?.addEventListener('click', () => {
    window.location.reload();
  });

  root.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      appState.activeModal = button.dataset.action;
      renderApp(root);
    });
  });
}

function viewTitle(view) {
  return (
    {
      dashboard: 'Dashboard',
      sales: 'Sales',
      inventory: 'Stock',
      expenses: 'Expenses',
      staff: 'Staff',
    }[view] ?? 'Data'
  );
}

function exportActiveView() {
  const exporters = {
    dashboard: () => ({
      filename: 'bizmate-dashboard.csv',
      rows: [
        ['Metric', 'Value'],
        ['Shop', activeShop()?.name ?? ''],
        ['Sales total', formatMoney(totalAmount(appState.sales))],
        ['Expense total', formatMoney(totalAmount(appState.expenses))],
        ['Inventory items', appState.inventory.length],
        ['Staff members', appState.staff.length],
      ],
    }),
    sales: () => ({
      filename: 'bizmate-sales.csv',
      rows: [
        ['Invoice', 'Customer', 'Payment method', 'Amount'],
        ...appState.sales.map((sale) => [
          sale.invoiceNumber,
          sale.customerName ?? '',
          sale.paymentMethod,
          sale.amount,
        ]),
      ],
    }),
    inventory: () => ({
      filename: 'bizmate-stock.csv',
      rows: [
        ['Name', 'SKU', 'Quantity', 'Purchase price', 'Selling price'],
        ...appState.inventory.map((item) => [
          item.name,
          item.sku,
          item.quantity,
          item.purchasePrice,
          item.sellingPrice,
        ]),
      ],
    }),
    expenses: () => ({
      filename: 'bizmate-expenses.csv',
      rows: [
        ['Category', 'Vendor', 'Amount'],
        ...appState.expenses.map((expense) => [
          expense.category,
          expense.vendor ?? '',
          expense.amount,
        ]),
      ],
    }),
    staff: () => ({
      filename: 'bizmate-staff.csv',
      rows: [
        ['Name', 'Role', 'Email', 'Phone', 'Status'],
        ...appState.staff.map((staffMember) => [
          staffMember.fullName,
          staffMember.role,
          staffMember.email ?? '',
          staffMember.phoneNumber ?? '',
          staffMember.isActive ? 'Active' : 'Inactive',
        ]),
      ],
    }),
  };

  const { filename, rows } = exporters[appState.activeView]();
  const csv = rows
    .map((row) =>
      row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','),
    )
    .join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function totalAmount(items) {
  return items.reduce((total, item) => total + Number(item.amount ?? 0), 0);
}

function escapeAttribute(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function bindModal(root) {
  const modal = root.querySelector('[data-modal]');
  if (!modal) return;

  modal.querySelectorAll('[data-close-modal]').forEach((button) => {
    button.addEventListener('click', () => {
      appState.activeModal = null;
      renderApp(root);
    });
  });

  bindSaleCalculator(modal);

  modal.querySelector('[data-modal-form]').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const submitButton = form.querySelector('button[type="submit"]');
    const errorElement = form.querySelector('[data-error]');
    submitButton.disabled = true;
    errorElement.textContent = '';

    try {
      await handleModalSubmit(formValues(form));
      appState.activeModal = null;
      renderApp(root);
    } catch (error) {
      errorElement.textContent = error.message ?? String(error);
      submitButton.disabled = false;
    }
  });
}

async function handleModalSubmit(values) {
  const shop = activeShop();

  switch (appState.activeModal) {
    case 'create-shop':
      if (appState.isDemoMode) {
        const shop = addDemoRecord('shops', {
          ownerId: appState.user.uid,
          name: values.name.trim(),
          address: values.address?.trim() || null,
          phoneNumber: values.phoneNumber?.trim() || null,
          taxId: values.taxId?.trim() || null,
          createdAt: new Date(),
        });
        appState.activeShopId = shop.id;
        saveDemoData();
        return;
      }
      await createShop({ ownerId: appState.user.uid, ...values });
      return;
    case 'record-sale':
      ensureShop(shop);
      values.itemName = selectedInventoryItem(values.itemId)?.name ?? '';
      if (appState.isDemoMode) {
        const sale = addDemoRecord('sales', saleFromValues(shop, values));
        appState.activeBill = sale;
        saveDemoData();
      } else {
        await recordSale({ shopId: shop.id, ...values });
        appState.activeBill = saleFromValues(shop, values);
      }
      return;
    case 'record-expense':
      ensureShop(shop);
      if (appState.isDemoMode) {
        addDemoRecord('expenses', {
          shopId: shop.id,
          category: values.category.trim(),
          amount: Number(values.amount),
          vendor: values.vendor?.trim() || null,
          notes: values.notes?.trim() || null,
          spentAt: new Date(),
        });
        saveDemoData();
        return;
      }
      await recordExpense({ shopId: shop.id, ...values });
      return;
    case 'add-staff':
      ensureShop(shop);
      if (appState.isDemoMode) {
        addDemoRecord('staff', {
          shopId: shop.id,
          fullName: values.fullName.trim(),
          role: values.role,
          email: values.email?.trim() || null,
          phoneNumber: values.phoneNumber?.trim() || null,
          dailyWage: Number(values.dailyWage || 0),
          joinedAt: new Date(),
          isActive: true,
        });
        saveDemoData();
        return;
      }
      await addStaffMember({ shopId: shop.id, ...values });
      return;
    case 'add-inventory':
      ensureShop(shop);
      if (appState.isDemoMode) {
        addDemoRecord('inventory', {
          shopId: shop.id,
          name: values.name.trim(),
          sku: values.sku.trim(),
          quantity: Number(values.quantity),
          purchasePrice: Number(values.purchasePrice),
          sellingPrice: Number(values.sellingPrice),
          reorderLevel: values.reorderLevel ? Number(values.reorderLevel) : null,
          updatedAt: new Date(),
        });
        saveDemoData();
        return;
      }
      await saveInventoryItem({ shopId: shop.id, ...values });
      return;
    default:
      throw new Error('Unknown action.');
  }
}

function addDemoRecord(collectionName, record) {
  const item = {
    id: `demo-${collectionName}-${crypto.randomUUID?.() ?? Date.now()}`,
    ...record,
  };
  appState[collectionName].unshift(item);
  return item;
}

function removeDemoShop(shopId) {
  appState.shops = appState.shops.filter((shop) => shop.id !== shopId);
  appState.sales = appState.sales.filter((sale) => sale.shopId !== shopId);
  appState.expenses = appState.expenses.filter((expense) => expense.shopId !== shopId);
  appState.staff = appState.staff.filter((staffMember) => staffMember.shopId !== shopId);
  appState.attendance = appState.attendance.filter((item) => item.shopId !== shopId);
  appState.inventory = appState.inventory.filter((item) => item.shopId !== shopId);
  appState.activeShopId = appState.shops[0]?.id ?? null;
}

function markDemoAttendance({ shopId, staffId, staffName, status }) {
  const attendanceDate = new Date().toISOString().slice(0, 10);
  const existing = appState.attendance.find(
    (item) => item.staffId === staffId && item.attendanceDate === attendanceDate,
  );

  if (existing) {
    existing.status = status;
    existing.markedAt = new Date();
    return existing;
  }

  return addDemoRecord('attendance', {
    shopId,
    staffId,
    staffName,
    status,
    note: null,
    markedAt: new Date(),
    attendanceDate,
  });
}

function bindSaleCalculator(modal) {
  const itemSelect = modal.querySelector('[data-sale-item]');
  if (!itemSelect) return;

  const quantityInput = modal.querySelector('[name="quantity"]');
  const unitPriceInput = modal.querySelector('[name="unitPrice"]');
  const amountInput = modal.querySelector('[name="amount"]');

  const updateAmount = () => {
    if (!quantityInput.value) quantityInput.value = '1';
    const quantity = Number(quantityInput.value || 1);
    const unitPrice = Number(unitPriceInput.value || 0);
    amountInput.value = (quantity * unitPrice).toFixed(2);
  };

  itemSelect.addEventListener('change', () => {
    const selectedOption = itemSelect.selectedOptions[0];
    if (selectedOption?.dataset.price) {
      unitPriceInput.value = Number(selectedOption.dataset.price).toFixed(2);
      updateAmount();
    }
  });

  quantityInput.addEventListener('input', updateAmount);
  unitPriceInput.addEventListener('input', updateAmount);
}

function saleFromValues(shop, values) {
  return {
    shopId: shop.id,
    invoiceNumber: values.invoiceNumber,
    itemId: values.itemId || null,
    itemName: selectedInventoryItem(values.itemId)?.name ?? values.itemName ?? null,
    quantity: Number(values.quantity || 1),
    unitPrice: Number(values.unitPrice || values.amount),
    amount: Number(values.amount),
    paymentMethod: values.paymentMethod,
    customerName: values.customerName || null,
    notes: values.notes || null,
    soldAt: new Date(),
  };
}

function selectedInventoryItem(itemId) {
  return appState.inventory.find((item) => item.id === itemId) ?? null;
}

function ensureShop(shop) {
  if (!shop) {
    throw new Error('Create a shop before adding business records.');
  }
}

function renderModal() {
  if (!appState.activeModal) return '';

  const modalContent = {
    'create-shop': {
      title: 'Create shop',
      submit: 'Save shop',
      fields: `
        ${textField('name', 'Shop name', true)}
        ${textField('address', 'Address')}
        ${textField('phoneNumber', 'Phone number', false, 'tel')}
        ${textField('taxId', 'Tax ID / GST number')}
      `,
    },
    'record-sale': {
      title: 'Add sale',
      submit: 'Save sale',
      fields: `
        ${textField('invoiceNumber', 'Invoice number', true)}
        ${inventorySelectField()}
        ${textField('quantity', 'Quantity', true, 'number', '1')}
        ${textField('unitPrice', 'Unit price', true, 'number', '0.01')}
        ${textField('amount', 'Total amount', true, 'number', '0.01')}
        ${selectField('paymentMethod', 'Payment method', [
          ['cash', 'Cash'],
          ['card', 'Card'],
          ['bankTransfer', 'Bank transfer'],
          ['upi', 'UPI'],
          ['other', 'Other'],
        ])}
        ${textField('customerName', 'Customer name')}
        ${textAreaField('notes', 'Notes')}
      `,
    },
    'record-expense': {
      title: 'Add expense',
      submit: 'Save expense',
      fields: `
        ${textField('category', 'Category', true)}
        ${textField('amount', 'Amount', true, 'number', '0.01')}
        ${textField('vendor', 'Vendor')}
        ${textAreaField('notes', 'Notes')}
      `,
    },
    'add-staff': {
      title: 'Add staff',
      submit: 'Save staff',
      fields: `
        ${textField('fullName', 'Full name', true)}
        ${selectField('role', 'Role', [
          ['manager', 'Manager'],
          ['cashier', 'Cashier'],
          ['inventoryManager', 'Inventory manager'],
          ['accountant', 'Accountant'],
          ['owner', 'Owner'],
        ])}
        ${textField('email', 'Email', false, 'email')}
        ${textField('phoneNumber', 'Phone number', false, 'tel')}
        ${textField('dailyWage', 'Daily wage', false, 'number', '1')}
      `,
    },
    'add-inventory': {
      title: 'Add inventory item',
      submit: 'Save item',
      fields: `
        ${textField('name', 'Item name', true)}
        ${textField('sku', 'SKU', true)}
        ${textField('quantity', 'Quantity', true, 'number', '1')}
        ${textField('purchasePrice', 'Purchase price', true, 'number', '0.01')}
        ${textField('sellingPrice', 'Selling price', true, 'number', '0.01')}
        ${textField('reorderLevel', 'Reorder level', false, 'number', '1')}
      `,
    },
  }[appState.activeModal];

  return `
    <div class="modal-backdrop" data-modal>
      <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="section-header">
          <h2 id="modal-title">${modalContent.title}</h2>
          <button class="icon-button" type="button" data-close-modal aria-label="Close">x</button>
        </div>
        <form class="form" data-modal-form>
          ${modalContent.fields}
          <p class="error" data-error></p>
          <div class="modal-actions">
            <button class="secondary-button" type="button" data-close-modal>Cancel</button>
            <button class="primary-button" type="submit">${modalContent.submit}</button>
          </div>
        </form>
      </section>
    </div>
  `;
}

function inventorySelectField() {
  return `
    <label class="field">
      <span>Item</span>
      <select name="itemId" data-sale-item>
        <option value="">Manual sale</option>
        ${appState.inventory
          .map(
            (item) => `
              <option value="${item.id}" data-price="${item.sellingPrice}">
                ${item.name} - ${formatMoney(item.sellingPrice)}
              </option>
            `,
          )
          .join('')}
      </select>
    </label>
  `;
}

function renderBill() {
  if (!appState.activeBill) return '';

  const shop = activeShop();
  const sale = appState.activeBill;

  return `
    <div class="modal-backdrop bill-backdrop">
      <section class="modal-card bill-card" role="dialog" aria-modal="true" aria-labelledby="bill-title">
        <div class="section-header bill-actions">
          <h2 id="bill-title">Bill</h2>
          <div>
            <button class="secondary-button" type="button" data-print-bill>Print</button>
            <button class="icon-button" type="button" data-close-bill aria-label="Close">x</button>
          </div>
        </div>
        <div class="bill-paper">
          <div class="bill-head">
            <div>
              <h2>${shop?.name ?? 'Bizmate AI'}</h2>
              <p>${shop?.address ?? ''}</p>
              <p>${shop?.phoneNumber ?? ''}</p>
            </div>
            <div>
              <strong>Invoice</strong>
              <p>${sale.invoiceNumber}</p>
              <p>${new Date(sale.soldAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div class="bill-customer">
            <span>Customer</span>
            <strong>${sale.customerName ?? 'Walk-in customer'}</strong>
          </div>
          <table class="bill-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${sale.itemName ?? 'Manual sale'}</td>
                <td>${sale.quantity}</td>
                <td>${formatMoney(sale.unitPrice)}</td>
                <td>${formatMoney(sale.amount)}</td>
              </tr>
            </tbody>
          </table>
          <div class="bill-total">
            <span>Total paid by ${sale.paymentMethod}</span>
            <strong>${formatMoney(sale.amount)}</strong>
          </div>
          <p class="muted">${sale.notes ?? 'Thank you for your business.'}</p>
        </div>
      </section>
    </div>
  `;
}

function renderLoading(root) {
  root.innerHTML = `
    <main class="auth-page">
      <section class="auth-card">
        <h1 class="brand">Bizmate AI</h1>
        <p class="subtitle">Connecting to your workspace...</p>
      </section>
    </main>
  `;
}

function textField(name, label, required = false, type = 'text', step = '') {
  return `
    <label class="field">
      <span>${label}</span>
      <input name="${name}" type="${type}" ${required ? 'required' : ''} ${step ? `step="${step}"` : ''} />
    </label>
  `;
}

function textAreaField(name, label) {
  return `
    <label class="field">
      <span>${label}</span>
      <textarea name="${name}" rows="3"></textarea>
    </label>
  `;
}

function selectField(name, label, options) {
  return `
    <label class="field">
      <span>${label}</span>
      <select name="${name}" required>
        ${options
          .map(([value, text]) => `<option value="${value}">${text}</option>`)
          .join('')}
      </select>
    </label>
  `;
}

function renderFirebaseSetup(root, error) {
  root.innerHTML = `
    <main class="auth-page">
      <section class="auth-card">
        <h1>Firebase setup needed</h1>
        <p class="subtitle">
          Create a <code>.env</code> file from <code>.env.example</code> and add your Firebase Web app credentials.
        </p>
        <p class="error">${error.message}</p>
        <button class="secondary-button auth-demo-button" type="button" data-start-demo>
          Try demo
        </button>
      </section>
    </main>
  `;
}

function firebaseErrorMessage(error) {
  const message = error?.message ?? String(error);

  if (
    error?.code === 'unavailable' ||
    message.toLowerCase().includes('client is offline')
  ) {
    return 'Firebase is not reachable from this browser right now. Check your internet connection, Firebase project access, or any network rules blocking Firestore, then retry.';
  }

  return message;
}
