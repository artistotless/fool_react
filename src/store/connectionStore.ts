import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface ConnectionStoreState {
  hubDetails: {
    url: string | null;
    token: any | null;
  } | null;
  setHubDetails: (details: { url: string, token: any } | null) => void;
}

const useConnectionStore = create<ConnectionStoreState>()(
  devtools(
    (set) => ({
      hubDetails: {
        url: null,
        token: null,
      },
      setHubDetails: (details) => set({ hubDetails: details }, undefined, 'connection/setHubDetails'),
    }),
    { name: 'Connection Store' }
  )
);

export default useConnectionStore; 