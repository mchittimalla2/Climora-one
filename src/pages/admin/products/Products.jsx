import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "../../../App.css";
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

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const response = await fetch(`${API_BASE_URL}/api/products`);
    const data = await response.json();
    setProducts(data);
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
    setEditingProduct(null);
    setIsModalOpen(false);
  };

  const saveProduct = async (productData) => {
    const isEditing = Boolean(editingProduct);

    const url = isEditing
      ? `${API_BASE_URL}/api/products/${editingProduct.id}`
      : `${API_BASE_URL}/api/products`;

    const method = isEditing ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      alert("Product save failed.");
      return;
    }

    closeModal();
    await fetchProducts();

    setSuccessMessage(
      isEditing ? "Product updated successfully." : "Product added successfully."
    );

    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      alert("Failed to delete product.");
      return;
    }

    await fetchProducts();
    setSuccessMessage("Product deleted successfully.");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  return (
    <div>
      <header className="header">
        <div className="logo-section">
          <img src="/images/logo.jpeg" alt="Climoraone" className="header-logo" />
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
      />
    </div>
  );
}

export default Products;