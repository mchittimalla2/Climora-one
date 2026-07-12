import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function BuyNowRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleBuyNow = (event) => {
      const buyButton = event.target.closest(".buy-btn");

      if (!buyButton || buyButton.disabled) {
        return;
      }

      // Store.jsx adds the selected quantity to the shared cart synchronously.
      // Navigate on the next task so checkout receives the updated cart state.
      window.setTimeout(() => navigate("/checkout"), 0);
    };

    document.addEventListener("click", handleBuyNow);
    return () => document.removeEventListener("click", handleBuyNow);
  }, [navigate]);

  return null;
}

export default BuyNowRedirect;
