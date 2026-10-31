import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email, password);

      const destination =
        location.state?.from === "/checkout"
          ? "/checkout"
          : "/products";

      navigate(destination, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Check your credentials."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-5 py-12">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-extrabold">
          Welcome Back
        </h1>

        <p className="mt-2 text-slate-500">
          Sign in to your ShopNest account.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >
          <div>
            <label
              htmlFor="login-email"
              className="mb-2 block font-medium"
            >
              Email
            </label>

            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              className="w-full rounded-xl border px-4 py-3"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="mb-2 block font-medium"
            >
              Password
            </label>

            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              className="w-full rounded-xl border px-4 py-3"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-indigo-600 py-3 font-bold text-white disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-bold text-indigo-600"
          >
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}