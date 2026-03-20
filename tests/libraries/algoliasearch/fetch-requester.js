export const createFetchRequester = () => ({
  async send(endRequest) {
    const timeoutMs = Math.max(
      1,
      (endRequest.connectTimeout || 0) + (endRequest.responseTimeout || 0),
    );
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endRequest.url, {
        method: endRequest.method,
        headers: endRequest.headers,
        body: endRequest.data,
        signal: controller.signal,
      });

      return {
        status: response.status,
        isTimedOut: false,
        content: await response.text(),
      };
    } catch (error) {
      if (error && error.name === 'AbortError') {
        return {
          status: 0,
          isTimedOut: true,
          content: '',
        };
      }

      throw error;
    } finally {
      clearTimeout(timer);
    }
  },
});
