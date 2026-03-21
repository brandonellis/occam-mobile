import { sendStreamingRequest } from '../../src/helpers/streaming.helper';
import { getToken, getTenantId, clearAllStorage } from '../../src/helpers/storage.helper';
import { getTenantApiUrl } from '../../src/config';
import { streamSSE } from '../../src/helpers/sse.helper';

jest.mock('../../src/helpers/storage.helper', () => ({
  getToken: jest.fn(),
  getTenantId: jest.fn(),
  clearAllStorage: jest.fn(),
}));

jest.mock('../../src/config', () => ({
  getTenantApiUrl: jest.fn(),
}));

jest.mock('../../src/helpers/sse.helper', () => ({
  streamSSE: jest.fn(),
}));

describe('sendStreamingRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getToken.mockResolvedValue('test-token');
    getTenantId.mockResolvedValue('tenant-123');
    getTenantApiUrl.mockReturnValue('http://api.test.com/api/v1');
    streamSSE.mockReturnValue({
      promise: Promise.resolve({ response: 'Hello' }),
      abort: jest.fn(),
    });
  });

  test('throws when no auth token is available', async () => {
    getToken.mockResolvedValue(null);
    await expect(sendStreamingRequest('/test/stream', {}))
      .rejects.toThrow('Authentication token is required');
    expect(streamSSE).not.toHaveBeenCalled();
  });

  test('constructs correct URL with tenant base', async () => {
    await sendStreamingRequest('/marshal/chat/stream', { message: 'hi' });
    expect(streamSSE).toHaveBeenCalledWith(
      'http://api.test.com/api/v1/marshal/chat/stream',
      expect.any(Object),
      expect.any(Object),
    );
  });

  test('sets auth and tenant headers', async () => {
    await sendStreamingRequest('/test', {});
    expect(streamSSE).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
          Accept: 'text/event-stream',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-Tenant': 'tenant-123',
        }),
      }),
      expect.any(Object),
    );
  });

  test('omits X-Tenant header when no tenant', async () => {
    getTenantId.mockResolvedValue(null);
    getTenantApiUrl.mockReturnValue('');
    await sendStreamingRequest('/test', {});
    const [url, options] = streamSSE.mock.calls[0];
    expect(url).toBe('/test');
    expect(options.headers['X-Tenant']).toBeUndefined();
  });

  test('passes JSON-stringified body', async () => {
    const body = { message: 'hello', history: [] };
    await sendStreamingRequest('/test', body);
    const [, options] = streamSSE.mock.calls[0];
    expect(options.body).toBe(JSON.stringify(body));
  });

  test('passes handlers through to streamSSE', async () => {
    const handlers = { token: jest.fn(), card: jest.fn() };
    await sendStreamingRequest('/test', {}, handlers);
    expect(streamSSE).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      handlers,
    );
  });

  test('sets 60 second timeout', async () => {
    await sendStreamingRequest('/test', {});
    const [, options] = streamSSE.mock.calls[0];
    expect(options.timeout).toBe(60000);
  });

  test('sets onUnauthorized to clearAllStorage', async () => {
    await sendStreamingRequest('/test', {});
    const [, options] = streamSSE.mock.calls[0];
    expect(typeof options.onUnauthorized).toBe('function');
    options.onUnauthorized();
    expect(clearAllStorage).toHaveBeenCalled();
  });

  test('returns the resolved promise from streamSSE', async () => {
    const expected = { response: 'Test result' };
    streamSSE.mockReturnValue({ promise: Promise.resolve(expected), abort: jest.fn() });
    const result = await sendStreamingRequest('/test', {});
    expect(result).toBe(expected);
  });

  test('propagates errors from streamSSE', async () => {
    streamSSE.mockReturnValue({
      promise: Promise.reject(new Error('Stream failed')),
      abort: jest.fn(),
    });
    await expect(sendStreamingRequest('/test', {})).rejects.toThrow('Stream failed');
  });
});
