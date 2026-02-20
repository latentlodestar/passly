import * as SecureStore from 'expo-secure-store';

const COGNITO_KEY_PREFIX = 'CognitoIdentityServiceProvider.';

/**
 * In-memory cache that backs the synchronous getItem / setItem / removeItem
 * interface required by the amazon-cognito-identity-js SDK.
 *
 * Must be populated at startup via `hydrateStorage()` before the SDK tries
 * to read any tokens.
 */
const cache = new Map<string, string>();

/**
 * Synchronous storage adapter compatible with CognitoUserPool's `Storage` option.
 * Uses an in-memory Map cache because the Cognito SDK calls getItem synchronously,
 * but expo-secure-store is async.  Every write is mirrored to SecureStore so values
 * survive app restarts once `hydrateStorage()` is called on next launch.
 */
export const secureStorage = {
  getItem(key: string): string | null {
    return cache.get(key) ?? null;
  },

  setItem(key: string, value: string): void {
    cache.set(key, value);
    // Fire-and-forget the async write to SecureStore
    SecureStore.setItemAsync(key, value).catch(() => {});
  },

  removeItem(key: string): void {
    cache.delete(key);
    SecureStore.deleteItemAsync(key).catch(() => {});
  },

  clear(): void {
    // Delete all cached keys from SecureStore, then clear the cache
    for (const key of cache.keys()) {
      SecureStore.deleteItemAsync(key).catch(() => {});
    }
    cache.clear();
  },
};

/**
 * Known Cognito key suffixes that need to be hydrated from SecureStore into
 * the in-memory cache at startup.  The full key is
 * `CognitoIdentityServiceProvider.<clientId>.<username>.<suffix>`.
 *
 * We also need the `LastAuthUser` key which has no username segment.
 */
const KNOWN_SUFFIXES = [
  'LastAuthUser',
  'accessToken',
  'idToken',
  'refreshToken',
  'clockDrift',
  'userData',
];

/**
 * Pre-loads all known Cognito keys from expo-secure-store into the in-memory
 * cache.  Call this once before constructing the CognitoUserPool or accessing
 * any session data.
 *
 * Because SecureStore doesn't support key enumeration, we build candidate keys
 * from the known client ID and the previously stored `LastAuthUser`.
 */
export async function hydrateStorage(): Promise<void> {
  const clientId = process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID ?? '';
  if (!clientId) return;

  const prefix = `${COGNITO_KEY_PREFIX}${clientId}`;

  // Try to load LastAuthUser first — we need the username for the other keys.
  const lastAuthUserKey = `${prefix}.LastAuthUser`;
  const lastAuthUser = await SecureStore.getItemAsync(lastAuthUserKey).catch(() => null);

  if (lastAuthUser) {
    cache.set(lastAuthUserKey, lastAuthUser);

    // Load user-specific keys
    const userPrefix = `${prefix}.${lastAuthUser}`;
    const promises = KNOWN_SUFFIXES.filter((s) => s !== 'LastAuthUser').map(async (suffix) => {
      const key = `${userPrefix}.${suffix}`;
      const value = await SecureStore.getItemAsync(key).catch(() => null);
      if (value) {
        cache.set(key, value);
      }
    });

    await Promise.all(promises);
  }
}
