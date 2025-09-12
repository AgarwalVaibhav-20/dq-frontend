import React, { useState } from "react";
import { LineChart, PieChart } from "@mui/x-charts";
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
} from "@mui/material";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

// Mock purchase data
const generatePurchaseData = () => {
  const suppliers = ['Supplier A', 'Supplier B', 'Supplier C', 'Supplier D', 'Supplier E'];
  const categories = ['Vegetables', 'Meat', 'Dairy', 'Spices', 'Grains', 'Beverages'];
  const purchaseData = [];
  
  for (let i = 0; i < 30; i++) {
    const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const amount = Math.floor(Math.random() * 2000) + 200;
    const quantity = Math.floor(Math.random() * 50) + 5;
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    
    purchaseData.push({
      id: i + 1,
      supplier,
      category,
      amount,
      quantity,
      date: date.toISOString().split('T')[0],
      status: ['Pending', 'Completed', 'Cancelled'][Math.floor(Math.random() * 3)],
      paymentStatus: ['Paid', 'Pending', 'Overdue'][Math.floor(Math.random() * 3)]
    });
  }
  
  return purchaseData;
};

export default function PurchaseAnalytics() {
  const [purchaseData] = useState(generatePurchaseData());
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [dateFilter, setDateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');

  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Filter data based on date, category, and supplier
  const filteredData = purchaseData.filter(item => {
    const matchesDate = !dateFilter || item.date === dateFilter;
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    const matchesSupplier = !supplierFilter || item.supplier === supplierFilter;
    return matchesDate && matchesCategory && matchesSupplier;
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Prepare chart data
  const lineChartData = filteredData.map((item, index) => ({
    x: index + 1,
    y: item.amount,
  }));

  // Prepare pie chart data
  const categoryTotals = {};
  filteredData.forEach(item => {
    categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.amount;
  });

  const pieChartData = Object.entries(categoryTotals).map(([category, amount]) => ({
    id: category,
    value: amount,
    label: category,
  }));

  // CSV Export
  const exportCSV = () => {
    const csvRows = [
      ["Supplier", "Category", "Amount", "Quantity", "Status", "Payment Status", "Date"],
      ...filteredData.map((item) => [
        item.supplier,
        item.category,
        item.amount,
        item.quantity,
        item.status,
        item.paymentStatus,
        item.date,
      ]),
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," +
      csvRows.map((e) => e.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "purchase-analytics.csv";
    link.click();
  };

  // PDF Export
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Purchase Analytics Report", 14, 20);

    doc.autoTable({
      startY: 30,
      head: [["Supplier", "Category", "Amount", "Quantity", "Status", "Payment Status", "Date"]],
      body: filteredData.map((item) => [
        item.supplier,
        item.category,
        item.amount,
        item.quantity,
        item.status,
        item.paymentStatus,
        item.date,
      ]),
    });

    doc.save("purchase-analytics.pdf");
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'Pending': return 'warning';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  // Get payment status color
  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Pending': return 'warning';
      case 'Overdue': return 'error';
      default: return 'default';
    }
  };

  // Get category color
  const getCategoryColor = (category) => {
    const colors = {
      'Vegetables': 'success',
      'Meat': 'error',
      'Dairy': 'info',
      'Spices': 'warning',
      'Grains': 'primary',
      'Beverages': 'secondary'
    };
    return colors[category] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Purchase Analytics
      </Typography>

      {/* Export Buttons */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button variant="contained" color="primary" onClick={exportCSV}>
          Export CSV
        </Button>
        <Button variant="contained" color="secondary" onClick={exportPDF}>
          Export PDF
        </Button>
      </Stack>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Date"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="Vegetables">Vegetables</MenuItem>
                <MenuItem value="Meat">Meat</MenuItem>
                <MenuItem value="Dairy">Dairy</MenuItem>
                <MenuItem value="Spices">Spices</MenuItem>
                <MenuItem value="Grains">Grains</MenuItem>
                <MenuItem value="Beverages">Beverages</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Supplier</InputLabel>
              <Select
                value={supplierFilter}
                label="Supplier"
                onChange={(e) => setSupplierFilter(e.target.value)}
              >
                <MenuItem value="">All Suppliers</MenuItem>
                <MenuItem value="Supplier A">Supplier A</MenuItem>
                <MenuItem value="Supplier B">Supplier B</MenuItem>
                <MenuItem value="Supplier C">Supplier C</MenuItem>
                <MenuItem value="Supplier D">Supplier D</MenuItem>
                <MenuItem value="Supplier E">Supplier E</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="outlined"
              onClick={() => {
                setDateFilter('');
                setCategoryFilter('');
                setSupplierFilter('');
              }}
              sx={{ height: '56px' }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Line Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, borderRadius: 3, boxShadow: 3 }}>
            <Typography variant="h6" gutterBottom>
              Purchase Trend Over Time
            </Typography>
            <LineChart
              dataset={lineChartData}
              xAxis={[{ dataKey: "x", label: "Purchase No." }]}
              series={[{ dataKey: "y", label: "Amount (₹)" }]}
              height={400}
              grid={{ vertical: true, horizontal: true }}
            />
          </Paper>
        </Grid>

        {/* Pie Chart */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 3, boxShadow: 3 }}>
            <Typography variant="h6" gutterBottom>
              Purchases by Category
            </Typography>
            <PieChart
              series={[
                {
                  data: pieChartData,
                  highlightScope: { faded: 'global', highlighted: 'item' },
                  faded: { additionalRadius: -30, color: 'gray' },
                },
              ]}
              height={400}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Purchase Table */}
      <Paper sx={{ p: 2, borderRadius: 3, boxShadow: 3 }}>
        <Typography variant="h6" gutterBottom>
          Purchase Transactions
        </Typography>
        <TableContainer>
          <Table sx={{ borderRadius: 2, overflow: "hidden" }}>
            <TableHead>
              <TableRow>
                {["Supplier", "Category", "Amount", "Quantity", "Status", "Payment Status", "Date"].map((header) => (
                  <TableCell
                    key={header}
                    sx={{
                      fontWeight: "bold",
                      color: theme.palette.text.primary,
                    }}
                  >
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item, idx) => (
                  <TableRow
                    key={item.id}
                    sx={{
                      backgroundColor: isDark
                        ? idx % 2 === 0
                          ? theme.palette.grey[900]
                          : theme.palette.grey[800]
                        : idx % 2 === 0
                          ? "#f9f9f9"
                          : "white",
                      "&:hover": {
                        backgroundColor: isDark
                          ? theme.palette.action.hover
                          : "#e3f2fd",
                      },
                    }}
                  >
                    <TableCell>{item.supplier}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.category}
                        color={getCategoryColor(item.category)}
                        variant="filled"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>₹{item.amount}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.status}
                        color={getStatusColor(item.status)}
                        variant="filled"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.paymentStatus}
                        color={getPaymentStatusColor(item.paymentStatus)}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{item.date}</TableCell>
                  </TableRow>
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
          rowsPerPageOptions={[5, 10, 20]}
        />
      </Paper>
    </Box>
  );
}
