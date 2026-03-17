let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken(env) {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry - 60000) {
    return cachedToken;
  }

  const res = await fetch(`https://${env.SHOPIFY_STORE}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: env.SHOPIFY_CLIENT_ID,
      client_secret: env.SHOPIFY_CLIENT_SECRET,
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token request failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = now + (data.expires_in * 1000);
  return cachedToken;
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return handleCORS(env);
    }

    const origin = request.headers.get('Origin') || '';
    if (env.ALLOWED_ORIGIN && !origin.includes(env.ALLOWED_ORIGIN)) {
      return new Response('Forbidden', { status: 403 });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      let data;

      if (path === '/api/orders') {
        data = await fetchAllOrders(env, url.searchParams);
      } else if (path === '/api/orders/summary') {
        data = await fetchOrdersSummary(env, url.searchParams);
      } else if (path === '/api/fulfillments') {
        data = await fetchFulfillments(env, url.searchParams);
      } else if (path === '/api/health') {
        const token = await getAccessToken(env);
        data = {
          status: 'ok',
          timestamp: new Date().toISOString(),
          tokenActive: !!token,
        };
      } else {
        return jsonResponse({ error: 'Not found', endpoints: [
          '/api/orders',
          '/api/orders/summary',
          '/api/fulfillments',
          '/api/health'
        ]}, 404, env, origin);
      }

      return jsonResponse(data, 200, env, origin);
    } catch (err) {
      return jsonResponse({ error: err.message }, 500, env, origin);
    }
  }
};

function handleCORS(env) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }
  });
}

function jsonResponse(data, status, env, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      'Cache-Control': 'public, max-age=300',
    }
  });
}

async function fetchAllPages(env, endpoint, resourceKey, params = {}) {
  const token = await getAccessToken(env);
  let allItems = [];
  let pageInfo = null;
  const limit = 250;

  do {
    const url = pageInfo
      ? `https://${env.SHOPIFY_STORE}/admin/api/2024-01/${endpoint}.json?limit=${limit}&page_info=${pageInfo}`
      : `https://${env.SHOPIFY_STORE}/admin/api/2024-01/${endpoint}.json?${new URLSearchParams({ limit, ...params })}`;

    const res = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
      }
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Shopify API error ${res.status}: ${text}`);
    }

    const data = await res.json();
    const items = data[resourceKey] || [];
    allItems = allItems.concat(items);

    const linkHeader = res.headers.get('Link') || '';
    const nextMatch = linkHeader.match(/<[^>]*page_info=([^>&]*)[^>]*>;\s*rel="next"/);
    pageInfo = nextMatch ? nextMatch[1] : null;

  } while (pageInfo);

  return allItems;
}

async function fetchAllOrders(env, searchParams) {
  const status = searchParams.get('status') || 'any';
  const createdMin = searchParams.get('created_at_min') || '';
  const createdMax = searchParams.get('created_at_max') || '';
  const fulfillment = searchParams.get('fulfillment_status') || 'any';

  const params = {
    status,
    fulfillment_status: fulfillment,
    fields: 'id,name,created_at,financial_status,fulfillment_status,total_price,currency,shipping_address,line_items,shipping_lines',
  };

  if (createdMin) params.created_at_min = createdMin;
  if (createdMax) params.created_at_max = createdMax;

  const orders = await fetchAllPages(env, 'orders', 'orders', params);

  return {
    count: orders.length,
    orders: orders.map(o => ({
      id: o.id,
      name: o.name,
      created_at: o.created_at,
      financial_status: o.financial_status,
      fulfillment_status: o.fulfillment_status,
      total_price: o.total_price,
      currency: o.currency,
      country: o.shipping_address?.country_code || null,
      province: o.shipping_address?.province_code || null,
      city: o.shipping_address?.city || null,
      line_items: (o.line_items || []).map(li => ({
        title: li.title,
        quantity: li.quantity,
        price: li.price,
        sku: li.sku,
        variant_title: li.variant_title,
        fulfillment_status: li.fulfillment_status,
      })),
      shipping_lines: (o.shipping_lines || []).map(sl => ({
        title: sl.title,
        price: sl.price,
        code: sl.code,
      })),
    }))
  };
}

async function fetchOrdersSummary(env, searchParams) {
  const createdMin = searchParams.get('created_at_min') || '';
  const createdMax = searchParams.get('created_at_max') || '';

  const params = {
    status: 'any',
    fulfillment_status: 'any',
    fields: 'id,created_at,fulfillment_status,financial_status,total_price,shipping_address',
  };

  if (createdMin) params.created_at_min = createdMin;
  if (createdMax) params.created_at_max = createdMax;

  const orders = await fetchAllPages(env, 'orders', 'orders', params);

  const byCountry = {};
  const byState = {};
  const byMonth = {};
  let totalRevenue = 0;
  let fulfilled = 0;
  let unfulfilled = 0;
  let partial = 0;

  for (const o of orders) {
    const country = o.shipping_address?.country_code || 'Unknown';
    const state = o.shipping_address?.province_code || null;
    const month = o.created_at?.substring(0, 7) || 'Unknown';
    const revenue = parseFloat(o.total_price) || 0;

    byCountry[country] = (byCountry[country] || 0) + 1;

    if (country === 'US' && state) {
      const stateKey = `US-${state}`;
      byState[stateKey] = (byState[stateKey] || 0) + 1;
    }

    if (!byMonth[month]) byMonth[month] = { orders: 0, revenue: 0 };
    byMonth[month].orders++;
    byMonth[month].revenue += revenue;

    totalRevenue += revenue;

    if (o.fulfillment_status === 'fulfilled') fulfilled++;
    else if (o.fulfillment_status === 'partial') partial++;
    else unfulfilled++;
  }

  return {
    totalOrders: orders.length,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    fulfillment: { fulfilled, unfulfilled, partial },
    byCountry,
    byState,
    byMonth,
  };
}

async function fetchFulfillments(env, searchParams) {
  const createdMin = searchParams.get('created_at_min') || '';
  const createdMax = searchParams.get('created_at_max') || '';

  const params = {
    status: 'any',
    fulfillment_status: 'any',
    fields: 'id,name,created_at,fulfillment_status,fulfillments,line_items',
  };

  if (createdMin) params.created_at_min = createdMin;
  if (createdMax) params.created_at_max = createdMax;

  const orders = await fetchAllPages(env, 'orders', 'orders', params);

  let totalItems = 0;
  let fulfilledItems = 0;
  const byDate = {};

  for (const o of orders) {
    const date = o.created_at?.substring(0, 10) || 'Unknown';

    for (const li of (o.line_items || [])) {
      totalItems += li.quantity || 1;
      if (li.fulfillment_status === 'fulfilled') {
        fulfilledItems += li.quantity || 1;
      }
    }

    if (!byDate[date]) byDate[date] = { orders: 0, fulfilled: 0, unfulfilled: 0 };
    byDate[date].orders++;
    if (o.fulfillment_status === 'fulfilled') byDate[date].fulfilled++;
    else byDate[date].unfulfilled++;
  }

  return {
    totalOrders: orders.length,
    totalItems,
    fulfilledItems,
    fulfillmentRate: totalItems > 0 ? Math.round((fulfilledItems / totalItems) * 10000) / 100 : 0,
    byDate,
  };
}
