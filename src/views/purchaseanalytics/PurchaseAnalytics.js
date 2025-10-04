import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LineChart, PieChart, BarChart } from "@mui/x-charts";
import { 
  FileText, 
  Hash, 
  Store, 
  Boxes, 
   IndianRupee , 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Calendar, 
  UtensilsCrossed, 
   ReceiptIndianRupee , 
  Info, 
  Package,
  // ExpandMore,
  // ExpandLess
} from 'lucide-react';
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
  // TrendingUp,
  // TrendingDown,
  ShoppingCart,
  Layers as Inventory,
  ChevronUp as ExpandMore,
  ChevronDown as ExpandLess,
  UtensilsCrossed as Restaurant,
  ChefHat as Kitchen
} from 'lucide-react';
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { fetchSuppliers } from '../../redux/slices/supplierSlice';
import { fetchInventories } from '../../redux/slices/stockSlice';
import { fetchMenuItems } from '../../redux/slices/menuSlice'

export default function PurchaseAnalytics() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Redux state
  const { suppliers, loading: suppliersLoading } = useSelector((state) => state.suppliers || { suppliers: [], loading: false });
  const { inventories, loading: inventoryLoading, saleProcessing } = useSelector((state) => state.inventories)
  const { menuItems, loading: menuItemsLoading } = useSelector(
    (state) => state.menuItems
  );
  const restaurantId = localStorage.getItem('restaurantId');
  const token = localStorage.getItem('authToken')

  // Local state
  const [purchaseData, setPurchaseData] = useState([]);
  const [menuItemsWithIngredients, setMenuItemsWithIngredients] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dateFilter, setDateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('inventory'); // 'inventory' or 'menu'
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Fetch data
  useEffect(() => {
    if (restaurantId && token) {
      dispatch(fetchInventories({ restaurantId, token }))
      dispatch(fetchSuppliers({ restaurantId, token }))
      dispatch(fetchMenuItems({ restaurantId, token }))
    }
  }, [restaurantId, token, dispatch])
  // Transform inventory 
  useEffect(() => {
    if (inventories.length > 0 && suppliers.length > 0) {
      console.log("Starting inventory data transformation...");

      // Sort inventories by purchasedAt date to get chronological order
      const sortedInventories = [...inventories].sort((a, b) => {
        const dateA = new Date(a.stock?.purchasedAt || a.createdAt);
        const dateB = new Date(b.stock?.purchasedAt || b.createdAt);
        return dateA - dateB;
      });

      const transformedData = sortedInventories.map((inventory, index) => {
        const supplier = suppliers.find(s => String(s._id) === String(inventory.supplierId));

        // FIXED: Access amount and quantity from stock object
        const currentAmount = inventory.stock?.amount || 0;
        const currentQuantity = inventory.stock?.quantity || 0;

        // Calculate current rate per unit
        const currentRate = currentQuantity > 0 ? currentAmount / currentQuantity : 0;

        // Find previous purchase of the same item from the same supplier
        const previousPurchase = sortedInventories
          .slice(0, index) // Only look at purchases before current one
          .reverse() // Start from most recent
          .find(prevInventory =>
            prevInventory.itemName === inventory.itemName &&
            String(prevInventory.supplierId) === String(inventory.supplierId)
          );

        let previousRate = 0;
        let rateChange = 0;
        let isFirstTimePurchase = !previousPurchase;

        if (previousPurchase && previousPurchase.stock?.amount && previousPurchase.stock?.quantity) {
          // Calculate previous rate from historical purchase
          previousRate = previousPurchase.stock.amount / previousPurchase.stock.quantity;

          // Calculate rate change percentage
          rateChange = previousRate > 0
            ? (((currentRate - previousRate) / previousRate) * 100).toFixed(2)
            : 0;
        } else {
          // First time purchase - no rate change
          previousRate = currentRate;
          rateChange = 0;
        }

        return {
          id: inventory._id,
          inventoryName: inventory.itemName,
          inventoryId: inventory._id.slice(-6),
          supplier: supplier?.supplierName || inventory.supplierName || 'Unknown Supplier',
          supplierId: inventory.supplierId,
          category: inventory.unit || 'General',
          amount: currentAmount,
          quantity: currentQuantity,
          previousRate: previousRate.toFixed(2),
          currentRate: currentRate.toFixed(2),
          rateChange: rateChange,
          isFirstTimePurchase, // Flag to identify first-time purchases
          menuItem: inventory.itemName,
          usedQuantity: Math.floor(currentQuantity * 0.3), // Estimated usage
          date: inventory.stock?.purchasedAt
            ? new Date(inventory.stock.purchasedAt).toISOString().split('T')[0]
            : new Date(inventory.createdAt).toISOString().split('T')[0],
          createdAt: inventory.createdAt,
          updatedAt: inventory.updatedAt,
          purchasedAt: inventory.stock?.purchasedAt,
          previousPurchaseDate: previousPurchase?.stock?.purchasedAt || null,
        };
      });

      setPurchaseData(transformedData);
    }
  }, [inventories, suppliers]);

  useEffect(() => {
    if (menuItems.length > 0 && inventories.length > 0 && suppliers.length > 0) {
      console.log("Starting menu items with ingredients transformation...");

      // Sort inventories by purchasedAt date for historical comparison
      const sortedInventories = [...inventories].sort((a, b) => {
        const dateA = new Date(a.stock?.purchasedAt || a.createdAt);
        const dateB = new Date(b.stock?.purchasedAt || b.createdAt);
        return dateA - dateB;
      });

      const menuItemsWithCosts = menuItems.map(menuItem => {
        const ingredients = menuItem.stockItems?.map(stockItem => {
          const inventory = inventories.find(
            inv => String(inv._id) === String(stockItem.stockId)
          );

          if (!inventory || !inventory.stock?.quantity || !inventory.stock?.amount) {
            return {
              stockId: stockItem.stockId,
              name: "Unknown Item",
              quantity: stockItem.quantity,
              costPerUnit: 0,
              totalCost: 0,
              supplier: "Unknown",
              rateChange: 0,
              unit: "unit",
              isFirstTimePurchase: true,
            };
          }

          const supplier = suppliers.find(
            s => String(s._id) === String(inventory.supplierId)
          );

          // === Inventory values ===
          const inventoryRate = inventory.stock.amount;       // rate per unit (e.g. 25/kg, 60/litre, etc.)
          const inventoryQuantity = inventory.stock.quantity; // total quantity purchased
          // const unit = inventory.unit?.toLowerCase() || "unit";
          const unit = stockItem.unit?.toLowerCase() || inventory.unit?.toLowerCase() || "unit";

          // === Convert rate into smallest unit ===
          let currentRate = 0;
          if (unit === "kg") {
            currentRate = inventoryRate;
          } else if (unit === "gm") {
            currentRate = inventoryRate / 1000;
          } else if (unit === "litre") {
            currentRate = inventoryRate / 1000; // per ml
          } else if (unit === "ml") {
            currentRate = inventoryRate; // already per ml
          } else if (unit === "pcs") {
            currentRate = inventoryRate; // per piece
          } else {
            currentRate = inventoryRate; // fallback
          }

          // === Calculate costs ===
          const totalCost = currentRate * stockItem.quantity; // recipe usage cost
          const totalInventoryCost = inventoryRate * inventoryQuantity; // purchase cost

          // === Historical rate change ===
          const currentInventoryIndex = sortedInventories.findIndex(
            inv => String(inv._id) === String(inventory._id)
          );
          const previousPurchase = sortedInventories
            .slice(0, currentInventoryIndex)
            .reverse()
            .find(
              prevInventory =>
                prevInventory.itemName === inventory.itemName &&
                String(prevInventory.supplierId) === String(inventory.supplierId)
            );

          let previousRate = 0;
          let rateChange = 0;
          let isFirstTimePurchase = !previousPurchase;

          if (
            previousPurchase &&
            previousPurchase.stock?.amount &&
            previousPurchase.stock?.quantity
          ) {
            previousRate =
              previousPurchase.stock.amount / previousPurchase.stock.quantity;
            rateChange =
              previousRate > 0
                ? (((currentRate - previousRate) / previousRate) * 100).toFixed(2)
                : 0;
          } else {
            previousRate = currentRate;
            rateChange = 0;
          }

          return {
            stockId: stockItem.stockId,
            name: inventory.itemName,
            quantity: stockItem.quantity,
            costPerUnit: currentRate.toFixed(4), // smallest unit rate (gm, ml, pcs)
            displayRate: `${inventoryRate}/${unit}`, // original input rate for UI
            totalCost: totalCost,
            supplier: supplier?.supplierName || inventory.supplierName || "Unknown",
            unit: unit,
            previousRate: previousRate.toFixed(4),
            currentRate: currentRate,
            rateChange: rateChange,
            isFirstTimePurchase,
            inventoryQuantity: inventoryQuantity,
            totalInventoryCost: totalInventoryCost,
            previousPurchaseDate: previousPurchase?.stock?.purchasedAt || null,
          };
        }) || [];

        // === Menu item level calculations ===
        const totalIngredientCost = ingredients.reduce(
          (sum, ing) => sum + ing.totalCost,
          0
        );
        const profitMargin = menuItem.price - totalIngredientCost;
        const profitPercentage =
          menuItem.price > 0
            ? ((profitMargin / menuItem.price) * 100).toFixed(2)
            : 0;

        return {
          id: menuItem._id,
          menuId: menuItem.menuId,
          itemName: menuItem.itemName,
          price: menuItem.price,
          category: menuItem.sub_category || "General",
          ingredients,
          totalIngredientCost: totalIngredientCost,
          profitMargin: profitMargin.toFixed(2),
          profitPercentage,
          stock:
            menuItem.stockItems?.reduce(
              (sum, item) => sum + (item.quantity || 0),
              0
            ) || 0,
          isActive: menuItem.isActive,
          date: menuItem.createdAt
            ? new Date(menuItem.createdAt).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          createdAt: menuItem.createdAt,
        };
      });

      setMenuItemsWithIngredients(menuItemsWithCosts);
    }
  }, [menuItems, inventories, suppliers]);


  // useEffect(() => {
  //   if (menuItems.length > 0 && inventories.length > 0 && suppliers.length > 0) {
  //     console.log("Starting menu items with ingredients transformation...");

  //     // ✅ Conversion map
  //     // const unitConversion = {
  //     //   kg: { to: "gm", factor: 1000 },
  //     //   gm: { to: "gm", factor: 1 },
  //     //   mg: { to: "gm", factor: 0.001 },
  //     //   litre: { to: "ml", factor: 1000 },
  //     //   ml: { to: "ml", factor: 1 },
  //     //   pcs: { to: "pcs", factor: 1 },
  //     // };

  //     // ✅ Helper: normalize quantity between units
  //     function normalizeQuantity(quantity, fromUnit, toUnit) {
  //       if (!unitConversion[fromUnit] || !unitConversion[toUnit]) return quantity;

  //       // Convert to base (gm/ml/pcs)
  //       const baseQty = quantity * unitConversion[fromUnit].factor;

  //       // Convert base to target
  //       return baseQty / unitConversion[toUnit].factor;
  //     }

  //     // Sort inventories by purchase date
  //     const sortedInventories = [...inventories].sort((a, b) => {
  //       const dateA = new Date(a.stock?.purchasedAt || a.createdAt);
  //       const dateB = new Date(b.stock?.purchasedAt || b.createdAt);
  //       return dateA - dateB;
  //     });

  //     const menuItemsWithCosts = menuItems.map(menuItem => {
  //       const ingredients = menuItem.stockItems?.map(stockItem => {
  //         const inventory = inventories.find(
  //           inv => String(inv._id) === String(stockItem.stockId)
  //         );

  //         if (!inventory || !inventory.stock?.quantity || !inventory.stock?.amount) {
  //           return {
  //             stockId: stockItem.stockId,
  //             name: "Unknown Item",
  //             quantity: stockItem.quantity,
  //             costPerUnit: 0,
  //             totalCost: 0,
  //             supplier: "Unknown",
  //             rateChange: 0,
  //             unit: "unit",
  //             isFirstTimePurchase: true,
  //           };
  //         }

  //         const supplier = suppliers.find(
  //           s => String(s._id) === String(inventory.supplierId)
  //         );

  //         const inventoryAmount = inventory.stock.amount; // total money spent
  //         const inventoryQuantity = inventory.stock.quantity; // total qty purchased
  //         const inventoryUnit = inventory.stock.unit || "unit";
  //         const recipeUnit = stockItem.unit || inventoryUnit;

  //         // ✅ Normalize recipe qty to stock unit
  //         const normalizedQty = normalizeQuantity(stockItem.quantity, recipeUnit, inventoryUnit);

  //         // ✅ Cost per unit (in stock unit, not double divided)
  //         const currentRate = inventoryAmount ;

  //         // ✅ Total cost for recipe qty
  //         const totalCost = currentRate * normalizedQty;

  //         console.log("Rate:", currentRate, "Normalized Qty:", normalizedQty, "Total:", totalCost);

  //         // Find previous purchase for comparison
  //         const currentInventoryIndex = sortedInventories.findIndex(
  //           inv => String(inv._id) === String(inventory._id)
  //         );
  //         const previousPurchase = sortedInventories
  //           .slice(0, currentInventoryIndex)
  //           .reverse()
  //           .find(
  //             prevInventory =>
  //               prevInventory.itemName === inventory.itemName &&
  //               String(prevInventory.supplierId) === String(inventory.supplierId)
  //           );

  //         let previousRate = 0;
  //         let rateChange = 0;
  //         let isFirstTimePurchase = !previousPurchase;

  //         if (
  //           previousPurchase &&
  //           previousPurchase.stock?.amount &&
  //           previousPurchase.stock?.quantity
  //         ) {
  //           previousRate = previousPurchase.stock.amount / previousPurchase.stock.quantity;
  //           rateChange =
  //             previousRate > 0
  //               ? (((currentRate - previousRate) / previousRate) * 100).toFixed(2)
  //               : 0;
  //         } else {
  //           previousRate = currentRate;
  //           rateChange = 0;
  //         }

  //         return {
  //           stockId: stockItem.stockId,
  //           name: inventory.itemName,
  //           quantity: stockItem.quantity,
  //           costPerUnit: currentRate.toFixed(2),
  //           totalCost: totalCost.toFixed(2),
  //           supplier: supplier?.supplierName || inventory.supplierName || "Unknown",
  //           unit: recipeUnit,
  //           previousRate: previousRate.toFixed(2),
  //           currentRate: currentRate.toFixed(2),
  //           rateChange,
  //           isFirstTimePurchase,
  //           inventoryAmount,
  //           inventoryQuantity,
  //           previousPurchaseDate: previousPurchase?.stock?.purchasedAt || null,
  //         };
  //       }) || [];

  //       // Calculate totals
  //       const totalIngredientCost = ingredients.reduce((sum, ing) => sum + parseFloat(ing.totalCost), 0);
  //       const profitMargin = menuItem.price - totalIngredientCost;
  //       const profitPercentage =
  //         menuItem.price > 0 ? ((profitMargin / menuItem.price) * 100).toFixed(2) : 0;

  //       return {
  //         id: menuItem._id,
  //         menuId: menuItem.menuId,
  //         itemName: menuItem.itemName,
  //         price: menuItem.price,
  //         category: menuItem.sub_category || "General",
  //         ingredients,
  //         totalIngredientCost: totalIngredientCost.toFixed(2),
  //         profitMargin: profitMargin.toFixed(2),
  //         profitPercentage,
  //         stock:
  //           menuItem.stockItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0,
  //         isActive: menuItem.isActive,
  //         date: menuItem.createdAt
  //           ? new Date(menuItem.createdAt).toISOString().split("T")[0]
  //           : new Date().toISOString().split("T")[0],
  //         createdAt: menuItem.createdAt,
  //       };
  //     });

  //     setMenuItemsWithIngredients(menuItemsWithCosts);
  //   }
  // }, [menuItems, inventories, suppliers]);

  const getSummaryData = () => {
    if (viewMode === 'inventory') {
      const totalPurchases = filteredData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      const totalQuantity = filteredData.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
      const priceIncreases = filteredData.filter(item => parseFloat(item.rateChange || 0) > 0).length;

      return {
        main: totalPurchases,
        mainLabel: 'Total Purchases',
        secondary: totalQuantity,
        secondaryLabel: 'Total Quantity',
        third: availableCategories.length,
        thirdLabel: 'Categories',
        fourth: priceIncreases,
        fourthLabel: 'Price Increases'
      };
    } else {
      // Menu items calculations
      const totalRevenuePotential = filteredData.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
      const totalIngredientCost = filteredData.reduce((sum, item) => sum + (parseFloat(item.totalIngredientCost) || 0), 0);
      const totalProfitPotential = filteredData.reduce((sum, item) => sum + (parseFloat(item.profitMargin) || 0), 0);
      const profitableItems = filteredData.filter(item => parseFloat(item.profitPercentage || 0) > 20).length;

      const averageProfitMargin = filteredData.length > 0 ? (totalProfitPotential / filteredData.length) : 0;
      const averageProfitPercentage = filteredData.length > 0
        ? (filteredData.reduce((sum, item) => sum + (parseFloat(item.profitPercentage) || 0), 0) / filteredData.length)
        : 0;

      return {
        main: totalRevenuePotential,
        mainLabel: 'Revenue Potential',
        secondary: filteredData.length,
        secondaryLabel: 'Menu Items',
        third: totalIngredientCost,
        thirdLabel: 'Total Ingredient Cost',
        fourth: profitableItems,
        fourthLabel: 'Profitable Items (>20%)',
        totalProfitPotential: totalProfitPotential,
        averageProfitMargin: averageProfitMargin,
        averageProfitPercentage: averageProfitPercentage
      };
    }
  }


  // Get current data based on view mode
  const currentData = viewMode === 'inventory' ? purchaseData : menuItemsWithIngredients;

  // Filter data based on search and filters
  const filteredData = currentData.filter(item => {
    const matchesDate = !dateFilter || item.date === dateFilter;
    const matchesCategory = !categoryFilter || item.category === categoryFilter;

    let matchesSupplier = true;
    if (supplierFilter) {
      if (viewMode === 'inventory') {
        matchesSupplier = item.supplierId === supplierFilter;
      } else {
        // For menu items, check if any ingredient has the selected supplier
        matchesSupplier = item.ingredients?.some(ing =>
          suppliers.find(s => s.supplierName === ing.supplier && s._id === supplierFilter)
        ) || false;
      }
    }

    let matchesSearch = true;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (viewMode === 'inventory') {
        matchesSearch = item.inventoryName.toLowerCase().includes(query) ||
          item.inventoryId.toLowerCase().includes(query) ||
          item.supplier.toLowerCase().includes(query);
      } else {
        matchesSearch = item.itemName.toLowerCase().includes(query) ||
          item.menuId.toLowerCase().includes(query) ||
          item.ingredients?.some(ing => ing.name.toLowerCase().includes(query));
      }
    }

    return matchesDate && matchesCategory && matchesSupplier && matchesSearch;
  });

  // Get unique categories based on view mode
  const availableCategories = [...new Set(currentData.map(item => item.category))];
  const availableSuppliers = suppliers.map(supplier => ({
    id: supplier._id,
    name: supplier.supplierName
  }));

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

  // Export functions for menu items
  const exportMenuItemsCSV = () => {
    const summaryData = getSummaryData();

    const csvRows = [
      // Summary section
      ["=== MENU ITEMS FINANCIAL SUMMARY ==="],
      ["Total Menu Items", filteredData.length],
      ["Total Revenue Potential", `₹${summaryData.main.toFixed(2)}`],
      ["Total Ingredient Cost", `₹${summaryData.third.toFixed(2)}`],
      ["Total Profit Potential", `₹${summaryData.totalProfitPotential.toFixed(2)}`],
      ["Average Profit Margin per Item", `₹${summaryData.averageProfitMargin.toFixed(2)}`],
      ["Average Profit Percentage", `${summaryData.averageProfitPercentage.toFixed(2)}%`],
      [],
      // Menu items data
      ["Menu Item", "Menu ID", "Selling Price", "Category", "Total Ingredient Cost", "Profit Margin", "Profit %", "Stock", "Active", "Date"],
      ...filteredData.map((item) => [
        item.itemName || '',
        item.menuId || '',
        parseFloat(item.price) || 0,
        item.category || '',
        parseFloat(item.totalIngredientCost) || 0,
        parseFloat(item.profitMargin) || 0,
        parseFloat(item.profitPercentage) || 0,
        item.stock || 0,
        item.isActive ? 'Yes' : 'No',
        item.date || '',
      ]),
      [],
      ["=== INGREDIENT DETAILS ==="],
      ["Menu Item", "Ingredient", "Quantity Used", "Unit", "Cost Per Unit", "Total Cost", "Supplier", "Rate Change %", "Previous Rate", "Current Rate"],

      // Flatten ingredient details with better error handling
      ...filteredData.flatMap(item =>
        (item.ingredients || []).map(ingredient => [
          item.itemName || '',
          ingredient.name || 'Unknown',
          parseFloat(ingredient.quantity) || 0,
          ingredient.unit || 'unit',
          `₹${parseFloat(ingredient.costPerUnit) || 0}`,
          `₹${parseFloat(ingredient.totalCost) || 0}`,
          ingredient.supplier || 'Unknown',
          `${parseFloat(ingredient.rateChange) || 0}%`,
          `₹${parseFloat(ingredient.previousRate) || 0}`,
          `₹${parseFloat(ingredient.currentRate) || 0}`
        ])
      )
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `menu-items-financial-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };



  const exportInventoryCSV = () => {
    const summaryData = getSummaryData();

    const csvRows = [
      // Summary section
      ["=== INVENTORY FINANCIAL SUMMARY ==="],
      ["Total Items", filteredData.length],
      ["Total Purchase Amount", `₹${summaryData.main.toFixed(2)}`],
      ["Total Quantity", summaryData.secondary],
      ["Total Categories", summaryData.third],
      ["Items with Price Increases", summaryData.fourth],
      [],
      // Inventory data
      ["Inventory Name", "Inventory ID", "Supplier", "Category", "Amount", "Quantity", "Previous Rate", "Current Rate", "Rate Change %", "Menu Item", "Used Quantity", "Date"],
      ...filteredData.map((item) => [
        item.inventoryName || '',
        item.inventoryId || '',
        item.supplier || '',
        item.category || '',
        parseFloat(item.amount) || 0,
        parseFloat(item.quantity) || 0,
        parseFloat(item.previousRate) || 0,
        parseFloat(item.currentRate) || 0,
        parseFloat(item.rateChange) || 0,
        item.menuItem || '',
        parseFloat(item.usedQuantity) || 0,
        item.date || '',
      ]),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `inventory-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };


  const exportCSV = () => {
    if (viewMode === 'menu') {
      exportMenuItemsCSV();
    } else {
      exportInventoryCSV();
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    const summaryData = getSummaryData();

    doc.setFontSize(16);
    doc.text(`${viewMode === 'menu' ? 'Menu Items Financial' : 'Inventory'} Analytics Report`, 14, 20);

    if (viewMode === 'menu') {
      doc.setFontSize(12);
      doc.text(`Total Menu Items: ${filteredData.length}`, 14, 35);
      doc.text(`Total Revenue Potential: ₹${summaryData.main.toFixed(2)}`, 14, 45);
      doc.text(`Total Ingredient Cost: ₹${summaryData.third.toFixed(2)}`, 14, 55);
      doc.text(`Total Profit Potential: ₹${summaryData.totalProfitPotential.toFixed(2)}`, 14, 65);
      doc.text(`Average Profit Margin: ₹${summaryData.averageProfitMargin}`, 14, 75);
      doc.text(`Average Profit %: ${summaryData.averageProfitPercentage}%`, 14, 85);

      doc.autoTable({
        startY: 95,
        head: [["Menu Item", "Selling Price", "Ingredient Cost", "Profit Margin", "Profit %", "Stock"]],
        body: filteredData.map((item) => [
          item.itemName,
          `₹${item.price.toFixed(2)}`,
          `₹${item.totalIngredientCost.toFixed(2)}`,
          `₹${item.profitMargin.toFixed(2)}`,
          `${item.profitPercentage}%`,
          item.stock
        ]),
        styles: { fontSize: 8 },
      });
    } else {
      // Regular inventory PDF export - unchanged
      const totalAmount = filteredData.reduce((sum, item) => sum + (item.amount || 0), 0);
      const totalQuantity = filteredData.reduce((sum, item) => sum + (item.quantity || 0), 0);

      doc.setFontSize(12);
      doc.text(`Total Amount: ₹${totalAmount.toFixed(2)}`, 14, 35);
      doc.text(`Total Quantity: ${totalQuantity}`, 14, 45);

      doc.autoTable({
        startY: 65,
        head: [["Inventory", "ID", "Supplier", "Category", "Amount", "Qty", "Prev Rate", "Curr Rate", "Change %"]],
        body: filteredData.map((item) => [
          item.inventoryName,
          item.inventoryId,
          item.supplier,
          item.category,
          `₹${(item.amount || 0).toFixed(2)}`,
          item.quantity || 0,
          `₹${(item.previousRate||0).toFixed(1)}`,
          `₹${item.currentRate}`,
          `${item.rateChange}%`,
        ]),
        styles: { fontSize: 8 },
      });
    }

    doc.save(`${viewMode}-financial-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getRateChangeColor = (change) => {
    const changeNum = parseFloat(change);
    if (changeNum > 5) return 'error';
    if (changeNum < -5) return 'success';
    return 'warning';
  };

  const getProfitColor = (profitPercentage) => {
    const profit = parseFloat(profitPercentage);
    if (profit > 50) return 'success';
    if (profit > 20) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        Purchase Analytics Dashboard
      </Typography>

      {/* View Mode Toggle */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h6">View Mode:</Typography>
          <Button
            variant={viewMode === 'inventory' ? 'contained' : 'outlined'}
            startIcon={<Inventory />}
            onClick={() => setViewMode('inventory')}
          >
            Inventory Analytics
          </Button>
          <Button
            variant={viewMode === 'menu' ? 'contained' : 'outlined'}
            startIcon={<Restaurant />}
            onClick={() => setViewMode('menu')}
          >
            Menu Item Costs
          </Button>
        </Stack>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                {viewMode === 'inventory' ? <ShoppingCart color="primary" /> : <Restaurant color="primary" />}
                <Box>
                  <Typography variant="h4">
                    {viewMode === 'inventory'
                      ? `₹${filteredData.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}`
                      : `₹${filteredData.reduce((sum, item) => sum + item.price, 0).toLocaleString()}`
                    }
                  </Typography>
                  <Typography color="text.secondary">
                    {viewMode === 'inventory' ? 'Total Purchases' : 'Total Revenue Potential'}
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
                <Inventory color="secondary" />
                <Box>
                  <Typography variant="h4">
                    {viewMode === 'inventory'
                      ? filteredData.reduce((sum, item) => sum + item.quantity, 0)
                      : filteredData.length
                    }
                  </Typography>
                  <Typography color="text.secondary">
                    {viewMode === 'inventory' ? 'Total Quantity' : 'Menu Items'}
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
                <Kitchen color="success" />
                <Box>
                  <Typography variant="h4">
                    {viewMode === 'inventory'
                      ? availableCategories.length
                      : `₹${filteredData.reduce((sum, item) => sum + parseFloat(item.totalIngredientCost || 0), 0).toFixed(0)}`
                    }
                  </Typography>
                  <Typography color="text.secondary">
                    {viewMode === 'inventory' ? 'Categories' : 'Total Ingredient Cost'}
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
                <TrendingUp color="error" />
                <Box>
                  <Typography variant="h4">
                    {viewMode === 'inventory'
                      ? filteredData.filter(item => parseFloat(item.rateChange) > 0).length
                      : filteredData.filter(item => parseFloat(item.profitPercentage) > 20).length
                    }
                  </Typography>
                  <Typography color="text.secondary">
                    {viewMode === 'inventory' ? 'Price Increases' : 'Profitable Items'}
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
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label={viewMode === 'inventory' ? "Search Inventory" : "Search Menu Items"}
              placeholder={viewMode === 'inventory' ? "Search by name or ID..." : "Search by menu item or ingredient..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Date"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          {/* <Grid item xs={12} md={2}>
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
          </Grid> */}
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Supplier</InputLabel>
              <Select
                value={supplierFilter}
                label="Supplier"
                onChange={(e) => setSupplierFilter(e.target.value)}
              >
                <MenuItem value="">All Suppliers</MenuItem>
                {availableSuppliers.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>{supplier.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setSearchQuery('');
                setDateFilter('');
                setCategoryFilter('');
                setSupplierFilter('');
              }}
              sx={{ height: '56px' }}
            >
              Clear All
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Data Table */}
     <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
        {/* Enhanced Header Section */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {viewMode === 'inventory' ? <Package size={24} /> : <UtensilsCrossed size={24} />}
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 0.5 }}>
                {viewMode === 'inventory' ? 'Inventory Management' : 'Menu Items & Costs'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {viewMode === 'inventory' 
                  ? `Tracking ${filteredData.length} inventory items with real-time rate changes`
                  : `Managing ${filteredData.length} menu items with detailed ingredient cost breakdown`}
              </Typography>
            </Box>
          </Box>
          <Chip 
            label={`Total Records: ${filteredData.length}`} 
            color="primary" 
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        </Box>

        <TableContainer>
          <Table sx={{ borderRadius: 2, overflow: "hidden" }}>
            {/* Enhanced Table Headers with Icons */}
            <TableHead>
              <TableRow sx={{ backgroundColor: isDark ? theme.palette.primary.dark : theme.palette.info.dark }}>
                {viewMode === 'inventory' ? (
                  [
                    { label: "Item Name", Icon: FileText },
                    { label: "ID", Icon: Hash },
                    { label: "Supplier", Icon: Store },
                    { label:"Unit", Icon: Boxes },
                    { label: "Amount", Icon:  IndianRupee  },
                    { label: "Quantity", Icon: BarChart3 },
                    { label: "Rate Change", Icon: TrendingUp },
                    { label: "Date", Icon: Calendar }
                  ].map((header) => (
                    <TableCell 
                      key={header.label} 
                      sx={{ 
                        fontWeight: "bold", 
                        color: isDark ? theme.palette.common.white : theme.palette.primary.contrastText,
                        fontSize: '0.875rem'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <header.Icon size={16} />
                        <span>{header.label}</span>
                      </Box>
                    </TableCell>
                  ))
                ) : (
                  [
                    { label: "Menu Item", Icon: UtensilsCrossed },
                    { label: "Price", Icon:  IndianRupee  },
                    { label: "Ingredient Cost", Icon:  ReceiptIndianRupee  },
                    { label: "Details", Icon: Info },
                    { label: "Stock", Icon: Package },
                    { label: "Date", Icon: Calendar }
                  ].map((header) => (
                    <TableCell 
                      key={header.label} 
                      sx={{ 
                        fontWeight: "bold", 
                        color: isDark ? theme.palette.common.white : theme.palette.primary.contrastText,
                        fontSize: '0.875rem'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <header.Icon size={16} />
                        <span>{header.label}</span>
                      </Box>
                    </TableCell>
                  ))
                )}
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredData
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item, idx) => (
                  <React.Fragment key={item.id}>
                    <TableRow sx={{
                      backgroundColor: isDark ? (idx % 2 === 0 ? theme.palette.grey[900] : theme.palette.grey[800]) : (idx % 2 === 0 ? "#f9f9f9" : "white"),
                      "&:hover": { backgroundColor: isDark ? theme.palette.action.hover : "#e3f2fd" },
                    }}>
                      {viewMode === 'inventory' ? (
                        <>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">{item.inventoryName}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{item.inventoryId}</Typography>
                          </TableCell>
                          <TableCell>{item.supplier}</TableCell>
                          <TableCell>
                            <Chip label={item.category} color="primary" variant="outlined" size="small" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">₹{item.amount}</Typography>
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            <Stack spacing={1}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                Previous: ₹{item.previousRate}
                              </Typography>
                              <Typography variant="caption" color="success.main" sx={{ fontWeight: 500 }}>
                                Current: ₹{item.currentRate}
                              </Typography>
                              <Chip
                                label={`${parseFloat(item.rateChange) > 0 ? '+' : ''}${item.rateChange}%`}
                                color={getRateChangeColor(item.rateChange)}
                                variant="filled"
                                size="small"
                                icon={parseFloat(item.rateChange) > 0 ? <TrendingUp /> : <TrendingDown />}
                                sx={{ fontWeight: 600 }}
                              />
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.date}</Typography>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>
                            <Stack>
                              <Typography variant="body2" fontWeight="medium">{item.itemName}</Typography>
                              <Typography variant="caption" color="text.secondary">{item.menuId}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">₹{item.price}</Typography>
                          </TableCell>
                          {/* Ingredient Cost */}
                          <TableCell>
                            <Typography variant="body2" color="warning.main" fontWeight="medium">
                              ₹{item.totalIngredientCost}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Click to view detailed ingredient breakdown" arrow placement="top">
                              <IconButton 
                                onClick={() => handleExpandRow(item.id)} 
                                size="small"
                                color="primary"
                                sx={{ 
                                  '&:hover': { 
                                    backgroundColor: isDark ? 'rgba(144, 202, 249, 0.16)' : 'rgba(25, 118, 210, 0.08)' 
                                  }
                                }}
                              >
                                {expandedRows.has(item.id) ? <ExpandLess /> : < ExpandMore />}
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={item.stock || 0}
                              variant="outlined"
                              size="small"
                            />
                            {console.log(item.stock, "stock")}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.date}</Typography>
                          </TableCell>
                        </>
                      )}
                    </TableRow>

                    {/* Expandable row for ingredient details (menu view only) */}
                    {viewMode === 'menu' && (
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                          <Collapse in={expandedRows.has(item.id)} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 2, p: 2, backgroundColor: isDark ? theme.palette.grey[900] : theme.palette.grey[50], borderRadius: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                < ReceiptIndianRupee  size={20} />
                                <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                                  Ingredient Breakdown
                                </Typography>
                              </Box>
                              <Table size="small">
                                <TableHead>
                                  <TableRow sx={{ backgroundColor: isDark ? theme.palette.grey[800] : theme.palette.grey[200] }}>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Ingredient</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Cost/Unit</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Total Cost</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Supplier</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Rate Change</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {item.ingredients?.map((ingredient, ingIdx) => (
                                    <TableRow key={ingredient.stockId} sx={{
                                      '&:hover': { backgroundColor: isDark ? theme.palette.action.hover : theme.palette.grey[100] }
                                    }}>
                                      <TableCell>
                                        <Typography variant="body2" fontWeight="medium">
                                          {ingredient.name}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="body2">
                                          {ingredient.quantity} {ingredient.unit}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Stack>
                                          <Typography variant="body2" fontWeight="medium">₹{ingredient.currentRate} / {ingredient.unit}</Typography>
                                          <Typography variant="caption" color="text.secondary">
                                            Previous: ₹{ingredient.previousRate}
                                          </Typography>
                                        </Stack>
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="body2" fontWeight="medium" color="primary.main">
                                          ₹{ingredient.totalCost}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="body2">{ingredient.supplier}</Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Chip
                                          label={`${parseFloat(ingredient.rateChange) > 0 ? '+' : ''}${ingredient.rateChange}%`}
                                          color={getRateChangeColor(ingredient.rateChange)}
                                          variant="outlined"
                                          size="small"
                                          icon={parseFloat(ingredient.rateChange) > 0 ? <TrendingUp /> : <TrendingDown />}
                                        />
                                      </TableCell>
                                    </TableRow>
                                  )) || (
                                    <TableRow>
                                      <TableCell colSpan={6}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, py: 2 }}>
                                          <Info size={16} color="gray" />
                                          <Typography variant="body2" color="text.secondary">
                                            No ingredients found for this menu item
                                          </Typography>
                                        </Box>
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

        {/* Enhanced Pagination */}
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
      {/* Charts Section - Only for inventory view */}
      {viewMode === 'inventory' && (
        <Grid container spacing={3} sx={{ mt: 3 }}>
          {/* Price Comparison Chart */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
              <Typography variant="h6" gutterBottom>
                Price Trend Comparison (Previous vs Current Rates)
              </Typography>
              {filteredData.length > 0 ? (
                <LineChart
                  dataset={filteredData.map((item, index) => ({
                    x: index + 1,
                    previousRate: parseFloat(item.previousRate),
                    currentRate: parseFloat(item.currentRate),
                    label: item.inventoryName
                  }))}
                  xAxis={[{ dataKey: "x", label: "Purchase No." }]}
                  series={[
                    { dataKey: "previousRate", label: "Previous Rate (₹)", color: "#ff9800" },
                    { dataKey: "currentRate", label: "Current Rate (₹)", color: "#2196f3" }
                  ]}
                  height={400}
                  grid={{ vertical: true, horizontal: true }}
                />
              ) : (
                <Alert severity="info">No data available for the selected filters</Alert>
              )}
            </Paper>
          </Grid>

          {/* Category Distribution */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
              <Typography variant="h6" gutterBottom>
                Purchases by Category
              </Typography>
              {filteredData.length > 0 ? (
                <PieChart
                  series={[
                    {
                      data: Object.entries(
                        filteredData.reduce((acc, item) => {
                          acc[item.category] = (acc[item.category] || 0) + item.amount;
                          return acc;
                        }, {})
                      ).map(([category, amount]) => ({
                        id: category,
                        value: amount,
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
        </Grid>
      )}

      {/* Charts Section - Only for menu view */}
      {viewMode === 'menu' && (
        <Grid container spacing={3} sx={{ mt: 3 }}>
          {/* Profit Margin Chart */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
              <Typography variant="h6" gutterBottom>
                Menu Items Profit Analysis
              </Typography>
              {filteredData.length > 0 ? (
                <LineChart
                  dataset={filteredData.map((item, index) => ({
                    menuItem: item.itemName,
                    price: item.price,
                    ingredientCost: parseFloat(item.totalIngredientCost),
                    profit: parseFloat(item.profitMargin),
                    index: index + 1
                  }))}
                  xAxis={[{ dataKey: "index", label: "Menu Item No." }]}
                  series={[
                    { dataKey: "price", label: "Selling Price (₹)", color: "#4caf50" },
                    { dataKey: "ingredientCost", label: "Ingredient Cost (₹)", color: "#f44336" },
                    { dataKey: "profit", label: "Profit Margin (₹)", color: "#2196f3" }
                  ]}
                  height={400}
                  grid={{ vertical: true, horizontal: true }}
                />
              ) : (
                <Alert severity="info">No data available for the selected filters</Alert>
              )}
            </Paper>
          </Grid>

          {/* Profit Distribution */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
              <Typography variant="h6" gutterBottom>
                Profit Distribution
              </Typography>
              {filteredData.length > 0 ? (
                <PieChart
                  series={[
                    {
                      data: [
                        {
                          id: 'high_profit',
                          value: filteredData.filter(item => parseFloat(item.profitPercentage) > 50).length,
                          label: 'High Profit (>50%)',
                          color: '#4caf50'
                        },
                        {
                          id: 'medium_profit',
                          value: filteredData.filter(item => {
                            const profit = parseFloat(item.profitPercentage);
                            return profit > 20 && profit <= 50;
                          }).length,
                          label: 'Medium Profit (20-50%)',
                          color: '#ff9800'
                        },
                        {
                          id: 'low_profit',
                          value: filteredData.filter(item => parseFloat(item.profitPercentage) <= 20).length,
                          label: 'Low Profit (≤20%)',
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
        </Grid>
      )}
    </Box>
  );
}