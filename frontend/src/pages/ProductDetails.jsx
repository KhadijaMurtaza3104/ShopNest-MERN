import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Package, ShoppingCart } from "lucide-react";
import api from "../services/api";
import { useCart } from "../context/CartContext";

export default function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadProduct() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/products/${id}`, {
          signal: controller.signal,
        });

        setProduct(response.data);
      } catch (err) {
        if (err.code === "ERR_CANCELED") return;
        setError("Product not found or could not be loaded.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => controller.abort();
  }, [id]);

  if (loading) {
    return <p className="py-20 text-center">Loading product...</p>;
  }

  if (error || !product) {
    return (
      <p className="py-20 text-center text-red-600">
        {error || "Product not found."}
      </p>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-indigo-600"
      >
        <ArrowLeft size={18} />
        Back to Products
      </Link>

      <div className="mt-10 grid gap-12 md:grid-cols-2">
        <div className="flex min-h-96 items-center justify-center overflow-hidden rounded-3xl bg-slate-100">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Package size={120} className="text-slate-300" />
          )}
        </div>

        <div>
          <p className="font-semibold uppercase text-indigo-600">
            {product.category?.name || "Accessories"}
          </p>

          <h1 className="mt-4 text-4xl font-extrabold">
            {product.name}
          </h1>

          <p className="mt-5 text-3xl font-bold">
            Rs. {Number(product.price).toLocaleString("en-PK")}
          </p>

          <p className="mt-6 leading-8 text-slate-600">
            {product.description}
          </p>

          <p className="mt-5 font-medium">
            {product.stock > 0
              ? `${product.stock} items in stock`
              : "Out of stock"}
          </p>

          <button
            type="button"
            onClick={() => addToCart(product)}
            disabled={product.stock <= 0}
            className="mt-8 flex items-center gap-3 rounded-xl bg-indigo-600 px-8 py-4 font-semibold text-white hover:bg-indigo-700 disabled:bg-slate-400"
          >
            <ShoppingCart size={20} />
            Add to Cart
          </button>
        </div>
      </div>
    </main>
  );
}