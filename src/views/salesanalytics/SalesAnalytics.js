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

// Mock sales data
const generateSalesData = () => {
  const categories = ['Food', 'Beverages', 'Desserts', 'Appetizers', 'Main Course'];
  const salesData = [];
  
  for (let i = 0; i < 30; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const amount = Math.floor(Math.random() * 1000) + 100;
    const quantity = Math.floor(Math.random() * 10) + 1;
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    
    salesData.push({
      id: i + 1,
      category,
      amount,
      quantity,
      date: date.toISOString().split('T')[0],
      customer: `Customer ${i + 1}`,
      paymentMethod: ['Cash', 'Card', 'UPI'][Math.floor(Math.random() * 3)]
    });
  }
  
  return salesData;
};

export default function SalesAnalytics() {
  const [salesData] = useState(generateSalesData());
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [dateFilter, setDateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Filter data based on date and category
  const filteredData = salesData.filter(item => {
    const matchesDate = !dateFilter || item.date === dateFilter;
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    return matchesDate && matchesCategory;
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
      ["Customer", "Category", "Amount", "Quantity", "Payment Method", "Date"],
      ...filteredData.map((item) => [
        item.customer,
        item.category,
        item.amount,
        item.quantity,
        item.paymentMethod,
        item.date,
      ]),
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," +
      csvRows.map((e) => e.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "sales-analytics.csv";
    link.click();
  };

  // PDF Export
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Sales Analytics Report", 14, 20);

    doc.autoTable({
      startY: 30,
      head: [["Customer", "Category", "Amount", "Quantity", "Payment Method", "Date"]],
      body: filteredData.map((item) => [
        item.customer,
        item.category,
        item.amount,
        item.quantity,
        item.paymentMethod,
        item.date,
      ]),
    });

    doc.save("sales-analytics.pdf");
  };

  // Get payment method color
  const getPaymentMethodColor = (method) => {
    switch (method) {
      case 'Cash': return 'success';
      case 'Card': return 'primary';
      case 'UPI': return 'secondary';
      default: return 'default';
    }
  };

  // Get category color
  const getCategoryColor = (category) => {
    const colors = {
      'Food': 'primary',
      'Beverages': 'secondary',
      'Desserts': 'success',
      'Appetizers': 'warning',
      'Main Course': 'info'
    };
    return colors[category] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Sales Analytics
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
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Date"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="Food">Food</MenuItem>
                <MenuItem value="Beverages">Beverages</MenuItem>
                <MenuItem value="Desserts">Desserts</MenuItem>
                <MenuItem value="Appetizers">Appetizers</MenuItem>
                <MenuItem value="Main Course">Main Course</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant="outlined"
              onClick={() => {
                setDateFilter('');
                setCategoryFilter('');
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
              Sales Trend Over Time
            </Typography>
            <LineChart
              dataset={lineChartData}
              xAxis={[{ dataKey: "x", label: "Transaction No." }]}
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
              Sales by Category
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

      {/* Sales Table */}
      <Paper sx={{ p: 2, borderRadius: 3, boxShadow: 3 }}>
        <Typography variant="h6" gutterBottom>
          Sales Transactions
        </Typography>
        <TableContainer>
          <Table sx={{ borderRadius: 2, overflow: "hidden" }}>
            <TableHead>
              <TableRow>
                {["Customer", "Category", "Amount", "Quantity", "Payment Method", "Date"].map((header) => (
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
                    <TableCell>{item.customer}</TableCell>
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
                        label={item.paymentMethod}
                        color={getPaymentMethodColor(item.paymentMethod)}
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
