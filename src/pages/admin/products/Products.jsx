import { useEffect, useState } from "react";
import AdminLayout from "../../../components/AdminLayout";
import "../../../App.css";
import "./ProductAdmin.css";
import { adminApi, getAdminUser } from "../../../auth/adminAuth";
import ProductSearch from "./ProductSearch";
import ProductTable from "./ProductTable";
import ProductModal from "./ProductModal";

function Products() {
  const user = getAdminUser();
  const [products, setProducts] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [pageError, setPageError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      setPageError("");
      const response = await adminApi("/api/admin/products");
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Unable to load products.");
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) { setPageError(error.message || "Unable to load products."); }
  };

  const filteredProducts = products.filter((product) => {
    const text = searchText.toLowerCase();
    return product.name?.toLowerCase().includes(text) || product.category?.toLowerCase().includes(text);
  });

  const closeModal = () => { if (!isSaving) { setEditingProduct(null); setIsModalOpen(false); } };

  const saveProduct = async (productData) => {
    const isEditing = Boolean(editingProduct);
    const path = isEditing ? `/api/admin/products/${editingProduct.id}` : "/api/admin/products";
    const formData = new FormData();
    formData.append("name", productData.name);
    formData.append("category", productData.category || "");
    formData.append("price", String(productData.price));
    formData.append("stock", String(productData.stock));
    formData.append("description", productData.description || "");
    Object.entries(productData.imageFiles).forEach(([slot, file]) => { if (file) formData.append(`image_${slot}`, file); });
    if (isEditing) formData.append("_method", "PUT");

    try {
      setIsSaving(true); setPageError("");
      const response = await adminApi(path, { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) {
        const validationErrors = data?.errors ? Object.values(data.errors).flat().join(" ") : "";
        throw new Error(validationErrors || data?.message || "Product save failed.");
      }
      setEditingProduct(null); setIsModalOpen(false); await fetchProducts();
      setSuccessMessage(isEditing ? "Product updated successfully." : "Product added successfully.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) { setPageError(error.message || "Product save failed."); } finally { setIsSaving(false); }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm("Move this product to the Recycle Bin? It can be restored for 30 days.")) return;
    try {
      setPageError("");
      const response = await adminApi(`/api/admin/products/${productId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Failed to move product to the Recycle Bin.");
      await fetchProducts(); setSuccessMessage(data.message || "Product moved to the Recycle Bin.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) { setPageError(error.message || "Failed to delete product."); }
  };

  const canSoftDelete = user?.role === "owner" || user?.is_break_glass;

  return (
    <AdminLayout
      eyebrow="Catalogue operations"
      title="Product management"
      description="Owners can move products to a 30-day Recycle Bin. Only break-glass can permanently delete them from there."
      actions={<button className="add-product-btn" onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}>+ Add Product</button>}
    >
      <section className="admin-panel product-admin-container">
        <div className="admin-products-header"><div><strong>{products.length} products available</strong><p>Signed in as {user?.name || "Administrator"}.</p></div></div>
        {successMessage && <div className="admin-alert success">{successMessage}</div>}
        {pageError && <div className="admin-alert error">{pageError}</div>}
        <ProductSearch searchText={searchText} setSearchText={setSearchText} />
        <ProductTable products={filteredProducts} onEdit={(product) => { setEditingProduct(product); setIsModalOpen(true); }} onDelete={canSoftDelete ? deleteProduct : undefined} />
      </section>
      <ProductModal isOpen={isModalOpen} onClose={closeModal} onSave={saveProduct} editingProduct={editingProduct} isSaving={isSaving} />
    </AdminLayout>
  );
}

export default Products;