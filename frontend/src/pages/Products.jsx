import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ShoppingCart, Package } from "lucide-react";
import api from "../services/api";
import { useCart } from "../context/CartContext";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get("category") || "";

  const { addToCart } = useCart();

  useEffect(() => {
    const controller = new AbortController();

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/products", {
          params: {
            search: search.trim() || undefined,
            sort,
            limit: 50,
            category: categoryId || undefined,
          },
          signal: controller.signal,
        });

        setProducts(response.data.products || []);
      } catch (err) {
        if (err.code === "ERR_CANCELED") return;

        console.error("Unable to load products:", err);
        setError("Unable to load products. Please try again.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    const timer = setTimeout(loadProducts, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, sort, categoryId]);

  const selectedCategoryName =
    products[0]?.category?.name || "Selected Category";

  return (
    <main className="mx-auto min-h-[70vh] max-w-7xl px-5 py-12">
      <div className="mb-8">
        <p className="font-semibold text-indigo-600">
          SHOPNEST COLLECTION
        </p>

        <h1 className="mt-2 text-4xl font-extrabold">
          {categoryId ? selectedCategoryName : "Explore Products"}
        </h1>

        <p className="mt-3 text-slate-500">
          {categoryId
            ? `Explore products in ${selectedCategoryName}.`
            : "Discover accessories for your perfect setup."}
        </p>

        {categoryId && (
          <Link
            to="/products"
            className="mt-4 inline-flex items-center rounded-lg bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100"
          >
            View All Products
          </Link>
        )}
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-600"
        />

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-xl border border-slate-300 px-4 py-3"
        >
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name_asc">Name: A to Z</option>
        </select>
      </div>

      {loading ? (
        <p className="py-16 text-center">Loading products...</p>
      ) : error ? (
        <p className="py-16 text-center text-red-600">{error}</p>
      ) : products.length === 0 ? (
        <div className="py-16 text-center">
          <Package
            size={55}
            className="mx-auto mb-4 text-slate-300"
          />

          <p className="text-lg font-semibold text-slate-600">
            No matching products found.
          </p>

          <p className="mt-2 text-sm text-slate-400">
            Try another search or browse all products.
          </p>

          {categoryId && (
            <Link
              to="/products"
              className="mt-5 inline-block font-semibold text-indigo-600 hover:underline"
            >
              View All Products
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <article
              key={product._id}
              className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md"
            >
              <Link to={`/products/${product._id}`}>
                <div className="flex h-52 items-center justify-center bg-slate-100">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package
                      size={65}
                      className="text-slate-300"
                    />
                  )}
                </div>
              </Link>

              <div className="p-5">
                <p className="text-xs font-semibold uppercase text-indigo-600">
                  {product.category?.name || "Accessories"}
                </p>

                <Link to={`/products/${product._id}`}>
                  <h2 className="mt-2 text-lg font-bold hover:text-indigo-600">
                    {product.name}
                  </h2>
                </Link>

                <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                  {product.description}
                </p>

                <p className="mt-4 text-xl font-extrabold">
                  Rs.{" "}
                  {Number(product.price).toLocaleString("en-PK")}
                </p>

                <button
                  type="button"
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  <ShoppingCart size={18} />
                  {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}