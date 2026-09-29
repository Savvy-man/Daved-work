import React, { useState } from "react";
import { AlertTriangle, ArrowUpRight } from "lucide-react";
import SearchableSelect from "./SearchableSelect";

export default function OutboundLogModal({
  isOpen,
  onClose,
  products,
  onStockUpdated,
  apiUrl,
  headers,
}) {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [recipient, setRecipient] = useState(""); 
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const selectedProduct = products.find(
    (p) => String(p.id || p._id) === String(productId),
  );
  const availableStock = selectedProduct
    ? selectedProduct.quantityInStock || selectedProduct.stock || 0
    : 0;
  const unitPrice = selectedProduct ? selectedProduct.price || 0 : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    if (!productId) {
      setErrorMsg("Please select a valid product to disburse.");
      setIsSubmitting(false);
      return;
    }

    const shipQty = parseInt(quantity, 10) || 0;

    if (shipQty <= 0) {
      setErrorMsg("Deduction quantity must be greater than zero.");
      setIsSubmitting(false);
      return;
    }

    if (shipQty > availableStock) {
      setErrorMsg(
        `Insufficient inventory. You are trying to ship ${shipQty} units, but only ${availableStock} are available.`,
      );
      setIsSubmitting(false);
      return;
    }

    // Calculate total layout transaction totals for strict accounting
    const calculatedTotalInvoice = Number(shipQty) * Number(unitPrice);

    try {
            const response = await fetch(
              `${apiUrl || "https://stockflow-backend-lls9.onrender.com"}/sales`,
        {
          method: "POST",
          headers: headers || {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            customerName: recipient || "Walk-in Customer",
            totalAmount: calculatedTotalInvoice, // Added total accounting line parameter
            
            // 🎯 THE FIX: Force the backend controller to process this transaction as a finished event
            status: "Completed", 
            
            items: [
              {
                productId: productId,
                quantitySold: shipQty,
                unitPrice: unitPrice,
              },
            ],
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to create sales order transaction.",
        );
      }

      if (onStockUpdated && selectedProduct) {
        const updatedProductProfile = {
          ...selectedProduct,
          quantityInStock: availableStock - shipQty,
          stock: availableStock - shipQty,
        };
        onStockUpdated(updatedProductProfile);
      }

      setProductId("");
      setQuantity("");
      setRecipient("");
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    }finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-md">
              <ArrowUpRight className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Create Outbound Sales Order
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Customer Name
            </label>
            <input
              type="text"
              required
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="e.g. Acme Logistics or John Doe"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Select Product Item
            </label>
            <SearchableSelect
              options={products.map((prod) => ({
                ...prod,
                displayName: `${prod.name} (${prod.quantityInStock || prod.stock || 0} available — \$${(prod.price || 0).toFixed(2)})`,
                isDisabled: (prod.quantityInStock || prod.stock || 0) === 0,
              }))}
              placeholder="Search and choose item from inventory..."
              value={productId}
              onChange={(val) => {
                const selected = products.find(
                  (p) => String(p.id || p._id) === String(val),
                );
                const stockLeft = selected
                  ? selected.quantityInStock || selected.stock || 0
                  : 0;

                if (stockLeft === 0) {
                  setErrorMsg("Selected item is completely out of stock.");
                  return;
                }

                setProductId(val);
                setErrorMsg("");
              }}
              labelKey="displayName"
              valueKey="id" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Quantity to Sell
            </label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="0"
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
              {isSubmitting
                ? "Logging Transaction..."
                : "Process Order & Deduct"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
