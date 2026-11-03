import { createBrowserRouter, Navigate } from "react-router-dom";

import { AppShell } from "@/components/AppShell";
import { AuthLayout } from "@/components/AuthLayout";
import { PublicLayout } from "@/components/PublicLayout";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "@/features/auth/pages/ResetPasswordPage";
import { VerifyEmailPage } from "@/features/auth/pages/VerifyEmailPage";
import { ProfilePage } from "@/features/auth/pages/ProfilePage";
import { PublicOnlyRoute, RequireAuth, RequireRole } from "@/features/auth/guards";
import { CategoriesPage } from "@/features/admin/categories/CategoriesPage";
import { MenuManagementPage } from "@/features/admin/menu/MenuManagementPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { ForbiddenPage } from "@/features/errors/ForbiddenPage";
import { NotFoundPage } from "@/features/errors/NotFoundPage";
import { MenuPage } from "@/features/menu/MenuPage";
import { MenuItemPage } from "@/features/menu/MenuItemPage";
import { CheckoutPage } from "@/features/orders/CheckoutPage";
import { OrderDetailPage } from "@/features/orders/OrderDetailPage";
import { OrdersPage } from "@/features/orders/OrdersPage";
import { PaymentConfirmationPage } from "@/features/orders/PaymentConfirmationPage";
import { UsersPage } from "@/features/users/UsersPage";

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <MenuPage /> },
      { path: "menu/:id", element: <MenuItemPage /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: "login",
        element: (
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        ),
      },
      {
        path: "register",
        element: (
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        ),
      },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "reset-password", element: <ResetPasswordPage /> },
      { path: "verify-email", element: <VerifyEmailPage /> },
    ],
  },
  {
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { path: "dashboard", element: <DashboardPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "checkout", element: <CheckoutPage /> },
      { path: "orders", element: <OrdersPage /> },
      {
        path: "orders/confirmation",
        element: <PaymentConfirmationPage />,
      },
      { path: "orders/:id", element: <OrderDetailPage /> },
      {
        path: "admin/menu",
        element: (
          <RequireRole roles={["ADMIN"]}>
            <MenuManagementPage />
          </RequireRole>
        ),
      },
      {
        path: "admin/categories",
        element: (
          <RequireRole roles={["ADMIN"]}>
            <CategoriesPage />
          </RequireRole>
        ),
      },
      {
        path: "admin/users",
        element: (
          <RequireRole roles={["ADMIN"]}>
            <UsersPage />
          </RequireRole>
        ),
      },
    ],
  },
  { path: "/menu", element: <Navigate to="/" replace /> },
  { path: "/403", element: <ForbiddenPage /> },
  { path: "*", element: <NotFoundPage /> },
]);
