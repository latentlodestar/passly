import { useMemo } from "react";

const STORAGE_KEY = "passly_device_id";

export function useDeviceId(): string {
  return useMemo(() => {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  }, []);
}
