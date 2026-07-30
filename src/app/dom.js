export function html(strings, ...values) {
  return strings.reduce((result, string, index) => {
    return `${result}${string}${values[index] ?? ''}`;
  }, '');
}

export function formatMoney(value) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'INR',
  }).format(value);
}

export function formatDate(value) {
  if (!(value instanceof Date)) return '';

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(value);
}

export function includesText(item, query, keys) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  return keys.some((key) => {
    const value = item[key];
    return String(value ?? '').toLowerCase().includes(normalizedQuery);
  });
}

export function setError(container, error) {
  const message = error?.message ?? String(error);
  container.querySelector('[data-error]').textContent = message;
}

export function formValues(form) {
  return Object.fromEntries(new FormData(form).entries());
}
