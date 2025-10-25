import React, { useState, useEffect } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
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
} from "@mui/material";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const dummyFeedback = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  user: `User ${i + 1}`,
  rating: Math.floor(Math.random() * 5) + 1,
  comment: `Feedback comment ${i + 1}`,
  date: `2025-09-${(i % 30) + 1}`,
}));

export default function FeedbackPage() {
  const [feedbacks] = useState(dummyFeedback);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [isDark, setIsDark] = useState(false);

  // ✅ Theme detection with observer
  useEffect(() => {
    const checkTheme = () => {
      const darkMode = 
        document.documentElement.getAttribute('data-coreui-theme') === 'dark' ||
        document.body.getAttribute('data-coreui-theme') === 'dark';
      setIsDark(darkMode);
    };

    // Initial check
    checkTheme();

    // Observer for theme changes
    const observer = new MutationObserver(checkTheme);
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-coreui-theme']
    });
    
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-coreui-theme']
    });

    return () => observer.disconnect();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const chartData = feedbacks.map((f, index) => ({
    x: index + 1,
    y: f.rating,
  }));

  const exportCSV = () => {
    const csvRows = [
      ["User", "Rating", "Comment", "Date"],
      ...feedbacks.map((fb) => [fb.user, fb.rating, fb.comment, fb.date]),
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," +
      csvRows.map((e) => e.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "feedbacks.csv";
    link.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Customer Feedback Report", 14, 20);

    doc.autoTable({
      startY: 30,
      head: [["User", "Rating", "Comment", "Date"]],
      body: feedbacks.map((fb) => [fb.user, fb.rating, fb.comment, fb.date]),
    });

    doc.save("feedbacks.pdf");
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return "success";
    if (rating === 3) return "warning";
    return "error";
  };

  return (
    <Box 
      sx={{ 
        p: 3, 
        bgcolor: isDark ? '#212529' : '#f8f9fa',
        minHeight: '100vh'
      }}
    >
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ color: isDark ? '#ffffff' : '#212529' }}
      >
        Customer Feedback
      </Typography>

      <Stack 
        direction={{ xs: "column", sm: "row" }} 
        spacing={{ xs: 1, sm: 2 }} 
        sx={{ mb: 2 }}
      >
        <Button 
          variant="contained" 
          color="primary" 
          onClick={exportCSV}
          sx={{ 
            width: { xs: "100%", sm: "auto" },
            minWidth: { xs: "auto", sm: "120px" },
            fontSize: { xs: "0.875rem", sm: "0.875rem" }
          }}
        >
          Export CSV
        </Button>
        <Button 
          variant="contained" 
          color="secondary" 
          onClick={exportPDF}
          sx={{ 
            width: { xs: "100%", sm: "auto" },
            minWidth: { xs: "auto", sm: "120px" },
            fontSize: { xs: "0.875rem", sm: "0.875rem" }
          }}
        >
          Export PDF
        </Button>
      </Stack>

      <Paper 
        sx={{ 
          p: 2, 
          mb: 3, 
          borderRadius: 3, 
          boxShadow: 3,
          bgcolor: isDark ? '#343a40' : '#ffffff'
        }}
      >
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ color: isDark ? '#ffffff' : '#212529' }}
        >
          Feedback Ratings Trend
        </Typography>
        <LineChart
          dataset={chartData}
          xAxis={[{ dataKey: "x", label: "Feedback No." }]}
          series={[{ dataKey: "y", label: "Rating" }]}
          height={450}
          grid={{ vertical: true, horizontal: true }}
        />
      </Paper>

      <Paper 
        sx={{ 
          p: 2, 
          borderRadius: 3, 
          boxShadow: 3,
          bgcolor: isDark ? '#343a40' : '#ffffff'
        }}
      >
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ color: isDark ? '#ffffff' : '#212529' }}
        >
          Feedback List
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow 
                sx={{ 
                  bgcolor: isDark ? '#212529' : '#e9ecef'
                }}
              >
                {["Customer", "Rating", "Comment", "Date"].map((header) => (
                  <TableCell 
                    key={header} 
                    sx={{ 
                      fontWeight: "bold",
                      color: isDark ? '#ffffff !important' : '#212529 !important',
                      bgcolor: 'transparent !important'
                    }}
                  >
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {feedbacks
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((fb, index) => (
                  <TableRow 
                    key={fb.id}
                    sx={{
                      bgcolor: isDark 
                        ? (index % 2 === 0 ? '#495057' : '#343a40')
                        : (index % 2 === 0 ? '#ffffff' : '#f8f9fa'),
                      '&:hover': {
                        bgcolor: isDark ? '#6c757d !important' : '#e9ecef !important',
                      },
                    }}
                  >
                    <TableCell sx={{ color: isDark ? '#ffffff !important' : '#212529 !important', bgcolor: 'transparent !important' }}>
                      {fb.user}
                    </TableCell>
                    <TableCell sx={{ bgcolor: 'transparent !important' }}>
                      <Chip
                        label={`${fb.rating} ⭐`}
                        color={getRatingColor(fb.rating)}
                        variant="filled"
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ color: isDark ? '#ffffff !important' : '#212529 !important', bgcolor: 'transparent !important' }}>
                      {fb.comment}
                    </TableCell>
                    <TableCell sx={{ color: isDark ? '#ffffff !important' : '#212529 !important', bgcolor: 'transparent !important' }}>
                      {fb.date}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={feedbacks.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 20]}
          sx={{ 
            color: isDark ? '#ffffff !important' : '#212529 !important',
            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows, .MuiTablePagination-select, .MuiIconButton-root': {
              color: isDark ? '#ffffff !important' : '#212529 !important',
            }
          }}
        />
      </Paper>
    </Box>
  );
}






