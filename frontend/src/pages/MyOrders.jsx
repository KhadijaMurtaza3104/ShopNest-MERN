import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Package, ShoppingBag } from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function MyOrders() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadOrders() {
      try {
        setLoading(true);

        const token = localStorage.getItem("shopnest_token");

        const response = await api.get("/orders/my", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        setOrders(response.data);
      } catch (err) {
        if (err.code === "ERR_CANCELED") return;

        setError(
          err.response?.data?.message ||
            "Unable to load your orders."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => controller.abort();
  }, [user, authLoading]);

  if (authLoading) {
    return <p className="py-20 text-center">Checking your account...</p>;
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-xl px-5 py-20 text-center">
        <h1 className="text-3xl font-bold">Login Required</h1>
        <Link
          to="/login"
          className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white"
        >
          Sign In
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[70vh] max-w-5xl px-5 py-12">
      <h1 className="text-4xl font-extrabold">
        My Orders
      </h1>

      {location.state?.orderPlaced && (
        <div className="mt-6 rounded-xl bg-green-50 p-4 font-semibold text-green-700">
          Your order was placed successfully!
        </div>
      )}

      {loading ? (
        <p className="py-16 text-center">
          Loading your orders...
        </p>
      ) : error ? (
        <p className="py-16 text-center text-red-600">
          {error}
        </p>
      ) : orders.length === 0 ? (
        <div className="mt-8 rounded-2xl border bg-white p-12 text-center">
          <ShoppingBag
            size={50}
            className="mx-auto text-slate-300"
          />

          <h2 className="mt-4 text-xl font-bold">
            No orders yet
          </h2>

          <Link
            to="/products"
            className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {orders.map((order) => (
            <article
              key={order._id}
              className="rounded-2xl border bg-white p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">
                    Order #{order._id.slice(-8).toUpperCase()}
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    {new Date(order.createdAt).toLocaleDateString(
                      "en-PK"
                    )}
                  </p>
                </div>

                <span className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-bold capitalize text-indigo-700">
                  {order.status}
                </span>
              </div>

              <div className="mt-5 space-y-3 border-t pt-5">
                {order.items.map((item) => (
                  <div
                    key={item.product}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <Package
                        size={22}
                        className="text-indigo-600"
                      />

                      <span>
                        {item.name} × {item.quantity}
                      </span>
                    </div>

                    <span className="font-semibold">
                      Rs.{" "}
                      {(
                        item.price * item.quantity
                      ).toLocaleString("en-PK")}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex justify-between border-t pt-5 font-extrabold">
                <span>Total</span>

                <span>
                  Rs.{" "}
                  {order.totalAmount.toLocaleString("en-PK")}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}