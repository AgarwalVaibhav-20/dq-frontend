import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Heart,
  Copy,
  RefreshCw,
  Calendar,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Award,
  X,
  Eye,
  Users,
  DollarSign,
  Percent
} from 'lucide-react';
import { fetchCoupons } from '../../redux/slices/coupenSlice';

function CouponsReport() {
  const dispatch = useDispatch();
  const { coupons = [], loading, error } = useSelector((state) => state.coupons || {});

  const [detailDialog, setDetailDialog] = useState({ open: false, coupon: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    dispatch(fetchCoupons());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchCoupons());
  };

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setSnackbar({ open: true, message: `Coupon code "${code}" copied!`, severity: 'success' });
      setTimeout(() => setSnackbar({ ...snackbar, open: false }), 3000);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to copy code', severity: 'error' });
      setTimeout(() => setSnackbar({ ...snackbar, open: false }), 3000);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCouponStatus = (coupon) => {
    const isExpired = new Date(coupon.expiryDate) < new Date();
    const isMaxUsageReached = coupon.maxUsage && coupon.usageCount >= coupon.maxUsage;
    const isInactive = !coupon.isActive;
    return { isExpired, isMaxUsageReached, isInactive };
  };

  const getCouponStats = () => {
    if (!coupons || coupons.length === 0) {
      return { totalCoupons: 0, activeCoupons: 0, totalUsage: 0, totalDiscount: 0 };
    }

    const totalCoupons = coupons.length;
    const activeCoupons = coupons.filter(c => c.isActive && new Date(c.expiryDate) > new Date()).length;
    const totalUsage = coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0);
    const totalDiscount = coupons.reduce((sum, c) => {
      const history = c.usageHistory || [];
      return sum + history.reduce((s, h) => s + h.discountApplied, 0);
    }, 0);
    return { totalCoupons, activeCoupons, totalUsage, totalDiscount };
  };

  const stats = getCouponStats();

  if (loading && (!coupons || coupons.length === 0)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Heart size={32} className="text-blue-600" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Coupon Reports</h1>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-red-800">{typeof error === 'string' ? error : error.message || 'Failed to load coupons'}</p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Total Coupons</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalCoupons}</p>
            </div>
            <Award size={40} className="text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Active Coupons</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.activeCoupons}</p>
            </div>
            <CheckCircle size={40} className="text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Total Usage</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalUsage}</p>
            </div>
            <Users size={40} className="text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Total Discount</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">₹{stats.totalDiscount}</p>
            </div>
            <DollarSign size={40} className="text-red-600" />
          </div>
        </div>
      </div>

      {/* Coupon Performance Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-blue-600 mb-4">Coupon Performance Report</h2>
          <div className="border-t border-gray-200 mb-4"></div>

          {!coupons || coupons.length === 0 ? (
            <div className="text-center py-12">
              <Heart size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No coupons found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Code</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Discount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Usage</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Usage %</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Expiry</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => {
                    const { isExpired, isMaxUsageReached } = getCouponStatus(coupon);
                    const usagePercent = coupon.maxUsage ? (coupon.usageCount / coupon.maxUsage) * 100 : 0;

                    return (
                      <tr key={coupon._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-gray-800">{coupon.code}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded border border-gray-300">
                            {coupon.discountType === 'percentage' ? <Percent size={12} /> : <DollarSign size={12} />}
                            {coupon.discountType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-800">
                          {coupon.discountValue}{coupon.discountType === 'percentage' ? '%' : ' ₹'}
                        </td>
                        <td className="py-3 px-4 text-gray-800">
                          {coupon.usageCount} / {coupon.maxUsage || 'Unlimited'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${usagePercent < 50 ? 'bg-blue-600' : usagePercent < 80 ? 'bg-yellow-500' : 'bg-red-600'}`}
                                style={{ width: `${Math.min(usagePercent, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">{usagePercent.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-1 text-xs rounded ${isExpired || isMaxUsageReached
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                            }`}>
                            {isExpired ? 'Expired' : isMaxUsageReached ? 'Full' : 'Active'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(coupon.expiryDate)}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setDetailDialog({ open: true, coupon })}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {detailDialog.open && detailDialog.coupon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setDetailDialog({ open: false, coupon: null })}>
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">Coupon Details</h3>
              <button
                onClick={() => setDetailDialog({ open: false, coupon: null })}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Coupon Code Header */}
              <div className="bg-blue-500 text-white rounded-lg p-6 text-center mb-6">
                <h2 className="text-3xl font-mono font-bold mb-3">{detailDialog.coupon.code}</h2>
                <div className="flex justify-center gap-2">
                  <span className="bg-white text-green-600 px-3 py-1 rounded-full text-sm font-semibold">
                    {detailDialog.coupon.discountValue}{detailDialog.coupon.discountType === 'percentage' ? '%' : ' ₹'} OFF
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${detailDialog.coupon.isActive ? 'bg-white text-green-600' : 'bg-white text-red-600'
                    }`}>
                    {detailDialog.coupon.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Discount Type</p>
                  <p className="font-semibold text-gray-800 capitalize">{detailDialog.coupon.discountType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Discount Value</p>
                  <p className="font-semibold text-gray-800">
                    {detailDialog.coupon.discountValue}{detailDialog.coupon.discountType === 'percentage' ? '%' : ' ₹'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Min Order Value</p>
                  <p className="font-semibold text-gray-800">₹{detailDialog.coupon.minOrderValue}</p>
                </div>
                {detailDialog.coupon.maxDiscountAmount && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Max Discount Amount</p>
                    <p className="font-semibold text-gray-800">₹{detailDialog.coupon.maxDiscountAmount}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Usage Statistics</p>
                  <p className="font-semibold text-gray-800 mb-2">
                    {detailDialog.coupon.usageCount} / {detailDialog.coupon.maxUsage || 'Unlimited'} times
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${detailDialog.coupon.maxUsage ? ((detailDialog.coupon.usageCount / detailDialog.coupon.maxUsage) * 100 > 80 ? 'bg-red-600' : 'bg-blue-600') : 'bg-gray-400'}`}
                      style={{ width: detailDialog.coupon.maxUsage ? `${(detailDialog.coupon.usageCount / detailDialog.coupon.maxUsage) * 100}%` : '100%' }}
                    ></div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Expiry Date</p>
                  <p className="font-semibold text-gray-800">{formatDate(detailDialog.coupon.expiryDate)}</p>
                  {new Date(detailDialog.coupon.expiryDate) < new Date() && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded">Expired</span>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Created Date</p>
                  <p className="font-semibold text-gray-800">{formatDate(detailDialog.coupon.createdAt)}</p>
                </div>
              </div>

              {detailDialog.coupon.description && (
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-1">Description</p>
                  <p className="text-gray-700 italic">"{detailDialog.coupon.description}"</p>
                </div>
              )}

              {/* Usage History */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={20} className="text-gray-700" />
                  <h4 className="text-lg font-semibold text-gray-800">Usage History</h4>
                </div>

                {detailDialog.coupon.usageHistory && detailDialog.coupon.usageHistory.length > 0 ? (
                  <>
                    <div className="overflow-x-auto border border-gray-200 rounded-lg mb-4">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-2 px-3 font-semibold text-gray-700">Date</th>
                            <th className="text-left py-2 px-3 font-semibold text-gray-700">Order ID</th>
                            <th className="text-left py-2 px-3 font-semibold text-gray-700">Customer</th>
                            <th className="text-right py-2 px-3 font-semibold text-gray-700">Order Value</th>
                            <th className="text-right py-2 px-3 font-semibold text-gray-700">Discount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailDialog.coupon.usageHistory.map((usage, index) => (
                            <tr key={index} className="border-t border-gray-100">
                              <td className="py-2 px-3">{formatDate(usage.date)}</td>
                              <td className="py-2 px-3 font-mono text-xs">{usage.orderId}</td>
                              <td className="py-2 px-3">{usage.customer}</td>
                              <td className="py-2 px-3 text-right">₹{usage.orderValue}</td>
                              <td className="py-2 px-3 text-right font-semibold text-green-600">-₹{usage.discountApplied}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Total Orders</p>
                          <p className="text-lg font-semibold text-gray-800">{detailDialog.coupon.usageHistory.length}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Total Order Value</p>
                          <p className="text-lg font-semibold text-gray-800">
                            ₹{detailDialog.coupon.usageHistory.reduce((sum, h) => sum + h.orderValue, 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Total Discount Given</p>
                          <p className="text-lg font-semibold text-red-600">
                            ₹{detailDialog.coupon.usageHistory.reduce((sum, h) => sum + h.discountApplied, 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <AlertCircle size={32} className="text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No usage history available yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setDetailDialog({ open: false, coupon: null })}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleCopyCode(detailDialog.coupon.code)}
                className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Copy size={16} />
                Copy Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snackbar */}
      {snackbar.open && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${snackbar.severity === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}>
            {snackbar.severity === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{snackbar.message}</span>
            <button
              onClick={() => setSnackbar({ ...snackbar, open: false })}
              className="ml-2 hover:opacity-80"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CouponsReport;