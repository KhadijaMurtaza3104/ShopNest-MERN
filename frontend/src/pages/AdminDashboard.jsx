
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Plus,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const emptyProduct = {
  name: "",
  description: "",
  price: "",
  stock: "",
  category: "",
  image: "",
  featured: false,
};

const orderStatuses = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const money = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-PK")}`;

const getErrorMessage = (error, fallback) => {
  if (error.code === "ECONNABORTED") {
    return "The request took too long. Please try again.";
  }

  return (
    error.response?.data?.message ||
    error.message ||
    fallback
  );
};

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();

  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyProduct });

  const [categoryName, setCategoryName] = useState("");
  const [aiLanguage, setAiLanguage] = useState("English");

  const adminRequest = useCallback(
    (config = {}) => ({
      ...config,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${localStorage.getItem(
          "shopnest_token"
        )}`,
      },
    }),
    []
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [
        productsResponse,
        categoriesResponse,
        ordersResponse,
      ] = await Promise.all([
        api.get("/products", {
          params: { limit: 100 },
        }),
        api.get("/categories"),
        api.get("/orders", adminRequest()),
      ]);

      setProducts(
        productsResponse.data.products || []
      );

      setCategories(
        Array.isArray(categoriesResponse.data)
          ? categoriesResponse.data
          : categoriesResponse.data.categories || []
      );

      setOrders(
        Array.isArray(ordersResponse.data)
          ? ordersResponse.data
          : ordersResponse.data.orders || []
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to load admin data."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [adminRequest]);

  useEffect(() => {
    if (!authLoading && user?.role === "admin") {
      loadData();
    }
  }, [authLoading, user, loadData]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm({ ...emptyProduct });
    setAiLanguage("English");
    setShowForm(true);
    setError("");
    setMessage("");
    setTab("products");
  };

  const openEditForm = (product) => {
    setEditingId(product._id);

    setForm({
      name: product.name || "",
      description: product.description || "",
      price: String(product.price ?? ""),
      stock: String(product.stock ?? ""),
      category:
        typeof product.category === "object"
          ? product.category?._id || ""
          : product.category || "",
      image: product.image || "",
      featured: Boolean(product.featured),
    });

    setAiLanguage("English");
    setShowForm(true);
    setError("");
    setMessage("");
    setTab("products");
  };

  const handleFormChange = (event) => {
    const { name, value, type, checked } =
      event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox" ? checked : value,
    }));
  };

  // GEMINI AI — 60-SECOND TIMEOUT
  const generateAIDescription = async () => {
    if (!form.name.trim()) {
      setError("Please enter a product name first.");
      return;
    }

    const selectedCategory = categories.find(
      (category) => category._id === form.category
    );

    setGenerating(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post(
        "/ai/generate-description",
        {
          name: form.name.trim(),
          category:
            selectedCategory?.name || "General",
          language: aiLanguage,
        },
        adminRequest({
          timeout: 60000,
        })
      );

      const description = response.data?.description;

      if (!description) {
        throw new Error(
          "Gemini returned an empty description."
        );
      }

      setForm((previous) => ({
        ...previous,
        description,
      }));

      setMessage(
        `${aiLanguage} description generated successfully.`
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to generate AI description."
        )
      );
    } finally {
      setGenerating(false);
    }
  };

  const saveProduct = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
        category: form.category,
        image: form.image.trim(),
        featured: form.featured,
      };

      const wasEditing = Boolean(editingId);

      if (wasEditing) {
        await api.put(
          `/products/${editingId}`,
          payload,
          adminRequest()
        );
      } else {
        await api.post(
          "/products",
          payload,
          adminRequest()
        );
      }

      setShowForm(false);
      setEditingId(null);
      setForm({ ...emptyProduct });

      await loadData();

      setMessage(
        wasEditing
          ? "Product updated successfully."
          : "Product added successfully."
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to save product."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (product) => {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await api.delete(
        `/products/${product._id}`,
        adminRequest()
      );

      await loadData();
      setMessage("Product deleted successfully.");
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to delete product."
        )
      );
    }
  };

  const addCategory = async (event) => {
    event.preventDefault();

    const name = categoryName.trim();

    if (!name) {
      setError("Please enter a category name.");
      return;
    }

    setSavingCategory(true);
    setError("");
    setMessage("");

    try {
      await api.post(
        "/categories",
        { name },
        adminRequest()
      );

      setCategoryName("");
      await loadData();

      setMessage(
        `Category "${name}" added successfully.`
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to add category."
        )
      );
    } finally {
      setSavingCategory(false);
    }
  };

  const deleteCategory = async (category) => {
    const confirmed = window.confirm(
      `Delete category "${category.name}"?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await api.delete(
        `/categories/${category._id}`,
        adminRequest()
      );

      await loadData();
      setMessage("Category deleted successfully.");
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to delete category."
        )
      );
    }
  };

  const updateOrderStatus = async (
    orderId,
    status
  ) => {
    setError("");
    setMessage("");

    try {
      await api.patch(
        `/orders/${orderId}/status`,
        { status },
        adminRequest()
      );

      await loadData();

      setMessage(
        "Order status updated successfully."
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to update order status."
        )
      );
    }
  };

  if (authLoading) {
    return (
      <p className="py-20 text-center">
        Checking admin access...
      </p>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <main className="mx-auto max-w-xl px-5 py-20 text-center">
        <h1 className="text-3xl font-bold">
          Admin Access Required
        </h1>

        <p className="mt-3 text-slate-500">
          Please sign in using your administrator
          account.
        </p>

        <Link
          to="/login"
          className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white"
        >
          Admin Login
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[75vh] max-w-7xl px-5 py-10">
      {/* HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-semibold uppercase tracking-wide text-indigo-600">
            Store Management
          </p>

          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
            Admin Dashboard
          </h1>

          <p className="mt-2 text-slate-500">
            Welcome, {user.name}. Manage your
            ShopNest store.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border bg-white px-4 py-3 font-semibold disabled:opacity-50"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* STATISTICS */}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-6">
          <Package
            className="text-indigo-600"
            size={28}
          />
          <p className="mt-4 text-sm text-slate-500">
            Total Products
          </p>
          <p className="mt-1 text-3xl font-extrabold">
            {products.length}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-6">
          <ShoppingBag
            className="text-indigo-600"
            size={28}
          />
          <p className="mt-4 text-sm text-slate-500">
            Total Orders
          </p>
          <p className="mt-1 text-3xl font-extrabold">
            {orders.length}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-6">
          <LayoutDashboard
            className="text-indigo-600"
            size={28}
          />
          <p className="mt-4 text-sm text-slate-500">
            Categories
          </p>
          <p className="mt-1 text-3xl font-extrabold">
            {categories.length}
          </p>
        </div>
      </div>

      {/* NAVIGATION TABS */}

      <div className="mt-8 flex flex-wrap gap-3">
        {[
          { id: "products", label: "Products" },
          { id: "orders", label: "Orders" },
          { id: "categories", label: "Categories" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTab(item.id);
              setError("");
              setMessage("");
            }}
            className={`rounded-xl px-5 py-3 font-bold ${
              tab === item.id
                ? "bg-indigo-600 text-white"
                : "border bg-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* ALERTS */}

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-xl bg-red-50 p-4 text-red-700"
        >
          {error}
        </p>
      )}

      {message && (
        <p
          role="status"
          className="mt-6 rounded-xl bg-green-50 p-4 text-green-700"
        >
          {message}
        </p>
      )}

      {loading && (
        <p className="mt-6 text-slate-500">
          Loading store data...
        </p>
      )}

      {/* PRODUCTS TAB */}

      {tab === "products" && (
        <section className="mt-8 rounded-2xl border bg-white p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">
              Product Management
            </h2>

            <button
              type="button"
              onClick={openCreateForm}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white"
            >
              <Plus size={19} />
              Add Product
            </button>
          </div>

          {showForm && (
            <form
              onSubmit={saveProduct}
              className="mt-7 rounded-2xl border bg-slate-50 p-5"
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl font-bold">
                  {editingId
                    ? "Edit Product"
                    : "Add New Product"}
                </h3>

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  aria-label="Close product form"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* NAME */}

                <div>
                  <label className="mb-2 block font-semibold">
                    Product Name
                  </label>

                  <input
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-xl border px-4 py-3"
                    placeholder="RGB Gaming Keyboard"
                  />
                </div>

                {/* CATEGORY */}

                <div>
                  <label className="mb-2 block font-semibold">
                    Category
                  </label>

                  <select
                    name="category"
                    value={form.category}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-xl border px-4 py-3"
                  >
                    <option value="">
                      Select category
                    </option>

                    {categories.map((category) => (
                      <option
                        key={category._id}
                        value={category._id}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* PRICE */}

                <div>
                  <label className="mb-2 block font-semibold">
                    Price (PKR)
                  </label>

                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-xl border px-4 py-3"
                  />
                </div>

                {/* STOCK */}

                <div>
                  <label className="mb-2 block font-semibold">
                    Stock Quantity
                  </label>

                  <input
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-xl border px-4 py-3"
                  />
                </div>

                {/* IMAGE */}

                <div className="sm:col-span-2">
                  <label className="mb-2 block font-semibold">
                    Image URL (Optional)
                  </label>

                  <input
                    name="image"
                    type="url"
                    value={form.image}
                    onChange={handleFormChange}
                    placeholder="https://example.com/product.jpg"
                    className="w-full rounded-xl border px-4 py-3"
                  />
                </div>

                {/* GEMINI AI */}

                <div className="sm:col-span-2 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Sparkles
                      size={20}
                      className="text-indigo-600"
                    />

                    <h4 className="font-bold text-indigo-900">
                      Gemini AI Description Generator
                    </h4>
                  </div>

                  <p className="mb-4 text-sm text-slate-600">
                    Enter a product name, select its
                    category, and generate a
                    professional description.
                  </p>

                  <div className="flex flex-wrap items-end gap-3">
                    <div>
                      <label
                        htmlFor="ai-language"
                        className="mb-2 block text-sm font-semibold"
                      >
                        Description Language
                      </label>

                      <select
                        id="ai-language"
                        value={aiLanguage}
                        onChange={(event) =>
                          setAiLanguage(
                            event.target.value
                          )
                        }
                        className="rounded-xl border bg-white px-4 py-3"
                      >
                        <option value="English">
                          English
                        </option>

                        <option value="German">
                          German
                        </option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={generateAIDescription}
                      disabled={
                        generating ||
                        !form.name.trim()
                      }
                      className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Sparkles size={18} />

                      {generating
                        ? "Generating..."
                        : "Generate with Gemini AI"}
                    </button>
                  </div>

                  {generating && (
                    <p className="mt-3 text-sm text-indigo-700">
                      Gemini is writing your
                      description. This may take
                      up to 60 seconds.
                    </p>
                  )}
                </div>

                {/* DESCRIPTION */}

                <div className="sm:col-span-2">
                  <label className="mb-2 block font-semibold">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    rows={5}
                    required
                    placeholder="Write a description or generate one using Gemini AI..."
                    className="w-full rounded-xl border px-4 py-3"
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    You can edit the AI-generated
                    description before saving.
                  </p>
                </div>

                {/* FEATURED */}

                <label className="flex items-center gap-3 sm:col-span-2">
                  <input
                    name="featured"
                    type="checkbox"
                    checked={form.featured}
                    onChange={handleFormChange}
                  />

                  <span className="font-semibold">
                    Featured Product
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={saving || generating}
                className="mt-6 rounded-xl bg-indigo-600 px-7 py-3 font-bold text-white disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Product"
                  : "Create Product"}
              </button>
            </form>
          )}

          {/* PRODUCT LIST */}

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[650px] text-left">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="p-4">Product</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr
                    key={product._id}
                    className="border-b"
                  >
                    <td className="p-4 font-semibold">
                      {product.name}
                    </td>

                    <td className="p-4">
                      {product.category?.name || "—"}
                    </td>

                    <td className="p-4">
                      {money(product.price)}
                    </td>

                    <td className="p-4">
                      {product.stock}
                    </td>

                    <td className="p-4">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            openEditForm(product)
                          }
                          title="Edit product"
                          className="text-indigo-600"
                        >
                          <Pencil size={19} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteProduct(product)
                          }
                          title="Delete product"
                          className="text-red-600"
                        >
                          <Trash2 size={19} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!loading && products.length === 0 && (
              <p className="py-10 text-center text-slate-500">
                No products found. Add your first
                product.
              </p>
            )}
          </div>
        </section>
      )}

      {/* CATEGORIES TAB */}

      {tab === "categories" && (
        <section className="mt-8 rounded-2xl border bg-white p-5 sm:p-7">
          <h2 className="text-2xl font-bold">
            Category Management
          </h2>

          <p className="mt-2 text-slate-500">
            Create categories for your products.
          </p>

          <form
            onSubmit={addCategory}
            className="mt-6 flex flex-wrap gap-3"
          >
            <input
              type="text"
              value={categoryName}
              onChange={(event) =>
                setCategoryName(event.target.value)
              }
              placeholder="e.g. Keyboards"
              required
              className="min-w-[220px] flex-1 rounded-xl border px-4 py-3"
            />

            <button
              type="submit"
              disabled={savingCategory}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              <Plus size={18} />

              {savingCategory
                ? "Adding..."
                : "Add Category"}
            </button>
          </form>

          <div className="mt-7 space-y-3">
            {categories.map((category) => {
              const productCount = products.filter(
                (product) =>
                  (typeof product.category ===
                  "object"
                    ? product.category?._id
                    : product.category) ===
                  category._id
              ).length;

              return (
                <div
                  key={category._id}
                  className="flex items-center justify-between gap-4 rounded-xl border p-4"
                >
                  <div>
                    <p className="font-bold">
                      {category.name}
                    </p>

                    <p className="text-sm text-slate-500">
                      {productCount} product
                      {productCount !== 1
                        ? "s"
                        : ""}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      deleteCategory(category)
                    }
                    disabled={productCount > 0}
                    title={
                      productCount > 0
                        ? "Move products to another category first"
                        : "Delete category"
                    }
                    className="text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              );
            })}

            {categories.length === 0 && (
              <p className="py-6 text-slate-500">
                No categories found.
              </p>
            )}
          </div>
        </section>
      )}

      {/* ORDERS TAB */}

      {tab === "orders" && (
        <section className="mt-8 rounded-2xl border bg-white p-5 sm:p-7">
          <h2 className="text-2xl font-bold">
            Customer Orders
          </h2>

          {orders.length === 0 ? (
            <p className="py-10 text-slate-500">
              No customer orders yet.
            </p>
          ) : (
            <div className="mt-6 space-y-5">
              {orders.map((order) => (
                <article
                  key={order._id}
                  className="rounded-xl border p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-bold">
                        Order #
                        {order._id
                          .slice(-8)
                          .toUpperCase()}
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        Customer:{" "}
                        {order.user?.name ||
                          "Unknown"}
                      </p>

                      <p className="text-sm text-slate-500">
                        {order.user?.email || ""}
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        {new Date(
                          order.createdAt
                        ).toLocaleDateString(
                          "en-PK"
                        )}
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor={`status-${order._id}`}
                        className="mb-2 block text-sm font-semibold"
                      >
                        Order Status
                      </label>

                      <select
                        id={`status-${order._id}`}
                        value={order.status}
                        onChange={(event) =>
                          updateOrderStatus(
                            order._id,
                            event.target.value
                          )
                        }
                        disabled={[
                          "delivered",
                          "cancelled",
                        ].includes(order.status)}
                        className="rounded-xl border px-4 py-3 capitalize disabled:opacity-60"
                      >
                        {orderStatuses.map(
                          (status) => (
                            <option
                              key={status}
                              value={status}
                            >
                              {status}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="mt-5 border-t pt-4">
                    {order.items?.map(
                      (item, index) => (
                        <p
                          key={`${item.product}-${index}`}
                          className="mt-2 text-sm text-slate-600"
                        >
                          {item.name} ×{" "}
                          {item.quantity} —{" "}
                          {money(
                            item.price *
                              item.quantity
                          )}
                        </p>
                      )
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap justify-between gap-3 border-t pt-4">
                    <span className="font-semibold">
                      {order.shippingAddress
                        ?.city || ""}
                    </span>

                    <span className="font-extrabold">
                      Total:{" "}
                      {money(order.totalAmount)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
