import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const DEVICE_ID_KEY = 'passly_device_id';

export function useDeviceId() {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
      if (!id) {
        id = Crypto.randomUUID();
        await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
      }
      setDeviceId(id);
    })();
  }, []);

  return deviceId;
}
