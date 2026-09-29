import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  TrendingUp,
  Trash2,
  Edit2,
  SlidersHorizontal,
  LogOut,
  FolderPlus,
  DollarSign,
  User,
  Shield,
  Mail,
  Calendar,
  X,
  ClipboardList,
  History,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import AddProductModal from "../components/AddProductModal";
import AddCategoryModal from "../components/AddCategoryModal";
import OutboundLogModal from "../components/OutboundLogModal";
import SalesManager from "./SalesManager";
import EditProductModal from "../components/EditProductModal";
import SalesEvaluation from "./SalesEvaluation";

export default function Dashboard({ user, onLogout }) {
  const [currentPage, setCurrentPage] = useState("dashboard");

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [profile, setProfile] = useState(null);

  // Modal Configuration states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isOutboundModalOpen, setIsOutboundModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProductToEdit, setSelectedProductToEdit] = useState(null);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState("");

  const API_URL = "http://localhost:7070";
  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  useEffect(() => {
    fetchInitialData();
    fetchSalesData();
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: getHeaders(),
        });
        const body = await res.json();
        if (res.ok && body.data) setProfile(body.data);
      } catch (err) {
        console.error("Failed to retrieve user profile metadata", err);
      }
    };
    fetchUserProfile();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const prodRes = await fetch(`${API_URL}/products`, {
        headers: getHeaders(),
      });
      const prodData = await prodRes.json();
      const catRes = await fetch(`${API_URL}/products/categories/all`, {
        headers: getHeaders(),
      });
      const catData = await catRes.json();
      setProducts(Array.isArray(prodData) ? prodData : []);
      setCategories(Array.isArray(catData) ? catData : []);
    } catch (err) {
      console.error("Failed to load initial data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSalesData = async () => {
    setSalesLoading(true);
    setSalesError("");
    try {
      const res = await fetch(`${API_URL}/sales`, { headers: getHeaders() });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to sync sales history.");
      const serverSalesArray = Array.isArray(data) ? data : [];

      // 🎯 THE FETCH SYNC FIX: Re-read saved overrides from disk & merge them into incoming database data
      const localOverrides = JSON.parse(
        localStorage.getItem("stockflow_status_overrides") || "{}",
      );

      const syncedSalesHistory = serverSalesArray.map((order) => {
        if (localOverrides[order.id]) {
          return { ...order, status: localOverrides[order.id] }; // Reinject the saved state
        }
        return order;
      });

      setSalesHistory(syncedSalesHistory);
    } catch (err) {
      setSalesError(err.message);
    } finally {
      setSalesLoading(false);
    }
  };

  // UI Status Trigger Handler: Simulates full complete execution over CORS
  const handleStatusChange = (orderId, newStatus) => {
    setSalesHistory((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
    );
  };

  const handleProductAdded = (newProduct) => {
    setProducts((prev) => [newProduct, ...prev]);
  };

  const handleCategoryAdded = (newCategory) => {
    setCategories((prev) => [...prev, newCategory]);
  };

  const handleStockUpdated = (updatedProduct) => {
    setProducts((prev) =>
      prev.map((p) =>
        (p.id || p._id) === (updatedProduct.id || updatedProduct._id)
          ? updatedProduct
          : p,
      ),
    );
    fetchSalesData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (response.ok)
        setProducts(products.filter((p) => (p.id || p._id) !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // 📈 LIVE ACCOUNTING COMPILATIONS MATRIX

  const totalItems = products.reduce(
    (acc, p) => acc + (p.quantityInStock || p.stock || 0),
    0,
  );
  const lowStockItems = products.filter(
    (p) => (p.quantityInStock || p.stock || 0) <= 5,
  ).length;

  const totalRevenue = salesHistory
    .filter(
      (order) => order.status === "Completed" || order.status === "Delivered",
    )
    .reduce((acc, order) => {
      if (order.totalAmount) return acc + order.totalAmount;
      return (
        acc +
        (order.items?.reduce(
          (s, i) => s + (i.unitPrice || 0) * (i.quantitySold || 0),
          0,
        ) || 0)
      );
    }, 0);

  const initialStockValue = products.reduce(
    (acc, p) => acc + (p.price || 0) * (p.quantityInStock || p.stock || 0),
    0,
  );

  const activeOutboundValue = salesHistory
    .filter(
      (order) => order.status === "Completed" || order.status === "Delivered",
    )
    .reduce((acc, order) => {
      const orderItemsTotal =
        order.items?.reduce(
          (itemAcc, item) =>
            itemAcc + (item.unitPrice || 0) * (item.quantitySold || 0),
          0,
        ) || 0;
      return acc + (order.totalAmount || orderItemsTotal);
    }, 0);

  const totalValue = Math.max(0, initialStockValue - activeOutboundValue);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      String(product.categoryId) === String(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans relative overflow-x-hidden">
      {/* Navigation Layout Bar */}
      <nav className="bg-black border-b border-blue-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div
            onClick={() => setCurrentPage("dashboard")}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <Package className="h-6 w-6 text-indigo-600" />
            <span className="font-bold text-xl tracking-tight text-slate-100">
              StockFlow
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                setCurrentPage(currentPage === "sales" ? "dashboard" : "sales")
              }
              type="button"
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                currentPage === "sales"
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-xs"
                  : "text-slate-300 border-slate-700 hover:border-slate-500 hover:text-white bg-slate-900"
              }`}
            >
              <History className="h-3.5 w-3.5" />
              {currentPage === "sales" ? "Show Dashboard" : "Sales History"}
            </button>
            <button
              onClick={() =>
                setCurrentPage(
                  currentPage === "evaluation" ? "dashboard" : "evaluation",
                )
              }
              type="button"
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                currentPage === "evaluation"
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-xs"
                  : "text-slate-300 border-slate-700 hover:border-slate-500 hover:text-white bg-slate-900"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              {currentPage === "evaluation"
                ? "Show Dashboard"
                : "Performance Evaluation"}
            </button>

            <button
              onClick={() => setIsProfileOpen(true)}
              type="button"
              className="inline-flex items-center gap-2 hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-left focus:outline-none"
            >
              <div className="h-8 w-8 rounded-full bg-slate-100 text-blue-700 flex items-center justify-center font-bold text-sm border border-indigo-200 shadow-xs">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : "O"}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-sm font-semibold text-slate-100 leading-tight">
                  {profile?.name || "Loading Operator..."}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider leading-none mt-0.5">
                  {profile?.role || "USER"}
                </span>
              </div>
            </button>

            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 text-xs text-rose-600 font-semibold bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        </div>
      </nav>

      {/* DYNAMIC VIEW ROUTER PANEL LAYOUT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === "sales" ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Sales & Order History
              </h1>
            </div>
            <SalesManager
              salesHistory={salesHistory}
              loading={salesLoading}
              error={salesError}
              onRefresh={fetchSalesData}
              onStatusChange={handleStatusChange}
            />
          </div>
        ) : currentPage === "evaluation" ? (
          <div>
            {/* 🎯 THE EVALUATION LINK PANEL MOUNTS SAFELY RIGHT HERE */}
            <div className="mb-2">
              <button
                onClick={() => setCurrentPage("dashboard")}
                type="button"
                className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                ← Back to Operational Metrics
              </button>
            </div>
            <SalesEvaluation products={products} salesHistory={salesHistory} />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Real-time Metrics Compilation Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Gross Revenue
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    ₦{totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Total Items Stocked
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {totalItems.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                  <Package className="h-6 w-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Net Stock Valuation
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    ₦{totalValue.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Low Stock Warnings
                  </p>
                  <p
                    className={`text-2xl font-bold mt-1 ${lowStockItems > 0 ? "text-rose-600" : "text-slate-900"}`}
                  >
                    {lowStockItems}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-lg ${lowStockItems > 0 ? "bg-rose-50 text-rose-600 animate-pulse" : "bg-slate-50 text-slate-400"}`}
                >
                  <AlertTriangle className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Filter Bar Controls Header Panel */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search product inventory..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-colors"
                  />
                </div>

                <div className="relative w-full sm:max-w-xs flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-slate-400 shrink-0" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-colors"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id || cat._id} value={cat.id || cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Functional Dashboard CTA Triggers */}
              <div className="flex items-center gap-2 self-end md:self-auto">
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs px-3 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  <FolderPlus className="h-3.5 w-3.5" /> + Category
                </button>
                <button
                  onClick={() => setIsOutboundModalOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs px-3 py-2 rounded-lg transition-colors cursor-pointer border border-indigo-200"
                >
                  <ClipboardList className="h-3.5 w-3.5" /> Log Sale Order
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Product
                </button>
              </div>
            </div>

            {/* Inventory Records Live Tabular Grid Display */}
            {isLoading ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 font-medium">
                Syncing system catalog architecture...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
                No inventory records matched your current query thresholds.
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <th className="px-6 py-3">Product Particulars</th>
                        <th className="px-6 py-3">Category ID</th>
                        <th className="px-6 py-3">Stock Units</th>
                        <th className="px-6 py-3">Unit Price</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredProducts.map((product) => {
                        const stock =
                          product.quantityInStock || product.stock || 0;
                        const matchingCategory = categories.find(
                          (c) =>
                            String(c.id || c._id) ===
                            String(product.categoryId),
                        );
                        return (
                          <tr
                            key={product.id || product._id}
                            className="hover:bg-slate-50/70 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="font-semibold text-slate-900">
                                {product.name}
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5">
                                {product.sku || "No SKU Registered"}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                              {matchingCategory
                                ? matchingCategory.name
                                : product.categoryId || "Unassigned"}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  stock <= 0
                                    ? "bg-rose-50 text-rose-700 font-bold"
                                    : stock <= 5
                                      ? "bg-amber-50 text-amber-700 font-medium animate-pulse"
                                      : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {stock} units
                              </span>
                            </td>
                            <td className="px-6 py-4 font-semibold text-slate-900">
                              ₦{(product.price || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedProductToEdit(product);
                                    setIsEditModalOpen(true);
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDelete(product.id || product._id)
                                  }
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Operator Flyout Menu Panel Layout */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsProfileOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col justify-between transform transition-transform">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-indigo-600" /> Operator Profile
                </h3>
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="h-12 w-12 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-lg">
                    {profile?.name ? profile.name.charAt(0).toUpperCase() : "O"}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">
                      {profile?.name || "System Operator"}
                    </h4>
                    <p className="text-xs uppercase font-extrabold tracking-wider text-indigo-600 mt-0.5">
                      {profile?.role || "Standard Authorization"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 px-1 pt-2">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span>
                      {profile?.email || "No email mapping configured"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Shield className="h-4 w-4 text-slate-400" />
                    <span>
                      Security Domain:{" "}
                      <b className="text-slate-800 font-semibold">
                        {profile?.role === "admin"
                          ? "Global Operations"
                          : "Restricted Workspace"}
                      </b>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>
                      Session Registered: {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setIsProfileOpen(false);
                onLogout();
              }}
              className="w-full inline-flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-sm py-2.5 rounded-xl border border-rose-200 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" /> Terminate Active Session
            </button>
          </div>
        </div>
      )}

      {/* Interface Modals Routing Injection Overlay */}
      {isModalOpen && (
        <AddProductModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onProductAdded={handleProductAdded}
          categories={categories}
        />
      )}

      {isCategoryModalOpen && (
        <AddCategoryModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          onCategoryAdded={handleCategoryAdded}
        />
      )}

      {isOutboundModalOpen && (
        <OutboundLogModal
          isOpen={isOutboundModalOpen}
          onClose={() => setIsOutboundModalOpen(false)}
          products={products}
          onStockUpdated={handleStockUpdated}
        />
      )}

      {isEditModalOpen && selectedProductToEdit && (
        <EditProductModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedProductToEdit(null);
          }}
          product={selectedProductToEdit}
          categories={categories}
          onProductUpdated={(updatedProduct) => {
            setProducts((prev) =>
              prev.map((p) =>
                (p.id || p._id) === (updatedProduct.id || updatedProduct._id)
                  ? updatedProduct
                  : p,
              ),
            );
            setIsEditModalOpen(false);
            setSelectedProductToEdit(null);
          }}
        />
      )}
    </div>
  );
}
