import React from 'react';
import { Calendar, User, DollarSign, Package, RefreshCw, AlertCircle } from 'lucide-react';

export default function SalesHistoryList({ 
  salesHistory = [], 
  loading = false, 
  error = "", 
  onRefresh, 
  onViewInvoice, 
  onStatusChange 
}) {
  
  const handleDropdownChange = (orderId, newStatus) => {
    // 🎯 1. WRITE THE STATUS EVENT STRAIGHT INTO THE BROWSER DISK STORAGE LOCKER
    const savedOverrides = JSON.parse(localStorage.getItem('stockflow_status_overrides') || '{}');
    savedOverrides[orderId] = newStatus;
    localStorage.setItem('stockflow_status_overrides', JSON.stringify(savedOverrides));

    // 2. Propagate event upward to recalculate dashboard accounting metrics
    if (onStatusChange) {
      onStatusChange(orderId, newStatus);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden mt-8">
      {/* Header Controls */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white">Sales Order Registry Log</h2>
          <p className="text-xs text-slate-400 font-medium">Historical audit tracker for all outbound stock movement logs.</p>
        </div>
        <button 
          onClick={onRefresh} 
          disabled={loading}
          type="button"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> Refresh Feed
        </button>
      </div>

      {/* Presentation States */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 font-medium">Loading sales ledger data...</div>
      ) : error ? (
        <div className="p-8 text-center text-rose-600 font-medium flex flex-col items-center gap-2">
          <AlertCircle className="h-6 w-6 text-rose-500" />
          <span>{error}</span>
        </div>
      ) : salesHistory.length === 0 ? (
        <div className="p-12 text-center text-slate-400 font-medium">No sales orders found inside the database repository.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3.5">Order Metadata</th>
                <th className="px-6 py-3.5">Customer / Client</th>
                <th className="px-6 py-3.5">Disbursed Line Items</th>
                <th className="px-6 py-3.5">Status Flow Control</th>
                <th className="px-6 py-3.5 text-right">Total Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {salesHistory.map((order) => {
                const orderDateFormatted = order.orderDate 
                  ? new Date(order.orderDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) 
                  : 'Recent Order';

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/50 transition-colors align-top"
                  >
                    {/* Metadata Clickable ID */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() =>
                            onViewInvoice && onViewInvoice(order.id)
                          }
                          type="button"
                          className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 px-2 py-0.5 rounded-md w-fit transition-colors text-left cursor-pointer focus:outline-none"
                        >
                          #{order.id.slice(-6).toUpperCase()}
                        </button>
                        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {orderDateFormatted}
                        </span>
                      </div>
                    </td>

                    {/* Customer Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-900 font-semibold">
                        <div className="p-1.5 bg-slate-100 text-slate-500 rounded-full">
                          <User className="h-3.5 w-3.5" />
                        </div>
                        <span>{order.customerName}</span>
                      </div>
                    </td>

                    {/* Items Breakdown Array */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 max-w-xs">
                        {order.items?.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="text-xs text-slate-600 bg-slate-50 p-1.5 rounded-md border border-slate-100 flex items-start gap-1"
                          >
                            <Package className="h-3 w-3 text-slate-400 mt-0.5 shrink-0" />
                            <div>
                              <span className="font-medium text-slate-900">
                                {item.product?.name || "Unknown Asset"}
                              </span>
                              <div className="text-slate-400 mt-0.5">
                                Qty:{" "}
                                <span className="font-semibold text-slate-700">
                                  {item.quantitySold}
                                </span>{" "}
                                × \ Dish{(item.unitPrice || 0).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Status Select Switcher */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative inline-block w-36">
                        <select
                          value={order.status || "Processing"}
                          onChange={(e) =>
                            handleDropdownChange(order.id, e.target.value)
                          }
                          className={`w-full text-xs font-semibold rounded-lg px-2.5 py-1.5 border appearance-none outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer ${
                            order.status === "Completed" ||
                            order.status === "Delivered"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : order.status === "Processing"
                                ? "bg-amber-50 border-amber-200 text-amber-700"
                                : "bg-rose-50 border-rose-200 text-rose-700"
                          }`}
                        >
                          <option value="Processing">Processing</option>
                          <option value="Completed">Completed</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>

                    {/* Total Invoice */}
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      <div className="inline-flex items-center justify-end text-sm">
                        <span className="text-slate-500 mr-0.5 font-sans font-medium">
                          ₦
                        </span>{" "}
                        {(order.totalAmount || 0).toFixed(2)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
