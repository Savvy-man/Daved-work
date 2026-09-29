import React, { useState, useEffect } from "react";
import { AlertTriangle, Edit3 } from "lucide-react";
import SearchableSelect from "./SearchableSelect";

export default function EditProductModal({
  isOpen,
  onClose,
  product,
  categories,
  onProductUpdated,
  apiUrl,
  headers,
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-populate input fields with existing product data when modal opens
  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setPrice(product.price || "");
      setStock(product.quantityInStock || product.stock || "0");
      setSku(product.sku || "");
      setCategoryId(product.categoryId || "");
      setErrorMsg("");
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    if (!categoryId) {
      setErrorMsg("Product must remain assigned to a valid category.");
      setIsSubmitting(false);
      return;
    }

    const parsedStock = parseInt(stock, 10) || 0;

    try {
      // Direct update path hitting your specific product ID route configuration
      const response = await fetch(
        `${apiUrl || "https://stockflow-backend-lls9.onrender.com"}/products/${product.id || product._id}`,
        {
          method: "PUT", // Switch to 'PATCH' if your backend routing demands it
          headers: headers || {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            name: name,
            sku: sku,
            price: parseFloat(price) || 0.0, // Strict Float conversion
            quantityInStock: parseInt(stock, 10) || 0, // Strips out the unknown 'stock' key and parses Int
            categoryId: categoryId,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Failed to update product details.",
        );
      }

      // Return refreshed database row back up to main inventory grid
      if (onProductUpdated) {
        onProductUpdated(data.product || data);
      }

      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Header Block */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
              <Edit3 className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Modify Product Attributes
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-medium text-sm"
          >
            ✕
          </button>
        </div>

        {/* Form Body Context */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              SKU / Barcode
            </label>
            <input
              type="text"
              required
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Product Title
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Unit Price (\$)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Current Stock
              </label>
              <input
                type="number"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Category Assignment
            </label>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Category Assignment
            </label>
            <SearchableSelect
              options={categories}
              placeholder="Search and select category item..."
              value={categoryId}
              onChange={(val) => setCategoryId(val)}
              labelKey="name"
              valueKey="id" // Handles Mongoose schema fields cleanly. Swap out for "_id" if your collection requires it
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Saving Alterations..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
