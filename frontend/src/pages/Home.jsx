import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Headphones,
  Keyboard,
  Mouse,
  Laptop,
} from "lucide-react";
import api from "../services/api";

const getCategoryIcon = (name = "") => {
  const value = name.toLowerCase();

  if (value.includes("mouse") || value.includes("mice")) return Mouse;
  if (value.includes("keyboard")) return Keyboard;
  if (value.includes("headphone") || value.includes("headset")) {
    return Headphones;
  }

  return Laptop;
};

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await api.get("/categories");
        const data = response.data;

        setCategories(
          Array.isArray(data) ? data : data.categories || []
        );
      } catch (error) {
        console.error("Unable to load categories:", error);
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, []);

  return (
    <>
      <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 md:grid-cols-2 md:py-28">
          <div>
            <p className="font-bold uppercase tracking-widest text-indigo-300">
              Upgrade your setup
            </p>

            <h1 className="mt-6 text-5xl font-black leading-tight">
              Your Setup.
              <br />
              <span className="text-indigo-400">Your Style.</span>
            </h1>

            <p className="mt-6 max-w-lg leading-8 text-slate-300">
              Discover modern gaming mice, keyboards, headphones,
              and accessories.
            </p>

            <Link
              to="/products"
              className="mt-8 inline-flex items-center gap-3 rounded-xl bg-indigo-600 px-7 py-4 font-bold text-white transition hover:bg-indigo-700"
            >
              Explore Products
              <ArrowRight size={19} />
            </Link>
          </div>

          <div className="flex min-h-72 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
            <Headphones
              size={145}
              strokeWidth={1}
              className="text-indigo-300"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16">
        <h2 className="text-3xl font-extrabold">Shop by Category</h2>

        {categoriesLoading ? (
          <p className="mt-8 text-slate-500">Loading categories...</p>
        ) : categories.length === 0 ? (
          <p className="mt-8 text-slate-500">
            No categories available yet.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {categories.map((category) => {
              const Icon = getCategoryIcon(category.name);

              return (
                <Link
                  to={`/products?category=${category._id}`}
                  key={category._id}
                  className="rounded-2xl border bg-white p-8 text-center transition hover:-translate-y-1 hover:shadow-md"
                >
                  <Icon
                    size={42}
                    className="mx-auto text-indigo-600"
                  />
                  <h3 className="mt-4 font-bold">{category.name}</h3>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-5">
          <h2 className="text-3xl font-extrabold">Ready to upgrade?</h2>
          <p className="mt-3 text-slate-500">
            Browse our latest tech accessories.
          </p>

          <Link
            to="/products"
            className="mt-7 inline-flex items-center gap-2 font-bold text-indigo-600"
          >
            View All Products <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}