import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, LockKeyhole } from "lucide-react";

import api from "../services/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function Checkout() {
  const navigate = useNavigate();

  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();

  const [form, setForm] = useState({
    fullName: user?.name || "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    setError("");

    if (!user) {
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }

    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("shopnest_token");

      await api.post(
        "/orders",
        {
          items: cart.map((item) => ({
            product: item._id,
            quantity: item.quantity,
          })),
          shippingAddress: form,
          paymentMethod: "COD",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      clearCart();
      navigate("/my-orders", {
        state: { orderPlaced: true },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to place your order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <main className="mx-auto max-w-xl px-5 py-20 text-center">
        <LockKeyhole
          size={48}
          className="mx-auto text-indigo-600"
        />

        <h1 className="mt-5 text-3xl font-bold">
          Login Required
        </h1>

        <p className="mt-3 text-slate-500">
          Please sign in before placing your order.
        </p>

        <Link
          to="/login"
          state={{ from: "/checkout" }}
          className="mt-7 inline-block rounded-xl bg-indigo-600 px-7 py-3 font-semibold text-white"
        >
          Sign In
        </Link>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="mx-auto max-w-xl px-5 py-20 text-center">
        <ShoppingBag
          size={48}
          className="mx-auto text-slate-300"
        />

        <h1 className="mt-5 text-3xl font-bold">
          Your Cart Is Empty
        </h1>

        <Link
          to="/products"
          className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white"
        >
          Browse Products
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      <h1 className="mb-8 text-4xl font-extrabold">
        Checkout
      </h1>

      <form
        onSubmit={placeOrder}
        className="grid gap-8 lg:grid-cols-3"
      >
        <section className="rounded-2xl border bg-white p-6 lg:col-span-2">
          <h2 className="text-2xl font-bold">
            Shipping Information
          </h2>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {[
              {
                name: "fullName",
                label: "Full Name",
                placeholder: "Your full name",
              },
              {
                name: "phone",
                label: "Phone Number",
                placeholder: "03XXXXXXXXX",
              },
              {
                name: "city",
                label: "City",
                placeholder: "Your city",
              },
              {
                name: "postalCode",
                label: "Postal Code (Optional)",
                placeholder: "Postal code",
              },
            ].map((field) => (
              <div key={field.name}>
                <label
                  htmlFor={field.name}
                  className="mb-2 block font-semibold"
                >
                  {field.label}
                </label>

                <input
                  id={field.name}
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  required={field.name !== "postalCode"}
                  placeholder={field.placeholder}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-600"
                />
              </div>
            ))}

            <div className="sm:col-span-2">
              <label
                htmlFor="address"
                className="mb-2 block font-semibold"
              >
                Complete Address
              </label>

              <textarea
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                required
                rows={3}
                placeholder="House number, street, area..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="mt-8 rounded-xl bg-indigo-50 p-5">
            <h3 className="font-bold text-indigo-900">
              Payment Method
            </h3>

            <p className="mt-2 text-indigo-700">
              Cash on Delivery (COD)
            </p>
          </div>
        </section>

        <aside className="h-fit rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-bold">
            Order Summary
          </h2>

          <div className="mt-6 space-y-4">
            {cart.map((item) => (
              <div
                key={item._id}
                className="flex justify-between gap-3 text-sm"
              >
                <span>
                  {item.name} × {item.quantity}
                </span>

                <span className="font-semibold">
                  Rs.{" "}
                  {(item.price * item.quantity).toLocaleString(
                    "en-PK"
                  )}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t pt-5">
            <div className="flex justify-between text-lg font-extrabold">
              <span>Subtotal</span>
              <span>
                Rs. {cartTotal.toLocaleString("en-PK")}
              </span>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Final total is verified by the server.
              Delivery charges are not included in this MVP.
            </p>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-600"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-7 w-full rounded-xl bg-indigo-600 py-4 font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Placing Order..." : "Place Order"}
          </button>

          <p className="mt-4 text-center text-xs text-slate-500">
            Secure order processing
          </p>
        </aside>
      </form>
    </main>
  );
}