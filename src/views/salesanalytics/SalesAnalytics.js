// import React, { useState, useEffect, useMemo } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { LineChart, PieChart, BarChart } from "@mui/x-charts";
// import {
//   Box,
//   Typography,
//   Paper,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   TablePagination,
//   Button,
//   Stack,
//   Chip,
//   useTheme,
//   Grid,
//   TextField,
//   FormControl,
//   InputLabel,
//   Select,
//   MenuItem,
//   Card,
//   CardContent,
//   Alert,
//   CircularProgress,
//   Collapse,
//   IconButton,
//   Divider,
// } from "@mui/material";
// import {
//   Search as SearchIcon,
//   TrendingUp,
//   TrendingDown,
//   Receipt,
//   ChevronUp as ExpandMore,
//   ChevronDown as ExpandLess,
//   Users,
//   DollarSign,
//   Target,
//   BarChart3,
//   PieChart as PieChartIcon
// } from 'lucide-react';
// import { jsPDF } from "jspdf";
// import "jspdf-autotable";

// // Import Redux slices
// import { fetchOrders } from '../../redux/slices/orderSlice';
// import { fetchCustomers } from '../../redux/slices/customerSlice';
// import { fetchMenuItems } from '../../redux/slices/menuSlice';
// import { fetchInventories } from '../../redux/slices/stockSlice';

// export default function SalesAnalytics() {
//   const dispatch = useDispatch();
//   const theme = useTheme();

//   // ✅ Fixed Redux selectors with proper fallbacks
//   const orders = useSelector((state) => state.orders?.orders || []);
//   const ordersLoading = useSelector((state) => state.orders?.loading || false);

//   const customers = useSelector((state) => state.customers?.customers || []);
//   const customersLoading = useSelector((state) => state.customers?.loading || false);

//   const menuItems = useSelector((state) => state.menuItems?.menuItems || []);
//   const menuItemsLoading = useSelector((state) => state.menuItems?.loading || false);

//   const inventories = useSelector((state) => state.inventories?.inventories || []);
//   const inventoriesLoading = useSelector((state) => state.inventories?.loading || false);

//   // ✅ Use React state instead of localStorage
//   const [restaurantId, setRestaurantId] = useState(null);
//   const [token, setToken] = useState(null);
//   const [salesData, setSalesData] = useState([]);
//   const [menuPerformanceData, setMenuPerformanceData] = useState([]);
//   const [customerAnalyticsData, setCustomerAnalyticsData] = useState([]);

//   const [page, setPage] = useState(0);
//   const [rowsPerPage, setRowsPerPage] = useState(10);
//   const [startDate, setStartDate] = useState('');
//   const [endDate, setEndDate] = useState('');
//   const [categoryFilter, setCategoryFilter] = useState('');
//   const [statusFilter, setStatusFilter] = useState('');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [viewMode, setViewMode] = useState('menu');
//   const [expandedRows, setExpandedRows] = useState(new Set());
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   // Initialize restaurantId and token from localStorage (only once on mount)
//   useEffect(() => {
//     try {
//       const storedRestaurantId = localStorage.getItem('restaurantId');
//       const storedToken = localStorage.getItem('authToken');
//       setRestaurantId(storedRestaurantId);
//       setToken(storedToken);
//     } catch (err) {
//       console.error('Error accessing localStorage:', err);
//       setError('Failed to load authentication data');
//     }
//   }, []);

//   // Fetch data when restaurantId and token are available
//   useEffect(() => {
//     const fetchData = async () => {
//       if (!restaurantId || !token) {
//         setError('Restaurant ID or token not found');
//         return;
//       }

//       try {
//         setLoading(true);
//         setError(null);

//         await Promise.all([
//           dispatch(fetchOrders({ restaurantId, token })),
//           dispatch(fetchCustomers({ restaurantId, token })),
//           dispatch(fetchMenuItems({ restaurantId, token })),
//           dispatch(fetchInventories({ token }))
//         ]);
//       } catch (err) {
//         console.error('Error fetching data:', err);
//         setError('Failed to fetch data from server');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [restaurantId, token, dispatch]);

//   // ✅ Transform sales data with proper validation
//   useEffect(() => {
//     if (!Array.isArray(orders) || orders.length === 0) {
//       setSalesData([]);
//       return;
//     }

//     try {
//       const transformedSalesData = orders
//         .filter(order => order && order._id)
//         .map((order) => {
//           const orderDate = new Date(order.createdAt || new Date());
//           const items = Array.isArray(order.items) ? order.items : [];

//           const subtotal = items.reduce((sum, item) => {
//             const price = Number(item.price) || 0;
//             const quantity = Number(item.quantity) || 0;
//             return sum + (price * quantity);
//           }, 0);

//           const tax = Number(order.tax) || (subtotal * 0.18);
//           const discount = Number(order.discount) || 0;
//           const totalAmount = subtotal + tax - discount;

//           // Calculate cost based on menu items
//           const totalCost = items.reduce((sum, item) => {
//             const menuItem = menuItems.find(m => 
//               String(m._id) === String(item.menuItemId || item.itemId)
//             );

//             let itemCost = 0;
//             if (menuItem) {
//               // Calculate cost from ingredients if available
//               if (menuItem.stockItems && Array.isArray(menuItem.stockItems) && menuItem.stockItems.length > 0) {
//                 itemCost = menuItem.stockItems.reduce((cost, stockItem) => {
//                   const inventoryItem = inventories.find(inv => 
//                     String(inv._id) === String(stockItem.stockId)
//                   );

//                   if (inventoryItem && inventoryItem.stock) {
//                     const rate = Number(inventoryItem.stock.amount) || 0;
//                     const qty = Number(stockItem.quantity) || 0;
//                     const unit = (stockItem.unit || '').toLowerCase();

//                     let ratePerUnit = rate;
//                     if (unit === 'gm' || unit === 'gram') {
//                       ratePerUnit = rate / 1000;
//                     } else if (unit === 'ml' || unit === 'milliliter') {
//                       ratePerUnit = rate / 1000;
//                     }

//                     return cost + (ratePerUnit * qty);
//                   }
//                   return cost;
//                 }, 0);
//               }

//               // Fallback to costPrice or 40% of selling price
//               if (itemCost === 0) {
//                 itemCost = Number(menuItem.costPrice) || (Number(menuItem.price) * 0.4) || 0;
//               }
//             } else {
//               // If menu item not found, use 40% of item price
//               itemCost = (Number(item.price) || 0) * 0.4;
//             }

//             return sum + (itemCost * (Number(item.quantity) || 0));
//           }, 0);

//           const profit = totalAmount - totalCost;
//           const profitMargin = totalAmount > 0 ? ((profit / totalAmount) * 100) : 0;

//           return {
//             id: order._id,
//             orderId: order.orderId || order._id.slice(-6),
//             customerName: order.customer?.name || order.customerName || 'Walk-in Customer',
//             customerId: order.customerId,
//             orderDate: orderDate.toISOString().split('T')[0],
//             orderTime: orderDate.toTimeString().slice(0, 5),
//             items: items.map(item => ({
//               name: item.name || item.itemName || 'Unknown Item',
//               quantity: Number(item.quantity) || 0,
//               price: Number(item.price) || 0,
//               total: (Number(item.price) || 0) * (Number(item.quantity) || 0),
//               category: item.categoryName || 'General',
//               menuItemId: item.itemId || item.menuItemId,
//             })),
//             itemsCount: items.length,
//             subtotal: subtotal.toFixed(2),
//             tax: tax.toFixed(2),
//             discount: discount.toFixed(2),
//             totalAmount: totalAmount.toFixed(2),
//             totalCost: totalCost.toFixed(2),
//             profit: profit.toFixed(2),
//             profitMargin: profitMargin.toFixed(2),
//             status: order.status || 'pending',
//             paymentMethod: order.paymentMethod || 'cash',
//             orderType: order.orderType || 'dine-in',
//             waiterId: order.waiterId,
//             tableNumber: order.tableNumber,
//             createdAt: order.createdAt,
//             completedAt: order.completedAt
//           };
//         })
//         .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

//       setSalesData(transformedSalesData);
//     } catch (error) {
//       console.error('Error transforming sales data:', error);
//       setError('Error processing sales data');
//     }
//   }, [orders, menuItems, inventories]);

//   // ✅ Transform menu performance data with better validation
//   useEffect(() => {
//     if (!Array.isArray(menuItems) || menuItems.length === 0 || 
//         !Array.isArray(inventories) || !Array.isArray(salesData)) {
//       setMenuPerformanceData([]);
//       return;
//     }

//     try {
//       const menuPerformance = {};

//       // First, aggregate actual sales data from orders
//       salesData.forEach(order => {
//         if (Array.isArray(order.items)) {
//           order.items.forEach(item => {
//             const key = `${item.menuItemId}_${item.name}`;

//             if (!menuPerformance[key]) {
//               menuPerformance[key] = {
//                 menuItemId: item.menuItemId,
//                 itemName: item.name,
//                 totalQuantitySold: 0,
//                 totalRevenue: 0,
//                 orderCount: 0,
//                 category: item.category || 'General'
//               };
//             }

//             menuPerformance[key].totalQuantitySold += Number(item.quantity) || 0;
//             menuPerformance[key].totalRevenue += Number(item.total) || 0;
//             menuPerformance[key].orderCount += 1;
//           });
//         }
//       });

//       // Now enrich with menu item details and calculate costs
//       const enrichedPerformance = [];

//       Object.values(menuPerformance).forEach(perfItem => {
//         const menuItem = menuItems.find(m => 
//           String(m._id) === String(perfItem.menuItemId) ||
//           m.itemName === perfItem.itemName
//         );

//         if (!menuItem || menuItem.status === 0) return;

//         const basePrice = Number(menuItem.price) || 0;

//         // Calculate cost from ingredients
//         let itemCost = 0;
//         if (menuItem.stockItems && Array.isArray(menuItem.stockItems) && menuItem.stockItems.length > 0) {
//           itemCost = menuItem.stockItems.reduce((totalCost, stockItem) => {
//             const inventoryItem = inventories.find(inv => 
//               String(inv._id) === String(stockItem.stockId)
//             );

//             if (inventoryItem && inventoryItem.stock) {
//               const rate = Number(inventoryItem.stock.amount) || 0;
//               const qty = Number(stockItem.quantity) || 0;
//               const unit = (stockItem.unit || inventoryItem.unit || '').toLowerCase();

//               let ratePerUnit = rate;
//               if (unit === 'kg' || unit === 'kilogram') {
//                 ratePerUnit = rate;
//               } else if (unit === 'gm' || unit === 'gram') {
//                 ratePerUnit = rate / 1000;
//               } else if (unit === 'litre' || unit === 'liter' || unit === 'ltr') {
//                 ratePerUnit = rate;
//               } else if (unit === 'ml' || unit === 'milliliter') {
//                 ratePerUnit = rate / 1000;
//               } else if (unit === 'pcs' || unit === 'pieces') {
//                 ratePerUnit = rate;
//               }

//               return totalCost + (ratePerUnit * qty);
//             }
//             return totalCost;
//           }, 0);
//         }

//         // Fallback to costPrice or 40% of selling price
//         if (itemCost === 0) {
//           itemCost = Number(menuItem.costPrice) || (basePrice * 0.4);
//         }

//         const averagePrice = perfItem.totalQuantitySold > 0 
//           ? perfItem.totalRevenue / perfItem.totalQuantitySold 
//           : basePrice;

//         const totalCostForSales = itemCost * perfItem.totalQuantitySold;
//         const profit = perfItem.totalRevenue - totalCostForSales;
//         const profitMargin = perfItem.totalRevenue > 0 
//           ? ((profit / perfItem.totalRevenue) * 100) 
//           : 0;

//         // Handle sizes if they exist
//         if (menuItem.sizes && Array.isArray(menuItem.sizes) && menuItem.sizes.length > 0) {
//           menuItem.sizes.forEach(size => {
//             const sizeName = size.name || size.label || 'Regular';
//             const sizePrice = Number(size.price) || basePrice;

//             enrichedPerformance.push({
//               id: `${menuItem._id}_${sizeName}`,
//               itemName: perfItem.itemName,
//               sizeName: sizeName,
//               menuId: menuItem.menuId || menuItem._id,
//               category: perfItem.category,
//               totalQuantity: perfItem.totalQuantitySold,
//               totalRevenue: perfItem.totalRevenue,
//               totalCost: totalCostForSales,
//               orderCount: perfItem.orderCount,
//               averagePrice: averagePrice,
//               averageCostPrice: itemCost.toFixed(2),
//               profit: profit,
//               profitMargin: profitMargin.toFixed(1),
//               menuItem: menuItem,
//               sizeInfo: size
//             });
//           });
//         } else {
//           enrichedPerformance.push({
//             id: menuItem._id,
//             itemName: perfItem.itemName,
//             sizeName: 'Regular',
//             menuId: menuItem.menuId || menuItem._id,
//             category: perfItem.category,
//             totalQuantity: perfItem.totalQuantitySold,
//             totalRevenue: perfItem.totalRevenue,
//             totalCost: totalCostForSales,
//             orderCount: perfItem.orderCount,
//             averagePrice: averagePrice,
//             averageCostPrice: itemCost.toFixed(2),
//             profit: profit,
//             profitMargin: profitMargin.toFixed(1),
//             menuItem: menuItem
//           });
//         }
//       });

//       // Sort by revenue (highest first)
//       const sortedPerformance = enrichedPerformance.sort((a, b) => b.totalRevenue - a.totalRevenue);
//       setMenuPerformanceData(sortedPerformance);
//     } catch (error) {
//       console.error('Error transforming menu performance data:', error);
//       setError('Menu performance data processing failed');
//     }
//   }, [menuItems, inventories, salesData]);

//   // Transform customer analytics data
//   useEffect(() => {
//     if (!Array.isArray(salesData) || salesData.length === 0) {
//       setCustomerAnalyticsData([]);
//       return;
//     }

//     try {
//       const customerAnalytics = {};

//       salesData.forEach(order => {
//         const customerId = order.customerId || order.customerName;
//         if (!customerAnalytics[customerId]) {
//           customerAnalytics[customerId] = {
//             customerId: customerId,
//             customerName: order.customerName,
//             totalOrders: 0,
//             totalSpent: 0,
//             averageOrderValue: 0,
//             lastOrderDate: order.orderDate,
//             favoriteItems: {},
//             orderFrequency: 0
//           };
//         }

//         customerAnalytics[customerId].totalOrders += 1;
//         customerAnalytics[customerId].totalSpent += parseFloat(order.totalAmount) || 0;

//         if (new Date(order.orderDate) > new Date(customerAnalytics[customerId].lastOrderDate)) {
//           customerAnalytics[customerId].lastOrderDate = order.orderDate;
//         }

//         if (Array.isArray(order.items)) {
//           order.items.forEach(item => {
//             const itemName = item.name || 'Unknown';
//             if (!customerAnalytics[customerId].favoriteItems[itemName]) {
//               customerAnalytics[customerId].favoriteItems[itemName] = 0;
//             }
//             customerAnalytics[customerId].favoriteItems[itemName] += item.quantity || 0;
//           });
//         }
//       });

//       const customerAnalyticsArray = Object.values(customerAnalytics).map(customer => {
//         customer.averageOrderValue = customer.totalOrders > 0 
//           ? (customer.totalSpent / customer.totalOrders).toFixed(2)
//           : '0.00';

//         const favoriteItemEntry = Object.entries(customer.favoriteItems)
//           .sort(([, a], [, b]) => b - a)[0];
//         customer.favoriteItem = favoriteItemEntry ? favoriteItemEntry[0] : 'None';

//         const customerOrders = salesData.filter(order => 
//           (order.customerId || order.customerName) === customer.customerId
//         );

//         if (customerOrders.length > 0) {
//           const firstOrder = Math.min(...customerOrders.map(order => 
//             new Date(order.orderDate).getTime()
//           ));
//           const daysSinceFirstOrder = (Date.now() - firstOrder) / (1000 * 60 * 60 * 24);
//           customer.orderFrequency = daysSinceFirstOrder > 30
//             ? (customer.totalOrders / (daysSinceFirstOrder / 30)).toFixed(1)
//             : customer.totalOrders.toString();
//         }

//         return customer;
//       }).sort((a, b) => b.totalSpent - a.totalSpent);

//       setCustomerAnalyticsData(customerAnalyticsArray);
//     } catch (error) {
//       console.error('Error transforming customer analytics data:', error);
//     }
//   }, [salesData]);

//   const getSummaryData = () => {
//     if (viewMode === 'sales') {
//       const totalRevenue = filteredData.reduce((sum, order) => 
//         sum + (parseFloat(order.totalAmount) || 0), 0
//       );
//       const totalOrders = filteredData.length;
//       const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
//       const totalProfit = filteredData.reduce((sum, order) => 
//         sum + (parseFloat(order.profit) || 0), 0
//       );

