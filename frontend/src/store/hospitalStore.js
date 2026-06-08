import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useHospitalStore = create(
  persist(
    (set) => ({
      activeHospital: null,
      hospitals: [],

      setActiveHospital: (hospital) => set({ activeHospital: hospital }),
      setHospitals: (hospitals) => set({ hospitals }),
      clearHospital: () => set({ activeHospital: null, hospitals: [] }),
    }),
    {
      name: 'mediagent-hospital',
      partialize: (state) => ({ activeHospital: state.activeHospital }),
    }
  )
);

export default useHospitalStore;
