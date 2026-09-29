import React, { useState } from 'react';
import SalesHistoryList from '../components/SalesHistoryList';
import SalesInvoiceDetail from './SalesInvoiceDetail';

export default function SalesManager({ apiUrl, headers, salesHistory, loading, error, onRefresh, onStatusChange }) {
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  return (
    <div className="w-full">
      {selectedOrderId ? (
        <SalesInvoiceDetail
          orderId={selectedOrderId}
          onBack={() => setSelectedOrderId(null)}
          apiUrl={apiUrl}
          headers={headers}
        />
      ) : (
        <SalesHistoryList
          apiUrl={apiUrl}
          headers={headers}
          salesHistory={salesHistory}
          loading={loading}
          error={error}
          onRefresh={onRefresh}
          onViewInvoice={(orderId) => setSelectedOrderId(orderId)}
          onStatusChange={onStatusChange}
        />
      )}
    </div>
  );
}
