// src/views/reports/YearlyChartReport.js
import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  CCard,
  CCardHeader,
  CCardBody,
  CFormSelect,
  CSpinner,
} from "@coreui/react";
import { CChartLine } from "@coreui/react-chartjs";

import { fetchTransactionsByRestaurantyear } from "../../redux/slices/transactionSlice";

const YearlyChartReport = () => {
  const dispatch = useDispatch();
  const restaurantId = useSelector((state) => state.auth.restaurantId);

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [transactions, setTransactions] = useState([]); // local state for chart
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("authToken");

  const yearOptions = Array.from({ length: 10 }, (_, i) => {
    const year = currentYear - i;
    return (
      <option key={year} value={year}>
        {year}
      </option>
    );
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!restaurantId || !token) return;
      setLoading(true);

      try {
        const res = await dispatch(
          fetchTransactionsByRestaurantyear({
            restaurantId,
            year: selectedYear,
            token,
          })
        ).unwrap();

        console.log("Yearly transactions (dispatch):", res);
        setTransactions(res || []); // store in local state
      } catch (err) {
        console.error("Error fetching yearly transactions:", err);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dispatch, restaurantId, selectedYear, token]);

  // Transform transactions for chart
  const chartData = useMemo(() => {
    const monthlyTotals = Array(12).fill(0);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    transactions.forEach((txn) => {
      const date = new Date(txn.createdAt);
      const monthIndex = date.getMonth();
      const total = txn.total || 0;
      if (monthIndex >= 0 && monthIndex < 12) monthlyTotals[monthIndex] += total;
    });

    return {
      labels: months,
      datasets: [
        {
          label: `Total Revenue for ${selectedYear} (₹)`,
          data: monthlyTotals,
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
        },
      ],
    };
  }, [transactions, selectedYear]);

  return (
    <CCard className="my-4">
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Yearly Performance Report</h5>
        <CFormSelect
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          style={{ width: "120px" }}
        >
          {yearOptions}
        </CFormSelect>
      </CCardHeader>
      <CCardBody>
        {loading ? (
          <div className="d-flex justify-content-center">
            <CSpinner color="primary" variant="grow" />
          </div>
        ) : (
          <CChartLine
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: "top" },
                title: {
                  display: true,
                  text: `Monthly Revenue Trends in ${selectedYear}`,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: (value) => `₹${value.toLocaleString("en-IN")}`,
                  },
                },
              },
            }}
            style={{ height: "400px" }}
          />
        )}
      </CCardBody>
    </CCard>
  );
};

export default YearlyChartReport;
