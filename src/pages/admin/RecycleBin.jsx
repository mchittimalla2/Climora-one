import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { adminApi, getAdminUser } from "../../auth/adminAuth";

export default function RecycleBin() {
  const user = getAdminUser();
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true); setError("");
      const response = await adminApi("/api/admin/products/recycle-bin");
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Unable to load the Recycle Bin.");
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const restore = async (id) => {
    try {
      setError(""); setMessage("");
      const response = await adminApi(`/api/admin/products/${id}/restore`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Restore failed.");
      setMessage(data.message); await load();
    } catch (e) { setError(e.message); }
  };

  const permanentDelete = async (product) => {
    const confirmation = window.prompt(`Type DELETE PRODUCT-${product.id} exactly:`);
    if (confirmation === null) return;
    const currentPassword = window.prompt("Enter the break-glass account password:");
    if (!currentPassword) return;

    try {
      setError(""); setMessage("");
      const response = await adminApi(`/api/admin/products/${product.id}/permanent`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation, current_password: currentPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Permanent deletion failed.");
      setMessage(data.message); await load();
    } catch (e) { setError(e.message); }
  };

  return (
    <AdminLayout eyebrow="Data protection" title="Product Recycle Bin" description="Deleted products remain recoverable for 30 days. Owners can restore them; only break-glass can permanently remove them." actions={<button className="admin-secondary-btn" onClick={load}>Refresh</button>}>
      {error && <div className="admin-alert error">{error}</div>}
      {message && <div className="admin-alert success">{message}</div>}
      <section className="admin-panel">
        {loading ? <div className="admin-empty">Loading deleted products...</div> : products.length === 0 ? <div className="admin-empty">The Recycle Bin is empty.</div> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Product</th><th>Deleted by</th><th>Deleted on</th><th>Eligible after</th><th>Actions</th></tr></thead>
              <tbody>{products.map((product) => <tr key={product.id}>
                <td><strong>{product.name}</strong><br/><small>{product.category || "Collection"}</small></td>
                <td>{product.deleted_by?.name || "Unknown"}<br/><small>{product.deleted_by?.email || ""}</small></td>
                <td>{product.deleted_at ? new Date(product.deleted_at).toLocaleString() : "—"}</td>
                <td>{product.purge_eligible_at ? new Date(product.purge_eligible_at).toLocaleDateString() : "—"}</td>
                <td>
                  <div className="product-actions">
                    <button type="button" onClick={() => restore(product.id)}>Restore</button>
                    {user?.is_break_glass && <button type="button" className="delete-btn" onClick={() => permanentDelete(product)}>Permanent delete</button>}
                  </div>
                </td>
              </tr>)}</tbody>
            </table>
          </div>
        )}
      </section>
    </AdminLayout>
  );
}
