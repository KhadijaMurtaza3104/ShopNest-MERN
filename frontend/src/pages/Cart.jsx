import { Link } from "react-router-dom";
import { ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function Cart() {
  const {
    cart,
    cartTotal,
    updateQuantity,
    removeFromCart,
  } = useCart();

  return (
    <main className="mx-auto min-h-[70vh] max-w-7xl px-5 py-12">
      <h1 className="mb-8 text-4xl font-extrabold">
        Shopping Cart
      </h1>

      {cart.length === 0 ? (
        <div className="rounded-2xl border bg-white px-6 py-20 text-center">
          <ShoppingBag
            size={55}
            className="mx-auto text-slate-300"
          />

          <h2 className="mt-5 text-xl font-bold">
            Your cart is empty
          </h2>

          <Link
            to="/products"
            className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {cart.map((item) => (
              <div
                key={item._id}
                className="flex flex-wrap items-center gap-5 rounded-2xl border bg-white p-5"
              >
                <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-slate-100">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full rounded-xl object-cover"
                    />
                  ) : (
                    <ShoppingBag className="text-slate-300" />
                  )}
                </div>

                <div className="min-w-40 flex-1">
                  <h2 className="font-bold">
                    {item.name}
                  </h2>

                  <p className="mt-1 font-semibold text-indigo-600">
                    Rs.{" "}
                    {Number(item.price).toLocaleString(
                      "en-PK"
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(
                        item._id,
                        item.quantity - 1
                      )
                    }
                    className="rounded-lg border px-3 py-2"
                  >
                    -
                  </button>

                  <span className="font-semibold">
                    {item.quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(
                        item._id,
                        item.quantity + 1
                      )
                    }
                    disabled={item.quantity >= item.stock}
                    className="rounded-lg border px-3 py-2 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    removeFromCart(item._id)
                  }
                  aria-label={`Remove ${item.name}`}
                  className="text-red-500"
                >
                  <Trash2 size={21} />
                </button>
              </div>
            ))}
          </div>

          <aside className="h-fit rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-bold">
              Order Summary
            </h2>

            <div className="mt-6 flex justify-between">
              <span>Subtotal</span>

              <span className="font-bold">
                Rs.{" "}
                {cartTotal.toLocaleString("en-PK")}
              </span>
            </div>

            <p className="mt-4 text-sm text-slate-500">
              Cash on Delivery available.
            </p>

            <Link
              to="/checkout"
              className="mt-7 block w-full rounded-xl bg-indigo-600 py-3 text-center font-bold text-white hover:bg-indigo-700"
            >
              Proceed to Checkout
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}