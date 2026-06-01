import { useRouter } from 'vue-router';
import { useAuth } from './useAuth';

/** Выход из аккаунта с очисткой токена и переходом на главную. */
export function useLogout() {
  const router = useRouter();
  const { logout } = useAuth();

  async function signOut() {
    await logout();
    router.push('/');
  }

  return { signOut };
}