//       return {
//         main: totalRevenue,
//         mainLabel: 'Total Revenue',
//         secondary: totalOrders,
//         secondaryLabel: 'Total Orders',
//         third: averageOrderValue,
//         thirdLabel: 'Avg Order Value',
//         fourth: totalProfit,
//         fourthLabel: 'Total Profit'
//       };
//     } else if (viewMode === 'menu') {
//       const totalRevenue = filteredData.reduce((sum, item) => 
//         sum + (Number(item.totalRevenue) || 0), 0
//       );
//       const totalItemsSold = filteredData.reduce((sum, item) => 
//         sum + (Number(item.totalQuantity) || 0), 0
//       );
//       const totalProfit = filteredData.reduce((sum, item) => 
//         sum + (Number(item.profit) || 0), 0
//       );
//       const topPerformer = filteredData.length > 0 ? filteredData[0] : { itemName: 'N/A' };

//       return {
//         main: totalRevenue,
//         mainLabel: 'Menu Revenue',
//         secondary: totalItemsSold,
//         secondaryLabel: 'Items Sold',
//         third: totalProfit,
//         thirdLabel: 'Total Profit',
//         fourth: topPerformer.itemName,
//         fourthLabel: 'Top Item (by revenue)'
//       };
//     } else {
//       const totalCustomers = filteredData.length;
//       const totalRevenue = filteredData.reduce((sum, customer) => 
//         sum + (Number(customer.totalSpent) || 0), 0
//       );
//       const averageSpending = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
//       const loyalCustomers = filteredData.filter(customer => 
//         (Number(customer.totalOrders) || 0) > 5
//       ).length;

//       return {
//         main: totalRevenue,
//         mainLabel: 'Customer Revenue',
//         secondary: totalCustomers,
//         secondaryLabel: 'Total Customers',
//         third: averageSpending,
//         thirdLabel: 'Avg Customer Value',
//         fourth: loyalCustomers,
//         fourthLabel: 'Loyal Customers'
//       };
//     }
//   };

//   const getCurrentData = () => {
//     switch (viewMode) {
//       case 'sales':
//         return salesData;
//       case 'menu':
//         return menuPerformanceData;
//       case 'customers':
//         return customerAnalyticsData;
//       default:
//         return salesData;
//     }
//   };

//   const currentData = getCurrentData();

//   const filteredData = useMemo(() => {
//     return currentData.filter(item => {
//       if (!item) return false;

//       let matchesDate = true;
//       if (startDate || endDate) {
//         const itemDate = new Date(viewMode === 'customers' ? item.lastOrderDate : item.orderDate);
//         if (startDate) matchesDate = matchesDate && itemDate >= new Date(startDate);
//         if (endDate) matchesDate = matchesDate && itemDate <= new Date(endDate);
//       }

//       const matchesCategory = !categoryFilter ||
//         (viewMode === 'sales' && Array.isArray(item.items) && 
//          item.items.some(orderItem => orderItem.category === categoryFilter)) ||
//         (viewMode === 'menu' && item.category === categoryFilter);

//       const matchesStatus = !statusFilter || (viewMode === 'sales' && item.status === statusFilter);

//       let matchesSearch = true;
//       if (searchQuery) {
//         const query = searchQuery.toLowerCase();
//         if (viewMode === 'sales') {
//           matchesSearch = (item.orderId?.toLowerCase() || '').includes(query) ||
//             (item.customerName?.toLowerCase() || '').includes(query) ||
//             (Array.isArray(item.items) && item.items.some(orderItem => 
//               (orderItem.name?.toLowerCase() || '').includes(query)
//             ));
//         } else if (viewMode === 'menu') {
//           matchesSearch = (item.itemName?.toLowerCase() || '').includes(query) ||
//             (item.category?.toLowerCase() || '').includes(query);
//         } else {
//           matchesSearch = (item.customerName?.toLowerCase() || '').includes(query) ||
//             (item.favoriteItem?.toLowerCase() || '').includes(query);
//         }
//       }

//       return matchesDate && matchesCategory && matchesStatus && matchesSearch;
//     });
//   }, [currentData, startDate, endDate, categoryFilter, statusFilter, searchQuery, viewMode]);

//   const handleChangePage = (event, newPage) => {
//     setPage(newPage);
//   };

//   const handleChangeRowsPerPage = (event) => {
//     setRowsPerPage(parseInt(event.target.value, 10));
//     setPage(0);
//   };

//   const handleExpandRow = (id) => {
//     const newExpanded = new Set(expandedRows);
//     if (newExpanded.has(id)) {
//       newExpanded.delete(id);
//     } else {
//       newExpanded.add(id);
//     }
//     setExpandedRows(newExpanded);
//   };

//   const exportCSV = () => {
//     let csvRows = [];
//     let fileName = `analytics-${new Date().toISOString().split('T')[0]}.csv`;

//     switch (viewMode) {
//       case 'sales':
//         csvRows = [
//           ["Order ID", "Customer", "Date", "Time", "Items", "Subtotal", "Tax", "Total", "Profit", "Status", "Payment Method"],
//           ...filteredData.map(o => [
//             o.orderId, o.customerName, o.orderDate, o.orderTime, o.itemsCount, 
//             o.subtotal, o.tax, o.totalAmount, o.profit, o.status, o.paymentMethod
//           ])
//         ];
//         fileName = `sales-${fileName}`;
//         break;
//       case 'menu':
//         csvRows = [
//           ["Menu Item", "Menu ID", "Size", "Cost Price (CP)", "Sold Price (SP)", "Profit", "Profit Percentage (%)", "Total Quantity", "Total Revenue"],
//           ...filteredData.map(item => [
//             item.itemName, 
//             item.menuId || '',
//             item.sizeName || 'Regular',
//             item.averageCostPrice || item.totalCost.toFixed(2), 
//             item.averagePrice, 
//             item.profit, 
//             item.profitMargin,
//             item.totalQuantity,
//             item.totalRevenue
//           ])
//         ];
//         fileName = `menu-performance-${fileName}`;
//         break;
//       case 'customers':
//         csvRows = [
//           ["Customer Name", "Total Orders", "Total Spent", "Avg Order Value", "Last Order", "Favorite Item", "Order Frequency (/month)"],
//           ...filteredData.map(c => [
//             c.customerName, c.totalOrders, c.totalSpent, c.averageOrderValue, 
//             c.lastOrderDate, c.favoriteItem, c.orderFrequency
//           ])
//         ];
//         fileName = `customers-${fileName}`;
//         break;
//       default:
//         return;
//     }

//     const csvContent = "data:text/csv;charset=utf-8," + 
//       csvRows.map(e => e.join(",")).join("\n");
//     const link = document.createElement("a");
//     link.href = encodeURI(csvContent);
//     link.download = fileName;
//     link.click();
//   };

//   const exportPDF = () => {
//     const doc = new jsPDF('landscape');

//     doc.setFontSize(16);
//     doc.text(`${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} Analytics Report`, 14, 20);

//     if (viewMode === 'sales') {
//       doc.autoTable({
//         startY: 30,
//         head: [["Order ID", "Customer", "Date", "Total", "Profit", "Status"]],
//         body: filteredData.slice(0, 50).map(o => [
//           o.orderId, o.customerName, o.orderDate, 
//           `₹${o.totalAmount}`, `₹${o.profit}`, o.status
//         ]),
//         styles: { fontSize: 8 },
//       });
//     } else if (viewMode === 'menu') {
//       doc.autoTable({
//         startY: 30,
//         head: [["Menu Item", "Size", "Cost Price (CP)", "Sold Price (SP)", "Profit", "Profit Percentage (%)"]],
//         body: filteredData.slice(0, 50).map(item => [
//           item.itemName, 
//           item.sizeName || 'Regular',
//           `₹${item.averageCostPrice || item.totalCost.toFixed(2)}`, 
//           `₹${item.averagePrice}`, 
//           `₹${item.profit}`, 
//           `${item.profitMargin}%`
//         ]),
//         styles: { fontSize: 8 },
//       });
//     } else {
//       doc.autoTable({
//         startY: 30,
//         head: [["Customer", "Orders", "Total Spent", "Avg Order", "Last Order"]],
//         body: filteredData.slice(0, 50).map(c => [
//           c.customerName, c.totalOrders, 
//           `₹${c.totalSpent.toFixed(2)}`, 
//           `₹${c.averageOrderValue}`, c.lastOrderDate
//         ]),
//         styles: { fontSize: 8 },
//       });
//     }

//     doc.save(`${viewMode}-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
//   };

//   const getStatusColor = (status) => {
//     switch (status?.toLowerCase()) {
//       case 'completed': return 'success';
//       case 'pending': return 'warning';
//       case 'cancelled': return 'error';
//       default: return 'default';
//     }
//   };

//   const availableStatuses = Array.from(new Set(
//     salesData.map(order => order.status).filter(Boolean)
//   ));

//   const isLoading = loading || ordersLoading || customersLoading || 
//                     menuItemsLoading || inventoriesLoading;

//   if (isLoading) {
//     return (
//       <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
//         <CircularProgress />
//         <Typography sx={{ ml: 2 }}>Loading sales data...</Typography>
//       </Box>
//     );
//   }

//   if (error) {
//     return (
//       <Box sx={{ p: 3 }}>
//         <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
//         <Button variant="contained" onClick={() => window.location.reload()}>Retry</Button>
//       </Box>
//     );
//   }

//   const summaryData = getSummaryData();

//   return (
//     <Box sx={{ p: 3 }}>
//       <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
//         Sales Analytics Dashboard
//       </Typography>

//       <Paper sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: 3 }}>
//         <Grid container spacing={2} alignItems="center">
//           <Grid item xs={12} sm={12} md={3}>
//             <Typography variant="h6" sx={{ 
//               textAlign: { xs: 'center', sm: 'center', md: 'left' },
//               mb: { xs: 1, sm: 1, md: 0 }
//             }}>
//               View Mode:
//             </Typography>
//           </Grid>
//           <Grid item xs={12} sm={12} md={9}>
//             <Stack 
//               direction={{ xs: 'column', sm: 'row' }} 
//               spacing={2} 
//               alignItems="center"
//               sx={{ 
//                 width: '100%',
//                 justifyContent: { xs: 'center', sm: 'flex-start' }
//               }}
//             >
//               <Button 
//                 variant={viewMode === 'menu' ? 'contained' : 'outlined'} 
//                 startIcon={<BarChart3 />} 
//                 onClick={() => setViewMode('menu')}
//                 sx={{ 
//                   minWidth: { xs: '100%', sm: 'auto' },
//                   fontSize: { xs: '0.875rem', sm: '0.875rem' },
//                   py: { xs: 1.5, sm: 1 },
//                   width: { xs: '100%', sm: 'auto' }
//                 }}
//               >
//                 Menu Performance
//               </Button>
//             </Stack>
//           </Grid>
//         </Grid>
//       </Paper>

//       <Grid container spacing={3} sx={{ mb: 3 }}>
//         <Grid item xs={12} sm={6} md={3}>
//           <Card sx={{ borderRadius: 3, boxShadow: 3, height: '100%' }}>
//             <CardContent>
//               <Stack direction="row" alignItems="center" spacing={2}>
//                 <DollarSign />
//                 <Box>
//                   <Typography variant="h5">
//                     ₹{summaryData.main.toLocaleString(undefined, { 
//                       minimumFractionDigits: 2, 
//                       maximumFractionDigits: 2 
//                     })}
//                   </Typography>
//                   <Typography color="text.secondary">{summaryData.mainLabel}</Typography>
//                 </Box>
//               </Stack>
//             </CardContent>
//           </Card>
//         </Grid>
//         <Grid item xs={12} sm={6} md={3}>
//           <Card sx={{ borderRadius: 3, boxShadow: 3, height: '100%' }}>
//             <CardContent>
//               <Stack direction="row" alignItems="center" spacing={2}>
//                 <Target />
//                 <Box>
//                   <Typography variant="h5">{summaryData.secondary.toLocaleString()}</Typography>
//                   <Typography color="text.secondary">{summaryData.secondaryLabel}</Typography>
//                 </Box>
//               </Stack>
//             </CardContent>
//           </Card>
//         </Grid>
//         <Grid item xs={12} sm={6} md={3}>
//           <Card sx={{ borderRadius: 3, boxShadow: 3, height: '100%' }}>
//             <CardContent>
//               <Stack direction="row" alignItems="center" spacing={2}>
//                 <TrendingUp />
//                 <Box>
//                   <Typography variant="h5">
//                     {typeof summaryData.third === 'number' 
//                       ? `₹${summaryData.third.toFixed(2)}` 
//                       : summaryData.third}
//                   </Typography>
//                   <Typography color="text.secondary">{summaryData.thirdLabel}</Typography>
//                 </Box>
//               </Stack>
//             </CardContent>
//           </Card>
//         </Grid>
//         <Grid item xs={12} sm={6} md={3}>
//           <Card sx={{ borderRadius: 3, boxShadow: 3, height: '100%' }}>
//             <CardContent>
//               <Stack direction="row" alignItems="center" spacing={2}>
//                 <PieChartIcon />
//                 <Box>
//                   <Typography variant="h5" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
//                     {typeof summaryData.fourth === 'number' 
//                       ? `₹${summaryData.fourth.toFixed(2)}` 
//                       : summaryData.fourth}
//                   </Typography>
//                   <Typography color="text.secondary">{summaryData.fourthLabel}</Typography>
//                 </Box>
//               </Stack>
//             </CardContent>
//           </Card>
//         </Grid>
//       </Grid>

//       <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
//         <Button variant="contained" color="primary" onClick={exportCSV}>Export CSV</Button>
//         <Button variant="contained" color="secondary" onClick={exportPDF}>Export PDF</Button>
//       </Stack>

//       <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: 3 }}>
//         <Typography variant="h6" gutterBottom>Search & Filters</Typography>
//         <Grid container spacing={2}>
//           <Grid item xs={12} md={4}>
//             <TextField 
//               fullWidth 
//               label="Search" 
//               value={searchQuery} 
//               onChange={(e) => setSearchQuery(e.target.value)} 
//               InputProps={{ 
//                 startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> 
//               }} 
//             />
//           </Grid>
//           <Grid item xs={12} md={2}>
//             <TextField 
//               fullWidth 
//               label="Start Date" 
//               type="date" 
//               value={startDate} 
//               onChange={(e) => setStartDate(e.target.value)} 
//               InputLabelProps={{ shrink: true }} 
//             />
//           </Grid>
//           <Grid item xs={12} md={2}>
//             <TextField 
//               fullWidth 
//               label="End Date" 
//               type="date" 
//               value={endDate} 
//               onChange={(e) => setEndDate(e.target.value)} 
//               InputLabelProps={{ shrink: true }} 
//             />
//           </Grid>
//           {viewMode === 'sales' && (
//             <Grid item xs={12} md={2}>
//               <FormControl fullWidth>
//                 <InputLabel>Status</InputLabel>
//                 <Select 
//                   value={statusFilter} 
//                   label="Status" 
//                   onChange={(e) => setStatusFilter(e.target.value)}
//                 >
//                   <MenuItem value="">All Statuses</MenuItem>
//                   {availableStatuses.map((status) => (
//                     <MenuItem key={status} value={status}>{status}</MenuItem>
//                   ))}
//                 </Select>
//               </FormControl>
//             </Grid>
//           )}
//           <Grid item xs={12} md={2}>
//             <Button 
//               fullWidth 
//               variant="outlined" 
//               onClick={() => { 
//                 setSearchQuery(''); 
//                 setStartDate(''); 
//                 setEndDate(''); 
//                 setStatusFilter(''); 
//               }} 
//               sx={{ height: '56px' }}
//             >
//               Clear
//             </Button>
//           </Grid>
//         </Grid>
//       </Paper>

