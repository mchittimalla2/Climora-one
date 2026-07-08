function ProductSearch({ searchText, setSearchText }) {
  return (
    <div className="product-search-bar">
      <input
        type="text"
        placeholder="Search products by name or category..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
      />
    </div>
  );
}

export default ProductSearch;