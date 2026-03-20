export const withMockFetch = async (plansOrFn, runFn) => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  let callIndex = 0;

  globalThis.fetch = async (url, options = {}) => {
    const call = { url: String(url), options };
    calls.push(call);

    let plan;
    if (typeof plansOrFn === 'function') {
      plan = await plansOrFn(call, calls);
    } else {
      const plans = Array.isArray(plansOrFn) ? plansOrFn : [plansOrFn];
      plan = plans[callIndex++] ?? plans[plans.length - 1] ?? {};
    }

    if (plan.throwError) {
      throw plan.throwError;
    }

    const status = plan.status ?? 200;
    const payload = plan.json ?? {};

    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => payload,
      text: async () => JSON.stringify(payload),
    };
  };

  try {
    return await runFn(calls);
  } finally {
    globalThis.fetch = originalFetch;
  }
};

export const parseJsonBody = (call) => {
  const body = call?.options?.body;
  return typeof body === 'string' && body.length > 0 ? JSON.parse(body) : {};
};

export const createSearchPayload = (query, page = 1, requestId = 1) => ({
  searchParameters: {
    q: query,
    page,
    type: 'search',
  },
  organic: [
    {
      title: `${query} result page ${page}`,
      link: `https://example.com/${encodeURIComponent(query)}/${page}`,
      snippet: `Snippet for ${query} page ${page}`,
      position: 1,
    },
  ],
  peopleAlsoAsk: [],
  relatedSearches: [],
  requestId,
});
