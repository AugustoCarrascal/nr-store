import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true, // en el navegador
    () => false // en el servidor
  );
}