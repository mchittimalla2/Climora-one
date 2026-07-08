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

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Failed to load products:", error);
      alert("Unable to load products from backend.");
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
    setEditingProduct(null);
    setIsModalOpen(false);
  };

  const saveProduct = async (productData) => {
    try {
      const isEditing = Boolean(editingProduct);

      const url = isEditing
        ? `${API_BASE_URL}/api/products/${editingProduct.id}`
        : `${API_BASE_URL}/api/products`;

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Product save failed:", data);
        alert("Product save failed.");
        return;
      }

      closeModal();
      fetchProducts();
    } catch (error) {
      console.error("Product save error:", error);
      alert("Unable to save product.");
    }
  };

  const deleteProduct = async (productId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        alert("Failed to delete product.");
        return;
      }

      fetchProducts();
    } catch (error) {
      console.error("Product delete error:", error);
      alert("Unable to delete product.");
    }
  };

  return (
    <div>
      <header className="header">
        <div className="logo-section">
          <img src="/images/logo.jpeg" alt="Climoraone" className="header-logo" />
        </div>

        <nav>
          <a href="/admin">Dashboard</a>
          <a href="/admin/orders">Orders</a>
          <a href="/admin/reports">Reports</a>
          <a href="/">Store</a>
        </nav>
      </header>

      <section className="admin-dashboard">
        <div className="admin-products-header">
          <div>
            <h2>Product Management</h2>
            <p>Add, edit, delete, and manage stock for Climoraone products.</p>
          </div>

          <button className="add-product-btn" onClick={openAddModal}>
            + Add Product
          </button>
        </div>

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