//       <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
//         <Typography variant="h6" gutterBottom>
//           {viewMode === 'sales' ? 'Sales Orders' : 
//            viewMode === 'menu' ? 'Menu Performance' : 
//            'Customer Analytics'} ({filteredData.length} records)
//         </Typography>
//         <TableContainer>
//           <Table>
//             <TableHead>
//               <TableRow>
//                 {viewMode === 'sales' 
//                   ? ["Order ID", "Customer", "Date", "Total", "Profit", "Status", "Details"].map((h) => (
//                       <TableCell key={h} sx={{ fontWeight: "bold" }}>{h}</TableCell>
//                     ))
//                   : viewMode === 'menu' 
//                     ? ["Menu Item", "Size", "Qty Sold", "Revenue", "Cost", "Profit", "Margin %"].map((h) => (
//                         <TableCell key={h} sx={{ fontWeight: "bold" }}>{h}</TableCell>
//                       ))
//                     : ["Customer", "Orders", "Total Spent", "Avg Order", "Last Order", "Favorite Item", "Frequency"].map((h) => (
//                         <TableCell key={h} sx={{ fontWeight: "bold" }}>{h}</TableCell>
//                       ))}
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item) => (
//                 <React.Fragment key={item.id || item.itemName || item.customerId}>
//                   <TableRow hover>
//                     {viewMode === 'sales' ? (
//                       <>
//                         <TableCell>{item.orderId}</TableCell>
//                         <TableCell>{item.customerName}</TableCell>
//                         <TableCell>{item.orderDate}</TableCell>
//                         <TableCell>₹{item.totalAmount}</TableCell>
//                         <TableCell>
//                           <Typography color={parseFloat(item.profit) > 0 ? 'success.main' : 'error.main'}>
//                             ₹{item.profit}
//                           </Typography>
//                         </TableCell>
//                         <TableCell>
//                           <Chip label={item.status} color={getStatusColor(item.status)} size="small" />
//                         </TableCell>
//                         <TableCell>
//                           <IconButton onClick={() => handleExpandRow(item.id)} size="small">
//                             {expandedRows.has(item.id) ? <ExpandLess /> : <ExpandMore />}
//                           </IconButton>
//                         </TableCell>
//                       </>
//                     ) : viewMode === 'menu' ? (
//                       <>
//                         <TableCell>
//                           <Stack>
//                             <Typography variant="body2" fontWeight="medium">{item.itemName}</Typography>
//                             <Typography variant="caption" color="text.secondary">{item.menuId}</Typography>
//                           </Stack>
//                         </TableCell>
//                         <TableCell>
//                           <Chip 
//                             label={item.sizeName || 'Regular'} 
//                             color="primary" 
//                             variant="outlined" 
//                             size="small" 
//                           />
//                         </TableCell>
//                         <TableCell>
//                           <Typography fontWeight="medium">{item.totalQuantity}</Typography>
//                         </TableCell>
//                         <TableCell>
//                           <Typography fontWeight="medium" color="primary.main">
//                             ₹{Number(item.totalRevenue).toFixed(2)}
//                           </Typography>
//                         </TableCell>
//                         <TableCell>₹{item.averageCostPrice}</TableCell>
//                         <TableCell>
//                           <Typography color="success.main" fontWeight="medium">
//                             ₹{Number(item.profit).toFixed(2)}
//                           </Typography>
//                         </TableCell>
//                         <TableCell>
//                           <Chip
//                             label={`${item.profitMargin}%`}
//                             color={parseFloat(item.profitMargin) >= 20 ? "success" : "warning"}
//                             size="small"
//                           />
//                         </TableCell>
//                       </>
//                     ) : (
//                       <>
//                         <TableCell>{item.customerName}</TableCell>
//                         <TableCell>{item.totalOrders}</TableCell>
//                         <TableCell>₹{Number(item.totalSpent).toFixed(2)}</TableCell>
//                         <TableCell>₹{item.averageOrderValue}</TableCell>
//                         <TableCell>{item.lastOrderDate}</TableCell>
//                         <TableCell>{item.favoriteItem}</TableCell>
//                         <TableCell>{item.orderFrequency}/month</TableCell>
//                       </>
//                     )}
//                   </TableRow>
//                   {viewMode === 'sales' && (
//                     <TableRow>
//                       <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
//                         <Collapse in={expandedRows.has(item.id)} timeout="auto" unmountOnExit>
//                           <Box sx={{ margin: 1 }}>
//                             <Typography variant="h6" gutterBottom>Order Details</Typography>
//                             <Table size="small">
//                               <TableHead>
//                                 <TableRow>
//                                   <TableCell>Item</TableCell>
//                                   <TableCell>Quantity</TableCell>
//                                   <TableCell>Price</TableCell>
//                                   <TableCell>Total</TableCell>
//                                 </TableRow>
//                               </TableHead>
//                               <TableBody>
//                                 {Array.isArray(item.items) && item.items.map((orderItem, i) => (
//                                   <TableRow key={i}>
//                                     <TableCell>{orderItem.name}</TableCell>
//                                     <TableCell>{orderItem.quantity}</TableCell>
//                                     <TableCell>₹{orderItem.price}</TableCell>
//                                     <TableCell>₹{orderItem.total.toFixed(2)}</TableCell>
//                                   </TableRow>
//                                 ))}
//                               </TableBody>
//                             </Table>
//                           </Box>
//                         </Collapse>
//                       </TableCell>
//                     </TableRow>
//                   )}
//                 </React.Fragment>
//               ))}
//             </TableBody>
//           </Table>
//         </TableContainer>
//         <TablePagination 
//           component="div" 
//           count={filteredData.length} 
//           page={page} 
//           onPageChange={handleChangePage} 
//           rowsPerPage={rowsPerPage} 
//           onRowsPerPageChange={handleChangeRowsPerPage} 
//         />
//       </Paper>

//       <Grid container spacing={3} sx={{ mt: 3 }}>
//         {viewMode === 'menu' && (
//           <>
//             <Grid item xs={12} md={8}>
//               <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
//                 <Typography variant="h6" gutterBottom>Cost Price vs Sold Price Analysis</Typography>
//                 {filteredData.length > 0 ? (
//                   <BarChart
//                     dataset={filteredData.slice(0, 10).map(item => ({
//                       itemName: item.itemName,
//                       costPrice: parseFloat(item.averageCostPrice) || 0,
//                       soldPrice: parseFloat(item.averagePrice) || 0,
//                     }))}
//                     xAxis={[{ 
//                       dataKey: 'itemName', 
//                       label: 'Menu Items',
//                       scaleType: 'band'
//                     }]}
//                     series={[
//                       { 
//                         dataKey: 'costPrice', 
//                         label: 'Cost Price (₹)', 
//                         color: '#ff9800',
//                       },
//                       { 
//                         dataKey: 'soldPrice', 
//                         label: 'Sold Price (₹)', 
//                         color: '#2196f3',
//                       }
//                     ]}
//                     height={400}
//                     grid={{ vertical: true, horizontal: true }}
//                   />
//                 ) : (
//                   <Alert severity="info">No data for chart</Alert>
//                 )}
//               </Paper>
//             </Grid>
//             <Grid item xs={12} md={4}>
//               <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
//                 <Typography variant="h6" gutterBottom>Menu Items Summary</Typography>
//                 {filteredData.length > 0 ? (
//                   <Box sx={{ 
//                     p: 2, 
//                     backgroundColor: theme.palette.mode === 'dark' 
//                       ? theme.palette.grey[800] 
//                       : theme.palette.grey[50], 
//                     borderRadius: 2 
//                   }}>
//                     <Stack spacing={2}>
//                       <Box>
//                         <Typography variant="subtitle2" color="text.secondary">
//                           Total Menu Items
//                         </Typography>
//                         <Typography variant="h4" fontWeight="bold" color="primary.main">
//                           {filteredData.length}
//                         </Typography>
//                       </Box>
//                       <Box>
//                         <Typography variant="subtitle2" color="text.secondary">
//                           Average Cost Price
//                         </Typography>
//                         <Typography variant="h5" fontWeight="medium" color="warning.main">
//                           ₹{filteredData.length > 0 
//                             ? (filteredData.reduce((sum, item) => 
//                                 sum + (parseFloat(item.averageCostPrice) || 0), 0
//                               ) / filteredData.length).toFixed(2)
//                             : '0.00'}
//                         </Typography>
//                       </Box>
//                       <Box>
//                         <Typography variant="subtitle2" color="text.secondary">
//                           Average Sold Price
//                         </Typography>
//                         <Typography variant="h5" fontWeight="medium" color="success.main">
//                           ₹{filteredData.length > 0 
//                             ? (filteredData.reduce((sum, item) => 
//                                 sum + (parseFloat(item.averagePrice) || 0), 0
//                               ) / filteredData.length).toFixed(2)
//                             : '0.00'}
//                         </Typography>
//                       </Box>
//                       <Box>
//                         <Typography variant="subtitle2" color="text.secondary">
//                           Average Profit Margin
//                         </Typography>
//                         <Typography variant="h5" fontWeight="medium" color="info.main">
//                           {filteredData.length > 0 
//                             ? (filteredData.reduce((sum, item) => 
//                                 sum + (parseFloat(item.profitMargin) || 0), 0
//                               ) / filteredData.length).toFixed(1)
//                             : '0.0'}%
//                         </Typography>
//                       </Box>
//                       <Divider />
//                       <Box>
//                         <Typography variant="subtitle2" color="text.secondary" gutterBottom>
//                           Profit Distribution
//                         </Typography>
//                         <Stack spacing={1}>
//                           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                               <Box sx={{ 
//                                 width: 12, 
//                                 height: 12, 
//                                 borderRadius: '50%', 
//                                 backgroundColor: '#4caf50' 
//                               }} />
//                               <Typography variant="body2">High Profit (&gt;50%)</Typography>
//                             </Box>
//                             <Typography variant="body2" fontWeight="medium">
//                               {filteredData.filter(item => parseFloat(item.profitMargin) > 50).length}
//                             </Typography>
//                           </Box>
//                           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                               <Box sx={{ 
//                                 width: 12, 
//                                 height: 12, 
//                                 borderRadius: '50%', 
//                                 backgroundColor: '#ff9800' 
//                               }} />
//                               <Typography variant="body2">Medium Profit (20-50%)</Typography>
//                             </Box>
//                             <Typography variant="body2" fontWeight="medium">
//                               {filteredData.filter(item => {
//                                 const profit = parseFloat(item.profitMargin);
//                                 return profit > 20 && profit <= 50;
//                               }).length}
//                             </Typography>
//                           </Box>
//                           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                               <Box sx={{ 
//                                 width: 12, 
//                                 height: 12, 
//                                 borderRadius: '50%', 
//                                 backgroundColor: '#f44336' 
//                               }} />
//                               <Typography variant="body2">Low Profit (&le;20%)</Typography>
//                             </Box>
//                             <Typography variant="body2" fontWeight="medium">
//                               {filteredData.filter(item => parseFloat(item.profitMargin) <= 20).length}
//                             </Typography>
//                           </Box>
//                         </Stack>
//                       </Box>
//                     </Stack>
//                   </Box>
//                 ) : (
//                   <Alert severity="info">No data available</Alert>
//                 )}
//               </Paper>
//             </Grid>
//           </>
//         )}
//       </Grid>
//     </Box>
//   );
// }


// // import React, { useState, useEffect, useMemo } from "react";
// // import { useDispatch, useSelector } from "react-redux";
// // import { LineChart, PieChart, BarChart } from "@mui/x-charts";
// // import {
// //   Box,
// //   Typography,
// //   Paper,
// //   Table,
// //   TableBody,
// //   TableCell,
// //   TableContainer,
// //   TableHead,
// //   TableRow,
// //   TablePagination,
// //   Button,
// //   Stack,
// //   Chip,
// //   useTheme,
// //   Grid,
// //   TextField,
// //   FormControl,
// //   InputLabel,
// //   Select,
// //   MenuItem,
// //   Card,
// //   CardContent,
// //   Alert,
// //   CircularProgress,
// //   Collapse,
// //   IconButton,
// //   Tooltip,
// //   Divider,
// // } from "@mui/material";
// // import {
// //   Search as SearchIcon,
// //   TrendingUp,
// //   TrendingDown,
// //   Receipt,
// //   ChevronUp as ExpandMore,
// //   ChevronDown as ExpandLess,
// //   Users,
// //   DollarSign,
// //   Target,
// //   BarChart3,
// //   PieChart as PieChartIcon
// // } from 'lucide-react';
// // import { jsPDF } from "jspdf";
// // import "jspdf-autotable";
// // // Import your sales-related Redux slices
// // import { fetchOrders } from '../../redux/slices/orderSlice';
// // import { fetchCustomers } from '../../redux/slices/customerSlice';
// // import { fetchMenuItems } from '../../redux/slices/menuSlice';
// // import { fetchInventories } from '../../redux/slices/stockSlice';

// // export default function SalesAnalytics() {
// //   const dispatch = useDispatch();
// //   const theme = useTheme();
// //   const isDark = theme.palette.mode === "dark";

// //   // Redux state - Fixed selectors to match store configuration
// //   const { orders = [], loading: ordersLoading = false } = useSelector(
// //     (state) => state.orders || { orders: [], loading: false }
// //   );
// //   const { customers = [], loading: customersLoading = false } = useSelector(
// //     (state) => state.customers || { customers: [], loading: false }
// //   );
// //   const { menuItems = [], loading: menuItemsLoading = false } = useSelector(
// //     (state) => state.menuItems || { menuItems: [], loading: false }
// //   );
// //   const { inventories = [], loading: inventoriesLoading = false } = useSelector(
// //     (state) => state.inventories || { inventories: [], loading: false }
// //   );

// //   // Debug Redux state
// //   console.log("🔍 Redux State Debug:", {
// //     orders: orders.length,
// //     customers: customers.length,
// //     menuItems: menuItems.length,
// //     inventories: inventories.length,
// //     ordersLoading,
// //     customersLoading,
// //     menuItemsLoading,
// //     inventoriesLoading
// //   });

// //   const [restaurantId, setRestaurantId] = useState(null);
// //   const [token, setToken] = useState(null);

// //   // Initialize restaurantId and token once
// //   useEffect(() => {
// //     const storedRestaurantId = localStorage.getItem('restaurantId');
// //     const storedToken = localStorage.getItem('authToken');
// //     setRestaurantId(storedRestaurantId);
// //     setToken(storedToken);
// //   }, []);

// //   // Local state with persistence
// //   const [salesData, setSalesData] = useState(() => {
// //     const saved = localStorage.getItem('salesAnalytics_salesData');
// //     return saved ? JSON.parse(saved) : [];
// //   });
// //   const [menuPerformanceData, setMenuPerformanceData] = useState(() => {
// //     const saved = localStorage.getItem('salesAnalytics_menuPerformanceData');
// //     return saved ? JSON.parse(saved) : [];
// //   });
// //   const [customerAnalyticsData, setCustomerAnalyticsData] = useState(() => {
// //     const saved = localStorage.getItem('salesAnalytics_customerAnalyticsData');
// //     return saved ? JSON.parse(saved) : [];
// //   });
// //   const [page, setPage] = useState(0);
// //   const [rowsPerPage, setRowsPerPage] = useState(10);
// //   const [startDate, setStartDate] = useState('');
// //   const [endDate, setEndDate] = useState('');
// //   const [categoryFilter, setCategoryFilter] = useState('');
// //   const [statusFilter, setStatusFilter] = useState('');
// //   const [searchQuery, setSearchQuery] = useState('');
// //   const [viewMode, setViewMode] = useState('menu'); // 'sales', 'menu', 'customers'
// //   const [expandedRows, setExpandedRows] = useState(new Set());
// //   const [loading, setLoading] = useState(false);
// //   const [error, setError] = useState(null);

// //   // Fetch data
// //   useEffect(() => {
// //     const fetchData = async () => {
// //       if (!restaurantId || !token) {
// //         setError('Restaurant ID or token not found');
// //         return;
// //       }

// //       try {
// //         setLoading(true);
// //         setError(null);

// //         await Promise.all([
// //           dispatch(fetchOrders({ restaurantId, token })),
// //           dispatch(fetchCustomers({ restaurantId, token })),
// //           dispatch(fetchMenuItems({ restaurantId, token })),
// //           dispatch(fetchInventories({ restaurantId, token }))
// //         ]);
// //       } catch (err) {
// //         console.error('Error fetching data:', err);
// //         setError('Failed to fetch data from server');
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     fetchData();
// //   }, [restaurantId, token, dispatch]);

// //   // Transform sales data
// //   useEffect(() => {
// //     if (!Array.isArray(orders) || orders.length === 0) {
// //       return;
// //     }

// //     // Prevent unnecessary re-processing if data hasn't changed
// //     const ordersString = JSON.stringify(orders.map(o => ({ id: o._id, createdAt: o.createdAt })));
// //     if (ordersString === salesData.length > 0 ? JSON.stringify(salesData.map(s => ({ id: s.id, createdAt: s.createdAt }))) : '') {
// //       return;
// //     }

// //     try {
// //       const transformedSalesData = orders
// //         .filter(order => order && order._id)
// //         .map((order) => {
// //           const orderDate = new Date(order.createdAt || new Date());
// //           const items = order.items || [];

// //           const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
// //           const tax = order.tax || (subtotal * 0.18);
// //           const discount = order.discount || 0;
// //           const totalAmount = subtotal + tax - discount;

// //           const totalCost = items.reduce((sum, item) => {
// //             const menuItem = menuItems.find(m => m._id === item.menuItemId);
// //             const itemCost = menuItem?.costPrice || (item.price * 0.6);
// //             return sum + (itemCost * item.quantity);
// //           }, 0);

// //           console.log(totalCost, "totalCost")

// //           const profit = totalAmount - totalCost;
// //           const profitMargin = totalAmount > 0 ? ((profit / totalAmount) * 100).toFixed(2) : 0;

// //           return {
// //             id: order._id,
// //             orderId: order.orderId || order._id.slice(-6),
// //             customerName: order.customer?.name || order.customerName || 'Walk-in Customer',
// //             customerId: order.customerId,
// //             orderDate: orderDate.toISOString().split('T')[0],
// //             orderTime: orderDate.toTimeString().slice(0, 5),
// //             items: items.map(item => ({
// //               name: item.name || item.itemName,
// //               quantity: item.quantity,
// //               price: item.price,
// //               total: item.price * item.quantity,
// //               category: item.categoryName || 'General',
// //               menuItemId: item.itemId || item.menuItemId, // Try both field names
// //             })),
// //             itemsCount: items.length,
// //             subtotal: subtotal.toFixed(2),
// //             tax: tax.toFixed(2),
// //             discount: discount.toFixed(2),
// //             totalAmount: totalAmount.toFixed(2),
// //             totalCost: totalCost.toFixed(2),
// //             profit: profit.toFixed(2),
// //             profitMargin: profitMargin,
// //             status: order.status,
// //             paymentMethod: order.paymentMethod || 'cash',
// //             orderType: order.orderType || 'dine-in',
// //             waiterId: order.waiterId,
// //             tableNumber: order.tableNumber,
// //             createdAt: order.createdAt,
// //             completedAt: order.completedAt
// //           };
// //         })
// //         .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

// //       setSalesData(transformedSalesData);

// //       // Save to localStorage for persistence
// //       localStorage.setItem('salesAnalytics_salesData', JSON.stringify(transformedSalesData));
// //     } catch (error) {
// //       console.error('❌ Error transforming sales data:', error);
// //       setError('Error processing sales data');
// //     }
// //   }, [orders, menuItems]);

// //   // Transform menu performance data
// //   useEffect(() => {
// //     if (menuItems.length === 0 || inventories.length === 0) {
// //       return;
// //     }

// //     // Prevent unnecessary re-processing if data hasn't changed
// //     const menuItemsString = JSON.stringify(menuItems.map(m => ({ id: m._id, itemName: m.itemName, price: m.price })));
// //     const inventoriesString = JSON.stringify(inventories.map(i => ({ id: i._id, stock: i.stock })));
// //     const currentDataString = JSON.stringify(menuPerformanceData.map(m => ({ id: m.id, itemName: m.itemName })));

// //     if (menuItemsString === currentDataString && inventoriesString === currentDataString) {
// //       return;
// //     }

// //     try {
// //       const menuPerformance = {};

// //       // Process menu items directly (not from orders)
// //       menuItems.forEach(menuItem => {
// //         // Skip deleted items
// //         if (menuItem.status === 0) {
// //           return;
// //         }
// //         const itemName = menuItem.itemName;
// //         const basePrice = menuItem.price || 0;

// //         // Process each size separately
// //         if (menuItem.sizes && menuItem.sizes.length > 0) {
// //           menuItem.sizes.forEach(size => {
// //             const sizeName = size.name || size.label || 'Regular';
// //             const sizePrice = size.price || basePrice;
// //             const sizeKey = `${itemName}_${sizeName}`;

// //             if (!menuPerformance[sizeKey]) {
// //               menuPerformance[sizeKey] = {
// //                 id: `${menuItem._id}_${sizeName}`, // Unique ID for each size
// //                 itemName: itemName,
// //                 sizeName: sizeName,
// //                 menuId: menuItem.menuId,
// //                 category: menuItem.categoryName || menuItem.sub_category || 'General',
// //                 totalQuantity: menuItem.stock || 0,
// //                 totalRevenue: 0,
// //                 totalCost: 0,
// //                 orderCount: 0,
// //                 averagePrice: sizePrice,
// //                 averageCostPrice: 0,
// //                 profit: 0,
// //                 profitMargin: 0,
// //                 sizes: [sizeName],
// //                 menuItem: menuItem,
// //                 sizeInfo: size
// //               };
// //             }
// //           });
// //         } else {
// //           // No sizes, use base price
// //           if (!menuPerformance[itemName]) {
// //             menuPerformance[itemName] = {
// //               id: menuItem._id,
// //               itemName: itemName,
// //               sizeName: 'Regular',
// //               menuId: menuItem.menuId,
// //               category: menuItem.categoryName || menuItem.sub_category || 'General',
// //               totalQuantity: menuItem.stock || 0,
// //               totalRevenue: 0,
// //               totalCost: 0,
// //               orderCount: 0,
// //               averagePrice: basePrice,
// //               averageCostPrice: 0,
// //               profit: 0,
// //               profitMargin: 0,
// //               sizes: ['Regular'],
// //               menuItem: menuItem
// //             };
// //           }
// //         }

// //         // Calculate cost from menu item's stockItems (ingredients) using actual inventory data
// //         // Using the same detailed calculation as PurchaseAnalytics.js
// //         let itemCost = 0;
// //         if (menuItem.stockItems && menuItem.stockItems.length > 0) {
// //           // Calculate cost based on actual inventory data with unit conversion
// //           itemCost = menuItem.stockItems.reduce((totalCost, stockItem) => {
// //             // Find the inventory item
// //             const inventoryItem = inventories.find(inv => String(inv._id) === String(stockItem.stockId));

// //             if (inventoryItem && inventoryItem.stock) {
// //               // === Inventory values ===
// //               const inventoryRate = inventoryItem.stock.amount;       // rate per unit (e.g. 25/kg, 60/litre, etc.)
// //               const inventoryQuantity = inventoryItem.stock.quantity; // total quantity purchased
// //               const unit = stockItem.unit?.toLowerCase() || inventoryItem.unit?.toLowerCase() || "unit";

// //               // === Convert rate into smallest unit ===
// //               let currentRate = 0;
// //               if (unit === "kg") {
// //                 currentRate = inventoryRate; // per kg
// //               } else if (unit === "gm") {
// //                 currentRate = inventoryRate / 1000; // per gm (kg/1000)
// //               } else if (unit === "litre" || unit === "liter" || unit === "ltr") {
// //                 currentRate = inventoryRate; // per ltr (no conversion needed)
// //               } else if (unit === "ml" || unit === "milliliter") {
// //                 currentRate = inventoryRate/1000; // per ml (ltr/1000)
// //               } else if (unit === "pcs" || unit === "pieces") {
// //                 currentRate = inventoryRate; // per piece
// //               } else {
// //                 currentRate = inventoryRate; // fallback
// //               }

// //               // === Calculate total cost for this ingredient ===
// //               const ingredientCost = currentRate * stockItem.quantity;
// //               return totalCost + ingredientCost;
// //             } else {
// //               // Fallback: use 40% of selling price as cost
// //               const estimatedCostPerUnit = (menuItem.price || 0) * 0.4;
// //               return totalCost + (estimatedCostPerUnit * stockItem.quantity);
// //             }
// //           }, 0);
// //         } else {
// //           // Fallback: use 40% of selling price as cost
// //           itemCost = basePrice * 0.4;
// //         }

// //         // Apply cost to all sizes of this menu item
// //         Object.values(menuPerformance).forEach(performanceItem => {
// //           if (performanceItem.menuItem._id === menuItem._id) {
// //             performanceItem.totalCost = itemCost;
// //             performanceItem.totalRevenue = performanceItem.averagePrice * (menuItem.stock || 0);
// //           }
// //         });
// //       });

// //       const menuPerformanceArray = Object.values(menuPerformance)
// //         .map(item => {
// //           const itemPrice = item.averagePrice; // Use size-specific price
// //           item.averageCostPrice = item.totalCost.toFixed(2);

// //           const profit = itemPrice - item.totalCost;
// //           item.profit = parseFloat(profit.toFixed(2));
// //           item.profitMargin = itemPrice > 0
// //             ? ((profit / itemPrice) * 100).toFixed(1)
// //             : "0";

// //           return item;
// //         })
// //         .sort((a, b) => b.profit - a.profit);

// //       setMenuPerformanceData(menuPerformanceArray);

// //       // Save to localStorage for persistence
// //       localStorage.setItem('salesAnalytics_menuPerformanceData', JSON.stringify(menuPerformanceArray));
// //     } catch (error) {
// //       console.error("❌ Error transforming menu performance data:", error);
// //       setError(`Menu performance data processing failed: ${error.message}`);
// //     }
// //   }, [menuItems, inventories]);

// //   // Transform customer analytics data
// //   useEffect(() => {
// //     if (salesData.length === 0) return;

// //     try {
// //       const customerAnalytics = {};

// //       salesData.forEach(order => {
// //         const customerId = order.customerId || order.customerName;
// //         if (!customerAnalytics[customerId]) {
// //           customerAnalytics[customerId] = {
// //             customerId: customerId,
// //             customerName: order.customerName,
// //             totalOrders: 0,
// //             totalSpent: 0,
// //             averageOrderValue: 0,
// //             lastOrderDate: order.orderDate,
// //             favoriteItems: {},
// //             orderFrequency: 0
// //           };
// //         }

// //         customerAnalytics[customerId].totalOrders += 1;
// //         customerAnalytics[customerId].totalSpent += parseFloat(order.totalAmount);

// //         if (new Date(order.orderDate) > new Date(customerAnalytics[customerId].lastOrderDate)) {
// //           customerAnalytics[customerId].lastOrderDate = order.orderDate;
// //         }

// //         order.items.forEach(item => {
// //           if (!customerAnalytics[customerId].favoriteItems[item.name]) {
// //             customerAnalytics[customerId].favoriteItems[item.name] = 0;
// //           }
// //           customerAnalytics[customerId].favoriteItems[item.name] += item.quantity;
// //         });
// //       });

// //       const customerAnalyticsArray = Object.values(customerAnalytics).map(customer => {
// //         customer.averageOrderValue = (customer.totalSpent / customer.totalOrders).toFixed(2);

// //         const favoriteItemEntry = Object.entries(customer.favoriteItems)
// //           .sort(([, a], [, b]) => b - a)[0];
// //         customer.favoriteItem = favoriteItemEntry ? favoriteItemEntry[0] : 'None';

// //         const customerOrders = salesData.filter(order => (order.customerId || order.customerName) === customer.customerId);
// //         const firstOrder = Math.min(...customerOrders.map(order => new Date(order.orderDate).getTime()));
// //         const daysSinceFirstOrder = (Date.now() - firstOrder) / (1000 * 60 * 60 * 24);
// //         customer.orderFrequency = daysSinceFirstOrder > 30 ?
// //           (customer.totalOrders / (daysSinceFirstOrder / 30)).toFixed(1) : customer.totalOrders.toString();

// //         return customer;
// //       }).sort((a, b) => b.totalSpent - a.totalSpent);

// //       setCustomerAnalyticsData(customerAnalyticsArray);

// //       // Save to localStorage for persistence
// //       localStorage.setItem('salesAnalytics_customerAnalyticsData', JSON.stringify(customerAnalyticsArray));
// //     } catch (error) {
// //       console.error('Error transforming customer analytics data:', error);
// //     }
// //   }, [salesData]);

// //   const getSummaryData = () => {
// //     if (viewMode === 'sales') {
// //       const totalRevenue = filteredData.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
// //       const totalOrders = filteredData.length;
// //       const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
// //       const totalProfit = filteredData.reduce((sum, order) => sum + parseFloat(order.profit), 0);

// //       return {
// //         main: totalRevenue,
// //         mainLabel: 'Total Revenue',
// //         secondary: totalOrders,
// //         secondaryLabel: 'Total Orders',
// //         third: averageOrderValue,
// //         thirdLabel: 'Avg Order Value',
// //         fourth: totalProfit,
// //         fourthLabel: 'Total Profit'
// //       };
// //     } else if (viewMode === 'menu') {
// //       const totalRevenue = filteredData.reduce((sum, item) => sum + item.totalRevenue, 0);
// //       const totalItemsSold = filteredData.reduce((sum, item) => sum + item.totalQuantity, 0);
// //       const totalProfit = filteredData.reduce((sum, item) => sum + item.profit, 0);
// //       const topPerformer = filteredData.length > 0 ? filteredData[0] : { itemName: 'N/A' };

// //       return {
// //         main: totalRevenue,
// //         mainLabel: 'Menu Revenue',
// //         secondary: totalItemsSold,
// //         secondaryLabel: 'Items Sold',
// //         third: totalProfit,
// //         thirdLabel: 'Total Profit',
// //         fourth: topPerformer.itemName,
// //         fourthLabel: 'Top Item'
// //       };
// //     } else {
// //       const totalCustomers = filteredData.length;
// //       const totalRevenue = filteredData.reduce((sum, customer) => sum + customer.totalSpent, 0);
// //       const averageSpending = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
// //       const loyalCustomers = filteredData.filter(customer => customer.totalOrders > 5).length;

// //       return {
// //         main: totalRevenue,
// //         mainLabel: 'Customer Revenue',
// //         secondary: totalCustomers,
// //         secondaryLabel: 'Total Customers',
// //         third: averageSpending,
// //         thirdLabel: 'Avg Customer Value',
// //         fourth: loyalCustomers,
// //         fourthLabel: 'Loyal Customers'
// //       };
// //     }
// //   };

// //   const getCurrentData = () => {
// //     switch (viewMode) {
// //       case 'sales':
// //         return salesData;
// //       case 'menu':
// //         return menuPerformanceData;
// //       case 'customers':
// //         return customerAnalyticsData;
// //       default:
// //         return salesData;
// //     }
// //   };

// //   const currentData = getCurrentData();

// //   const filteredData = useMemo(() => {
// //     return currentData.filter(item => {
// //       if (!item) return false;

// //       let matchesDate = true;
// //       if (startDate || endDate) {
// //         const itemDate = new Date(viewMode === 'customers' ? item.lastOrderDate : item.orderDate);
// //         if (startDate) matchesDate = matchesDate && itemDate >= new Date(startDate);
// //         if (endDate) matchesDate = matchesDate && itemDate <= new Date(endDate);
// //       }

// //       const matchesCategory = !categoryFilter ||
// //         (viewMode === 'sales' && item.items.some(orderItem => orderItem.category === categoryFilter)) ||
// //         (viewMode === 'menu' && item.category === categoryFilter);

// //       const matchesStatus = !statusFilter ||
// //         (viewMode === 'sales' && item.status === statusFilter);

// //       let matchesSearch = true;
// //       if (searchQuery) {
// //         const query = searchQuery.toLowerCase();
// //         if (viewMode === 'sales') {
// //           matchesSearch = (item.orderId?.toLowerCase() || '').includes(query) ||
// //             (item.customerName?.toLowerCase() || '').includes(query) ||
// //             item.items.some(orderItem => (orderItem.name?.toLowerCase() || '').includes(query));
// //         } else if (viewMode === 'menu') {
// //           matchesSearch = (item.itemName?.toLowerCase() || '').includes(query) ||
// //             (item.category?.toLowerCase() || '').includes(query);
// //         } else {
// //           matchesSearch = (item.customerName?.toLowerCase() || '').includes(query) ||
// //             (item.favoriteItem?.toLowerCase() || '').includes(query);
// //         }
// //       }

// //       return matchesDate && matchesCategory && matchesStatus && matchesSearch;
// //     });
// //   }, [currentData, startDate, endDate, categoryFilter, statusFilter, searchQuery, viewMode]);

// //   const handleChangePage = (event, newPage) => {
// //     setPage(newPage);
// //   };

// //   const handleChangeRowsPerPage = (event) => {
// //     setRowsPerPage(parseInt(event.target.value, 10));
// //     setPage(0);
// //   };

// //   const handleExpandRow = (id) => {
// //     const newExpanded = new Set(expandedRows);
// //     if (newExpanded.has(id)) {
// //       newExpanded.delete(id);
// //     } else {
// //       newExpanded.add(id);
// //     }
// //     setExpandedRows(newExpanded);
// //   };

// //   const exportCSV = () => {
// //     let csvRows = [];
// //     let fileName = `analytics-${new Date().toISOString().split('T')[0]}.csv`;

// //     switch (viewMode) {
// //       case 'sales':
// //         csvRows = [
// //           ["Order ID", "Customer", "Date", "Time", "Items", "Subtotal", "Tax", "Total", "Profit", "Status", "Payment Method"],
// //           ...filteredData.map(o => [o.orderId, o.customerName, o.orderDate, o.orderTime, o.itemsCount, o.subtotal, o.tax, o.totalAmount, o.profit, o.status, o.paymentMethod])
// //         ];
// //         fileName = `sales-${fileName}`;
// //         break;
// //       case 'menu':
// //         csvRows = [
// //           ["Menu Item", "Menu ID", "Size", "Cost Price (CP)", "Sold Price (SP)", "Profit", "Profit Percentage (%)", "Total Quantity", "Total Revenue"],
// //           ...filteredData.map(item => [
// //             item.itemName, 
// //             item.menuId || '',
// //             item.sizeName || item.sizes?.join(', ') || 'Regular',
// //             item.averageCostPrice || item.totalCost.toFixed(2), 
// //             item.averagePrice, 
// //             item.profit, 
// //             item.profitMargin,
// //             item.totalQuantity,
// //             item.totalRevenue
// //           ])
// //         ];
// //         fileName = `menu-performance-${fileName}`;
// //         break;
// //       case 'customers':
// //         csvRows = [
// //           ["Customer Name", "Total Orders", "Total Spent", "Avg Order Value", "Last Order", "Favorite Item", "Order Frequency (/month)"],
// //           ...filteredData.map(c => [c.customerName, c.totalOrders, c.totalSpent, c.averageOrderValue, c.lastOrderDate, c.favoriteItem, c.orderFrequency])
// //         ];
// //         fileName = `customers-${fileName}`;
// //         break;
// //       default:
// //         return;
// //     }

// //     const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
// //     const link = document.createElement("a");
// //     link.href = encodeURI(csvContent);
// //     link.download = fileName;
// //     link.click();
// //   };

// //   const exportPDF = () => {
// //     const doc = new jsPDF('landscape');
// //     const summaryData = getSummaryData();

// //     doc.setFontSize(16);
// //     doc.text(`${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} Analytics Report`, 14, 20);

// //     if (viewMode === 'sales') {
// //       doc.autoTable({
// //         startY: 30,
// //         head: [["Order ID", "Customer", "Date", "Total", "Profit", "Status"]],
// //         body: filteredData.slice(0, 50).map(o => [o.orderId, o.customerName, o.orderDate, `₹${o.totalAmount}`, `₹${o.profit}`, o.status]),
// //         styles: { fontSize: 8 },
// //       });
// //     } else if (viewMode === 'menu') {
// //       doc.autoTable({
// //         startY: 30,
// //         head: [["Menu Item", "Size", "Cost Price (CP)", "Sold Price (SP)", "Profit", "Profit Percentage (%)"]],
// //         body: filteredData.slice(0, 50).map(item => [
// //           item.itemName, 
// //           item.sizeName || item.sizes?.join(', ') || 'Regular',
// //           `₹${item.averageCostPrice || item.totalCost.toFixed(2)}`, 
// //           `₹${item.averagePrice}`, 
// //           `₹${item.profit}`, 
// //           `${item.profitMargin}%`
// //         ]),
// //         styles: { fontSize: 8 },
// //       });
// //     } else {
// //       doc.autoTable({
// //         startY: 30,
// //         head: [["Customer", "Orders", "Total Spent", "Avg Order", "Last Order"]],
// //         body: filteredData.slice(0, 50).map(c => [c.customerName, c.totalOrders, `₹${c.totalSpent.toFixed(2)}`, `₹${c.averageOrderValue}`, c.lastOrderDate]),
// //         styles: { fontSize: 8 },
// //       });
// //     }

// //     doc.save(`${viewMode}-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
// //   };

// //   const getStatusColor = (status) => {
// //     switch (status?.toLowerCase()) {
// //       case 'completed': return 'success';
// //       case 'pending': return 'warning';
// //       case 'cancelled': return 'error';
// //       default: return 'default';
// //     }
// //   };

// //   const availableStatuses = [...new Set(salesData.map(order => order.status).filter(Boolean))];

// //   if (loading || ordersLoading || customersLoading || menuItemsLoading || inventoriesLoading) {
// //     return (
// //       <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
// //         <CircularProgress />
// //         <Typography sx={{ ml: 2 }}>Loading sales data...</Typography>
// //       </Box>
// //     );
// //   }


// //   if (error) {
// //     return (
// //       <Box sx={{ p: 3 }}>
// //         <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
// //         <Button variant="contained" onClick={() => window.location.reload()}>Retry</Button>
// //       </Box>
// //     );
// //   }

// //   const summaryData = getSummaryData();

// //   return (
// //     <Box sx={{ p: 3 }}>
// //       <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
// //         Sales Analytics Dashboard
// //       </Typography>

// //       <Paper sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: 3 }}>
// //         <Grid container spacing={2} alignItems="center">
// //           <Grid item xs={12} sm={12} md={3}>
// //             <Typography variant="h6" sx={{ 
// //               textAlign: { xs: 'center', sm: 'center', md: 'left' },
// //               mb: { xs: 1, sm: 1, md: 0 }
// //             }}>
// //               View Mode:
// //             </Typography>
// //           </Grid>
// //           <Grid item xs={12} sm={12} md={9}>
// //             <Stack 
// //               direction={{ xs: 'column', sm: 'row' }} 
// //               spacing={2} 
// //               alignItems="center"
// //               sx={{ 
// //                 width: '100%',
// //                 justifyContent: { xs: 'center', sm: 'flex-start' }
// //               }}
// //             >
// //               {/* Sales Overview button hidden */}
// //               {/* <Button 
// //                 variant={viewMode === 'sales' ? 'contained' : 'outlined'} 
// //                 startIcon={<Receipt />} 
// //                 onClick={() => setViewMode('sales')}
// //                 sx={{ 
// //                   minWidth: { xs: '100%', sm: 'auto' },
// //                   fontSize: { xs: '0.875rem', sm: '0.875rem' },
// //                   width: { xs: '100%', sm: 'auto' }
// //                 }}
// //               >
// //                 Sales Overview
// //               </Button> */}
// //               <Button 
// //                 variant={viewMode === 'menu' ? 'contained' : 'outlined'} 
// //                 startIcon={<BarChart3 />} 
// //                 onClick={() => setViewMode('menu')}
// //                 sx={{ 
// //                   minWidth: { xs: '100%', sm: 'auto' },
// //                   fontSize: { xs: '0.875rem', sm: '0.875rem' },
// //                   py: { xs: 1.5, sm: 1 },
// //                   width: { xs: '100%', sm: 'auto' }
// //                 }}
// //               >
// //                 Menu Performance
// //               </Button>
// //               {/* Customer Analytics button hidden */}
// //               {/* <Button 
// //                 variant={viewMode === 'customers' ? 'contained' : 'outlined'} 
// //                 startIcon={<Users />} 
// //                 onClick={() => setViewMode('customers')}
// //                 sx={{ 
// //                   minWidth: { xs: '100%', sm: 'auto' },
// //                   fontSize: { xs: '0.875rem', sm: '0.875rem' },
// //                   width: { xs: '100%', sm: 'auto' }
// //                 }}
// //               >
// //                 Customer Analytics
// //               </Button> */}
// //             </Stack>
// //           </Grid>
// //         </Grid>
// //       </Paper>

// //       <Grid container spacing={3} sx={{ mb: 3 }}>
// //         <Grid item xs={12} sm={6} md={3}>
// //           <Card sx={{ borderRadius: 3, boxShadow: 3, height: '100%' }}>
// //             <CardContent>
// //               <Stack direction="row" alignItems="center" spacing={2}>
// //                 <DollarSign />
// //                 <Box>
// //                   <Typography variant="h5">₹{summaryData.main.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
// //                   <Typography color="text.secondary">{summaryData.mainLabel}</Typography>
// //                 </Box>
// //               </Stack>
// //             </CardContent>
// //           </Card>
// //         </Grid>
// //         <Grid item xs={12} sm={6} md={3}>
// //           <Card sx={{ borderRadius: 3, boxShadow: 3, height: '100%' }}>
// //             <CardContent>
// //               <Stack direction="row" alignItems="center" spacing={2}>
// //                 <Target />
// //                 <Box>
// //                   <Typography variant="h5">{summaryData.secondary.toLocaleString()}</Typography>
// //                   <Typography color="text.secondary">{summaryData.secondaryLabel}</Typography>
// //                 </Box>
// //               </Stack>
// //             </CardContent>
// //           </Card>
// //         </Grid>
// //         <Grid item xs={12} sm={6} md={3}>
// //           <Card sx={{ borderRadius: 3, boxShadow: 3, height: '100%' }}>
// //             <CardContent>
// //               <Stack direction="row" alignItems="center" spacing={2}>
// //                 <TrendingUp />
// //                 <Box>
// //                   <Typography variant="h5">{typeof summaryData.third === 'number' ? `₹${summaryData.third.toFixed(2)}` : summaryData.third}</Typography>
// //                   <Typography color="text.secondary">{summaryData.thirdLabel}</Typography>
// //                 </Box>
// //               </Stack>
// //             </CardContent>
// //           </Card>
// //         </Grid>
// //         <Grid item xs={12} sm={6} md={3}>
// //           <Card sx={{ borderRadius: 3, boxShadow: 3, height: '100%' }}>
// //             <CardContent>
// //               <Stack direction="row" alignItems="center" spacing={2}>
// //                 <PieChartIcon />
// //                 <Box>
// //                   <Typography variant="h5" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
// //                     {typeof summaryData.fourth === 'number' ? `₹${summaryData.fourth.toFixed(2)}` : summaryData.fourth}
// //                   </Typography>
// //                   <Typography color="text.secondary">{summaryData.fourthLabel}</Typography>
// //                 </Box>
// //               </Stack>
// //             </CardContent>
// //           </Card>
// //         </Grid>
// //       </Grid>

// //       <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
// //         <Button variant="contained" color="primary" onClick={exportCSV}>Export CSV</Button>
// //         <Button variant="contained" color="secondary" onClick={exportPDF}>Export PDF</Button>
// //       </Stack>

// //       <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: 3 }}>
// //         <Typography variant="h6" gutterBottom>Search & Filters</Typography>
// //         <Grid container spacing={2}>
// //           <Grid item xs={12} md={4}>
// //             <TextField fullWidth label="Search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }} />
// //           </Grid>
// //           <Grid item xs={12} md={2}>
// //             <TextField fullWidth label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} />
// //           </Grid>
// //           <Grid item xs={12} md={2}>
// //             <TextField fullWidth label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} />
// //           </Grid>
// //           {viewMode === 'sales' && (
// //             <Grid item xs={12} md={2}>
// //               <FormControl fullWidth>
// //                 <InputLabel>Status</InputLabel>
// //                 <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
// //                   <MenuItem value="">All Statuses</MenuItem>
// //                   {availableStatuses.map((status) => (<MenuItem key={status} value={status}>{status}</MenuItem>))}
// //                 </Select>
// //               </FormControl>
// //             </Grid>
// //           )}
// //           <Grid item xs={12} md={2}>
// //             <Button fullWidth variant="outlined" onClick={() => { setSearchQuery(''); setStartDate(''); setEndDate(''); setStatusFilter(''); }} sx={{ height: '56px' }}>Clear</Button>
// //           </Grid>
// //         </Grid>
// //       </Paper>

// //       <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
// //         <Typography variant="h6" gutterBottom>{viewMode === 'sales' ? 'Sales Orders' : viewMode === 'menu' ? 'Menu Performance' : 'Customer Analytics'} ({filteredData.length} records)</Typography>
// //         <TableContainer>
// //           <Table>
// //             <TableHead>
// //               <TableRow>
// //                 {viewMode === 'sales' ? ["Order ID", "Customer", "Date", "Total", "Profit", "Status", "Details"].map((h) => (<TableCell key={h} sx={{ fontWeight: "bold" }}>{h}</TableCell>))
// //                   : viewMode === 'menu' ? ["Menu Item", "Size", "Cost Price (CP)", "Sold Price (SP)", "Profit", "Profit Percentage (%)"].map((h) => (<TableCell key={h} sx={{ fontWeight: "bold" }}>{h}</TableCell>))
// //                     : ["Customer", "Orders", "Total Spent", "Avg Order", "Last Order", "Favorite Item", "Frequency"].map((h) => (<TableCell key={h} sx={{ fontWeight: "bold" }}>{h}</TableCell>))}
// //               </TableRow>
// //             </TableHead>
// //             <TableBody>
// //               {filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item, idx) => (
// //                 <React.Fragment key={item.id || item.itemName || item.customerId}>
// //                   <TableRow hover>
// //                     {viewMode === 'sales' ? (
// //                       <>
// //                         <TableCell>{item.orderId}</TableCell>
// //                         <TableCell>{item.customerName}</TableCell>
// //                         <TableCell>{item.orderDate}</TableCell>
// //                         <TableCell>₹{item.totalAmount}</TableCell>
// //                         <TableCell color={parseFloat(item.profit) > 0 ? 'success.main' : 'error.main'}>₹{item.profit}</TableCell>
// //                         <TableCell><Chip label={item.status} color={getStatusColor(item.status)} size="small" /></TableCell>
// //                         <TableCell><IconButton onClick={() => handleExpandRow(item.id)} size="small">{expandedRows.has(item.id) ? <ExpandLess /> : <ExpandMore />}</IconButton></TableCell>
// //                       </>
// //                     ) : viewMode === 'menu' ? (
// //                       <>
// //                         <TableCell>
// //                           <Stack>
// //                             <Typography variant="body2" fontWeight="medium">{item.itemName}</Typography>
// //                             <Typography variant="caption" color="text.secondary">{item.menuId}</Typography>
// //                           </Stack>
// //                         </TableCell>
// //                         <TableCell>
// //                           <Chip 
// //                             label={item.sizeName || item.sizes?.join(', ') || 'Regular'} 
// //                             color="primary" 
// //                             variant="outlined" 
// //                             size="small" 
// //                           />
// //                         </TableCell>
// //                         <TableCell>₹{item.averageCostPrice || item.totalCost.toFixed(2)}</TableCell>
// //                         <TableCell>₹{item.averagePrice}</TableCell>
// //                         <TableCell color="success.main">₹{item.profit}</TableCell>
// //                         <TableCell><Typography color={parseFloat(item.profitMargin) >= 20 ? "success.main" : "warning.main"}>{item.profitMargin}%</Typography></TableCell>
// //                       </>
// //                     ) : (
// //                       <>
// //                         <TableCell>{item.customerName}</TableCell>
// //                         <TableCell>{item.totalOrders}</TableCell>
// //                         <TableCell>₹{item.totalSpent.toFixed(2)}</TableCell>
// //                         <TableCell>₹{item.averageOrderValue}</TableCell>
// //                         <TableCell>{item.lastOrderDate}</TableCell>
// //                         <TableCell>{item.favoriteItem}</TableCell>
// //                         <TableCell>{item.orderFrequency}/month</TableCell>
// //                       </>
// //                     )}
// //                   </TableRow>
// //                   {viewMode === 'sales' && (
// //                     <TableRow>
// //                       <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
// //                         <Collapse in={expandedRows.has(item.id)} timeout="auto" unmountOnExit>
// //                           <Box sx={{ margin: 1 }}>
// //                             <Typography variant="h6" gutterBottom>Order Details</Typography>
// //                             <Table size="small">
// //                               <TableHead>
// //                                 <TableRow><TableCell>Item</TableCell><TableCell>Quantity</TableCell><TableCell>Price</TableCell><TableCell>Total</TableCell></TableRow>
// //                               </TableHead>
// //                               <TableBody>
// //                                 {item.items?.map((orderItem, i) => (<TableRow key={i}><TableCell>{orderItem.name}</TableCell><TableCell>{orderItem.quantity}</TableCell><TableCell>₹{orderItem.price}</TableCell><TableCell>₹{orderItem.total.toFixed(2)}</TableCell></TableRow>))}
// //                               </TableBody>
// //                             </Table>
// //                           </Box>
// //                         </Collapse>
// //                       </TableCell>
// //                     </TableRow>
// //                   )}
// //                 </React.Fragment>
// //               ))}
// //             </TableBody>
// //           </Table>
// //         </TableContainer>
// //         <TablePagination component="div" count={filteredData.length} page={page} onPageChange={handleChangePage} rowsPerPage={rowsPerPage} onRowsPerPageChange={handleChangeRowsPerPage} />
// //       </Paper>

// //       <Grid container spacing={3} sx={{ mt: 3 }}>
// //         {viewMode === 'sales' && (
// //           <>
// //             <Grid item xs={12} md={8}>
// //               <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
// //                 <Typography variant="h6" gutterBottom>Daily Revenue Trend</Typography>
// //                 {filteredData.length > 0 ? (
// //                   <LineChart
// //                     dataset={Object.entries(filteredData.reduce((acc, order) => {
// //                       acc[order.orderDate] = (acc[order.orderDate] || 0) + parseFloat(order.totalAmount);
// //                       return acc;
// //                     }, {})).map(([date, revenue]) => ({ date, revenue }))}
// //                     xAxis={[{ dataKey: "date", scaleType: 'band' }]}
// //                     series={[{ dataKey: "revenue", label: "Revenue (₹)" }]}
// //                     height={400}
// //                   />
// //                 ) : (<Alert severity="info">No data for chart</Alert>)}
// //               </Paper>
// //             </Grid>
// //             <Grid item xs={12} md={4}>
// //               <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
// //                 <Typography variant="h6" gutterBottom>Order Status</Typography>
// //                 {filteredData.length > 0 ? (
// //                   <PieChart
// //                     series={[{
// //                       data: Object.entries(filteredData.reduce((acc, order) => {
// //                         acc[order.status] = (acc[order.status] || 0) + 1;
// //                         return acc;
// //                       }, {})).map(([label, value]) => ({ id: label, value, label }))
// //                     }]}
// //                     height={400}
// //                   />
// //                 ) : (<Alert severity="info">No data for chart</Alert>)}
// //               </Paper>
// //             </Grid>
// //           </>
// //         )}
// //         {viewMode === 'menu' && (
// //           <>
// //             <Grid item xs={12} md={8}>
// //               <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
// //                 <Typography variant="h6" gutterBottom>Cost Price vs Sold Price Analysis</Typography>
// //                 {filteredData.length > 0 ? (
// //                   <BarChart
// //                     dataset={filteredData.map(item => ({
// //                       id: item.id,
// //                       itemName: item.itemName,
// //                       costPrice: parseFloat(item.averageCostPrice || item.totalCost) || 0,
// //                       soldPrice: parseFloat(item.averagePrice) || 0,
// //                       profit: parseFloat(item.profit) || 0,
// //                       profitMargin: parseFloat(item.profitMargin) || 0
// //                     }))}
// //                     xAxis={[{ 
// //                       dataKey: 'itemName', 
// //                       label: 'Menu Items',
// //                       scaleType: 'band'
// //                     }]}
// //                     yAxis={[
// //                       { 
// //                         dataKey: 'costPrice', 
// //                         label: 'Cost Price (₹)',
// //                         scaleType: 'linear'
// //                       },
// //                       { 
// //                         dataKey: 'soldPrice', 
// //                         label: 'Sold Price (₹)',
// //                         scaleType: 'linear'
// //                       }
// //                     ]}
// //                     series={[
// //                       { 
// //                         dataKey: 'costPrice', 
// //                         label: 'Cost Price (₹)', 
// //                         color: '#ff9800',
// //                         yAxisKey: 'costPrice'
// //                       },
// //                       { 
// //                         dataKey: 'soldPrice', 
// //                         label: 'Sold Price (₹)', 
// //                         color: '#2196f3',
// //                         yAxisKey: 'soldPrice'
// //                       }
// //                     ]}
// //                     height={400}
// //                     grid={{ vertical: true, horizontal: true }}
// //                   />
// //                 ) : (<Alert severity="info">No data for chart</Alert>)}
// //               </Paper>
// //             </Grid>
// //             <Grid item xs={12} md={4}>
// //               <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
// //                 <Typography variant="h6" gutterBottom>Menu Items Summary</Typography>
// //                 {filteredData.length > 0 ? (
// //                   <Box sx={{ p: 2, backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[50], borderRadius: 2 }}>
// //                     <Stack spacing={2}>
// //                       <Box>
// //                         <Typography variant="subtitle2" color="text.secondary">Total Menu Items</Typography>
// //                         <Typography variant="h4" fontWeight="bold" color="primary.main">
// //                           {filteredData.length}
// //                         </Typography>
// //                       </Box>
// //                       <Box>
// //                         <Typography variant="subtitle2" color="text.secondary">Average Cost Price</Typography>
// //                         <Typography variant="h5" fontWeight="medium" color="warning.main">
// //                           ₹{filteredData.length > 0 
// //                             ? (filteredData.reduce((sum, item) => sum + (parseFloat(item.averageCostPrice || item.totalCost) || 0), 0) / filteredData.length).toFixed(2)
// //                             : 0}
// //                         </Typography>
// //                       </Box>
// //                       <Box>
// //                         <Typography variant="subtitle2" color="text.secondary">Average Sold Price</Typography>
// //                         <Typography variant="h5" fontWeight="medium" color="success.main">
// //                           ₹{filteredData.length > 0 
// //                             ? (filteredData.reduce((sum, item) => sum + (parseFloat(item.averagePrice) || 0), 0) / filteredData.length).toFixed(2)
// //                             : 0}
// //                         </Typography>
// //                       </Box>
// //                       <Box>
// //                         <Typography variant="subtitle2" color="text.secondary">Average Profit Margin</Typography>
// //                         <Typography variant="h5" fontWeight="medium" color="info.main">
// //                           {filteredData.length > 0 
// //                             ? (filteredData.reduce((sum, item) => sum + (parseFloat(item.profitMargin) || 0), 0) / filteredData.length).toFixed(1)
// //                             : 0}%
// //                         </Typography>
// //                       </Box>
// //                       <Divider />
// //                       <Box>
// //                         <Typography variant="subtitle2" color="text.secondary" gutterBottom>
// //                           Profit Distribution
// //                         </Typography>
// //                         <Stack spacing={1}>
// //                           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
// //                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
// //                               <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#4caf50' }} />
// //                               <Typography variant="body2">High Profit (&gt;50%)</Typography>
// //                             </Box>
// //                             <Typography variant="body2" fontWeight="medium">
// //                               {filteredData.filter(item => parseFloat(item.profitMargin) > 50).length}
// //                             </Typography>
// //                           </Box>
// //                           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
// //                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
// //                               <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff9800' }} />
// //                               <Typography variant="body2">Medium Profit (20-50%)</Typography>
// //                             </Box>
// //                             <Typography variant="body2" fontWeight="medium">
// //                               {filteredData.filter(item => {
// //                                 const profit = parseFloat(item.profitMargin);
// //                                 return profit > 20 && profit <= 50;
// //                               }).length}
// //                             </Typography>
// //                           </Box>
// //                           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
// //                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
// //                               <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#f44336' }} />
// //                               <Typography variant="body2">Low Profit (&le;20%)</Typography>
// //                             </Box>
// //                             <Typography variant="body2" fontWeight="medium">
// //                               {filteredData.filter(item => parseFloat(item.profitMargin) <= 20).length}
// //                             </Typography>
// //                           </Box>
// //                         </Stack>
// //                       </Box>
// //                     </Stack>
// //                   </Box>
// //                 ) : (
// //                   <Alert severity="info">No data available</Alert>
// //                 )}
// //               </Paper>
// //             </Grid>
// //           </>
// //         )}
// //         {viewMode === 'customers' && (
// //           <Grid item xs={12} md={12}>
// //             <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
// //               <Typography variant="h6" gutterBottom>Top 10 Customers by Spending</Typography>
// //               {filteredData.length > 0 ? (
// //                 <BarChart
// //                   dataset={filteredData.slice(0, 10)}
// //                   xAxis={[{ dataKey: 'customerName', scaleType: 'band' }]}
// //                   series={[{ dataKey: 'totalSpent', label: 'Total Spent (₹)' }]}
// //                   height={400}
// //                 />
// //               ) : (<Alert severity="info">No data for chart</Alert>)}
// //             </Paper>
// //           </Grid>
// //         )}
// //       </Grid>
// //     </Box>
// //   );
// // }

import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LineChart, PieChart, BarChart } from "@mui/x-charts";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Stack,
  Chip,
  useTheme,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Collapse,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  Search as SearchIcon,
  TrendingUp,
  TrendingDown,
  Receipt,
  ChevronUp as ExpandMore,
  ChevronDown as ExpandLess,
  Users,
  DollarSign,
  Target,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { jsPDF } from "jspdf";
