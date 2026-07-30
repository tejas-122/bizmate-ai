export const appState = {
  user: null,
  profile: null,
  activeView: 'dashboard',
  activeModal: null,
  searchQuery: '',
  isDarkMode: readStoredTheme() === 'dark',
  isDemoMode: readStoredDemoMode() === 'true',
  shops: [],
  sales: [],
  expenses: [],
  staff: [],
  attendance: [],
  inventory: [],
  activeBill: null,
  activeShopId: null,
  errors: [],
  subscriptions: [],
  activeShopSubscriptions: [],
};

function readStoredTheme() {
  try {
    return localStorage.getItem('bizmate-theme');
  } catch {
    return 'light';
  }
}

function readStoredDemoMode() {
  try {
    return localStorage.getItem('bizmate-demo-mode');
  } catch {
    return 'false';
  }
}

export function resetBusinessState() {
  appState.shops = [];
  appState.sales = [];
  appState.expenses = [];
  appState.staff = [];
  appState.attendance = [];
  appState.inventory = [];
  appState.activeShopId = null;
  appState.activeBill = null;
  appState.errors = [];
  clearSubscriptions();
}

export function clearSubscriptions() {
  appState.subscriptions.forEach((unsubscribe) => unsubscribe());
  appState.subscriptions = [];
  clearActiveShopSubscriptions();
}

export function clearActiveShopSubscriptions() {
  appState.activeShopSubscriptions.forEach((unsubscribe) => unsubscribe());
  appState.activeShopSubscriptions = [];
}

export function activeShop() {
  return appState.shops.find((shop) => shop.id === appState.activeShopId) ?? null;
}
