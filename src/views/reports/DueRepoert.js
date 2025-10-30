import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDues } from '../../redux/slices/duesSlice';
import { Search, TrendingUp, TrendingDown, DollarSign, Users, FileText, X, Calendar, Receipt, CreditCard } from 'lucide-react';

const DueReport = () => {
  const dispatch = useDispatch();
  const { dues, loading, error } = useSelector((state) => state.dues);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const restaurantId = localStorage.getItem('restaurantId');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      dispatch(fetchDues({ token }));
    }
  }, [dispatch]);

  // Group dues by customer with proper balance calculations
  const getCustomerDueSummary = () => {
    const summary = {};
    dues.forEach((due) => {
      const customerId = due.customer_id || due.customerId;
      if (!summary[customerId]) {
        summary[customerId] = {
          customerId,
          customerName: due.customerName || 'Unknown',
          totalDue: 0,
          totalPaid: 0,
          totalRemaining: 0,
          unpaidCount: 0,
          paidCount: 0,
          partiallyPaidCount: 0,
          dues: [],
        };
      }
      const total = parseFloat(due.total) || 0;
      const paidAmount = parseFloat(due.paidAmount) || 0;
      const remainingAmount = parseFloat(due.remainingAmount) || (total - paidAmount);

      summary[customerId].totalDue += total;
      summary[customerId].totalPaid += paidAmount;
      summary[customerId].totalRemaining += remainingAmount;
      summary[customerId].dues.push(due);

      if (due.status === 'paid' || remainingAmount <= 0) {
        summary[customerId].paidCount += 1;
      } else if (paidAmount > 0 && remainingAmount > 0) {
        summary[customerId].partiallyPaidCount += 1;
      } else {
        summary[customerId].unpaidCount += 1;
      }
    });
    return Object.values(summary);
  };

  const customerSummary = getCustomerDueSummary();

  const filteredCustomers = customerSummary.filter((customer) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      customer.customerName.toLowerCase().includes(searchLower) ||
      customer.customerId.toString().toLowerCase().includes(searchLower);

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'unpaid' && customer.totalRemaining > 0) ||
      (filterStatus === 'paid' && customer.totalRemaining === 0 && customer.totalPaid > 0) ||
      (filterStatus === 'partial' && customer.partiallyPaidCount > 0);

    return matchesSearch && matchesStatus;
  });

  const totalDuesAmount = customerSummary.reduce((sum, c) => sum + c.totalDue, 0);
  const totalPaidAmount = customerSummary.reduce((sum, c) => sum + c.totalPaid, 0);
  const totalRemainingAmount = customerSummary.reduce((sum, c) => sum + c.totalRemaining, 0);
  const customersWithOutstanding = customerSummary.filter((c) => c.totalRemaining > 0).length;

  const handleCustomerClick = (customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-theme-aware">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-secondary">Loading due reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-aware p-3 sm:p-6" style={{ color: "var(--cui-body-color)" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2 text-theme-aware">
            <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            <span className="hidden sm:inline">Customer Due Report</span>
            <span className="sm:hidden">Due Report</span>
          </h1>
          <p className="text-sm sm:text-base text-secondary mt-1">Comprehensive tracking of customer dues and payments</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="rounded-lg shadow p-4 sm:p-6 border-l-4 border-blue-500" style={{ backgroundColor: "var(--cui-card-bg)", color: "var(--cui-body-color)" }}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-secondary">Total Dues</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-theme-aware">₹{totalDuesAmount.toFixed(2)}</p>
                <p className="text-xs text-secondary mt-1">{customerSummary.length} customers</p>
              </div>
              <DollarSign className="w-8 h-8 sm:w-10 sm:h-10 text-primary  " />
            </div>
          </div>
          <div className="rounded-lg shadow p-4 sm:p-6 border-l-4 border-green-500" style={{ backgroundColor: "var(--cui-card-bg)", color: "var(--cui-body-color)" }}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-secondary">Total Paid</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">₹{totalPaidAmount.toFixed(2)}</p>
                <p className="text-xs text-secondary mt-1">
                  {totalDuesAmount > 0 ? ((totalPaidAmount / totalDuesAmount) * 100).toFixed(1) : 0}% collected
                </p>
              </div>
              <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
            </div>
          </div>
          <div className="rounded-lg shadow p-4 sm:p-6 border-l-4 border-red-500" style={{ backgroundColor: "var(--cui-card-bg)", color: "var(--cui-body-color)" }}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-secondary">Outstanding</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">₹{totalRemainingAmount.toFixed(2)}</p>
                <p className="text-xs text-secondary mt-1">{customersWithOutstanding} customers</p>
              </div>
              <TrendingDown className="w-8 h-8 sm:w-10 sm:h-10 text-red-500 " />
            </div>
          </div>
          <div className="rounded-lg shadow p-4 sm:p-6 border-l-4 border-orange-500" style={{ backgroundColor: "var(--cui-card-bg)", color: "var(--cui-body-color)" }}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-secondary">Collection Rate</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">
                  {totalDuesAmount > 0 ? ((totalPaidAmount / totalDuesAmount) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-xs text-secondary mt-1">Payment efficiency</p>
              </div>
              <Users className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500 " />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-lg shadow p-3 sm:p-4 mb-4 sm:mb-6" style={{ backgroundColor: "var(--cui-card-bg)", color: "var(--cui-body-color)" }}>
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Search by customer name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ backgroundColor: "var(--cui-input-bg)", color: "var(--cui-input-color)" }}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'all', label: 'All', color: 'blue' },
                { value: 'unpaid', label: 'Unpaid', color: 'red' },
                { value: 'partial', label: 'Partial', color: 'orange' },
                { value: 'paid', label: 'Paid', color: 'green' }
              ].map((status) => (
                <button
                  key={status.value}
                  onClick={() => setFilterStatus(status.value)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    filterStatus === status.value
                      ? `bg-${status.color}-600 text-white`
                      : 'bg-secondary text-theme-aware hover:bg-secondary'
                  }`}
                  style={
                    filterStatus === status.value
                      ? { backgroundColor:
                          status.color === 'blue' ? '#2563eb' :
                          status.color === 'red' ? '#dc2626' :
                          status.color === 'orange' ? '#ea580c' :
                          '#16a34a'
                        }
                      : { backgroundColor: "var(--cui-gray-200)", color: "var(--cui-body-color)" }
                  }
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg shadow overflow-hidden" style={{ backgroundColor: "var(--cui-card-bg)" }}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead style={{ backgroundColor: "var(--cui-gray-100)" }}>
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-secondary uppercase">Customer Name</th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-secondary uppercase">Total Due</th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-secondary uppercase">Amount Paid</th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-secondary uppercase">Remaining</th>
                  <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-secondary uppercase">Progress</th>
                  <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-secondary uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-3 sm:px-6 py-8 text-center text-secondary">
                      No customers found
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => {
                    const progressPercent = customer.totalDue > 0
                      ? ((customer.totalPaid / customer.totalDue) * 100).toFixed(1)
                      : 0;

                    return (
                      <tr
                        key={customer.customerId}
                        className="hover:bg-secondary cursor-pointer transition-colors"
                        style={{ color: "var(--cui-body-color)" }}
                        onClick={() => handleCustomerClick(customer)}
                      >
                        <td className="px-3 sm:px-6 py-4">
                          <div className="font-medium text-theme-aware text-sm sm:text-base">{customer.customerName}</div>
                          <div className="text-xs sm:text-sm text-secondary">
                            {customer.dues.length} transaction{customer.dues.length !== 1 ? 's' : ''}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-right font-medium text-theme-aware text-sm sm:text-base">
                          ₹{customer.totalDue.toFixed(2)}
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-right text-green-600 font-medium text-sm sm:text-base">
                          ₹{customer.totalPaid.toFixed(2)}
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-right">
                          <span className={`font-bold text-sm sm:text-base ${customer.totalRemaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ₹{customer.totalRemaining.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <div className="flex flex-col items-center">
                            <div className="w-full" style={{ backgroundColor: "var(--cui-gray-200)", borderRadius: '9999px', height: '8px', marginBottom: '0.25rem' }}>
                              <div
                                className={`h-2 rounded-full ${
                                  progressPercent >= 100 ? 'bg-green-500' :
                                  progressPercent >= 50 ? 'bg-orange-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(progressPercent, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-secondary font-medium">{progressPercent}%</span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-center">
                          {customer.totalRemaining === 0 && customer.totalPaid > 0 ? (
                            <span className="px-2 sm:px-3 py-1 inline-flex text-xs font-semibold rounded-full" style={{ backgroundColor: "var(--cui-gray-200)", color: "#059669" }}>
                              <span className="hidden sm:inline">Fully Paid</span>
                              <span className="sm:hidden">Paid</span>
                            </span>
                          ) : customer.totalPaid > 0 && customer.totalRemaining > 0 ? (
                            <span className="px-2 sm:px-3 py-1 inline-flex text-xs font-semibold rounded-full" style={{ backgroundColor: "var(--cui-gray-200)", color: "#ea580c" }}>
                              Partial
                            </span>
                          ) : (
                            <span className="px-2 sm:px-3 py-1 inline-flex text-xs font-semibold rounded-full" style={{ backgroundColor: "var(--cui-gray-200)", color: "#dc2626" }}>
                              Unpaid
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 sm:mt-6 rounded-lg p-3 sm:p-4" style={{ backgroundColor: "var(--cui-secondary-bg)", border: "1px solid var(--cui-border-color)" }}>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
            <p className="text-xs sm:text-sm text-primary text-center sm:text-left">
              Showing <span className="font-semibold">{filteredCustomers.length}</span> of{' '}
              <span className="font-semibold">{customerSummary.length}</span> customers
            </p>
            <div className="flex gap-4 sm:gap-6 justify-center sm:justify-end">
              <div className="text-center">
                <p className="text-xs text-primary mb-1">Avg Due per Customer</p>
                <p className="text-sm sm:text-lg font-bold text-theme-aware">
                  ₹{customerSummary.length > 0 ? (totalDuesAmount / customerSummary.length).toFixed(2) : 0}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-primary mb-1">Avg Outstanding</p>
                <p className="text-sm sm:text-lg font-bold text-theme-aware">
                  ₹{customerSummary.length > 0 ? (totalRemainingAmount / customerSummary.length).toFixed(2) : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal for Customer Dues Details */}
        {isModalOpen && selectedCustomer && (
          <div style={{ background: "rgba(0,0,0,0.5)" }} className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="rounded-lg shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col" style={{ backgroundColor: "var(--cui-card-bg)", color: "var(--cui-body-color)" }}>
              {/* Modal Header */}
              <div className="from-primary to-blue-700 text-theme-aware px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{selectedCustomer.customerName}</h2>
                  <p className="text-blue-100 text-xs sm:text-sm mt-1">
                    Customer ID: {selectedCustomer.customerId?.toString().slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-white hover:bg-blue-800 rounded-full p-2 transition-colors   ml-2"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* Modal Summary */}
              <div className=" from-blue-50 to-blue-100 px-3 sm:px-6 py-3 sm:py-4 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 border-b">
                <div className="text-center">
                  <p className="text-xs text-gray-600 uppercase mb-1">Total Due</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">₹{selectedCustomer.totalDue.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 uppercase mb-1">Amount Paid</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">₹{selectedCustomer.totalPaid.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 uppercase mb-1">Remaining</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">₹{selectedCustomer.totalRemaining.toFixed(2)}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="px-3 sm:px-6 py-3 bg-gray-50 border-b">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Payment Progress</span>
                  <span className="text-xs sm:text-sm font-bold text-gray-900">
                    {selectedCustomer.totalDue > 0 
                      ? ((selectedCustomer.totalPaid / selectedCustomer.totalDue) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                  <div
                    className=" from-green-500 to-green-600 h-2 sm:h-3 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        (selectedCustomer.totalPaid / selectedCustomer.totalDue) * 100,
                        100
                      )}%`
                    }}
                  ></div>
                </div>
              </div>

              {/* Modal Body - Dues List */}
              <div className="overflow-y-auto flex-1 p-3 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  All Transactions ({selectedCustomer.dues.length})
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {selectedCustomer.dues.map((due, index) => {
                    const total = parseFloat(due.total) || 0;
                    const paid = parseFloat(due.paidAmount) || 0;
                    const remaining = parseFloat(due.remainingAmount) || (total - paid);
                    const progress = total > 0 ? ((paid / total) * 100).toFixed(1) : 0;

                    return (
                      <div
                        key={due._id || due.id || index}
                        className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow bg-white"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                              <span className="font-semibold text-gray-900 text-sm sm:text-base">
                                Due #{(due._id || due.id)?.toString().slice(0, 8).toUpperCase()}
                              </span>
                              {remaining <= 0 ? (
                                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800 w-fit">
                                  Paid
                                </span>
                              ) : paid > 0 ? (
                                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 w-fit">
                                  Partial
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800 w-fit">
                                  Unpaid
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-2">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>{formatDate(due.createdAt || due.created_at || due.date)}</span>
                            </div>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                            <p className="text-lg sm:text-xl font-bold text-gray-900">₹{total.toFixed(2)}</p>
                          </div>
                        </div>

                        {/* Payment Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 p-2 sm:p-3 bg-gray-50 rounded">
                          <div>
                            <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              Paid Amount
                            </p>
                            <p className="text-base sm:text-lg font-bold text-green-600">₹{paid.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Remaining</p>
                            <p className={`text-base sm:text-lg font-bold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              ₹{remaining.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div>
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Payment Progress</span>
                            <span className="font-semibold">{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                            <div
                              className={`h-1.5 sm:h-2 rounded-full ${
                                progress >= 100 ? 'bg-green-500' :
                                progress >= 50 ? 'bg-orange-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        {due.notes && (
                          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">Notes</p>
                            <p className="text-xs sm:text-sm text-gray-700">{due.notes}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-3 sm:px-6 py-3 sm:py-4 border-t flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="text-xs sm:text-sm text-gray-600 flex flex-wrap gap-2 sm:gap-4">
                  {selectedCustomer.unpaidCount > 0 && (
                    <span>
                      <span className="font-semibold text-red-600">{selectedCustomer.unpaidCount}</span> Unpaid
                    </span>
                  )}
                  {selectedCustomer.partiallyPaidCount > 0 && (
                    <span>
                      <span className="font-semibold text-orange-600">{selectedCustomer.partiallyPaidCount}</span> Partial
                    </span>
                  )}
                  {selectedCustomer.paidCount > 0 && (
                    <span>
                      <span className="font-semibold text-green-600">{selectedCustomer.paidCount}</span> Paid
                    </span>
                  )}
                </div>
                <button
                  onClick={closeModal}
                  className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base w-full sm:w-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DueReport;