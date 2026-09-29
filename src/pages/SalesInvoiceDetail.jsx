import React, { useEffect, useState } from 'react';
import { Calendar, User, DollarSign, Package, RefreshCw, AlertCircle, ArrowLeft, Printer, FileText } from 'lucide-react';

export default function SalesInvoiceDetail({ orderId, onBack, apiUrl, headers }) {
  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchInvoiceDetails = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch(`${apiUrl || 'http://localhost:7070'}/sales/${orderId}`, {
        headers: headers
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch invoice details records.');
      }

      setInvoice(data);
    } catch (err) {
      console.error("Invoice retrieval failure:", err);
      setErrorMsg(err.message || 'Could not load individual invoice data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchInvoiceDetails();
    }
  }, [orderId, apiUrl]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500 font-medium bg-white rounded-xl border border-slate-200 shadow-xs mt-8">
        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-600 mb-2" />
        Loading invoice breakdown...
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="p-8 text-center text-rose-600 font-medium flex flex-col items-center gap-2 bg-white rounded-xl border border-slate-200 shadow-xs mt-8">
        <AlertCircle className="h-8 w-8 text-rose-500" />
        <span>{errorMsg}</span>
        <button onClick={onBack} className="mt-4 text-xs font-semibold text-slate-600 border border-slate-200 px-3 py-1.5 rounded-md hover:bg-slate-50 transition-colors">
          Return to Logs
        </button>
      </div>
    );
  }

  if (!invoice) return null;

  const invoiceDateFormatted = invoice.orderDate
    ? new Date(invoice.orderDate).toLocaleDateString(undefined, { dateStyle: 'long' })
    : 'Recent Order';

  return (
    <div className="mt-8 max-w-4xl mx-auto print:mt-0 print:max-w-full">
      {/* Action Controls - Hidden on Print */}
      <div className="mb-4 flex items-center justify-between print:hidden">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3 w-3" /> Back to History
        </button>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-md transition-colors cursor-pointer shadow-xs"
        >
          <Printer className="h-3 w-3" /> Print Invoice
        </button>
      </div>

      {/* Main Invoice Card Wrapper */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden print:border-0 print:shadow-none">
        
        {/* Invoice Top Header */}
        <div className="p-8 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">SALES INVOICE</h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Reference: #{invoice.id?.toUpperCase()}</p>
            </div>
          </div>
          <div className="sm:text-right">
            <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-md mb-2 ${
              invoice.status === 'Completed' || invoice.status === 'Delivered'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : invoice.status === 'Processing'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {invoice.status || 'Processing'}
            </span>
            <p className="text-xs text-slate-400 flex items-center sm:justify-end gap-1">
              <Calendar className="h-3 w-3" /> Date Issued: {invoiceDateFormatted}
            </p>
          </div>
        </div>

        {/* Info Split Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-100 bg-slate-50/50">
          <div className="p-6 border-b md:border-b-0 md:border-r border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To</h3>
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-base">
              <div className="p-1.5 bg-slate-200/60 text-slate-600 rounded-full">
                <User className="h-4 w-4" />
              </div>
              <span>{invoice.customerName}</span>
            </div>
          </div>
          
          <div className="p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Method</h3>
              <p className="text-sm font-semibold text-slate-700">{invoice.paymentMethod || 'Account Balance / Credit'}</p>
            </div>
          </div>
        </div>

        {/* Items Breakdown Table */}
        <div className="p-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Line Item Analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5">Product Description</th>
                  <th className="py-2.5 text-center w-24">Quantity</th>
                  <th className="py-2.5 text-right w-32">Unit Price</th>
                  <th className="py-2.5 text-right w-32">Total Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {invoice.items?.map((item, idx) => {
                  const qty = item.quantitySold || 0;
                  const price = item.unitPrice || 0;
                  const itemTotal = qty * price;

                  return (
                    <tr key={item.id || idx} className="align-middle">
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-800">{item.product?.name || "Unknown Asset"}</span>
                        </div>
                      </td>
                      <td className="py-3.5 text-center font-semibold text-slate-700">{qty}</td>
                      <td className="py-3.5 text-right font-mono text-slate-600">\${price.toFixed(2)}</td>
                      <td className="py-3.5 text-right font-mono font-semibold text-slate-900">\${itemTotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total Calculations */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span>Subtotal:</span>
              <span className="font-mono text-slate-700">\${(invoice.totalAmount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span>Tax / VAT (0%):</span>
              <span className="font-mono text-slate-700">\$0.00</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-slate-950">
              <span className="text-sm font-bold">Total Invoice Amount:</span>
              <span className="font-mono text-base font-extrabold text-indigo-600 inline-flex items-center">
                <DollarSign className="h-4 w-4 shrink-0 -mr-0.5" />
                {(invoice.totalAmount || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
