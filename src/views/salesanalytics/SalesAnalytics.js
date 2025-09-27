import React, { useState, useEffect } from "react";
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
  Divider,
  Tooltip,
} from "@mui/material";
import {
  Search as SearchIcon,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Receipt,
  ChevronUp as ExpandMore,
  ChevronDown as ExpandLess,
  Calendar,
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
// import {} from '../../redux/slices/orderSlice';
// import {} from '../../redux/slices/'
export default function SalesAnalytics() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Redux state - Add proper selectors based on your Redux structure
  const { orders = [], loading: ordersLoading = false } = useSelector(
    (state) => state.orders || { orders: [], loading: false }
  );
  const { customers = [], loading: customersLoading = false } = useSelector(
    (state) => state.customers || { customers: [], loading: false }
  );
  const { menuItems = [], loading: menuItemsLoading = false } = useSelector(
    (state) => state.menuItems || { menuItems: [], loading: false }
  );
  

  const restaurantId = localStorage.getItem('restaurantId');
  const token = localStorage.getItem('authToken');

  // Local state
  const [salesData, setSalesData] = useState([]);
  const [menuPerformanceData, setMenuPerformanceData] = useState([]);
  const [customerAnalyticsData, setCustomerAnalyticsData] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dateFilter, setDateFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('sales'); // 'sales', 'menu', 'customers'
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        
        // Replace with your actual Redux actions
        await Promise.all([
          dispatch(fetchOrders({ restaurantId, token })),
          dispatch(fetchCustomers({ restaurantId, token })),
          dispatch(fetchMenuItems({ restaurantId, token }))
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
      console.log('No orders data available');
      return;
    }

    try {
      console.log("Transforming sales data...", orders.length, "orders");

      const transformedSalesData = orders
        .filter(order => order && order._id)
        .map((order, index) => {
          const orderDate = new Date(order.createdAt || new Date());
          const items = order.items || [];
          
          // Calculate order totals
          const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          const tax = order.tax || (subtotal * 0.18); // 18% GST
          const discount = order.discount || 0;
          const totalAmount = subtotal + tax - discount;

          // Calculate profit (if you have cost data)
          const totalCost = items.reduce((sum, item) => {
            const menuItem = menuItems.find(m => m._id === item.menuItemId);
            const itemCost = menuItem?.costPrice || (item.price * 0.6); // Assume 40% margin if no cost data
            return sum + (itemCost * item.quantity);
          }, 0);
          
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
              category: item.categoryName || 'General'
            })),
            itemsCount: items.length,
            subtotal: subtotal.toFixed(2),
            tax: tax.toFixed(2),
            discount: discount.toFixed(2),
            totalAmount: totalAmount.toFixed(2),
            totalCost: totalCost.toFixed(2),
            profit: profit.toFixed(2),
            profitMargin: profitMargin,
            status: order.status ,
            paymentMethod: order.paymentMethod || 'cash',
            orderType: order.orderType || 'dine-in', // dine-in, takeaway, delivery
            waiterId: order.waiterId,
            tableNumber: order.tableNumber,
            createdAt: order.createdAt,
            completedAt: order.completedAt
          };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setSalesData(transformedSalesData);
    } catch (error) {
      console.error('Error transforming sales data:', error);
      setError('Error processing sales data');
    }
  }, [orders, menuItems]);

  // Transform menu performance data
  useEffect(() => {
    if (salesData.length === 0) return;

    try {
      // Aggregate menu item performance
      const menuPerformance = {};
      
      salesData.forEach(order => {
        order.items.forEach(item => {
          if (!menuPerformance[item.name]) {
            menuPerformance[item.name] = {
              itemName: item.name,
              category: item.category,
              totalQuantity: 0,
              totalRevenue: 0,
              orderCount: 0,
              averagePrice: 0,
              
            };
          }
          
          menuPerformance[item.name].totalQuantity += item.quantity;
          menuPerformance[item.name].totalRevenue += item.total;
          menuPerformance[item.name].orderCount += 1;
        });
      });

      // Calculate additional metrics
      const menuPerformanceArray = Object.values(menuPerformance).map(item => {
        item.averagePrice = (item.totalRevenue / item.totalQuantity).toFixed(2);
        // item.popularity = ((item.orderCount / salesData.length) * 100).toFixed(1);
        return item;
      }).sort((a, b) => b.totalRevenue - a.totalRevenue);

      setMenuPerformanceData(menuPerformanceArray);
    } catch (error) {
      console.error('Error transforming menu performance data:', error);
    }
  }, [salesData]);

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
        
        // Track favorite items
        order.items.forEach(item => {
          if (!customerAnalytics[customerId].favoriteItems[item.name]) {
            customerAnalytics[customerId].favoriteItems[item.name] = 0;
          }
          customerAnalytics[customerId].favoriteItems[item.name] += item.quantity;
        });
      });

      // Calculate additional metrics
      const customerAnalyticsArray = Object.values(customerAnalytics).map(customer => {
        customer.averageOrderValue = (customer.totalSpent / customer.totalOrders).toFixed(2);
        
        // Find most ordered item
        const favoriteItem = Object.entries(customer.favoriteItems)
          .sort(([,a], [,b]) => b - a)[0];
        customer.favoriteItem = favoriteItem ? favoriteItem[0] : 'None';
        
        // Calculate order frequency (orders per month)
        const firstOrder = Math.min(...salesData
          .filter(order => (order.customerId || order.customerName) === customer.customerId)
          .map(order => new Date(order.orderDate).getTime()));
        const daysSinceFirstOrder = (Date.now() - firstOrder) / (1000 * 60 * 60 * 24);
        customer.orderFrequency = daysSinceFirstOrder > 30 ? 
          (customer.totalOrders / (daysSinceFirstOrder / 30)).toFixed(1) : customer.totalOrders;

        return customer;
      }).sort((a, b) => b.totalSpent - a.totalSpent);

      setCustomerAnalyticsData(customerAnalyticsArray);
    } catch (error) {
      console.error('Error transforming customer analytics data:', error);
    }
  }, [salesData]);

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
      const totalItems = filteredData.reduce((sum, item) => sum + item.totalQuantity, 0);
      const totalRevenue = filteredData.reduce((sum, item) => sum + item.totalRevenue, 0);
      const topPerformer = filteredData.length > 0 ? filteredData[0] : null;

      return {
        main: totalRevenue,
        mainLabel: 'Menu Revenue',
        secondary: totalItems,
        secondaryLabel: 'Items Sold',
        third: filteredData.length,
        thirdLabel: 'Menu Items',
        fourth: topPerformer ? topPerformer.totalQuantity : 0,
        fourthLabel: 'Top Item Sales'
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

  // Get current data based on view mode
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

  // Filter data based on search and filters
  const filteredData = currentData.filter(item => {
    if (!item) return false;

    // Date filtering
    let matchesDate = true;
    if (startDate || endDate || dateFilter) {
      const itemDate = viewMode === 'customers' ? item.lastOrderDate : 
                      viewMode === 'menu' ? new Date().toISOString().split('T')[0] :
                      item.orderDate;
      
      if (dateFilter) {
        matchesDate = itemDate === dateFilter;
      } else {
        if (startDate) matchesDate = matchesDate && itemDate >= startDate;
        if (endDate) matchesDate = matchesDate && itemDate <= endDate;
      }
    }

    // Category filtering
    const matchesCategory = !categoryFilter || 
      (viewMode === 'sales' && item.items.some(orderItem => orderItem.category === categoryFilter)) ||
      (viewMode === 'menu' && item.category === categoryFilter);

    // Status filtering
    const matchesStatus = !statusFilter || 
      (viewMode === 'sales' && item.status === statusFilter);

    // Search filtering
    let matchesSearch = true;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (viewMode === 'sales') {
        matchesSearch = item.orderId.toLowerCase().includes(query) ||
          item.customerName.toLowerCase().includes(query) ||
          item.items.some(orderItem => orderItem.name.toLowerCase().includes(query));
      } else if (viewMode === 'menu') {
        matchesSearch = item.itemName.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query);
      } else {
        matchesSearch = item.customerName.toLowerCase().includes(query) ||
          item.favoriteItem.toLowerCase().includes(query);
      }
    }

    return matchesDate && matchesCategory && matchesStatus && matchesSearch;
  });

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

  // Export functions
  const exportSalesCSV = () => {
    try {
      const summaryData = getSummaryData();
      
      const csvRows = [
        ["=== SALES ANALYTICS SUMMARY ==="],
        ["Total Orders", filteredData.length],
        ["Total Revenue", `₹${summaryData.main.toFixed(2)}`],
        ["Average Order Value", `₹${summaryData.third.toFixed(2)}`],
        ["Total Profit", `₹${summaryData.fourth.toFixed(2)}`],
        [],
        ["Order ID", "Customer", "Date", "Time", "Items", "Subtotal", "Tax", "Total", "Profit", "Status", "Payment Method"],
        ...filteredData.map((order) => [
          order.orderId || '',
          order.customerName || '',
          order.orderDate || '',
          order.orderTime || '',
          order.itemsCount || 0,
          `₹${order.subtotal || 0}`,
          `₹${order.tax || 0}`,
          `₹${order.totalAmount || 0}`,
          `₹${order.profit || 0}`,
          order.status || '',
          order.paymentMethod || ''
        ])
      ];

      const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
      const link = document.createElement("a");
      link.href = encodeURI(csvContent);
      link.download = `sales-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      console.error('Error exporting sales CSV:', error);
      setError('Failed to export CSV file');
    }
  };

  const exportMenuCSV = () => {
    try {
      const csvRows = [
        ["=== MENU PERFORMANCE SUMMARY ==="],
        ["Total Items", filteredData.length],
        ["Total Revenue", `₹${filteredData.reduce((sum, item) => sum + item.totalRevenue, 0).toFixed(2)}`],
        ["Total Quantity Sold", filteredData.reduce((sum, item) => sum + item.totalQuantity, 0)],
        [],
        ["Item Name", "Category", "Quantity Sold", "Total Revenue", "Average Price", "Popularity %", "Orders"],
        ...filteredData.map((item) => [
          item.itemName || '',
          item.category || '',
          item.totalQuantity || 0,
          `₹${item.totalRevenue || 0}`,
          `₹${item.averagePrice || 0}`,
          // `${item.popularity || 0}%`,
          item.orderCount || 0
        ])
      ];

      const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
      const link = document.createElement("a");
      link.href = encodeURI(csvContent);
      link.download = `menu-performance-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      console.error('Error exporting menu CSV:', error);
      setError('Failed to export CSV file');
    }
  };

  const exportCustomerCSV = () => {
    try {
      const csvRows = [
        ["=== CUSTOMER ANALYTICS SUMMARY ==="],
        ["Total Customers", filteredData.length],
        ["Total Revenue", `₹${filteredData.reduce((sum, customer) => sum + customer.totalSpent, 0).toFixed(2)}`],
        ["Average Customer Value", `₹${filteredData.reduce((sum, customer) => sum + customer.totalSpent, 0) / filteredData.length || 0}`],
        [],
        ["Customer Name", "Total Orders", "Total Spent", "Average Order Value", "Last Order", "Favorite Item", "Order Frequency"],
        ...filteredData.map((customer) => [
          customer.customerName || '',
          customer.totalOrders || 0,
          `₹${customer.totalSpent || 0}`,
          `₹${customer.averageOrderValue || 0}`,
          customer.lastOrderDate || '',
          customer.favoriteItem || '',
          `${customer.orderFrequency || 0}/month`
        ])
      ];

      const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
      const link = document.createElement("a");
      link.href = encodeURI(csvContent);
      link.download = `customer-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      console.error('Error exporting customer CSV:', error);
      setError('Failed to export CSV file');
    }
  };

  const exportCSV = () => {
    switch (viewMode) {
      case 'sales':
        exportSalesCSV();
        break;
      case 'menu':
        exportMenuCSV();
        break;
      case 'customers':
        exportCustomerCSV();
        break;
      default:
        exportSalesCSV();
    }
  };

  const exportPDF = () => {
    try {
      const doc = new jsPDF('landscape');
      const summaryData = getSummaryData();

      doc.setFontSize(16);
      doc.text(`${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} Analytics Report`, 14, 20);

      if (viewMode === 'sales') {
        doc.setFontSize(12);
        doc.text(`Total Orders: ${filteredData.length}`, 14, 35);
        doc.text(`Total Revenue: ₹${summaryData.main.toFixed(2)}`, 14, 45);
        doc.text(`Average Order Value: ₹${summaryData.third.toFixed(2)}`, 14, 55);
        doc.text(`Total Profit: ₹${summaryData.fourth.toFixed(2)}`, 14, 65);

        doc.autoTable({
          startY: 75,
          head: [["Order ID", "Customer", "Date", "Items", "Total", "Profit", "Status"]],
          body: filteredData.slice(0, 50).map((order) => [
            order.orderId || '',
            order.customerName || '',
            order.orderDate || '',
            order.itemsCount || 0,
            `₹${order.totalAmount || 0}`,
            `₹${order.profit || 0}`,
            order.status || ''
          ]),
          styles: { fontSize: 8 },
        });
      } else if (viewMode === 'menu') {
        doc.setFontSize(12);
        doc.text(`Menu Items: ${filteredData.length}`, 14, 35);
        doc.text(`Total Revenue: ₹${summaryData.main.toFixed(2)}`, 14, 45);
        doc.text(`Total Items Sold: ${summaryData.secondary}`, 14, 55);

        doc.autoTable({
          startY: 65,
          head: [["Item", "Category", "Qty Sold", "Revenue", "Avg Price"]],
          body: filteredData.slice(0, 50).map((item) => [
            item.itemName || '',
            item.category || '',
            item.totalQuantity || 0,
            `₹${item.totalRevenue || 0}`,
            `₹${item.averagePrice || 0}`,
            // `${item.popularity || 0}%`
          ]),
          styles: { fontSize: 8 },
        });
      } else {
        doc.setFontSize(12);
        doc.text(`Total Customers: ${filteredData.length}`, 14, 35);
        doc.text(`Total Revenue: ₹${summaryData.main.toFixed(2)}`, 14, 45);
        doc.text(`Avg Customer Value: ₹${summaryData.third.toFixed(2)}`, 14, 55);

        doc.autoTable({
          startY: 65,
          head: [["Customer", "Orders", "Total Spent", "Avg Order", "Last Order", "Favorite Item"]],
          body: filteredData.slice(0, 50).map((customer) => [
            customer.customerName || '',
            customer.totalOrders || 0,
            `₹${customer.totalSpent || 0}`,
            `₹${customer.averageOrderValue || 0}`,
            customer.lastOrderDate || '',
            customer.favoriteItem || ''
          ]),
          styles: { fontSize: 8 },
        });
      }

      doc.save(`${viewMode}-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setError('Failed to export PDF file');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPerformanceColor = (value, threshold) => {
    const numValue = parseFloat(value) || 0;
    if (numValue >= threshold) return 'success';
    if (numValue >= threshold * 0.7) return 'warning';
    return 'error';
  };

  // Get unique categories and filters
  const availableCategories = viewMode === 'menu' 
    ? [...new Set(menuPerformanceData.map(item => item.category).filter(Boolean))]
    : [...new Set(salesData.flatMap(order => order.items.map(item => item.category)).filter(Boolean))];
  
  const availableStatuses = [...new Set(salesData.map(order => order.status).filter(Boolean))];

  if (loading || ordersLoading || customersLoading || menuItemsLoading) {
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
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => {
            setError(null);
            window.location.reload();
          }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  const summaryData = getSummaryData();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        Sales Analytics Dashboard
      </Typography>

      {/* View Mode Toggle */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h6">View Mode:</Typography>
          <Button
            variant={viewMode === 'sales' ? 'contained' : 'outlined'}
            startIcon={<Receipt />}
            onClick={() => setViewMode('sales')}
          >
            Sales Overview
          </Button>
          <Button
            variant={viewMode === 'menu' ? 'contained' : 'outlined'}
            startIcon={<BarChart3 />}
            onClick={() => setViewMode('menu')}
          >
            Menu Performance
          </Button>
          <Button
            variant={viewMode === 'customers' ? 'contained' : 'outlined'}
            startIcon={<Users />}
            onClick={() => setViewMode('customers')}
          >
            Customer Analytics
          </Button>
        </Stack>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <DollarSign color="primary" />
                <Box>
                  <Typography variant="h4">
                    ₹{summaryData.main.toLocaleString()}
                  </Typography>
                  <Typography color="text.secondary">
                    {summaryData.mainLabel}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Target color="secondary" />
                <Box>
                  <Typography variant="h4">
                    {summaryData.secondary.toLocaleString()}
                  </Typography>
                  <Typography color="text.secondary">
                    {summaryData.secondaryLabel}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <TrendingUp color="success" />
                <Box>
                  <Typography variant="h4">
                    {viewMode === 'sales' ? 
                      `₹${summaryData.third.toFixed(0)}` : 
                      summaryData.third.toLocaleString()
                    }
                  </Typography>
                  <Typography color="text.secondary">
                    {summaryData.thirdLabel}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <PieChartIcon color="info" />
                <Box>
                  <Typography variant="h4">
                    {viewMode === 'sales' || viewMode === 'customers' ? 
                      `₹${summaryData.fourth.toFixed(0)}` : 
                      summaryData.fourth.toLocaleString()
                    }
                  </Typography>
                  <Typography color="text.secondary">
                    {summaryData.fourthLabel}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Export Buttons */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button variant="contained" color="primary" onClick={exportCSV}>
          Export CSV
        </Button>
        <Button variant="contained" color="secondary" onClick={exportPDF}>
          Export PDF
        </Button>
      </Stack>

      {/* Enhanced Filters */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: 3 }}>
        <Typography variant="h6" gutterBottom>
          Search & Filters
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label={viewMode === 'sales' ? "Search Orders" : 
                     viewMode === 'menu' ? "Search Menu Items" : "Search Customers"}
              placeholder={viewMode === 'sales' ? "Search by order ID, customer..." :
                          viewMode === 'menu' ? "Search by item name..." : "Search by customer name..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>

          {/* Date Range Filters */}
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Category Filter */}
          {/* {(viewMode === 'sales' || viewMode === 'menu') && (
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {availableCategories.map((category) => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )} */}

          {/* Status Filter for Sales */}
          {viewMode === 'sales' && (
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {availableStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12} md={1}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setSearchQuery('');
                setStartDate('');
                setEndDate('');
                setDateFilter('');
                setCategoryFilter('');
                setStatusFilter('');
              }}
              sx={{ height: '56px' }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Data Table */}
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
        <Typography variant="h6" gutterBottom>
          {viewMode === 'sales' ? 'Sales Orders' :
           viewMode === 'menu' ? 'Menu Performance' : 
           'Customer Analytics'} ({filteredData.length} records)
        </Typography>
        <TableContainer>
          <Table sx={{ borderRadius: 2, overflow: "hidden" }}>
            <TableHead>
              <TableRow>
                {viewMode === 'sales' ? (
                  ["Order ID", "Customer", "Date", "Time", "Items", "Total", "Profit", "Status", "Details"].map((header) => (
                    <TableCell key={header} sx={{ fontWeight: "bold", backgroundColor: isDark ? theme.palette.grey[800] : theme.palette.grey[100] }}>
                      {header}
                    </TableCell>
                  ))
                ) : viewMode === 'menu' ? (
                  ["Menu Item",  "Qty Sold", "Revenue", "Avg Price", "Orders"].map((header) => (
                    <TableCell key={header} sx={{ fontWeight: "bold", backgroundColor: isDark ? theme.palette.grey[800] : theme.palette.grey[100] }}>
                      {header}
                    </TableCell>
                  ))
                ) : (
                  ["Customer", "Orders", "Total Spent", "Avg Order", "Last Order", "Favorite Item", "Frequency"].map((header) => (
                    <TableCell key={header} sx={{ fontWeight: "bold", backgroundColor: isDark ? theme.palette.grey[800] : theme.palette.grey[100] }}>
                      {header}
                    </TableCell>
                  ))
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item, idx) => (
                  <React.Fragment key={item.id || idx}>
                    <TableRow sx={{
                      backgroundColor: isDark ? (idx % 2 === 0 ? theme.palette.grey[900] : theme.palette.grey[800]) : (idx % 2 === 0 ? "#f9f9f9" : "white"),
                      "&:hover": { backgroundColor: isDark ? theme.palette.action.hover : "#e3f2fd" },
                    }}>
                      {viewMode === 'sales' ? (
                        <>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">{item.orderId}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.customerName}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.orderDate}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.orderTime}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={item.itemsCount} color="primary" variant="outlined" size="small" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">₹{item.totalAmount}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color={parseFloat(item.profit) > 0 ? 'success.main' : 'error.main'}>
                              ₹{item.profit}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={item.status}
                              color={getStatusColor(item.status)}
                              variant="filled"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Tooltip title="View order details">
                              <IconButton onClick={() => handleExpandRow(item.id)} size="small">
                                {expandedRows.has(item.id) ? <ExpandLess /> : <ExpandMore />}
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </>
                      ) : viewMode === 'menu' ? (
                        <>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">{item.itemName}</Typography>
                          </TableCell>
                          {/**<TableCell>
                            <Chip label={item.category} color="primary" variant="outlined" size="small" />
                          </TableCell> */}
                          <TableCell>
                            <Typography variant="body2">{item.totalQuantity}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">₹{item.totalRevenue.toFixed(2)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">₹{item.averagePrice}</Typography>
                          </TableCell>
                          {/* <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="body2">{item.popularity}%</Typography>
                              <Chip
                                label={parseFloat(item.popularity) > 10 ? 'Popular' : 'Low'}
                                color={getPerformanceColor(item.popularity, 10)}
                                variant="outlined"
                                size="small"
                              />
                            </Stack>
                          </TableCell> */}
                          <TableCell>
                            <Typography variant="body2">{item.orderCount}</Typography>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">{item.customerName}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.totalOrders}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">₹{item.totalSpent.toFixed(2)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">₹{item.averageOrderValue}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.lastOrderDate}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.favoriteItem}</Typography>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="body2">{item.orderFrequency}/month</Typography>
                              <Chip
                                label={parseFloat(item.orderFrequency) > 2 ? 'Loyal' : 'Casual'}
                                color={getPerformanceColor(item.orderFrequency, 2)}
                                variant="outlined"
                                size="small"
                              />
                            </Stack>
                          </TableCell>
                        </>
                      )}
                    </TableRow>

                    {/* Expandable row for order details (sales view only) */}
                    {viewMode === 'sales' && (
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
                          <Collapse in={expandedRows.has(item.id)}  unmountOnExit>
                            <Box sx={{ margin: 1 }}>
                              <Typography variant="h6" gutterBottom component="div">
                                Order Details
                              </Typography>
                              <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="body2"><strong>Payment Method:</strong> {item.paymentMethod}</Typography>
                                  <Typography variant="body2"><strong>Order Type:</strong> {item.orderType}</Typography>
                                  <Typography variant="body2"><strong>Table:</strong> {item.tableNumber || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="body2"><strong>Subtotal:</strong> ₹{item.subtotal}</Typography>
                                  <Typography variant="body2"><strong>Tax:</strong> ₹{item.tax}</Typography>
                                  <Typography variant="body2"><strong>Discount:</strong> ₹{item.discount}</Typography>
                                </Grid>
                              </Grid>
                              <Typography variant="h6" gutterBottom>Items Ordered</Typography>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Item</TableCell>
                                    <TableCell>Category</TableCell>
                                    <TableCell>Quantity</TableCell>
                                    <TableCell>Price</TableCell>
                                    <TableCell>Total</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {item.items?.map((orderItem, itemIdx) => (
                                    <TableRow key={itemIdx}>
                                      <TableCell>{orderItem.name}</TableCell>
                                      <TableCell>{orderItem.category}</TableCell>
                                      <TableCell>{orderItem.quantity}</TableCell>
                                      <TableCell>₹{orderItem.price}</TableCell>
                                      <TableCell>₹{orderItem.total.toFixed(2)}</TableCell>
                                    </TableRow>
                                  )) || (
                                    <TableRow>
                                      <TableCell colSpan={5}>
                                        <Typography variant="body2" color="text.secondary" align="center">
                                          No items found for this order
                                        </Typography>
                                      </TableCell>
                                    </TableRow>
                                  )}
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

        {/* Pagination */}
        <TablePagination
          component="div"
          count={filteredData.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 20, 50]}
          showFirstButton
          showLastButton
        />
      </Paper>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        {viewMode === 'sales' && (
          <>
            {/* Revenue Trend Chart */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Daily Revenue Trend
                </Typography>
                {filteredData.length > 0 ? (
                  <LineChart
                    dataset={Object.entries(
                      filteredData.reduce((acc, order) => {
                        const date = order.orderDate;
                        acc[date] = (acc[date] || 0) + parseFloat(order.totalAmount);
                        return acc;
                      }, {})
                    ).map(([date, revenue], index) => ({
                      x: index + 1,
                      date,
                      revenue,
                      label: date
                    }))}
                    xAxis={[{ dataKey: "x", label: "Days" }]}
                    series={[
                      { dataKey: "revenue", label: "Revenue (₹)", color: "#2196f3" }
                    ]}
                    height={400}
                    grid={{ vertical: true, horizontal: true }}
                  />
                ) : (
                  <Alert severity="info">No sales data available for the selected filters</Alert>
                )}
              </Paper>
            </Grid>

            {/* Order Status Distribution */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Order Status Distribution
                </Typography>
                {filteredData.length > 0 ? (
                  <PieChart
                    series={[
                      {
                        data: Object.entries(
                          filteredData.reduce((acc, order) => {
                            acc[order.status] = (acc[order.status] || 0) + 1;
                            return acc;
                          }, {})
                        ).map(([status, count]) => ({
                          id: status,
                          value: count,
                          label: status.charAt(0).toUpperCase() + status.slice(1),
                        })),
                        highlightScope: { faded: 'global', highlighted: 'item' },
                        faded: { additionalRadius: -30, color: 'gray' },
                      },
                    ]}
                    height={400}
                  />
                ) : (
                  <Alert severity="info">No data available</Alert>
                )}
              </Paper>
            </Grid>
          </>
        )}

        {viewMode === 'menu' && (
          <>
            {/* Top Performing Items */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Top 10 Menu Items by Revenue
                </Typography>
                {filteredData.length > 0 ? (
                  <BarChart
                    dataset={filteredData.slice(0, 10).map((item, index) => ({
                      item: item.itemName.substring(0, 15),
                      revenue: item.totalRevenue,
                      quantity: item.totalQuantity,
                      index: index
                    }))}
                    xAxis={[{ dataKey: "item", label: "Menu Items" }]}
                    series={[
                      { dataKey: "revenue", label: "Revenue (₹)", color: "#4caf50" },
                    ]}
                    height={400}
                  />
                ) : (
                  <Alert severity="info">No menu performance data available</Alert>
                )}
              </Paper>
            </Grid>

            {/* Category Performance */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Revenue by Category
                </Typography>
                {filteredData.length > 0 ? (
                  <PieChart
                    series={[
                      {
                        data: Object.entries(
                          filteredData.reduce((acc, item) => {
                            acc[item.category] = (acc[item.category] || 0) + item.totalRevenue;
                            return acc;
                          }, {})
                        ).map(([category, revenue]) => ({
                          id: category,
                          value: revenue,
                          label: category,
                        })),
                        highlightScope: { faded: 'global', highlighted: 'item' },
                        faded: { additionalRadius: -30, color: 'gray' },
                      },
                    ]}
                    height={400}
                  />
                ) : (
                  <Alert severity="info">No data available</Alert>
                )}
              </Paper>
            </Grid>
          </>
        )}

        {viewMode === 'customers' && (
          <>
            {/* Customer Spending Distribution */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Top 10 Customers by Spending
                </Typography>
                {filteredData.length > 0 ? (
                  <BarChart
                    dataset={filteredData.slice(0, 10).map((customer, index) => ({
                      customer: customer.customerName.substring(0, 15),
                      spent: customer.totalSpent,
                      orders: customer.totalOrders,
                      index: index
                    }))}
                    xAxis={[{ dataKey: "customer", label: "Customers" }]}
                    series={[
                      { dataKey: "spent", label: "Total Spent (₹)", color: "#ff9800" },
                    ]}
                    height={400}
                  />
                ) : (
                  <Alert severity="info">No customer data available</Alert>
                )}
              </Paper>
            </Grid>

            {/* Customer Loyalty Distribution */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Customer Loyalty Segments
                </Typography>
                {filteredData.length > 0 ? (
                  <PieChart
                    series={[
                      {
                        data: [
                          {
                            id: 'loyal',
                            value: filteredData.filter(customer => customer.totalOrders > 10).length,
                            label: 'Loyal (>10 orders)',
                            color: '#4caf50'
                          },
                          {
                            id: 'regular',
                            value: filteredData.filter(customer => customer.totalOrders > 5 && customer.totalOrders <= 10).length,
                            label: 'Regular (5-10 orders)',
                            color: '#ff9800'
                          },
                          {
                            id: 'occasional',
                            value: filteredData.filter(customer => customer.totalOrders > 1 && customer.totalOrders <= 5).length,
                            label: 'Occasional (2-5 orders)',
                            color: '#2196f3'
                          },
                          {
                            id: 'new',
                            value: filteredData.filter(customer => customer.totalOrders === 1).length,
                            label: 'New (1 order)',
                            color: '#f44336'
                          }
                        ],
                        highlightScope: { faded: 'global', highlighted: 'item' },
                        faded: { additionalRadius: -30, color: 'gray' },
                      },
                    ]}
                    height={400}
                  />
                ) : (
                  <Alert severity="info">No data available</Alert>
                )}
              </Paper>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
}

// import React, { useState } from "react";
// import { LineChart, PieChart } from "@mui/x-charts";
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
// } from "@mui/material";
// import { jsPDF } from "jspdf";
// import "jspdf-autotable";

// // Mock sales data
// const generateSalesData = () => {
//   const categories = ['Food', 'Beverages', 'Desserts', 'Appetizers', 'Main Course'];
//   const salesData = [];
  
//   for (let i = 0; i < 30; i++) {
//     const category = categories[Math.floor(Math.random() * categories.length)];
//     const amount = Math.floor(Math.random() * 1000) + 100;
//     const quantity = Math.floor(Math.random() * 10) + 1;
//     const date = new Date();
//     date.setDate(date.getDate() - (29 - i));
    
//     salesData.push({
//       id: i + 1,
//       category,
//       amount,
//       quantity,
//       date: date.toISOString().split('T')[0],
//       customer: `Customer ${i + 1}`,
//       paymentMethod: ['Cash', 'Card', 'UPI'][Math.floor(Math.random() * 3)]
//     });
//   }
  
//   return salesData;
// };

// export default function SalesAnalytics() {
//   const [salesData] = useState(generateSalesData());
//   const [page, setPage] = useState(0);
//   const [rowsPerPage, setRowsPerPage] = useState(5);
//   const [dateFilter, setDateFilter] = useState('');
//   const [categoryFilter, setCategoryFilter] = useState('');

//   const theme = useTheme();
//   const isDark = theme.palette.mode === "dark";

//   // Filter data based on date and category
//   const filteredData = salesData.filter(item => {
//     const matchesDate = !dateFilter || item.date === dateFilter;
//     const matchesCategory = !categoryFilter || item.category === categoryFilter;
//     return matchesDate && matchesCategory;
//   });

//   const handleChangePage = (event, newPage) => {
//     setPage(newPage);
//   };

//   const handleChangeRowsPerPage = (event) => {
//     setRowsPerPage(parseInt(event.target.value, 10));
//     setPage(0);
//   };

//   // Prepare chart data
//   const lineChartData = filteredData.map((item, index) => ({
//     x: index + 1,
//     y: item.amount,
//   }));

//   // Prepare pie chart data
//   const categoryTotals = {};
//   filteredData.forEach(item => {
//     categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.amount;
//   });

//   const pieChartData = Object.entries(categoryTotals).map(([category, amount]) => ({
//     id: category,
//     value: amount,
//     label: category,
//   }));

//   // CSV Export
//   const exportCSV = () => {
//     const csvRows = [
//       ["Customer", "Category", "Amount", "Quantity", "Payment Method", "Date"],
//       ...filteredData.map((item) => [
//         item.customer,
//         item.category,
//         item.amount,
//         item.quantity,
//         item.paymentMethod,
//         item.date,
//       ]),
//     ];
//     const csvContent =
//       "data:text/csv;charset=utf-8," +
//       csvRows.map((e) => e.join(",")).join("\n");

//     const link = document.createElement("a");
//     link.href = encodeURI(csvContent);
//     link.download = "sales-analytics.csv";
//     link.click();
//   };

//   // PDF Export
//   const exportPDF = () => {
//     const doc = new jsPDF();
//     doc.setFontSize(16);
//     doc.text("Sales Analytics Report", 14, 20);

//     doc.autoTable({
//       startY: 30,
//       head: [["Customer", "Category", "Amount", "Quantity", "Payment Method", "Date"]],
//       body: filteredData.map((item) => [
//         item.customer,
//         item.category,
//         item.amount,
//         item.quantity,
//         item.paymentMethod,
//         item.date,
//       ]),
//     });

//     doc.save("sales-analytics.pdf");
//   };

//   // Get payment method color
//   const getPaymentMethodColor = (method) => {
//     switch (method) {
//       case 'Cash': return 'success';
//       case 'Card': return 'primary';
//       case 'UPI': return 'secondary';
//       default: return 'default';
//     }
//   };

//   // Get category color
//   const getCategoryColor = (category) => {
//     const colors = {
//       'Food': 'primary',
//       'Beverages': 'secondary',
//       'Desserts': 'success',
//       'Appetizers': 'warning',
//       'Main Course': 'info'
//     };
//     return colors[category] || 'default';
//   };

//   return (
//     <Box sx={{ p: 3 }}>
//       <Typography variant="h4" gutterBottom>
//         Sales Analytics
//       </Typography>

//       {/* Export Buttons */}
//       <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
//         <Button variant="contained" color="primary" onClick={exportCSV}>
//           Export CSV
//         </Button>
//         <Button variant="contained" color="secondary" onClick={exportPDF}>
//           Export PDF
//         </Button>
//       </Stack>

//       {/* Filters */}
//       <Paper sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: 3 }}>
//         <Typography variant="h6" gutterBottom>
//           Filters
//         </Typography>
//         <Grid container spacing={2}>
//           <Grid item xs={12} md={4}>
//             <TextField
//               fullWidth
//               label="Date"
//               type="date"
//               value={dateFilter}
//               onChange={(e) => setDateFilter(e.target.value)}
//               InputLabelProps={{ shrink: true }}
//             />
//           </Grid>
//           <Grid item xs={12} md={4}>
//             <FormControl fullWidth>
//               <InputLabel>Category</InputLabel>
//               <Select
//                 value={categoryFilter}
//                 label="Category"
//                 onChange={(e) => setCategoryFilter(e.target.value)}
//               >
//                 <MenuItem value="">All Categories</MenuItem>
//                 <MenuItem value="Food">Food</MenuItem>
//                 <MenuItem value="Beverages">Beverages</MenuItem>
//                 <MenuItem value="Desserts">Desserts</MenuItem>
//                 <MenuItem value="Appetizers">Appetizers</MenuItem>
//                 <MenuItem value="Main Course">Main Course</MenuItem>
//               </Select>
//             </FormControl>
//           </Grid>
//           <Grid item xs={12} md={4}>
//             <Button
//               variant="outlined"
//               onClick={() => {
//                 setDateFilter('');
//                 setCategoryFilter('');
//               }}
//               sx={{ height: '56px' }}
//             >
//               Clear Filters
//             </Button>
//           </Grid>
//         </Grid>
//       </Paper>

//       {/* Charts Section */}
//       <Grid container spacing={3} sx={{ mb: 3 }}>
//         {/* Line Chart */}
//         <Grid item xs={12} md={8}>
//           <Paper sx={{ p: 2, borderRadius: 3, boxShadow: 3 }}>
//             <Typography variant="h6" gutterBottom>
//               Sales Trend Over Time
//             </Typography>
//             <LineChart
//               dataset={lineChartData}
//               xAxis={[{ dataKey: "x", label: "Transaction No." }]}
//               series={[{ dataKey: "y", label: "Amount (₹)" }]}
//               height={400}
//               grid={{ vertical: true, horizontal: true }}
//             />
//           </Paper>
//         </Grid>

//         {/* Pie Chart */}
//         <Grid item xs={12} md={4}>
//           <Paper sx={{ p: 2, borderRadius: 3, boxShadow: 3 }}>
//             <Typography variant="h6" gutterBottom>
//               Sales by Category
//             </Typography>
//             <PieChart
//               series={[
//                 {
//                   data: pieChartData,
//                   highlightScope: { faded: 'global', highlighted: 'item' },
//                   faded: { additionalRadius: -30, color: 'gray' },
//                 },
//               ]}
//               height={400}
//             />
//           </Paper>
//         </Grid>
//       </Grid>

//       {/* Sales Table */}
//       <Paper sx={{ p: 2, borderRadius: 3, boxShadow: 3 }}>
//         <Typography variant="h6" gutterBottom>
//           Sales Transactions
//         </Typography>
//         <TableContainer>
//           <Table sx={{ borderRadius: 2, overflow: "hidden" }}>
//             <TableHead>
//               <TableRow>
//                 {["Customer", "Category", "Amount", "Quantity", "Payment Method", "Date"].map((header) => (
//                   <TableCell
//                     key={header}
//                     sx={{
//                       fontWeight: "bold",
//                       color: theme.palette.text.primary,
//                     }}
//                   >
//                     {header}
//                   </TableCell>
//                 ))}
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {filteredData
//                 .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
//                 .map((item, idx) => (
//                   <TableRow
//                     key={item.id}
//                     sx={{
//                       backgroundColor: isDark
//                         ? idx % 2 === 0
//                           ? theme.palette.grey[900]
//                           : theme.palette.grey[800]
//                         : idx % 2 === 0
//                           ? "#f9f9f9"
//                           : "white",
//                       "&:hover": {
//                         backgroundColor: isDark
//                           ? theme.palette.action.hover
//                           : "#e3f2fd",
//                       },
//                     }}
//                   >
//                     <TableCell>{item.customer}</TableCell>
//                     <TableCell>
//                       <Chip
//                         label={item.category}
//                         color={getCategoryColor(item.category)}
//                         variant="filled"
//                         size="small"
//                       />
//                     </TableCell>
//                     <TableCell>₹{item.amount}</TableCell>
//                     <TableCell>{item.quantity}</TableCell>
//                     <TableCell>
//                       <Chip
//                         label={item.paymentMethod}
//                         color={getPaymentMethodColor(item.paymentMethod)}
//                         variant="outlined"
//                         size="small"
//                       />
//                     </TableCell>
//                     <TableCell>{item.date}</TableCell>
//                   </TableRow>
//                 ))}
//             </TableBody>
//           </Table>
//         </TableContainer>

//         {/* Pagination */}
//         <TablePagination
//           component="div"
//           count={filteredData.length}
//           page={page}
//           onPageChange={handleChangePage}
//           rowsPerPage={rowsPerPage}
//           onRowsPerPageChange={handleChangeRowsPerPage}
//           rowsPerPageOptions={[5, 10, 20]}
//         />
//       </Paper>
//     </Box>
//   );
// }
