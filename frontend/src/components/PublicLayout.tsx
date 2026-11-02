import { Link, Outlet } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";

import { useMe } from "@/features/auth/hooks";
import { useAuthStore } from "@/features/auth/store";

import { Avatar, LinkButton, Logo } from "./ui";

export function PublicLayout() {
  const user = useAuthStore((state) => state.user);

  // Revalidates an existing session in the background. Guests are unaffected:
  // the query is disabled until the store reports an authenticated session.
  useMe();

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-stone-50/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            aria-label="Mimmies Plus home"
            className="shrink-0 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600"
          >
            <span className="sm:hidden">
              <Logo compact />
            </span>
            <span className="hidden sm:block">
              <Logo />
            </span>
          </Link>

          <nav
            aria-label="Menu sections"
            className="hidden items-center gap-1 md:flex"
          >
            <a
              href="#categories"
              className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
            >
              Categories
            </a>
            <a
              href="#menu"
              className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
            >
              Menu
            </a>
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <LinkButton
                  to="/dashboard"
                  variant="secondary"
                  size="sm"
                  leftIcon={
                    <LayoutDashboard className="size-4" aria-hidden="true" />
                  }
                >
                  Dashboard
                </LinkButton>
                <Link
                  to="/profile"
                  aria-label="Open your profile"
                  className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                >
                  <Avatar name={user.name} />
                </Link>
              </>
            ) : (
              <>
                <LinkButton to="/login" variant="secondary" size="sm">
                  Sign in
                </LinkButton>
                <span className="hidden sm:inline-flex">
                  <LinkButton to="/register" size="sm">
                    Create account
                  </LinkButton>
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>

      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-6 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Mimmies Plus Catering</p>
          <p>Freshly made, beautifully catered.</p>
        </div>
      </footer>
    </div>
  );
}
