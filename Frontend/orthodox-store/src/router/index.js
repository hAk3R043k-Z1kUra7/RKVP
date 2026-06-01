import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import ForgotPassword from '../views/ForgotPassword.vue';
import ResetPassword from '../views/ResetPassword.vue';
import ProductList from '../views/ProductList.vue';
import Cart from '../views/Cart.vue';
import VirtualCandle from '../views/VirtualCandle.vue';
import NameGenerator from '../views/NameGenerator.vue';
import Prayers from '../views/Prayers.vue';
import CabinetLayout from '../views/CabinetLayout.vue';
import CabinetProfile from '../views/CabinetProfile.vue';
import CabinetOrders from '../views/CabinetOrders.vue';
import CabinetFavorites from '../views/CabinetFavorites.vue';
import DashboardLayout from '../views/DashboardLayout.vue';
import AdminProducts from '../views/AdminProducts.vue';
import AdminProductForm from '../views/AdminProductForm.vue';
import DashboardUsers from '../views/DashboardUsers.vue';
import NotFound from '../views/NotFound.vue';
import AuthBlocked from '../views/AuthBlocked.vue';
import { apiFetch } from '../api';

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/products', name: 'Products', component: ProductList },
  { path: '/cart', name: 'Cart', component: Cart },
  { path: '/candle', name: 'VirtualCandle', component: VirtualCandle },
  { path: '/name-generator', name: 'NameGenerator', component: NameGenerator },
  { path: '/prayers', name: 'Prayers', component: Prayers },
  {
    path: '/auth/login',
    name: 'Login',
    component: Login,
    meta: { guestOnly: true },
  },
  {
    path: '/auth/register',
    name: 'Register',
    component: Register,
    meta: { guestOnly: true },
  },
  {
    path: '/auth/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPassword,
    meta: { guestOnly: true },
  },
  {
    path: '/auth/reset-password',
    name: 'ResetPassword',
    component: ResetPassword,
    meta: { guestOnly: true },
  },
  {
    path: '/error/already-logged-in',
    name: 'AuthBlocked',
    component: AuthBlocked,
  },
  { path: '/profile', redirect: '/cabinet/profile' },
  {
    path: '/cabinet',
    component: CabinetLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/cabinet/profile' },
      { path: 'profile', name: 'CabinetProfile', component: CabinetProfile },
      { path: 'orders', name: 'CabinetOrders', component: CabinetOrders },
      { path: 'favorites', name: 'CabinetFavorites', component: CabinetFavorites },
    ],
  },
  {
    path: '/dashboard',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresSeller: true },
    children: [
      { path: '', redirect: '/dashboard/products' },
      { path: 'products', name: 'DashboardProducts', component: AdminProducts },
      { path: 'products/new', name: 'DashboardProductNew', component: AdminProductForm },
      { path: 'products/:id/edit', name: 'DashboardProductEdit', component: AdminProductForm },
      {
        path: 'users',
        name: 'DashboardUsers',
        component: DashboardUsers,
        meta: { requiresAdmin: true },
      },
    ],
  },
  { path: '/admin/products', redirect: '/dashboard/products' },
  { path: '/admin/products/new', redirect: '/dashboard/products/new' },
  { path: '/admin/products/:id/edit', redirect: (to) => `/dashboard/products/${to.params.id}/edit` },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound },
];

const router = createRouter({ history: createWebHistory('/RKVP/'), routes });

async function getCurrentUser() {
  const stored = localStorage.getItem('user');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed?.role) return parsed;
    } catch {
      /* ignore */
    }
  }
  try {
    const res = await apiFetch('/auth/me');
    localStorage.setItem('user', JSON.stringify(res.user));
    return res.user;
  } catch {
    return null;
  }
}

function canManageProducts(user) {
  return user?.role === 'seller' || user?.role === 'admin';
}

router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token');

  if (to.path === '/error/already-logged-in' && !token) {
    return next('/auth/login');
  }

  if (to.meta.guestOnly && token) {
    return next('/error/already-logged-in');
  }

  if (to.meta.requiresAuth && !token) {
    return next({ path: '/auth/login', query: { redirect: to.fullPath } });
  }

  const needsSeller = to.matched.some((r) => r.meta.requiresSeller);
  const needsAdmin = to.matched.some((r) => r.meta.requiresAdmin);

  if (needsSeller || needsAdmin) {
    if (!token) return next({ path: '/auth/login', query: { redirect: to.fullPath } });
    const user = await getCurrentUser();

    if (needsAdmin && (!user || user.role !== 'admin')) {
      return next('/dashboard/products');
    }

    if (needsSeller && (!user || !canManageProducts(user))) {
      return next('/cabinet/profile');
    }
  }

  next();
});

export default router;
