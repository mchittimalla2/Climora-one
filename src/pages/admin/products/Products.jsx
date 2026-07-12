import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "../../../App.css";
import "./ProductAdmin.css";
import { API_BASE_URL } from "../../../config/api";
import ProductSearch from "./ProductSearch";
import ProductTable from "./ProductTable";
import ProductModal from "./ProductModal";

function Products() {
  const [products, setProducts] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [pageError, setPageError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setPageError("");
      const response = await fetch(`${API_BASE_URL}/api/products`, {
        headers: { Accept: "application/json" },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to load products.");
      }

      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      setPageError(error.message || "Unable to load products.");
    }
  };

  const filteredProducts = products.filter((product) => {
    const text = searchText.toLowerCase();
    return (
      product.name?.toLowerCase().includes(text) ||
      product.category?.toLowerCase().includes(text)
    );
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setEditingProduct(null);
    setIsModalOpen(false);
  };

  const saveProduct = async (productData) => {
    const isEditing = Boolean(editingProduct);
    const url = isEditing
      ? `${API_BASE_URL}/api/products/${editingProduct.id}`
      : `${API_BASE_URL}/api/products`;

    const formData = new FormData();
    formData.append("name", productData.name);
    formData.append("category", productData.category || "");
    formData.append("price", String(productData.price));
    formData.append("stock", String(productData.stock));
    formData.append("description", productData.description || "");

    productData.images.forEach((image) => {
      formData.append("images[]", image);
    });

    if (isEditing) {
      formData.append("_method", "PUT");
    }

    try {
      setIsSaving(true);
      setPageError("");

      const response = await fetch(url, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        const validationErrors = data?.errors
          ? Object.values(data.errors).flat().join(" ")
          : "";

        throw new Error(
          validationErrors || data?.message || "Product save failed."
        );
      }

      closeModal();
      await fetchProducts();
      setSuccessMessage(
        isEditing
          ? "Product updated successfully."
          : "Product added successfully."
      );
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setPageError(error.message || "Product save failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete product.");
      }

      await fetchProducts();
      setSuccessMessage("Product deleted successfully.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setPageError(error.message || "Failed to delete product.");
    }
  };

  return (
    <div>
      <header className="header">
        <div className="logo-section">
          <img
            src={`${import.meta.env.BASE_URL}images/logo.jpeg`}
            alt="Climoraone"
            className="header-logo"
          />
        </div>

        <nav>
          <Link to="/admin">Dashboard</Link>
          <Link to="/admin/orders">Orders</Link>
          <Link to="/admin/reports">Reports</Link>
          <Link to="/">Store</Link>
        </nav>
      </header>

      <section className="admin-dashboard">
        <div className="admin-products-header">
          <div>
            <h2>Product Management</h2>
            <p>Add, edit, delete, and manage stock for Climoraone products.</p>
            <strong>{products.length} products available</strong>
          </div>

          <button className="add-product-btn" onClick={openAddModal}>
            + Add Product
          </button>
        </div>

        {successMessage && (
          <div className="success-banner">{successMessage}</div>
        )}

        {pageError && <div className="product-page-error">{pageError}</div>}

        <ProductSearch
          searchText={searchText}
          setSearchText={setSearchText}
        />

        <ProductTable
          products={filteredProducts}
          onEdit={openEditModal}
          onDelete={deleteProduct}
        />
      </section>

      <ProductModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={saveProduct}
        editingProduct={editingProduct}
        isSaving={isSaving}
      />
    </div>
  );
}

export default Products;
