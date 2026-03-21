import { streamSSE } from '../../src/helpers/sse.helper';

// Mock XMLHttpRequest
class MockXHR {
  constructor() {
    this.method = null;
    this.url = null;
    this.headers = {};
    this.timeout = 0;
    this.responseText = '';
    this.status = 200;
    this.onprogress = null;
    this.onload = null;
    this.onerror = null;
    this.ontimeout = null;
    this._aborted = false;
  }

  open(method, url) {
    this.method = method;
    this.url = url;
  }

  setRequestHeader(key, value) {
    this.headers[key] = value;
  }

  send() {
    // Subclasses or test code will trigger callbacks
  }

  abort() {
    this._aborted = true;
  }
}

// Replace global XMLHttpRequest
let xhrInstance;
beforeEach(() => {
  xhrInstance = null;
  global.XMLHttpRequest = jest.fn(() => {
    xhrInstance = new MockXHR();
    return xhrInstance;
  });
});

afterEach(() => {
  delete global.XMLHttpRequest;
});

describe('streamSSE', () => {
  test('returns promise and abort function', () => {
    const result = streamSSE('http://test.com/stream', {});
    expect(result).toHaveProperty('promise');
    expect(result).toHaveProperty('abort');
    expect(typeof result.abort).toBe('function');
  });

  test('opens XHR with correct method and URL', () => {
    streamSSE('http://test.com/stream', { method: 'POST' });
    expect(xhrInstance.method).toBe('POST');
    expect(xhrInstance.url).toBe('http://test.com/stream');
  });

  test('sets request headers', () => {
    streamSSE('http://test.com/stream', {
      headers: { Authorization: 'Bearer token', 'Content-Type': 'application/json' },
    });
    expect(xhrInstance.headers.Authorization).toBe('Bearer token');
    expect(xhrInstance.headers['Content-Type']).toBe('application/json');
  });

  test('sets timeout', () => {
    streamSSE('http://test.com/stream', { timeout: 30000 });
    expect(xhrInstance.timeout).toBe(30000);
  });

  test('defaults to POST method', () => {
    streamSSE('http://test.com/stream');
    expect(xhrInstance.method).toBe('POST');
  });

  test('resolves with final result from done event', async () => {
    const { promise } = streamSSE('http://test.com/stream', {}, {});

    // Simulate SSE response with done event
    xhrInstance.responseText = 'event: done\ndata: {"response":"Hello","suggested_actions":[]}\n\n';
    xhrInstance.status = 200;
    xhrInstance.onload();

    const result = await promise;
    expect(result).toEqual({ response: 'Hello', suggested_actions: [] });
  });

  test('calls token handler for token events via onprogress', async () => {
    const onToken = jest.fn();
    const { promise } = streamSSE('http://test.com/stream', {}, {
      token: onToken,
    });

    // First chunk via onprogress
    xhrInstance.responseText = 'event: token\ndata: {"text":"Hello "}\n\n';
    xhrInstance.onprogress();

    expect(onToken).toHaveBeenCalledWith({ text: 'Hello ' });

    // Second chunk
    xhrInstance.responseText += 'event: token\ndata: {"text":"world"}\n\nevent: done\ndata: {"response":"Hello world"}\n\n';
    xhrInstance.onprogress();

    expect(onToken).toHaveBeenCalledTimes(2);

    // Complete
    xhrInstance.status = 200;
    xhrInstance.onload();

    const result = await promise;
    expect(result.response).toBe('Hello world');
  });

  test('calls card handler for card events', async () => {
    const onCard = jest.fn();
    const { promise } = streamSSE('http://test.com/stream', {}, {
      card: onCard,
    });

    xhrInstance.responseText = 'event: card\ndata: {"card":{"type":"stats"}}\n\nevent: done\ndata: {"response":"ok"}\n\n';
    xhrInstance.status = 200;
    xhrInstance.onload();

    await promise;
    expect(onCard).toHaveBeenCalledWith({ card: { type: 'stats' } });
  });

  test('rejects on network error', async () => {
    const { promise } = streamSSE('http://test.com/stream');
    xhrInstance.onerror();
    await expect(promise).rejects.toThrow('Network error during streaming');
  });

  test('rejects on timeout', async () => {
    const { promise } = streamSSE('http://test.com/stream');
    xhrInstance.ontimeout();
    await expect(promise).rejects.toThrow('Streaming request timed out');
  });

  test('rejects on HTTP error with sanitized message', async () => {
    const { promise } = streamSSE('http://test.com/stream');
    xhrInstance.status = 500;
    xhrInstance.responseText = JSON.stringify({ message: 'Internal Server Error' });
    xhrInstance.onload();
    await expect(promise).rejects.toThrow('Internal Server Error');
  });

  test('truncates long error responses', async () => {
    const { promise } = streamSSE('http://test.com/stream');
    xhrInstance.status = 500;
    xhrInstance.responseText = 'x'.repeat(500);
    xhrInstance.onload();
    await expect(promise).rejects.toThrow(/^x{200}$/);
  });

  test('rejects with status code when no response text', async () => {
    const { promise } = streamSSE('http://test.com/stream');
    xhrInstance.status = 503;
    xhrInstance.responseText = '';
    xhrInstance.onload();
    await expect(promise).rejects.toThrow('Stream request failed: 503');
  });

  test('rejects on SSE error event', async () => {
    const { promise } = streamSSE('http://test.com/stream');
    xhrInstance.responseText = 'event: error\ndata: {"message":"Rate limited"}\n\n';
    xhrInstance.status = 200;
    xhrInstance.onload();
    await expect(promise).rejects.toThrow('Rate limited');
  });

  test('rejects when stream ends without done event', async () => {
    const { promise } = streamSSE('http://test.com/stream');
    xhrInstance.responseText = 'event: token\ndata: {"text":"partial"}\n\n';
    xhrInstance.status = 200;
    xhrInstance.onload();
    await expect(promise).rejects.toThrow('Stream ended without a final result');
  });

  test('calls onUnauthorized on 401', async () => {
    const onUnauthorized = jest.fn();
    const { promise } = streamSSE('http://test.com/stream', { onUnauthorized });
    xhrInstance.status = 401;
    xhrInstance.responseText = '';
    xhrInstance.onload();

    await expect(promise).rejects.toThrow();
    expect(onUnauthorized).toHaveBeenCalled();
  });

  test('does not call onUnauthorized on non-401 errors', async () => {
    const onUnauthorized = jest.fn();
    const { promise } = streamSSE('http://test.com/stream', { onUnauthorized });
    xhrInstance.status = 500;
    xhrInstance.responseText = '';
    xhrInstance.onload();

    await expect(promise).rejects.toThrow();
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  test('abort() calls xhr.abort()', () => {
    const { abort } = streamSSE('http://test.com/stream');
    expect(xhrInstance._aborted).toBe(false);
    abort();
    expect(xhrInstance._aborted).toBe(true);
  });

  test('abort() is idempotent', () => {
    const { abort } = streamSSE('http://test.com/stream');
    abort();
    abort(); // second call should not throw
    expect(xhrInstance._aborted).toBe(true);
  });

  test('handles single-chunk response where onprogress does not fire', async () => {
    const onToken = jest.fn();
    const { promise } = streamSSE('http://test.com/stream', {}, { token: onToken });

    // onprogress never fires — only onload with full response
    xhrInstance.responseText = 'event: token\ndata: {"text":"all at once"}\n\nevent: done\ndata: {"response":"all at once"}\n\n';
    xhrInstance.status = 200;
    xhrInstance.onload();

    const result = await promise;
    expect(result.response).toBe('all at once');
    expect(onToken).toHaveBeenCalledWith({ text: 'all at once' });
  });

  test('handles empty onprogress calls gracefully', async () => {
    const { promise } = streamSSE('http://test.com/stream');

    // Empty onprogress (no new data)
    xhrInstance.responseText = '';
    xhrInstance.onprogress();

    // Then real data
    xhrInstance.responseText = 'event: done\ndata: {"response":"ok"}\n\n';
    xhrInstance.status = 200;
    xhrInstance.onload();

    const result = await promise;
    expect(result.response).toBe('ok');
  });
});
