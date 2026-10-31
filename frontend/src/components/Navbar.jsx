import { Link, NavLink } from "react-router-dom";
import {
  ShoppingCart,
  Store,
  LogOut,
} from "lucide-react";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { cartCount } = useCart();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5">
        <Link
          to="/"
          className="flex items-center gap-2 text-2xl font-black text-indigo-600"
        >
          <Store size={25} />
          ShopNest.
        </Link>

        <div className="flex flex-wrap items-center gap-4 text-sm font-semibold sm:gap-6">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/products">Products</NavLink>

          {user ? (
            <>
              <NavLink to="/my-orders">My Orders</NavLink>

              {user.role === "admin" && (
                <NavLink
                  to="/admin"
                  className="font-bold text-indigo-600"
                >
                  Admin
                </NavLink>
              )}

              <span className="hidden text-slate-600 md:inline">
                Hi, {user.name}
              </span>

              <button
                type="button"
                onClick={logout}
                title="Log out"
                aria-label="Log out"
              >
                <LogOut size={21} />
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}

          <Link
            to="/cart"
            className="relative"
            aria-label="Shopping cart"
          >
            <ShoppingCart size={24} />

            {cartCount > 0 && (
              <span className="absolute -right-3 -top-3 rounded-full bg-indigo-600 px-1.5 text-xs text-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </nav>
    </header>
  );
}