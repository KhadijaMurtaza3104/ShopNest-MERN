import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await register(name, email, password);
      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-5 py-12">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-extrabold">Create Account</h1>
        <p className="mt-2 text-slate-500">
          Join ShopNest and start shopping.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="register-name" className="mb-2 block font-medium">
              Full Name
            </label>
            <input
              id="register-name"
              required
              minLength={2}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-xl border px-4 py-3"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="register-email" className="mb-2 block font-medium">
              Email
            </label>
            <input
              id="register-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border px-4 py-3"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="register-password" className="mb-2 block font-medium">
              Password
            </label>
            <input
              id="register-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border px-4 py-3"
              placeholder="At least 8 characters"
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
            {submitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-indigo-600">
            Sign In
          </Link>
        </p>
      </div>
    </main>
  );
}