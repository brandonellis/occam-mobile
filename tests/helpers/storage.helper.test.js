/**
 * Tests for storage.helper.js — in-memory caching layer over SecureStore.
 *
 * Because the cache is module-level state, each describe block uses
 * jest.isolateModules() to get a fresh module instance with a clean cache.
 */
import * as SecureStore from 'expo-secure-store';

// Helper to get a fresh module with clean cache
const loadFreshModule = () => {
  let mod;
  jest.isolateModules(() => {
    mod = require('../../src/helpers/storage.helper');
  });
  return mod;
};

describe('storage.helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('token caching', () => {
    test('getToken reads from SecureStore on first call', async () => {
      const { getToken } = loadFreshModule();
      SecureStore.getItemAsync.mockResolvedValueOnce('test-token-123');

      const token = await getToken();

      expect(token).toBe('test-token-123');
      expect(SecureStore.getItemAsync).toHaveBeenCalledTimes(1);
    });

    test('getToken returns cached value on subsequent calls without hitting SecureStore', async () => {
      const { getToken } = loadFreshModule();
      SecureStore.getItemAsync.mockResolvedValueOnce('cached-token');

      await getToken(); // populates cache
      const token = await getToken(); // should use cache

      expect(token).toBe('cached-token');
      expect(SecureStore.getItemAsync).toHaveBeenCalledTimes(1);
    });

    test('setToken updates both cache and SecureStore', async () => {
      const { setToken, getToken } = loadFreshModule();

      await setToken('new-token');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        expect.any(String),
        'new-token'
      );

      // Subsequent getToken should return from cache without hitting SecureStore
      const token = await getToken();
      expect(token).toBe('new-token');
      expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
    });

    test('removeToken resets cache so next getToken hits SecureStore', async () => {
      const { setToken, removeToken, getToken } = loadFreshModule();

      await setToken('to-be-removed');
      await removeToken();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalled();

      // Next getToken should hit SecureStore again since cache was reset
      SecureStore.getItemAsync.mockResolvedValueOnce(null);
      const token = await getToken();

      expect(token).toBeNull();
      expect(SecureStore.getItemAsync).toHaveBeenCalledTimes(1);
    });

    test('getToken caches null when SecureStore has no value', async () => {
      const { getToken } = loadFreshModule();
      SecureStore.getItemAsync.mockResolvedValueOnce(null);

      const first = await getToken();
      expect(first).toBeNull();

      // Second call should NOT hit SecureStore — null is now cached
      const second = await getToken();
      expect(second).toBeNull();
      expect(SecureStore.getItemAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('tenantId caching', () => {
    test('setTenantId and getTenantId use cache', async () => {
      const { setTenantId, getTenantId } = loadFreshModule();

      await setTenantId('my-tenant');

      const tenantId = await getTenantId();
      expect(tenantId).toBe('my-tenant');
      expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
    });

    test('removeTenantId resets cache', async () => {
      const { setTenantId, removeTenantId, getTenantId } = loadFreshModule();

      await setTenantId('old-tenant');
      await removeTenantId();

      SecureStore.getItemAsync.mockResolvedValueOnce(null);
      const tenantId = await getTenantId();

      expect(tenantId).toBeNull();
      expect(SecureStore.getItemAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearAllStorage', () => {
    test('resets all caches and clears SecureStore', async () => {
      const { setToken, setTenantId, clearAllStorage, getToken, getTenantId } =
        loadFreshModule();

      await setToken('t');
      await setTenantId('tid');
      jest.clearAllMocks(); // reset call counts

      await clearAllStorage();

      // Both should now hit SecureStore on next read
      SecureStore.getItemAsync.mockResolvedValue(null);
      const token = await getToken();
      const tenantId = await getTenantId();

      expect(token).toBeNull();
      expect(tenantId).toBeNull();
      // 2 reads from SecureStore (cache was cleared)
      expect(SecureStore.getItemAsync).toHaveBeenCalledTimes(2);
    });
  });
});
