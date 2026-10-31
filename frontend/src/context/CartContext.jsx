import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const CartContext = createContext(null);

function readStoredCart() {
  try {
    const stored = JSON.parse(localStorage.getItem("shopnest_cart"));
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(readStoredCart);

  useEffect(() => {
    localStorage.setItem("shopnest_cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    if (!product || product.stock <= 0) return;

    setCart((current) => {
      const existing = current.find(
        (item) => item._id === product._id
      );

      if (existing) {
        return current.map((item) =>
          item._id === product._id
            ? {
                ...item,
                quantity: Math.min(
                  item.quantity + 1,
                  product.stock
                ),
                stock: product.stock,
                price: product.price,
              }
            : item
        );
      }

      return [
        ...current,
        {
          _id: product._id,
          name: product.name,
          price: product.price,
          image: product.image,
          stock: product.stock,
          quantity: 1,
        },
      ];
    });
  };

  const removeFromCart = (id) => {
    setCart((current) =>
      current.filter((item) => item._id !== id)
    );
  };

  const updateQuantity = (id, quantity) => {
    setCart((current) =>
      current.map((item) =>
        item._id === id
          ? {
              ...item,
              quantity: Math.max(
                1,
                Math.min(Number(quantity) || 1, item.stock)
              ),
            }
          : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}