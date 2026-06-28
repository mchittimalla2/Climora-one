import { useEffect, useState } from "react";
import "../../App.css";
import defaultProducts from "../../data/products";

function Products() {
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imageFiles, setImageFiles] = useState({
    main: "",
    side: "",
    top: "",
    back: "",
  });

  useEffect(() => {
    const savedProducts =
      JSON.parse(localStorage.getItem("climoraone_products")) || defaultProducts;

    setProducts(savedProducts);
    localStorage.setItem("climoraone_products", JSON.stringify(savedProducts));
  }, []);

  const saveProducts = (updatedProducts) => {
    setProducts(updatedProducts);
    localStorage.setItem("climoraone_products", JSON.stringify(updatedProducts));
  };

  const convertImageToBase64 = (file, imageType) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      setImageFiles((prev) => ({
        ...prev,
        [imageType]: reader.result,
      }));
    };

    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setImageFiles({
      main: product.images?.[0] || "",
      side: product.images?.[1] || "",
      top: product.images?.[2] || "",
      back: product.images?.[3] || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleProductSubmit = (e) => {
    e.preventDefault();

    const form = e.target;

    const productData = {
      id: editingProduct ? editingProduct.id : Date.now(),
      name: form.name.value,
      category: form.category.value,
      price: Number(form.price.value),
      stock: Number(form.stock.value),
      lowStockAlert: Number(form.lowStockAlert.value),
      description: form.description.value,
      images: [
        imageFiles.main,
        imageFiles.side,
        imageFiles.top,
        imageFiles.back,
      ],
      isActive: true,
    };

    if (!imageFiles.main) {
      alert("Please upload the main product image.");
      return;
    }

    if (editingProduct) {
      saveProducts(
        products.map((product) =>
          product.id === editingProduct.id ? productData : product
        )
      );
      setEditingProduct(null);
    } else {
      saveProducts([...products, productData]);
    }

    setImageFiles({
      main: "",
      side: "",
      top: "",
      back: "",
    });

    form.reset();
  };

  const deleteProduct = (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    saveProducts(products.filter((product) => product.id !== id));
  };

  return (
    <div>
      <header className="header">
        <div className="logo-section">
          <img
            src="/images/logo.jpeg"
            alt="Climoraone"
            className="header-logo"
          />
        </div>

        <nav>
          <a href="/admin">Dashboard</a>
          <a href="/admin/orders">Orders</a>
          <a href="/admin/reports">Reports</a>
          <a href="/">Store</a>
        </nav>
      </header>

      <section className="admin-dashboard">
        <h2>{editingProduct ? "Edit Product" : "Add Product"}</h2>

        <form className="checkout-form" onSubmit={handleProductSubmit}>
          <input
            name="name"
            placeholder="Product Name"
            defaultValue={editingProduct?.name || ""}
            required
          />

          <select
            name="category"
            defaultValue={editingProduct?.category || ""}
            required
          >
            <option value="">Select Category</option>
            <option value="Religious">Religious</option>
            <option value="Toys">Toys</option>
            <option value="Home Decor">Home Decor</option>
            <option value="Handicrafts">Handicrafts</option>
            <option value="Gift Items">Gift Items</option>
          </select>

          <input
            name="price"
            type="number"
            placeholder="Price"
            defaultValue={editingProduct?.price || ""}
            required
          />

          <input
            name="stock"
            type="number"
            placeholder="Stock Quantity"
            defaultValue={editingProduct?.stock || 0}
            required
          />

          <input
            name="lowStockAlert"
            type="number"
            placeholder="Low Stock Alert Quantity"
            defaultValue={editingProduct?.lowStockAlert || 5}
            required
          />

          <textarea
            name="description"
            placeholder="Product Description"
            defaultValue={editingProduct?.description || ""}
            required
          />

          <div className="image-upload-box">
            <label>
              Main Image *
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  convertImageToBase64(e.target.files[0], "main")
                }
              />
            </label>

            {imageFiles.main && (
              <img src={imageFiles.main} alt="Main preview" />
            )}
          </div>

          <div className="image-upload-box">
            <label>
              Side Image
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  convertImageToBase64(e.target.files[0], "side")
                }
              />
            </label>

            {imageFiles.side && (
              <img src={imageFiles.side} alt="Side preview" />
            )}
          </div>

          <div className="image-upload-box">
            <label>
              Top Image
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  convertImageToBase64(e.target.files[0], "top")
                }
              />
            </label>

            {imageFiles.top && (
              <img src={imageFiles.top} alt="Top preview" />
            )}
          </div>

          <div className="image-upload-box">
            <label>
              Back Image
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  convertImageToBase64(e.target.files[0], "back")
                }
              />
            </label>

            {imageFiles.back && (
              <img src={imageFiles.back} alt="Back preview" />
            )}
          </div>

          <button type="submit">
            {editingProduct ? "Update Product" : "Add Product"}
          </button>

          {editingProduct && (
            <button
              type="button"
              className="cancel-btn"
              onClick={() => {
                setEditingProduct(null);
                setImageFiles({
                  main: "",
                  side: "",
                  top: "",
                  back: "",
                });
              }}
            >
              Cancel Edit
            </button>
          )}
        </form>

        <h2>Product Inventory</h2>

        {products.length === 0 ? (
          <p>No products added yet.</p>
        ) : (
          products.map((product) => (
            <div className="admin-order" key={product.id}>
              <img
                src={product.images?.[0]}
                alt={product.name}
                style={{ width: "100px", borderRadius: "10px" }}
              />

              <h3>{product.name}</h3>
              <p>Category: {product.category}</p>
              <p>Price: ₹{product.price}</p>
              <p>
                Stock: <strong>{product.stock ?? 0}</strong>
              </p>

              {(product.stock ?? 0) <= (product.lowStockAlert ?? 5) && (
                <p className="error-text">⚠ Low Stock</p>
              )}

              <p>{product.description}</p>

              <button onClick={() => handleEdit(product)}>Edit</button>
              <button
                onClick={() => deleteProduct(product.id)}
                className="delete-btn"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

export default Products;