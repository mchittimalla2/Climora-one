import { useEffect, useMemo, useState } from "react";

const emptyForm = {
  name: "",
  category: "",
  price: "",
  stock: "",
  description: "",
};

function ProductModal({ isOpen, onClose, onSave, editingProduct }) {
  const [formData, setFormData] = useState(emptyForm);
  const [imageFiles, setImageFiles] = useState([]);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name || "",
        category: editingProduct.category || "",
        price: editingProduct.price || "",
        stock: editingProduct.stock ?? "",
        description: editingProduct.description || "",
      });
    } else {
      setFormData(emptyForm);
    }

    setImageFiles([]);
    setFormError("");
  }, [editingProduct, isOpen]);

  const previews = useMemo(
    () => imageFiles.map((file) => URL.createObjectURL(file)),
    [imageFiles]
  );

  useEffect(
    () => () => previews.forEach((preview) => URL.revokeObjectURL(preview)),
    [previews]
  );

  if (!isOpen) return null;

  const existingImages = Array.isArray(editingProduct?.images)
    ? editingProduct.images
    : editingProduct?.main_image
      ? [editingProduct.main_image]
      : [];

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleImages = (event) => {
    const files = Array.from(event.target.files || []);

    if (files.length > 4) {
      setFormError("You can upload a maximum of four images.");
      event.target.value = "";
      return;
    }

    const oversized = files.find((file) => file.size > 3 * 1024 * 1024);

    if (oversized) {
      setFormError("Each image must be 3 MB or smaller.");
      event.target.value = "";
      return;
    }

    setFormError("");
    setImageFiles(files);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!editingProduct && imageFiles.length === 0) {
      setFormError("Upload at least one product image.");
      return;
    }

    onSave({
      ...formData,
      price: Number(formData.price),
      stock: Number(formData.stock || 0),
      images: imageFiles,
    });
  };

  const displayedImages = previews.length > 0 ? previews : existingImages;

  return (
    <div className="product-modal-overlay">
      <div className="product-modal product-modal--wide">
        <div className="product-modal-header">
          <div>
            <h2>{editingProduct ? "Edit Product" : "Add Product"}</h2>
            <p>Upload up to four clear product images. The first image is the main image.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close product form">
            ×
          </button>
        </div>

        <form className="product-form" onSubmit={handleSubmit}>
          <div className="product-form-grid">
            <label>
              <span>Product name *</span>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                maxLength="150"
                required
              />
            </label>

            <label>
              <span>Category</span>
              <input
                name="category"
                value={formData.category}
                onChange={handleChange}
                maxLength="100"
              />
            </label>

            <label>
              <span>Price *</span>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              <span>Stock quantity *</span>
              <input
                name="stock"
                type="number"
                min="0"
                step="1"
                value={formData.stock}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <label>
            <span>Product description</span>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              maxLength="2000"
              rows="4"
            />
          </label>

          <div className="product-image-upload">
            <label htmlFor="product-images" className="product-image-upload__label">
              <strong>{editingProduct ? "Replace product images" : "Product images *"}</strong>
              <span>Choose 1–4 JPG, PNG or WebP files. Maximum 3 MB each.</span>
            </label>

            <input
              id="product-images"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleImages}
            />

            {displayedImages.length > 0 && (
              <div className="product-image-previews">
                {displayedImages.slice(0, 4).map((image, index) => (
                  <figure key={`${image}-${index}`}>
                    <img src={image} alt={`Product preview ${index + 1}`} />
                    <figcaption>{index === 0 ? "Main image" : `Image ${index + 1}`}</figcaption>
                  </figure>
                ))}
              </div>
            )}
          </div>

          {formError && <div className="product-form-error">{formError}</div>}

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