// import React, { useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { fetchFeedbacks } from '../../redux/slices/feedbackSlice';
// import { CTable, CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow, CSpinner } from '@coreui/react';

// const Feedback = () => {
//   const dispatch = useDispatch();
//   const { feedbacks, loading, error } = useSelector((state) => state.feedbacks);
//   const restaurantId = useSelector((state) => state.auth.restaurantId);

//   useEffect(() => {
//     if (restaurantId) {
//       dispatch(fetchFeedbacks(restaurantId));
//     }
//   }, [dispatch, restaurantId]);

//   const formatDate = (dateString) => {
//     const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
//     return new Date(dateString).toLocaleDateString(undefined, options);
//   };

//   return (
//     <div style={{ paddingLeft: '20px', paddingRight: '20px' }}>
//       <h2 className="mb-4">Customer Feedback</h2>
//       {loading ? (
//         <div className="d-flex justify-content-center">
//           <CSpinner color="primary" variant="grow" />
//         </div>
//       ) : error ? (
//         <p className="text-danger">Error: {error}</p>
//       ) : (
//         <CTable hover responsive>
//           <CTableHead>
//             <CTableRow>
//               <CTableHeaderCell>Customer Name</CTableHeaderCell>
//               <CTableHeaderCell>Phone Number</CTableHeaderCell>
//               <CTableHeaderCell>Email</CTableHeaderCell>
//               <CTableHeaderCell>Feedback</CTableHeaderCell>
//               <CTableHeaderCell>Description</CTableHeaderCell>
//               <CTableHeaderCell>Date</CTableHeaderCell>
//             </CTableRow>
//           </CTableHead>
//           <CTableBody>
//             {feedbacks?.map((feedback, index) => (
//               <CTableRow key={index}>
//                 <CTableDataCell>{feedback.customerName}</CTableDataCell>
//                 <CTableDataCell>{feedback.phoneNumber}</CTableDataCell>
//                 <CTableDataCell>{feedback.email || 'N/A'}</CTableDataCell>
//                 <CTableDataCell>{feedback.feedback || 'N/A'}</CTableDataCell>
//                 <CTableDataCell>{feedback.short || 'N/A'}</CTableDataCell>
//                 <CTableDataCell>{formatDate(feedback.date)}</CTableDataCell>
//               </CTableRow>
//             ))}
//           </CTableBody>
//         </CTable>
//       )}
//     </div>
//   );
// };

// export default Feedback;