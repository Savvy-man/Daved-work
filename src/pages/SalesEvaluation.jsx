import React, { useState } from 'react';
import { Calendar, TrendingUp, ArrowDownLeft, ArrowUpRight, BarChart3, Clock } from 'lucide-react';

export default function SalesEvaluation({ products = [], salesHistory = [] }) {
  // Evaluation toggle control layout: 'daily' vs 'monthly'
  const [timeframe, setTimeframe] = useState('daily');

  // Helper date parsing tokens matching current date (2026)
  const todayStr = new Date().toLocaleDateString(undefined, { dateStyle: 'medium' });
  const currentMonthStr = new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  // Filter conditions checking whether data entries fall inside evaluation windows
  const isToday = (dateInput) => {
    if (!dateInput) return false;
    return new Date(dateInput).toDateString() === new Date().toDateString();
  };

  const isThisMonth = (dateInput) => {
    if (!dateInput) return false;
    const d = new Date(dateInput);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  const activeFilter = timeframe === 'daily' ? isToday : isThisMonth;

  // =========================================================================
  // 📈 EVALUATION DATA CONTEXT PROCESSING PIPELINE (IN NAIRA)
  // =========================================================================
  
  // 1. Outbound Sales Filters (Fulfillments tracked through overrides)
  const evaluatedSales = salesHistory.filter(
    (order) => activeFilter(order.orderDate || order.createdAt) && (order.status === 'Completed' || order.status === 'Delivered')
  );

  const outboundVolume = evaluatedSales.reduce((acc, order) => {
    return acc + (order.items?.reduce((s, i) => s + (i.quantitySold || 0), 0) || 0);
  }, 0);

  const outboundRevenue = evaluatedSales.reduce((acc, order) => {
    if (order.totalAmount) return acc + order.totalAmount;
    return acc + (order.items?.reduce((s, i) => s + ((i.unitPrice || 0) * (i.quantitySold || 0)), 0) || 0);
  }, 0);

  // 2. Incoming Stock Intake Filters
  const evaluatedProductsIntake = products.filter((p) => activeFilter(p.createdAt || p.updatedAt));

  const inboundVolume = evaluatedProductsIntake.reduce((acc, p) => acc + (p.quantityInStock || p.stock || 0), 0);
  const inboundAssetCost = evaluatedProductsIntake.reduce((acc, p) => {
    return acc + ((p.price || 0) * (p.quantityInStock || p.stock || 0));
  }, 0);

  return (
    <div className="space-y-6 mt-4">
      {/* Header Evaluation Control Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-600" /> Operational Metrics Evaluation
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Active target validation interval: <span className="font-bold text-slate-700">{timeframe === 'daily' ? todayStr : currentMonthStr}</span>
          </p>
        </div>

        {/* Evaluation Interval Switch Tabs */}
        <div className="bg-slate-100 p-1 rounded-lg flex items-center self-start sm:self-auto">
          <button
            onClick={() => setTimeframe('daily')}
            type="button"
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              timeframe === 'daily' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Daily Summary
          </button>
          <button
            onClick={() => setTimeframe('monthly')}
            type="button"
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              timeframe === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Monthly Audit
          </button>
        </div>
      </div>

      {/* Numerical Performance KPI Panel Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Net Flow Shift Balance Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Value Realised</p>
            <p className={`text-2xl font-extrabold font-mono mt-1 ${outboundRevenue >= inboundAssetCost ? 'text-emerald-600' : 'text-rose-600'}`}>
              {outboundRevenue >= inboundAssetCost ? '+' : '-'}₦{Math.abs(outboundRevenue - inboundAssetCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className={`p-3 rounded-lg ${outboundRevenue >= inboundAssetCost ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        {/* Stock Intake Allocation Volume Summary Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Warehouse Stock Intake</p>
            <p className="text-2xl font-extrabold font-mono text-slate-900 mt-1">+{inboundVolume.toLocaleString()} Units</p>
            <span className="text-[11px] font-mono text-slate-400 font-medium">Asset Evaluation: ₦{inboundAssetCost.toLocaleString()}</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <ArrowDownLeft className="h-6 w-6" />
          </div>
        </div>

        {/* Fulfilling Disbursements Revenue Summary Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Fulfilled Disbursements</p>
            <p className="text-2xl font-extrabold font-mono text-emerald-600 mt-1">-{outboundVolume.toLocaleString()} Units</p>
            <span className="text-[11px] font-mono text-emerald-500 font-bold">Revenue Yield: ₦{outboundRevenue.toLocaleString()}</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <ArrowUpRight className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Split Audit Tables Grid Layout Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COMPONENT: STOCK INBOUND INTAKE LEDGER */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center gap-1.5 text-slate-700 font-bold text-sm">
              <ArrowDownLeft className="h-4 w-4 text-blue-600" /> Stock Inbound Procurement Log
            </div>
            {evaluatedProductsIntake.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium flex items-center justify-center gap-1.5/3"><Clock className="h-3.5 w-3.5" /> No warehouse asset loading updates registered inside this target frame.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50/50 uppercase font-semibold text-slate-400 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Item Identity</th>
                      <th className="px-4 py-2.5 text-center">Procured Qty</th>
                      <th className="px-4 py-2.5 text-right">Asset Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {evaluatedProductsIntake.map((p) => {
                      const qty = p.quantityInStock || p.stock || 0;
                      const value = (p.price || 0) * qty;
                      return (
                        <tr key={p.id || p._id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3 text-slate-900 font-semibold">{p.name}</td>
                          <td className="px-4 py-3 text-center text-slate-600 font-mono">{qty} units</td>
                          <td className="px-4 py-3 text-right text-slate-900 font-mono">₦{value.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COMPONENT: OUTBOUND DISBURSEMENTS LOG */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center gap-1.5 text-slate-700 font-bold text-sm">
              <ArrowUpRight className="h-4 w-4 text-emerald-600" /> Fulfilled Outbound Log
            </div>
            {evaluatedSales.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium flex items-center justify-center gap-1.5"><Clock className="h-3.5 w-3.5" /> No orders have reached fulfillment inside this window.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50/50 uppercase font-semibold text-slate-400 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Customer Name</th>
                        <th className="px-4 py-2.5 text-center">Disbursed Qty</th>  
                    <th className="px-4 py-2.5 text-right">Revenue Yield</th>
                    </tr>
                  </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                        {evaluatedSales.map((order) => {
                            const totalQty = order.items?.reduce((s, i) => s + (i.quantitySold || 0), 0) || 0;
                            const totalRevenue = order.items?.reduce((s, i) => s + ((i.unitPrice || 0) * (i.quantitySold || 0)), 0) || 0;
                            return (
                                <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-4 py-3 text-slate-900 font-semibold">{order.customerName}</td>
                                    <td className="px-4 py-3 text-center text-slate-600 font-mono">{totalQty} units</td>
                                    <td className="px-4 py-3 text-right text-slate-900 font-mono">₦{totalRevenue.toLocaleString()}</td>
                                </tr>
                            );
                        }   )}
                    </tbody>
                </table>
                </div>
            )}
          </div>
        </div>
        </div>
    </div>
  );
}