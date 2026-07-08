import { useEffect, useState } from "react";

function ProductModal({ isOpen, onClose, onSave, editingProduct }) {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    description: "",
    main_image: "",
  });

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name || "",
        category: editingProduct.category || "",
        price: editingProduct.price || "",
        stock: editingProduct.stock || "",
        description: editingProduct.description || "",
        main_image: editingProduct.main_image || "",
      });
    } else {
      setFormData({
        name: "",
        category: "",
        price: "",
        stock: "",
        description: "",
        main_image: "",
      });
    }
  }, [editingProduct, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onSave({
      ...formData,
      price: Number(formData.price),
      stock: Number(formData.stock),
    });
  };

  return (
    <div className="product-modal-overlay">
      <div className="product-modal">
        <div className="product-modal-header">
          <h2>{editingProduct ? "Edit Product" : "Add Product"}</h2>
          <button onClick={onClose}>×</button>
        </div>

        <form className="product-form" onSubmit={handleSubmit}>
          <input
            name="name"
            placeholder="Product Name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <input
            name="category"
            placeholder="Category"
            value={formData.category}
            onChange={handleChange}
          />

          <input
            name="price"
            type="number"
            placeholder="Price"
            value={formData.price}
            onChange={handleChange}
            required
          />

          <input
            name="stock"
            type="number"
            placeholder="Stock Quantity"
            value={formData.stock}
            onChange={handleChange}
          />

          <textarea
            name="description"
            placeholder="Product Description"
            value={formData.description}
            onChange={handleChange}
          />

          <input
            name="main_image"
            placeholder="Image URL for now"
            value={formData.main_image}
            onChange={handleChange}
          />

          <div className="product-modal-actions">
            <button type="button" onClick={onClose} className="secondary-btn">
              Cancel
            </button>

            <button type="submit">
              {editingProduct ? "Update Product" : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductModal;