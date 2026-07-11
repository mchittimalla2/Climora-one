import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("climoraone_cart")) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("climoraone_cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
    const requestedQuantity = Math.max(1, Number(quantity) || 1);
    const parsedStock = Number(product.stock);
    const stock = Number.isFinite(parsedStock)
    ? parsedStock
    : 10;

    if (stock <= 0) {
      return {
        success: false,
        message: "This product is out of stock.",
      };
    }

    const existingItem = cart.find((item) => item.id === product.id);
    const existingQuantity = existingItem?.quantity || 0;

    if (existingQuantity + requestedQuantity > stock) {
      return {
        success: false,
        message: `Only ${stock} items are available.`,
      };
    }

    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.id === product.id);

      if (existing) {
        return currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + requestedQuantity,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: requestedQuantity,
        },
      ];
    });

    return { success: true };
  };

  const increaseQty = (id) => {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const parsedStock = Number(item.stock);

        const stock = Number.isFinite(parsedStock)
        ? parsedStock
        : 10;

        if (item.quantity >= stock) {
        return item;
        }

        return {
          ...item,
          quantity: item.quantity + 1,
        };
      })
    );
  };

  const decreaseQty = (id) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== id)
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const total = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0
      ),
    [cart]
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        increaseQty,
        decreaseQty,
        removeFromCart,
        clearCart,
        cartCount,
        total,
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