function ProductTable({ products, onEdit, onDelete }) {
  const getStockStatus = (stock) => {
    if (Number(stock) <= 0) {
      return { label: "Out of Stock", className: "stock-badge out" };
    }

    if (Number(stock) <= 10) {
      return { label: "Low Stock", className: "stock-badge low" };
    }

    return { label: "In Stock", className: "stock-badge good" };
  };

  return (
    <div className="product-table-wrapper">
      <table className="product-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Product</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan="7" className="empty-table">
                No products found.
              </td>
            </tr>
          ) : (
            products.map((product) => {
              const stockStatus = getStockStatus(product.stock);
              const image =
                product.images?.[0] ||
                product.main_image ||
                `${import.meta.env.BASE_URL}images/logo.jpeg`;

              return (
                <tr key={product.id}>
                  <td>
                    <img
                      src={image}
                      alt={product.name}
                      className="product-thumb"
                      loading="lazy"
                    />
                    {product.images?.length > 1 && (
                      <small className="product-image-count">
                        {product.images.length} images
                      </small>
                    )}
                  </td>

                  <td>
                    <strong>{product.name}</strong>
                    <p>{product.description}</p>
                  </td>

                  <td>{product.category || "Uncategorized"}</td>
                  <td>₹{product.price}</td>
                  <td>{product.stock ?? 0}</td>

                  <td>
                    <span className={stockStatus.className}>
                      {stockStatus.label}
                    </span>
                  </td>

                  <td>
                    <div className="product-actions">
                      <button type="button" onClick={() => onEdit(product)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() => onDelete(product.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ProductTable;
