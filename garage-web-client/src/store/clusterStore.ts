import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ClusterConfig {
  id: string;
  name: string;
  endpoint: string;
  token: string;
}

interface ClusterState {
  clusters: ClusterConfig[];
  activeClusterId: string | null;
  addCluster: (cluster: Omit<ClusterConfig, "id">) => void;
  removeCluster: (id: string) => void;
  setActiveCluster: (id: string | null) => void;
  updateCluster: (id: string, updates: Partial<ClusterConfig>) => void;
}

export const useClusterStore = create<ClusterState>()(
  persist(
    (set) => ({
      clusters: [],
      activeClusterId: null,
      addCluster: (cluster) =>
        set((state) => ({
          clusters: [
            ...state.clusters,
            { ...cluster, id: crypto.randomUUID() },
          ],
        })),
      removeCluster: (id) =>
        set((state) => ({
          clusters: state.clusters.filter((c) => c.id !== id),
          activeClusterId:
            state.activeClusterId === id ? null : state.activeClusterId,
        })),
      setActiveCluster: (id) => set({ activeClusterId: id }),
      updateCluster: (id, updates) =>
        set((state) => ({
          clusters: state.clusters.map((c) =>
            c.id === id ? { ...c, ...updates } : c,
          ),
        })),
    }),
    {
      name: "garage-cluster-storage",
    },
  ),
);
