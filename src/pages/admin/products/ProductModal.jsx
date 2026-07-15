import { useEffect, useMemo, useState } from "react";
import {
  emptySpecifications,
  parseProductDetails,
  serializeProductDetails,
} from "../../../utils/productDetails";

const emptyForm = {
  name: "",
  category: "",
  price: "",
  stock: "",
  summary: "",
  specifications: { ...emptySpecifications },
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
    if (editingProduct) {
      const parsedDetails = parseProductDetails(editingProduct.description || "");
      setFormData({
        name: editingProduct.name || "",
        category: editingProduct.category || "",
        price: editingProduct.price || "",
        stock: editingProduct.stock ?? "",
        summary: parsedDetails.summary,
        specifications: parsedDetails.specifications,
      });
    } else {
      setFormData({ ...emptyForm, specifications: { ...emptySpecifications } });
    }

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

  const handleSpecificationChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      specifications: {
        ...current.specifications,
        [name]: value,
      },
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

    const requiredSpecificationFields = [
      ["material", "Material"],
      ["color", "Color"],
      ["productType", "Product type"],
      ["genericName", "Generic name"],
      ["countryOfOrigin", "Country of origin"],
    ];

    const missingSpecification = requiredSpecificationFields.find(
      ([key]) => !String(formData.specifications[key] || "").trim()
    );

    if (missingSpecification) {
      setFormError(`${missingSpecification[1]} is required.`);
      return;
    }

    onSave({
      name: formData.name,
      category: formData.category,
      price: Number(formData.price),
      stock: Number(formData.stock || 0),
      description: serializeProductDetails(formData.summary, formData.specifications),
      imageFiles,
    });
  };

  return (
    <div className="product-modal-overlay">
      <div className="product-modal product-modal--wide">
        <div className="product-modal-header">
          <div>
            <h2>{editingProduct ? "Edit Product" : "Add Product"}</h2>
            <p>Add complete product information, specifications and four product views.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close product form">×</button>
        </div>

        <form className="product-form" onSubmit={handleSubmit}>
          <section className="product-form-section">
            <div className="product-form-section__heading">
              <span>01</span>
              <div><h3>Core product information</h3><p>Details customers see first on the product page.</p></div>
            </div>

            <div className="product-form-grid">
              <label><span>Product name *</span><input name="name" value={formData.name} onChange={handleChange} maxLength="150" required /></label>
              <label><span>Category *</span><input name="category" value={formData.category} onChange={handleChange} maxLength="100" required /></label>
              <label><span>Price *</span><input name="price" type="number" min="0" step="0.01" value={formData.price} onChange={handleChange} required /></label>
              <label><span>Stock quantity *</span><input name="stock" type="number" min="0" step="1" value={formData.stock} onChange={handleChange} required /></label>
            </div>

            <label>
              <span>Product description *</span>
              <textarea name="summary" value={formData.summary} onChange={handleChange} maxLength="2000" rows="4" required placeholder="Describe the craftsmanship, purpose, finish and what makes this piece special." />
            </label>
          </section>

          <section className="product-form-section">
            <div className="product-form-section__heading">
              <span>02</span>
              <div><h3>Product highlights</h3><p>Standardized details displayed consistently for every product.</p></div>
            </div>

            <div className="product-form-grid product-form-grid--three">
              <label><span>Material *</span><input name="material" value={formData.specifications.material} onChange={handleSpecificationChange} placeholder="Wooden" required /></label>
              <label><span>Color *</span><input name="color" value={formData.specifications.color} onChange={handleSpecificationChange} placeholder="Multi" required /></label>
              <label><span>Product type *</span><input name="productType" value={formData.specifications.productType} onChange={handleSpecificationChange} placeholder="Handicraft & décor showpiece" required /></label>
              <label><span>Generic name *</span><input name="genericName" value={formData.specifications.genericName} onChange={handleSpecificationChange} placeholder="Idols & figurines" required /></label>
              <label><span>Net quantity</span><input name="netQuantity" type="number" min="1" value={formData.specifications.netQuantity} onChange={handleSpecificationChange} /></label>
              <label><span>Country of origin *</span><input name="countryOfOrigin" value={formData.specifications.countryOfOrigin} onChange={handleSpecificationChange} required /></label>
              <label><span>Finish</span><input name="finish" value={formData.specifications.finish} onChange={handleSpecificationChange} placeholder="Hand-painted lacquer finish" /></label>
              <label><span>Craft / artisan region</span><input name="artisanRegion" value={formData.specifications.artisanRegion} onChange={handleSpecificationChange} placeholder="Telangana, India" /></label>
              <label><span>Package contents</span><input name="packageContents" value={formData.specifications.packageContents} onChange={handleSpecificationChange} placeholder="1 handcrafted showpiece" /></label>
            </div>
          </section>

          <section className="product-form-section">
            <div className="product-form-section__heading">
              <span>03</span>
              <div><h3>Dimensions, weight and care</h3><p>Accurate physical information helps customers buy with confidence.</p></div>
            </div>

            <div className="product-form-grid product-form-grid--three">
              <label><span>Length</span><input name="length" type="number" min="0" step="0.01" value={formData.specifications.length} onChange={handleSpecificationChange} /></label>
              <label><span>Breadth</span><input name="breadth" type="number" min="0" step="0.01" value={formData.specifications.breadth} onChange={handleSpecificationChange} /></label>
              <label><span>Height</span><input name="height" type="number" min="0" step="0.01" value={formData.specifications.height} onChange={handleSpecificationChange} /></label>
              <label><span>Dimension unit</span><select name="dimensionUnit" value={formData.specifications.dimensionUnit} onChange={handleSpecificationChange}><option value="cm">cm</option><option value="inch">inch</option><option value="mm">mm</option></select></label>
              <label><span>Weight</span><input name="weight" type="number" min="0" step="0.01" value={formData.specifications.weight} onChange={handleSpecificationChange} /></label>
              <label><span>Weight unit</span><select name="weightUnit" value={formData.specifications.weightUnit} onChange={handleSpecificationChange}><option value="g">g</option><option value="kg">kg</option></select></label>
            </div>

            <label><span>Care instructions</span><textarea name="careInstructions" value={formData.specifications.careInstructions} onChange={handleSpecificationChange} rows="3" placeholder="Wipe gently with a dry soft cloth. Keep away from direct moisture and prolonged sunlight." /></label>
          </section>

          <section className="product-form-section">
            <div className="product-form-section__heading">
              <span>04</span>
              <div><h3>Product photography</h3><p>Upload clear images from four different views.</p></div>
            </div>

            <div className="product-image-slots">
              {imageSlots.map(({ key, label }, index) => {
                const preview = previews[key] || existingImages[index];
                return (
                  <div className="product-image-slot" key={key}>
                    <div className="product-image-slot__preview">
                      {preview ? <img src={preview} alt={`${label} preview`} /> : <span>No image</span>}
                    </div>
                    <div className="product-image-slot__content">
                      <strong>{label}{!editingProduct ? " *" : ""}</strong>
                      <small>JPG, PNG or WebP · Max 3 MB</small>
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => handleImageChange(key, event)} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {formError && <div className="product-form-error">{formError}</div>}

          <div className="product-modal-actions">
            <button type="button" onClick={onClose} className="secondary-btn" disabled={isSaving}>Cancel</button>
            <button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : editingProduct ? "Update Product" : "Save Product"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductModal;
