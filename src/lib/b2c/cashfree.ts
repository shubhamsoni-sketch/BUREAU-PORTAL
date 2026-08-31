const DEFAULT_API_VERSION = '2025-01-01';

function config() {
  const clientId = process.env.CASHFREE_CLIENT_ID || process.env.CASHFREE_APP_ID || '';
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET || process.env.CASHFREE_SECRET_KEY || '';
  const environment = (process.env.CASHFREE_ENV || 'production').toLowerCase();
  return {
    clientId,
    clientSecret,
    apiVersion: process.env.CASHFREE_API_VERSION || DEFAULT_API_VERSION,
    baseUrl: environment === 'sandbox' ? 'https://sandbox.cashfree.com/pg' : 'https://api.cashfree.com/pg',
    mode: environment === 'sandbox' ? 'sandbox' : 'production',
  };
}

export function cashfreeMode() {
  return config().mode;
}

async function cashfreeFetch(path: string, init?: RequestInit) {
  const value = config();
  if (!value.clientId || !value.clientSecret) throw new Error('Cashfree payment gateway is not configured');

  const response = await fetch(`${value.baseUrl}${path}`, {
    ...init,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'x-api-version': value.apiVersion,
      'x-client-id': value.clientId,
      'x-client-secret': value.clientSecret,
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.message || data?.type || `Cashfree request failed with ${response.status}`;
    throw new Error(message);
  }
  return data;
}

export function createCashfreeOrder(input: {
  orderId: string;
  amount: number;
  requestId: string;
  mobile: string;
}) {
  return cashfreeFetch('/orders', {
    method: 'POST',
    body: JSON.stringify({
      order_id: input.orderId,
      order_amount: input.amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: input.requestId,
        customer_name: 'CreditTrust Customer',
        customer_phone: input.mobile,
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://portal.credittrust.in'}/get-my-report?order_id={order_id}`,
      },
      order_note: `CreditTrust financial report ${input.requestId}`,
    }),
  });
}

export function getCashfreeOrder(orderId: string) {
  return cashfreeFetch(`/orders/${encodeURIComponent(orderId)}`, { method: 'GET' });
}