import "jspdf-autotable";
// Import your sales-related Redux slices
import { fetchOrders } from '../../redux/slices/orderSlice';
import { fetchCustomers } from '../../redux/slices/customerSlice';
import { fetchMenuItems } from '../../redux/slices/menuSlice';
import { fetchInventories } from '../../redux/slices/stockSlice';
import { fetchTransactionsByRestaurant } from '../../redux/slices/transactionSlice';

export default function SalesAnalytics() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Redux state - Fixed selectors to match store configuration
  const { orders = [], loading: ordersLoading = false } = useSelector(
    (state) => state.orders || { orders: [], loading: false }
  );
  const { customers = [], loading: customersLoading = false } = useSelector(
    (state) => state.customers || { customers: [], loading: false }
  );
  const { menuItems = [], loading: menuItemsLoading = false } = useSelector(
    (state) => state.menuItems || { menuItems: [], loading: false }
  );
  const { inventories = [], loading: inventoriesLoading = false } = useSelector(
    (state) => state.inventories || { inventories: [], loading: false }
  );
  const transactionsState = useSelector((state) => state.transactions || { transactions: [], loading: false });
  const transactions = transactionsState.transactions || [];
  const transactionsLoading = transactionsState.loading || false;

  // Debug Redux state
  console.log("🔍 Redux State Debug:", {
    orders: orders.length,
    customers: customers.length,
    menuItems: menuItems.length,
    inventories: inventories.length,
    transactions: transactions.length,
    ordersLoading,
    customersLoading,
    menuItemsLoading,
    inventoriesLoading,
    transactionsLoading
  });

  const [restaurantId, setRestaurantId] = useState(null);
  const [token, setToken] = useState(null);

  // Initialize restaurantId and token once
  useEffect(() => {
    const storedRestaurantId = localStorage.getItem('restaurantId');
    const storedToken = localStorage.getItem('authToken');
    setRestaurantId(storedRestaurantId);
    setToken(storedToken);
  }, []);

  // Local state with persistence
  const [salesData, setSalesData] = useState(() => {
    const saved = localStorage.getItem('salesAnalytics_salesData');
    return saved ? JSON.parse(saved) : [];
  });
  const [menuPerformanceData, setMenuPerformanceData] = useState(() => {
    const saved = localStorage.getItem('salesAnalytics_menuPerformanceData');
    return saved ? JSON.parse(saved) : [];
  });
  const [customerAnalyticsData, setCustomerAnalyticsData] = useState(() => {
    const saved = localStorage.getItem('salesAnalytics_customerAnalyticsData');
    return saved ? JSON.parse(saved) : [];
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('menu'); // 'sales', 'menu', 'customers'
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [topItemsPeriod, setTopItemsPeriod] = useState('weekly'); // 'weekly' or 'monthly'
  const [showTopItemsList, setShowTopItemsList] = useState(false);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!restaurantId || !token) {
        setError('Restaurant ID or token not found');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        await Promise.all([
          dispatch(fetchOrders({ restaurantId, token })),
          dispatch(fetchCustomers({ restaurantId, token })),
          dispatch(fetchMenuItems({ restaurantId, token })),
          dispatch(fetchInventories({ restaurantId, token })),
          dispatch(fetchTransactionsByRestaurant({ restaurantId, token }))
        ]);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data from server');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [restaurantId, token, dispatch]);

  // Transform sales data
  useEffect(() => {
    if (!Array.isArray(orders) || orders.length === 0) {
      return;
    }

    // Prevent unnecessary re-processing if data hasn't changed
    const ordersString = JSON.stringify(orders.map(o => ({ id: o._id, createdAt: o.createdAt })));
    if (ordersString === salesData.length > 0 ? JSON.stringify(salesData.map(s => ({ id: s.id, createdAt: s.createdAt }))) : '') {
      return;
    }

    try {
      const transformedSalesData = orders
        .filter(order => order && order._id)
        .map((order) => {
          const orderDate = new Date(order.createdAt || new Date());
          const items = order.items || [];

          const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          const tax = order.tax || (subtotal * 0.18);
          const discount = order.discount || 0;
          const totalAmount = subtotal + tax - discount;

          const totalCost = items.reduce((sum, item) => {
            const menuItem = menuItems.find(m => m._id === item.menuItemId);
            const itemCost = menuItem?.costPrice || (item.price * 0.6);
            return sum + (itemCost * item.quantity);
          }, 0);

          console.log(totalCost, "totalCost")

          const profit = totalAmount - totalCost;
          const profitMargin = totalAmount > 0 ? ((profit / totalAmount) * 100).toFixed(2) : 0;

          return {
            id: order._id,
            orderId: order.orderId || order._id.slice(-6),
            customerName: order.customer?.name || order.customerName || 'Walk-in Customer',
            customerId: order.customerId,
            orderDate: orderDate.toISOString().split('T')[0],
            orderTime: orderDate.toTimeString().slice(0, 5),
            items: items.map(item => ({
              name: item.name || item.itemName,
              quantity: item.quantity,
              price: item.price,
              total: item.price * item.quantity,
              category: item.categoryName || 'General',
              menuItemId: item.itemId || item.menuItemId, // Try both field names
            })),
            itemsCount: items.length,
            subtotal: subtotal.toFixed(2),
            tax: tax.toFixed(2),
            discount: discount.toFixed(2),
            totalAmount: totalAmount.toFixed(2),
            totalCost: totalCost.toFixed(2),
            profit: profit.toFixed(2),
            profitMargin: profitMargin,
            status: order.status,
            paymentMethod: order.paymentMethod || 'cash',
            orderType: order.orderType || 'dine-in',
            waiterId: order.waiterId,
            tableNumber: order.tableNumber,
            createdAt: order.createdAt,
            completedAt: order.completedAt
          };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setSalesData(transformedSalesData);

      // Save to localStorage for persistence
      localStorage.setItem('salesAnalytics_salesData', JSON.stringify(transformedSalesData));
    } catch (error) {
      console.error('❌ Error transforming sales data:', error);
      setError('Error processing sales data');
    }
  }, [orders, menuItems]);

  // Transform menu performance data
  useEffect(() => {
    if (menuItems.length === 0 || inventories.length === 0) {
      return;
    }

    // Prevent unnecessary re-processing if data hasn't changed
    const menuItemsString = JSON.stringify(menuItems.map(m => ({ id: m._id, itemName: m.itemName, price: m.price })));
    const inventoriesString = JSON.stringify(inventories.map(i => ({ id: i._id, stock: i.stock })));
    const currentDataString = JSON.stringify(menuPerformanceData.map(m => ({ id: m.id, itemName: m.itemName })));

    if (menuItemsString === currentDataString && inventoriesString === currentDataString) {
      return;
    }

    try {
      const menuPerformance = {};

      // Process menu items directly (not from orders)
      menuItems.forEach(menuItem => {
        // Skip deleted items
        if (menuItem.status === 0) {
          return;
        }
        const itemName = menuItem.itemName;
        const basePrice = menuItem.price || 0;

        // Process each size separately
        if (menuItem.sizes && menuItem.sizes.length > 0) {
          menuItem.sizes.forEach(size => {
            const sizeName = size.name || size.label || 'Regular';
            const sizePrice = size.price || basePrice;
            const sizeKey = `${itemName}_${sizeName}`;

            if (!menuPerformance[sizeKey]) {
              menuPerformance[sizeKey] = {
                id: `${menuItem._id}_${sizeName}`, // Unique ID for each size
                itemName: itemName,
                sizeName: sizeName,
                menuId: menuItem.menuId,
                category: menuItem.categoryName || menuItem.sub_category || 'General',
                totalQuantity: menuItem.stock || 0,
                totalRevenue: 0,
                totalCost: 0,
                orderCount: 0,
                averagePrice: sizePrice,
                averageCostPrice: 0,
                profit: 0,
                profitMargin: 0,
                sizes: [sizeName],
                menuItem: menuItem,
                sizeInfo: size
              };
            }
          });
        } else {
          // No sizes, use base price
          if (!menuPerformance[itemName]) {
            menuPerformance[itemName] = {
              id: menuItem._id,
              itemName: itemName,
              sizeName: 'Regular',
              menuId: menuItem.menuId,
              category: menuItem.categoryName || menuItem.sub_category || 'General',
              totalQuantity: menuItem.stock || 0,
              totalRevenue: 0,
              totalCost: 0,
              orderCount: 0,
              averagePrice: basePrice,
              averageCostPrice: 0,
              profit: 0,
              profitMargin: 0,
              sizes: ['Regular'],
              menuItem: menuItem
            };
          }
        }

        // Apply cost to all sizes of this menu item
        Object.values(menuPerformance).forEach(performanceItem => {
          if (performanceItem.menuItem._id === menuItem._id) {
            // Calculate cost from menu item's stockItems (ingredients) using actual inventory data
            // Filter ingredients based on the specific size
            let itemCost = 0;
            if (menuItem.stockItems && menuItem.stockItems.length > 0) {
              // Filter ingredients that match the current size
              const sizeSpecificIngredients = menuItem.stockItems.filter(stockItem => {
                return stockItem.size === performanceItem.sizeName || stockItem.size === performanceItem.sizeName.toLowerCase();
              });

              // Calculate cost based on actual inventory data with unit conversion
              itemCost = sizeSpecificIngredients.reduce((totalCost, stockItem) => {
                // Find the inventory item
                const inventoryItem = inventories.find(inv => String(inv._id) === String(stockItem.stockId));

                if (inventoryItem && inventoryItem.supplierStocks && inventoryItem.supplierStocks.length > 0) {
                  // Get the latest purchase from supplierStocks
                  const latestPurchase = [...inventoryItem.supplierStocks].sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt))[0];

                  if (latestPurchase) {
                    // === Inventory values ===
                    const inventoryRate = latestPurchase.pricePerUnit || 0;       // rate per unit (e.g. 25/kg, 60/litre, etc.)
                    const unit = stockItem.unit?.toLowerCase() || inventoryItem.unit?.toLowerCase() || "unit";

                    // === Convert rate into smallest unit ===
                    let currentRate = 0;
                    if (unit === "kg") {
                      currentRate = inventoryRate; // per kg
                    } else if (unit === "gm") {
                      currentRate = inventoryRate / 1000; // per gm (kg/1000)
                    } else if (unit === "litre" || unit === "liter" || unit === "ltr") {
                      currentRate = inventoryRate; // per ltr (no conversion needed)
                    } else if (unit === "ml" || unit === "milliliter") {
                      currentRate = inventoryRate / 1000; // per ml (ltr/1000)
                    } else if (unit === "pcs" || unit === "pieces") {
                      currentRate = inventoryRate; // per piece
                    } else {
                      currentRate = inventoryRate; // fallback
                    }

                    // === Calculate total cost for this ingredient ===
                    const ingredientCost = currentRate * stockItem.quantity;
                    return totalCost + ingredientCost;
                  }
                }

                // Fallback: use 40% of selling price as cost
                const estimatedCostPerUnit = (performanceItem.averagePrice || 0) * 0.4;
                return totalCost + (estimatedCostPerUnit * stockItem.quantity);
              }, 0);
            } else {
              // Fallback: use 40% of selling price as cost
              itemCost = (performanceItem.averagePrice || 0) * 0.4;
            }

            performanceItem.totalCost = itemCost;
            performanceItem.totalRevenue = performanceItem.averagePrice * (menuItem.stock || 0);
          }
        });
      });

      const menuPerformanceArray = Object.values(menuPerformance)
        .map(item => {
          const itemPrice = item.averagePrice; // Use size-specific price
          item.averageCostPrice = item.totalCost.toFixed(2);

          const profit = itemPrice - item.totalCost;
          item.profit = parseFloat(profit.toFixed(2));
          item.profitMargin = itemPrice > 0
            ? ((profit / itemPrice) * 100).toFixed(1)
            : "0";

          return item;
        })
        .sort((a, b) => b.profit - a.profit);

      setMenuPerformanceData(menuPerformanceArray);

      // Save to localStorage for persistence
      localStorage.setItem('salesAnalytics_menuPerformanceData', JSON.stringify(menuPerformanceArray));
    } catch (error) {
      console.error("❌ Error transforming menu performance data:", error);
      setError(`Menu performance data processing failed: ${error.message}`);
    }
  }, [menuItems, inventories]);

  // Transform customer analytics data
  useEffect(() => {
    if (salesData.length === 0) return;

    try {
      const customerAnalytics = {};

      salesData.forEach(order => {
        const customerId = order.customerId || order.customerName;
        if (!customerAnalytics[customerId]) {
          customerAnalytics[customerId] = {
            customerId: customerId,
            customerName: order.customerName,
            totalOrders: 0,
            totalSpent: 0,
            averageOrderValue: 0,
            lastOrderDate: order.orderDate,
            favoriteItems: {},
            orderFrequency: 0
          };
        }

        customerAnalytics[customerId].totalOrders += 1;
        customerAnalytics[customerId].totalSpent += parseFloat(order.totalAmount);

        if (new Date(order.orderDate) > new Date(customerAnalytics[customerId].lastOrderDate)) {
          customerAnalytics[customerId].lastOrderDate = order.orderDate;
        }

        order.items.forEach(item => {
          if (!customerAnalytics[customerId].favoriteItems[item.name]) {
            customerAnalytics[customerId].favoriteItems[item.name] = 0;
          }
          customerAnalytics[customerId].favoriteItems[item.name] += item.quantity;
        });
      });

      const customerAnalyticsArray = Object.values(customerAnalytics).map(customer => {
        customer.averageOrderValue = (customer.totalSpent / customer.totalOrders).toFixed(2);

        const favoriteItemEntry = Object.entries(customer.favoriteItems)
          .sort(([, a], [, b]) => b - a)[0];
        customer.favoriteItem = favoriteItemEntry ? favoriteItemEntry[0] : 'None';

        const customerOrders = salesData.filter(order => (order.customerId || order.customerName) === customer.customerId);
        const firstOrder = Math.min(...customerOrders.map(order => new Date(order.orderDate).getTime()));
        const daysSinceFirstOrder = (Date.now() - firstOrder) / (1000 * 60 * 60 * 24);
        customer.orderFrequency = daysSinceFirstOrder > 30 ?
          (customer.totalOrders / (daysSinceFirstOrder / 30)).toFixed(1) : customer.totalOrders.toString();

        return customer;
      }).sort((a, b) => b.totalSpent - a.totalSpent);

      setCustomerAnalyticsData(customerAnalyticsArray);

      // Save to localStorage for persistence
      localStorage.setItem('salesAnalytics_customerAnalyticsData', JSON.stringify(customerAnalyticsArray));
    } catch (error) {
      console.error('Error transforming customer analytics data:', error);
    }
  }, [salesData]);

  // Max Heap (Priority Queue) implementation for top items
  class MaxHeap {
    constructor(compareFn) {
      this.heap = [];
      this.compare = compareFn || ((a, b) => a.frequency - b.frequency);
    }

    push(item) {
      this.heap.push(item);
      this.heapifyUp(this.heap.length - 1);
    }

    pop() {
      if (this.heap.length === 0) return null;
      if (this.heap.length === 1) return this.heap.pop();

      const top = this.heap[0];
      this.heap[0] = this.heap.pop();
      this.heapifyDown(0);
      return top;
    }

    size() {
      return this.heap.length;
    }

    heapifyUp(index) {
      while (index > 0) {
        const parentIndex = Math.floor((index - 1) / 2);
        if (this.compare(this.heap[parentIndex], this.heap[index]) >= 0) break;
        [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]];
        index = parentIndex;
      }
    }

    heapifyDown(index) {
      while (true) {
        let largest = index;
        const left = 2 * index + 1;
        const right = 2 * index + 2;

        if (left < this.heap.length && this.compare(this.heap[left], this.heap[largest]) > 0) {
          largest = left;
        }
        if (right < this.heap.length && this.compare(this.heap[right], this.heap[largest]) > 0) {
          largest = right;
        }

        if (largest === index) break;
        [this.heap[index], this.heap[largest]] = [this.heap[largest], this.heap[index]];
        index = largest;
      }
    }
  }

  // Function to get top items using frequency map and max heap
  const getTopItemsByFrequency = (period = 'weekly', topK = 3) => {
    try {
      if (!transactions || transactions.length === 0) {
        console.log('⚠️ No transactions available');
        return [];
      }

      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      let startDate;
      if (period === 'weekly') {
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
      } else {
        // Monthly - 1 month ago from current date to today
        startDate = new Date(today);
        startDate.setMonth(startDate.getMonth() - 1); // Go back 1 month
        startDate.setHours(0, 0, 0, 0);
      }

      console.log(`📅 ${period.toUpperCase()} Date Range:`, {
        startDate: startDate.toISOString(),
        endDate: today.toISOString(),
        totalTransactions: transactions.length
      });

      // Filter transactions by date range
      const filteredTransactions = transactions.filter(transaction => {
        if (!transaction.createdAt) return false;
        
        // Exclude CashIn/CashOut transactions
        if (transaction.type === 'CashIn' || transaction.type === 'CashOut' || 
            transaction.type === 'bank_in' || transaction.type === 'bank_out') {
          return false;
        }
        
        if (transaction.status === 'cancelled') return false;
        
        if (!transaction.items || !Array.isArray(transaction.items) || transaction.items.length === 0) {
          return false;
        }
        
        const transactionDate = new Date(transaction.createdAt);
        
        // For both weekly and monthly: Check date range
        // Reset time to start of day for accurate comparison
        const transactionDateOnly = new Date(transactionDate);
        transactionDateOnly.setHours(0, 0, 0, 0);
        const startDateOnly = new Date(startDate);
        startDateOnly.setHours(0, 0, 0, 0);
        const todayOnly = new Date(today);
        todayOnly.setHours(23, 59, 59, 999); // Include today's full day
        
        // Check if transaction is within the date range
        return transactionDate >= startDateOnly && transactionDate <= todayOnly;
      });

      console.log(`✅ Filtered ${period} transactions:`, filteredTransactions.length);

      // Create frequency map - count how many times each item appears in transactions
      // Frequency = कितनी बार item transactions में आया (कितने orders में वो item है)
      // Total Quantity = सभी transactions में उस item की कुल quantity का sum (कुल कितने units बिके)
      // Example: 
      //   - Transaction 1: Burger (quantity: 2) -> frequency = 1, totalQuantity = 2
      //   - Transaction 2: Burger (quantity: 3) -> frequency = 2, totalQuantity = 5
      //   - Transaction 3: Burger (quantity: 1) -> frequency = 3, totalQuantity = 6
      const itemFrequencyMap = {};
      
      filteredTransactions.forEach(transaction => {
        if (transaction.items && Array.isArray(transaction.items)) {
          transaction.items.forEach(item => {
            const itemName = item.itemName || 'Unknown';
            
            if (!itemFrequencyMap[itemName]) {
              itemFrequencyMap[itemName] = {
                itemName: itemName,
                frequency: 0,           // कितने transactions में यह item आया
                totalQuantity: 0,       // सभी transactions में इस item की कुल quantity
                totalRevenue: 0         // सभी transactions में इस item की कुल revenue
              };
            }
            
            // Increment frequency (count each occurrence in transaction)
            // हर transaction में item आने पर frequency +1 होगी
            itemFrequencyMap[itemName].frequency += 1;
            
            // Add quantity (sum of all quantities across all transactions)
            // सभी transactions में item की quantity का sum
            itemFrequencyMap[itemName].totalQuantity += (parseInt(item.quantity) || 0);
            itemFrequencyMap[itemName].totalRevenue += (parseFloat(item.subtotal) || 0);
          });
        }
      });

      console.log(`📊 ${period.toUpperCase()} Item Frequency Map:`, {
        uniqueItems: Object.keys(itemFrequencyMap).length,
        items: Object.entries(itemFrequencyMap).slice(0, 5).map(([name, data]) => ({
          name,
          frequency: data.frequency,
          quantity: data.totalQuantity
        }))
      });

      // Use Max Heap to get top K items based on frequency
      const heap = new MaxHeap((a, b) => {
        // Compare by frequency first, then by totalQuantity
        if (a.frequency !== b.frequency) {
          return a.frequency - b.frequency;
        }
        return a.totalQuantity - b.totalQuantity;
      });

      // Add all items to heap
      Object.values(itemFrequencyMap).forEach(item => {
        heap.push(item);
      });

      // Extract top K items
      const topItems = [];
      const itemsToExtract = Math.min(topK, heap.size());
      
      for (let i = 0; i < itemsToExtract; i++) {
        const item = heap.pop();
        if (item) topItems.push(item);
      }

      // Reverse to get descending order (highest frequency first)
      const result = topItems.reverse();
      console.log(`🏆 ${period.toUpperCase()} Top ${topK} Items:`, result);
      return result;
    } catch (error) {
      console.error('❌ Error getting top items by frequency:', error);
      return [];
    }
  };

  // Function to calculate top item based on transactions from last 7 days
  const calculateTopItemFromTransactions = () => {
    const topItems = getTopItemsByFrequency('weekly', 1);
    return topItems.length > 0 ? topItems[0].itemName : 'N/A';
  };

  const getSummaryData = () => {
    if (viewMode === 'sales') {
      const totalRevenue = filteredData.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
      const totalOrders = filteredData.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const totalProfit = filteredData.reduce((sum, order) => sum + parseFloat(order.profit), 0);

      return {
        main: totalRevenue,
        mainLabel: 'Total Revenue',
        secondary: totalOrders,
        secondaryLabel: 'Total Orders',
        third: averageOrderValue,
        thirdLabel: 'Avg Order Value',
        fourth: totalProfit,
        fourthLabel: 'Total Profit'
      };
    } else if (viewMode === 'menu') {
      const totalRevenue = filteredData.reduce((sum, item) => sum + item.totalRevenue, 0);
      const totalItemsSold = filteredData.reduce((sum, item) => sum + item.totalQuantity, 0);
      const totalProfit = filteredData.reduce((sum, item) => sum + item.profit, 0);
      
      // Calculate top item from transactions (based on selected period)
      const topItems = getTopItemsByFrequency(topItemsPeriod, 1);
      let topItem = topItems.length > 0 ? topItems[0].itemName : 'N/A';
      
      // Fallback: If no transactions found, use the first item from filtered data
      if (topItem === 'N/A' && filteredData.length > 0) {
        topItem = filteredData[0].itemName || 'N/A';
        console.log('⚠️ Using fallback top item from filtered data:', topItem);
      }

      return {
        main: totalRevenue,
        mainLabel: 'Menu Revenue',
        secondary: totalItemsSold,
        secondaryLabel: 'Items Sold',
        third: totalProfit,
        thirdLabel: 'Total Profit',
        fourth: topItem,
        fourthLabel: 'Top Item'
      };
    } else {
      const totalCustomers = filteredData.length;
      const totalRevenue = filteredData.reduce((sum, customer) => sum + customer.totalSpent, 0);
      const averageSpending = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
      const loyalCustomers = filteredData.filter(customer => customer.totalOrders > 5).length;

      return {
        main: totalRevenue,
        mainLabel: 'Customer Revenue',
        secondary: totalCustomers,
        secondaryLabel: 'Total Customers',
        third: averageSpending,
        thirdLabel: 'Avg Customer Value',
        fourth: loyalCustomers,
        fourthLabel: 'Loyal Customers'
      };
    }
  };

  const getCurrentData = () => {
    switch (viewMode) {
      case 'sales':
        return salesData;
      case 'menu':
        return menuPerformanceData;
      case 'customers':
        return customerAnalyticsData;
      default:
        return salesData;
    }
  };

  const currentData = getCurrentData();

  const filteredData = useMemo(() => {
    return currentData.filter(item => {
      if (!item) return false;

      let matchesDate = true;
      if (startDate || endDate) {
        const itemDate = new Date(viewMode === 'customers' ? item.lastOrderDate : item.orderDate);
        if (startDate) matchesDate = matchesDate && itemDate >= new Date(startDate);
        if (endDate) matchesDate = matchesDate && itemDate <= new Date(endDate);
      }

      const matchesCategory = !categoryFilter ||
        (viewMode === 'sales' && item.items.some(orderItem => orderItem.category === categoryFilter)) ||
        (viewMode === 'menu' && item.category === categoryFilter);

      const matchesStatus = !statusFilter ||
        (viewMode === 'sales' && item.status === statusFilter);

      let matchesSearch = true;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (viewMode === 'sales') {
          matchesSearch = (item.orderId?.toLowerCase() || '').includes(query) ||
            (item.customerName?.toLowerCase() || '').includes(query) ||
            item.items.some(orderItem => (orderItem.name?.toLowerCase() || '').includes(query));
        } else if (viewMode === 'menu') {
          matchesSearch = (item.itemName?.toLowerCase() || '').includes(query) ||
            (item.category?.toLowerCase() || '').includes(query);
        } else {
          matchesSearch = (item.customerName?.toLowerCase() || '').includes(query) ||
            (item.favoriteItem?.toLowerCase() || '').includes(query);
        }
      }

      return matchesDate && matchesCategory && matchesStatus && matchesSearch;
    });
  }, [currentData, startDate, endDate, categoryFilter, statusFilter, searchQuery, viewMode]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExpandRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const exportCSV = () => {
    let csvRows = [];
    let fileName = `analytics-${new Date().toISOString().split('T')[0]}.csv`;

    switch (viewMode) {
      case 'sales':
        csvRows = [
          ["Order ID", "Customer", "Date", "Time", "Items", "Subtotal", "Tax", "Total", "Profit", "Status", "Payment Method"],
          ...filteredData.map(o => [o.orderId, o.customerName, o.orderDate, o.orderTime, o.itemsCount, o.subtotal, o.tax, o.totalAmount, o.profit, o.status, o.paymentMethod])
        ];
        fileName = `sales-${fileName}`;
        break;
      case 'menu':
        csvRows = [
          ["Menu Item", "Menu ID", "Size", "Cost Price (CP)", "Sold Price (SP)", "Profit", "Profit Percentage (%)", "Total Quantity", "Total Revenue"],
          ...filteredData.map(item => [
            item.itemName,
            item.menuId || '',
            item.sizeName || item.sizes?.join(', ') || 'Regular',
            item.averageCostPrice || item.totalCost.toFixed(2),
            item.averagePrice,
            item.profit,
            item.profitMargin,
            item.totalQuantity,
            item.totalRevenue
          ])
        ];
        fileName = `menu-performance-${fileName}`;
        break;
      case 'customers':
        csvRows = [
          ["Customer Name", "Total Orders", "Total Spent", "Avg Order Value", "Last Order", "Favorite Item", "Order Frequency (/month)"],
          ...filteredData.map(c => [c.customerName, c.totalOrders, c.totalSpent, c.averageOrderValue, c.lastOrderDate, c.favoriteItem, c.orderFrequency])
        ];
        fileName = `customers-${fileName}`;
        break;
      default:
        return;
    }

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = fileName;
    link.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    const summaryData = getSummaryData();

    doc.setFontSize(16);
    doc.text(`${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} Analytics Report`, 14, 20);

    if (viewMode === 'sales') {
      doc.autoTable({
        startY: 30,
        head: [["Order ID", "Customer", "Date", "Total", "Profit", "Status"]],
        body: filteredData.slice(0, 50).map(o => [o.orderId, o.customerName, o.orderDate, `₹${o.totalAmount}`, `₹${o.profit}`, o.status]),
        styles: { fontSize: 8 },
      });
    } else if (viewMode === 'menu') {
      doc.autoTable({
        startY: 30,
        head: [["Menu Item", "Size", "Cost Price (CP)", "Sold Price (SP)", "Profit", "Profit Percentage (%)"]],
        body: filteredData.slice(0, 50).map(item => [
          item.itemName,
          item.sizeName || item.sizes?.join(', ') || 'Regular',
          `₹${item.averageCostPrice || item.totalCost.toFixed(2)}`,
          `₹${item.averagePrice}`,
          `₹${item.profit}`,
          `${item.profitMargin}%`
        ]),
        styles: { fontSize: 8 },
      });
    } else {
      doc.autoTable({
        startY: 30,
        head: [["Customer", "Orders", "Total Spent", "Avg Order", "Last Order"]],
        body: filteredData.slice(0, 50).map(c => [c.customerName, c.totalOrders, `₹${c.totalSpent.toFixed(2)}`, `₹${c.averageOrderValue}`, c.lastOrderDate]),
        styles: { fontSize: 8 },
      });
    }

    doc.save(`${viewMode}-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const availableStatuses = [...new Set(salesData.map(order => order.status).filter(Boolean))];

  if (loading || ordersLoading || customersLoading || menuItemsLoading || inventoriesLoading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading sales data...</Typography>
      </Box>
    );
  }


  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>Retry</Button>
      </Box>
    );
  }

  const summaryData = getSummaryData();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        <h2 className="text-center text-2xl font-semibold">
          Sales Analytics Dashboard
        </h2>
      </Typography>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={12} md={3}>
            <Typography variant="h6" sx={{
              textAlign: { xs: 'center', sm: 'center', md: 'left' },
              mb: { xs: 1, sm: 1, md: 0 }
            }}>
              View Mode:
            </Typography>
          </Grid>
          <Grid item xs={12} sm={12} md={9}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems="center"
              sx={{
                width: '100%',
                justifyContent: { xs: 'center', sm: 'flex-start' }
              }}
            >
              {/* Sales Overview button hidden */}
              {/* <Button 
                variant={viewMode === 'sales' ? 'contained' : 'outlined'} 
                startIcon={<Receipt />} 
                onClick={() => setViewMode('sales')}
                sx={{ 
                  minWidth: { xs: '100%', sm: 'auto' },
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                Sales Overview
              </Button> */}
              <Button
                variant={viewMode === 'menu' ? 'contained' : 'outlined'}
                startIcon={<BarChart3 />}
                onClick={() => setViewMode('menu')}
                sx={{
                  minWidth: { xs: '100%', sm: 'auto' },
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  py: { xs: 1.5, sm: 1 },
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                Menu Performance
              </Button>
              {/* Customer Analytics button hidden */}
              {/* <Button 
                variant={viewMode === 'customers' ? 'contained' : 'outlined'} 
                startIcon={<Users />} 
                onClick={() => setViewMode('customers')}
                sx={{ 
                  minWidth: { xs: '100%', sm: 'auto' },
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                Customer Analytics
              </Button> */}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: 3, height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <DollarSign />
                <Box>
                  <Typography variant="h5">₹{summaryData.main.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
                  <Typography color="text.secondary">{summaryData.mainLabel}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: 3, height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Target />
                <Box>
                  <Typography variant="h5">{summaryData.secondary.toLocaleString()}</Typography>
                  <Typography color="text.secondary">{summaryData.secondaryLabel}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: 3, height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <TrendingUp />
                <Box>
                  <Typography variant="h5">{typeof summaryData.third === 'number' ? `₹${summaryData.third.toFixed(2)}` : summaryData.third}</Typography>
                  <Typography color="text.secondary">{summaryData.thirdLabel}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: 3, height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <PieChartIcon />
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={1} justifyContent="space-between">
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h5" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {typeof summaryData.fourth === 'number' ? `₹${summaryData.fourth.toFixed(2)}` : summaryData.fourth}
                      </Typography>
                      <Typography color="text.secondary">{summaryData.fourthLabel}</Typography>
                    </Box>
                    {viewMode === 'menu' && (
                      <FormControl size="small" sx={{ minWidth: 100 }}>
                        <Select
                          value={topItemsPeriod}
                          onChange={(e) => setTopItemsPeriod(e.target.value)}
                          sx={{ fontSize: '0.75rem' }}
                        >
                          <MenuItem value="weekly">Weekly</MenuItem>
                          <MenuItem value="monthly">Monthly</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  </Stack>
                  {viewMode === 'menu' && (
                    <Button
                      size="small"
                      onClick={() => setShowTopItemsList(!showTopItemsList)}
                      sx={{ mt: 1, fontSize: '0.7rem' }}
                    >
                      {showTopItemsList ? 'Hide' : 'Show'} Top Items List
                    </Button>
                  )}
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button variant="contained" color="primary" onClick={exportCSV}>Export CSV</Button>
        <Button variant="contained" color="secondary" onClick={exportPDF}>Export PDF</Button>
      </Stack>

      {/* Top Items List Section */}
      {viewMode === 'menu' && showTopItemsList && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: 3 }}>
          <Typography variant="h6" gutterBottom>
            Top Items ({topItemsPeriod === 'weekly' ? 'Last 7 Days' : 'Current Month'})
          </Typography>
          {(() => {
            const topItems = getTopItemsByFrequency(topItemsPeriod, 3);
            
            if (topItems.length === 0) {
              return (
                <Alert severity="info">
                  No top items data available for {topItemsPeriod === 'weekly' ? 'last 7 days' : 'current month'}.
                </Alert>
              );
            }

            return (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Rank</strong></TableCell>
                      <TableCell><strong>Item Name</strong></TableCell>
                      <TableCell align="right"><strong>Frequency</strong></TableCell>
                      <TableCell align="right"><strong>Total Quantity</strong></TableCell>
                      <TableCell align="right"><strong>Total Revenue</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topItems.map((item, index) => (
                      <TableRow key={item.itemName || index} hover>
                        <TableCell>
                          <Chip 
                            label={`#${index + 1}`} 
                            color={index < 3 ? 'primary' : 'default'} 
                            size="small"
                          />
                        </TableCell>
                        <TableCell><strong>{item.itemName || 'Unknown'}</strong></TableCell>
                        <TableCell align="right">{item.frequency || 0}</TableCell>
                        <TableCell align="right">{item.totalQuantity || 0}</TableCell>
                        <TableCell align="right">₹{parseFloat(item.totalRevenue || 0).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            );
          })()}
        </Paper>
      )}

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: 3 }}>
        <Typography variant="h6" gutterBottom>Search & Filters</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }} />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField fullWidth label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField fullWidth label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          {viewMode === 'sales' && (
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                  <MenuItem value="">All Statuses</MenuItem>
                  {availableStatuses.map((status) => (<MenuItem key={status} value={status}>{status}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
          )}
          <Grid item xs={12} md={2}>
            <Button fullWidth variant="outlined" onClick={() => { setSearchQuery(''); setStartDate(''); setEndDate(''); setStatusFilter(''); }} sx={{ height: '56px' }}>Clear</Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, }}>
        <Typography variant="h6" gutterBottom>{viewMode === 'sales' ? 'Sales Orders' : viewMode === 'menu' ? 'Menu Performance' : 'Customer Analytics'} ({filteredData.length} records)</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {viewMode === 'sales' ?
                  ["Order ID", "Customer", "Date", "Total", "Profit", "Status", "Details"].map((h) => (
                    <TableCell
                      key={h}
                      sx={{
                        fontWeight: "bold",
                        // ✅ FIX: Ensure text is white/light for visibility
                        color: 'var(--cui-body-color)'
                      }}>
                      {h}
                    </TableCell>
                  ))
                  : viewMode === 'menu' ?
                    ["Menu Item", "Size", "Cost Price (CP)", "Sold Price (SP)", "Profit", "Profit Percentage (%)"].map((h) => (
                      <TableCell
                        key={h}
                        sx={{
                          fontWeight: "bold",
                          // ✅ FIX: Ensure text is white/light for visibility
                          color: 'var(--cui-body-color)'
                        }}>
                        {h}
                      </TableCell>
                    ))
                    :
                    ["Customer", "Orders", "Total Spent", "Avg Order", "Last Order", "Favorite Item", "Frequency"].map((h) => (
                      <TableCell
                        key={h}
                        sx={{
                          fontWeight: "bold",
                          // ✅ FIX: Ensure text is white/light for visibility
                          color: 'var(--cui-body-color)'
                        }}>
                        {h}
                      </TableCell>
                    ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item, idx) => (
                <React.Fragment key={item.id || item.itemName || item.customerId}>
                  <TableRow hover>
                    {viewMode === 'sales' ? (
                      <>
                        <TableCell>{item.orderId}</TableCell>
                        <TableCell>{item.customerName}</TableCell>
                        <TableCell>{item.orderDate}</TableCell>
                        <TableCell>₹{item.totalAmount}</TableCell>
                        <TableCell color={parseFloat(item.profit) > 0 ? 'success.main' : 'error.main'}>₹{item.profit}</TableCell>
                        <TableCell><Chip label={item.status} color={getStatusColor(item.status)} size="small" /></TableCell>
                        <TableCell><IconButton onClick={() => handleExpandRow(item.id)} size="small">{expandedRows.has(item.id) ? <ExpandLess /> : <ExpandMore />}</IconButton></TableCell>
                      </>
                    ) : viewMode === 'menu' ? (
                      <>
                        <TableCell>
                          <Stack>
                            <Typography variant="body2" fontWeight="medium">{item.itemName}</Typography>
                            <Typography variant="caption" color="text.secondary">{item.menuId}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.sizeName || item.sizes?.join(', ') || 'Regular'}
                            color="primary"
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>₹{item.averageCostPrice || item.totalCost.toFixed(2)}</TableCell>
                        <TableCell>₹{item.averagePrice}</TableCell>
                        <TableCell color="success.main">₹{item.profit}</TableCell>
                        <TableCell><Typography color={parseFloat(item.profitMargin) >= 20 ? "success.main" : "warning.main"}>{item.profitMargin}%</Typography></TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>{item.customerName}</TableCell>
                        <TableCell>{item.totalOrders}</TableCell>
                        <TableCell>₹{item.totalSpent.toFixed(2)}</TableCell>
                        <TableCell>₹{item.averageOrderValue}</TableCell>
                        <TableCell>{item.lastOrderDate}</TableCell>
                        <TableCell>{item.favoriteItem}</TableCell>
                        <TableCell>{item.orderFrequency}/month</TableCell>
                      </>
                    )}
                  </TableRow>
                  {viewMode === 'sales' && (
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                        <Collapse in={expandedRows.has(item.id)} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 1 }}>
                            <Typography variant="h6" gutterBottom>Order Details</Typography>
                            <Table size="small">
                              <TableHead>
                                <TableRow><TableCell>Item</TableCell><TableCell>Quantity</TableCell><TableCell>Price</TableCell><TableCell>Total</TableCell></TableRow>
                              </TableHead>
                              <TableBody>
                                {item.items?.map((orderItem, i) => (<TableRow key={i}><TableCell>{orderItem.name}</TableCell><TableCell>{orderItem.quantity}</TableCell><TableCell>₹{orderItem.price}</TableCell><TableCell>₹{orderItem.total.toFixed(2)}</TableCell></TableRow>))}
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={filteredData.length} page={page} onPageChange={handleChangePage} rowsPerPage={rowsPerPage} onRowsPerPageChange={handleChangeRowsPerPage} />
      </Paper>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        {viewMode === 'sales' && (
          <>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
                <Typography variant="h6" gutterBottom>Daily Revenue Trend</Typography>
                {filteredData.length > 0 ? (
                  <LineChart
                    dataset={Object.entries(filteredData.reduce((acc, order) => {
                      acc[order.orderDate] = (acc[order.orderDate] || 0) + parseFloat(order.totalAmount);
                      return acc;
                    }, {})).map(([date, revenue]) => ({ date, revenue }))}
                    xAxis={[{ dataKey: "date", scaleType: 'band' }]}
                    series={[{ dataKey: "revenue", label: "Revenue (₹)" }]}
                    height={400}
                  />
                ) : (<Alert severity="info">No data for chart</Alert>)}
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
                <Typography variant="h6" gutterBottom>Order Status</Typography>
                {filteredData.length > 0 ? (
                  <PieChart
                    series={[{
                      data: Object.entries(filteredData.reduce((acc, order) => {
                        acc[order.status] = (acc[order.status] || 0) + 1;
                        return acc;
                      }, {})).map(([label, value]) => ({ id: label, value, label }))
                    }]}
                    height={400}
                  />
                ) : (<Alert severity="info">No data for chart</Alert>)}
              </Paper>
            </Grid>
          </>
        )}
        {viewMode === 'menu' && (
          <>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
                <Typography variant="h6" gutterBottom>Cost Price vs Sold Price Analysis</Typography>
                {filteredData.length > 0 ? (
                  <BarChart
                    dataset={filteredData.map(item => ({
                      id: item.id,
                      itemName: item.itemName,
                      costPrice: parseFloat(item.averageCostPrice || item.totalCost) || 0,
                      soldPrice: parseFloat(item.averagePrice) || 0,
                      profit: parseFloat(item.profit) || 0,
                      profitMargin: parseFloat(item.profitMargin) || 0
                    }))}
                    xAxis={[{
                      dataKey: 'itemName',
                      label: 'Menu Items',
                      scaleType: 'band'
                    }]}
                    yAxis={[
                      {
                        dataKey: 'costPrice',
                        label: 'Cost Price (₹)',
                        scaleType: 'linear'
                      },
                      {
                        dataKey: 'soldPrice',
                        label: 'Sold Price (₹)',
                        scaleType: 'linear'
                      }
                    ]}
                    series={[
                      {
                        dataKey: 'costPrice',
                        label: 'Cost Price (₹)',
                        color: '#ff9800',
                        yAxisKey: 'costPrice'
                      },
                      {
                        dataKey: 'soldPrice',
                        label: 'Sold Price (₹)',
                        color: '#2196f3',
                        yAxisKey: 'soldPrice'
                      }
                    ]}
                    height={400}
                    grid={{ vertical: true, horizontal: true }}
                  />
                ) : (<Alert severity="info">No data for chart</Alert>)}
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
                <Typography variant="h6" gutterBottom>Menu Items Summary</Typography>
                {filteredData.length > 0 ? (
                  <Box sx={{ p: 2, backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[50], borderRadius: 2 }}>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Total Menu Items</Typography>
                        <Typography variant="h4" fontWeight="bold" color="primary.main">
                          {filteredData.length}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Average Cost Price</Typography>
                        <Typography variant="h5" fontWeight="medium" color="warning.main">
                          ₹{filteredData.length > 0
                            ? (filteredData.reduce((sum, item) => sum + (parseFloat(item.averageCostPrice || item.totalCost) || 0), 0) / filteredData.length).toFixed(2)
                            : 0}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Average Sold Price</Typography>
                        <Typography variant="h5" fontWeight="medium" color="success.main">
                          ₹{filteredData.length > 0
                            ? (filteredData.reduce((sum, item) => sum + (parseFloat(item.averagePrice) || 0), 0) / filteredData.length).toFixed(2)
                            : 0}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Average Profit Margin</Typography>
                        <Typography variant="h5" fontWeight="medium" color="info.main">
                          {filteredData.length > 0
                            ? (filteredData.reduce((sum, item) => sum + (parseFloat(item.profitMargin) || 0), 0) / filteredData.length).toFixed(1)
                            : 0}%
                        </Typography>
                      </Box>
                      <Divider />
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Profit Distribution
                        </Typography>
                        <Stack spacing={1}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#4caf50' }} />
                              <Typography variant="body2">High Profit (&gt;50%)</Typography>
                            </Box>
                            <Typography variant="body2" fontWeight="medium">
                              {filteredData.filter(item => parseFloat(item.profitMargin) > 50).length}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff9800' }} />
                              <Typography variant="body2">Medium Profit (20-50%)</Typography>
                            </Box>
                            <Typography variant="body2" fontWeight="medium">
                              {filteredData.filter(item => {
                                const profit = parseFloat(item.profitMargin);
                                return profit > 20 && profit <= 50;
                              }).length}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#f44336' }} />
                              <Typography variant="body2">Low Profit (&le;20%)</Typography>
                            </Box>
                            <Typography variant="body2" fontWeight="medium">
                              {filteredData.filter(item => parseFloat(item.profitMargin) <= 20).length}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    </Stack>
                  </Box>
                ) : (
                  <Alert severity="info">No data available</Alert>
                )}
              </Paper>
            </Grid>
          </>
        )}
        {viewMode === 'customers' && (
          <Grid item xs={12} md={12}>
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
              <Typography variant="h6" gutterBottom>Top 10 Customers by Spending</Typography>
              {filteredData.length > 0 ? (
                <BarChart
                  dataset={filteredData.slice(0, 10)}
                  xAxis={[{ dataKey: 'customerName', scaleType: 'band' }]}
                  series={[{ dataKey: 'totalSpent', label: 'Total Spent (₹)' }]}
                  height={400}
                />
              ) : (<Alert severity="info">No data for chart</Alert>)}
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}