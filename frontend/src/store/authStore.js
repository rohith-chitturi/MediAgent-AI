import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: ({ user, accessToken, refreshToken }) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      clearAuth: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),

      updateAccessToken: (accessToken) => set({ accessToken }),

      getUser: () => get().user,
      getToken: () => get().accessToken,
      
      hasPermission: (permission) => {
        const user = get().user;
        if (!user) return false;
        if (user.role === 'SUPER_ADMIN') return true;
        return user.permissions?.includes(permission) || false;
      },
      
      hasRole: (role) => {
        const user = get().user;
        return user?.role === role;
      },
    }),
    {
      name: 'mediagent-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
