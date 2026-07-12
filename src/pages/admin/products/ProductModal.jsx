import { useEffect, useMemo, useState } from "react";

const emptyForm = {
  name: "",
  category: "",
  price: "",
  stock: "",
  description: "",
};

const imageSlots = [
  { key: "main", label: "Main image" },
  { key: "side", label: "Side image" },
  { key: "top", label: "Top image" },
  { key: "back", label: "Back image" },
];

function ProductModal({ isOpen, onClose, onSave, editingProduct, isSaving }) {
  const [formData, setFormData] = useState(emptyForm);
  const [imageFiles, setImageFiles] = useState({});
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setFormData(
      editingProduct
        ? {
            name: editingProduct.name || "",
            category: editingProduct.category || "",
            price: editingProduct.price || "",
            stock: editingProduct.stock ?? "",
            description: editingProduct.description || "",
          }
        : emptyForm
    );
    setImageFiles({});
    setFormError("");
  }, [editingProduct, isOpen]);

  const previews = useMemo(() => {
    const result = {};
    Object.entries(imageFiles).forEach(([slot, file]) => {
      result[slot] = file ? URL.createObjectURL(file) : null;
    });
    return result;
  }, [imageFiles]);

  useEffect(
    () => () =>
      Object.values(previews).forEach((preview) => {
        if (preview) URL.revokeObjectURL(preview);
      }),
    [previews]
  );

  if (!isOpen) return null;

  const existingImages = editingProduct?.images || [];

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleImageChange = (slot, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setFormError(`${slot} image must be 3 MB or smaller.`);
      event.target.value = "";
      return;
    }

    setFormError("");
    setImageFiles((current) => ({ ...current, [slot]: file }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!editingProduct) {
      const missing = imageSlots.find(({ key }) => !imageFiles[key]);
      if (missing) {
        setFormError(`Please upload the ${missing.label.toLowerCase()}.`);
        return;
      }
    }

    onSave({
      ...formData,
      price: Number(formData.price),
      stock: Number(formData.stock || 0),
      imageFiles,
    });
  };

  return (
    <div className="product-modal-overlay">
      <div className="product-modal product-modal--compact">
        <div className="product-modal-header">
          <div>
            <h2>{editingProduct ? "Edit Product" : "Add Product"}</h2>
            <p>Add product details and four product views.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close product form">
            ×
          </button>
        </div>

        <form className="product-form" onSubmit={handleSubmit}>
          <div className="product-form-grid">
            <label>
              <span>Product name *</span>
              <input name="name" value={formData.name} onChange={handleChange} maxLength="150" required />
            </label>
            <label>
              <span>Category</span>
              <input name="category" value={formData.category} onChange={handleChange} maxLength="100" />
            </label>
            <label>
              <span>Price *</span>
              <input name="price" type="number" min="0" step="0.01" value={formData.price} onChange={handleChange} required />
            </label>
            <label>
              <span>Stock quantity *</span>
              <input name="stock" type="number" min="0" step="1" value={formData.stock} onChange={handleChange} required />
            </label>
          </div>

          <label>
            <span>Product description</span>
            <textarea name="description" value={formData.description} onChange={handleChange} maxLength="2000" rows="3" />
          </label>

          <div className="product-image-slots">
            {imageSlots.map(({ key, label }, index) => {
              const preview = previews[key] || existingImages[index];

              return (
                <div className="product-image-slot" key={key}>
                  <div className="product-image-slot__preview">
                    {preview ? (
                      <img src={preview} alt={`${label} preview`} />
                    ) : (
                      <span>No image</span>
                    )}
                  </div>
                  <div className="product-image-slot__content">
                    <strong>{label}{!editingProduct ? " *" : ""}</strong>
                    <small>JPG, PNG or WebP · Max 3 MB</small>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => handleImageChange(key, event)}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {formError && <div className="product-form-error">{formError}</div>}

          <div className="product-modal-actions">
            <button type="button" onClick={onClose} className="secondary-btn" disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : editingProduct ? "Update Product" : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductModal;
