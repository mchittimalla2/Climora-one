import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function Cart() {
  const {
    cart,
    increaseQty,
    decreaseQty,
    removeFromCart,
    total,
  } = useCart();

  return (
    <main className="cart-page">
      <div className="cart-page__header">
        <h1>Your Cart</h1>
        <Link to="/products">Continue Shopping</Link>
      </div>

      {cart.length === 0 ? (
        <section className="empty-cart">
          <div className="empty-cart__icon" aria-hidden="true">
            🛒
          </div>

          <h2>Your cart is empty</h2>

          <p>
            Looks like you have not added any Climoraone products yet.
          </p>

          <Link className="btn" to="/products">
            Explore Products
          </Link>
        </section>
      ) : (
        <section className="cart-page__content">
          <div className="cart-page__items">
            {cart.map((item) => (
              <article className="cart-page__item" key={item.id}>
                <img
                  src={item.images?.[0]}
                  alt={item.name}
                  loading="lazy"
                  decoding="async"
                />

                <div className="cart-page__item-info">
                  <h2>{item.name}</h2>
                  <p>₹{item.price}</p>

                  <div className="cart-page__quantity">
                    <button
                      type="button"
                      onClick={() => decreaseQty(item.id)}
                      aria-label={`Reduce quantity of ${item.name}`}
                    >
                      −
                    </button>

                    <strong>{item.quantity}</strong>

                    <button
                      type="button"
                      onClick={() => increaseQty(item.id)}
                      disabled={item.quantity >= Number(item.stock)}
                      aria-label={`Increase quantity of ${item.name}`}
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    className="cart-page__remove"
                    onClick={() => removeFromCart(item.id)}
                  >
                    Remove
                  </button>
                </div>

                <strong>
                  ₹{Number(item.price) * item.quantity}
                </strong>
              </article>
            ))}
          </div>

          <aside className="cart-summary">
            <h2>Order Summary</h2>

            <div>
              <span>Items</span>
              <span>{cart.length}</span>
            </div>

            <div>
              <span>Total</span>
              <strong>₹{total}</strong>
            </div>

            <button type="button" className="checkout-btn">
              Proceed to Checkout
            </button>
          </aside>
        </section>
      )}
    </main>
  );
}