

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

// Global CSS fix for DataGrid width issues
const globalStyles = `
  .MuiDataGrid-root {
    width: 100% !important;
    min-width: 100% !important;
  }
  .MuiDataGrid-container--top {
    width: 100% !important;
  }
  .MuiDataGrid-container--bottom {
    width: 100% !important;
  }
  .MuiDataGrid-main {
    width: 100% !important;
  }
  .MuiDataGrid-virtualScroller {
    width: 100% !important;
  }
  .MuiDataGrid-virtualScrollerContent {
    width: 100% !important;
  }
`;

// Inject global styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = globalStyles;
  document.head.appendChild(styleSheet);
}
import { LineChart, PieChart, BarChart } from "@mui/x-charts";
import {
  FileText,
  Hash,
  Store,
  Boxes,
  IndianRupee,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  UtensilsCrossed,
  ReceiptIndianRupee,
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
import { fetchMenuItems } from '../../redux/slices/menuSlice';
import {
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CButton,
} from '@coreui/react';

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
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dateFilter, setDateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('inventory'); // 'inventory' or 'menu'
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [suppliersModalOpen, setSuppliersModalOpen] = useState(false);
  const [selectedItemSuppliers, setSelectedItemSuppliers] = useState([]);
  const [selectedItemName, setSelectedItemName] = useState('');
  const [selectedItemUnit, setSelectedItemUnit] = useState('');
  const [selectedGraphItem, setSelectedGraphItem] = useState(null);

  // Data validation helper
  const validateDataStructure = (data, type) => {
    console.log(`Validating ${type} data structure:`, data);
    if (!Array.isArray(data)) {
      console.error(`${type} is not an array:`, data);
      return false;
    }
    if (data.length === 0) {
      console.warn(`${type} array is empty`);
      return false;
    }
    console.log(`${type} validation passed, length:`, data.length);
    return true;
  };

  // Fetch data
  useEffect(() => {
    if (restaurantId && token) {
      console.log("Fetching data for restaurant:", restaurantId);
      setIsDataLoading(true);

      // Fetch data with error handling
      Promise.all([
        dispatch(fetchInventories({ restaurantId, token })),
        dispatch(fetchSuppliers({ restaurantId, token })),
        dispatch(fetchMenuItems({ restaurantId, token }))
      ]).then((results) => {
        console.log("Data fetch results:", results);
        results.forEach((result, index) => {
          const actionNames = ['inventories', 'suppliers', 'menuItems'];
          if (result.type && result.type.includes('rejected')) {
            console.error(`${actionNames[index]} fetch failed:`, result.payload);
          } else {
            console.log(`${actionNames[index]} fetch successful:`, result.payload);
          }
        });
      }).catch((error) => {
        console.error("Error in data fetching:", error);
      });
    } else {
      console.log("Missing restaurantId or token:", { restaurantId, token: !!token });
      setIsDataLoading(false);
    }
  }, [restaurantId, token, dispatch])
  // Transform inventory 
  // In PurchaseAnalytics.js

  // useEffect(() => {
  //   try {
  //     const inventoriesValid = validateDataStructure(inventories, 'inventories');
  //     if (!inventoriesValid) {
  //       setPurchaseData([]);
  //       setIsDataLoading(false);
  //       return;
  //     }

  //     console.log("Starting inventory data transformation with NEW schema logic...");

  //     // 1. Filter inventories by the current restaurantId
  //     const filteredInventories = inventories.filter(
  //       (inventory) => String(inventory.restaurantId) === String(restaurantId)
  //     );
  //     console.log("Filtered Inventories for Restaurant:", filteredInventories);

  //     // 2. Flatten the supplierStocks array into a single list of purchases
  //     const allPurchases = filteredInventories.flatMap((inventory) =>
  //       // For each inventory, map its supplierStocks to a new format
  //       (inventory.supplierStocks || []).map((stock) => ({
  //         // Item-level details
  //         id: `${inventory._id}-${stock._id}`, // Create a unique ID for the row
  //         inventoryName: inventory.itemName,
  //         inventoryId: inventory._id.slice(-6),
  //         category: inventory.unit || 'General',

  //         // Purchase-specific details from supplierStocks
  //         supplier: stock.supplierName || 'N/A',
  //         supplierId: stock.supplierId,
  //         amount: stock.totalAmount || 0,
  //         quantity: stock.purchasedQuantity || 0,
  //         currentRate: (stock.pricePerUnit || 0).toFixed(2),
  //         date: stock.purchasedAt
  //           ? new Date(stock.purchasedAt).toISOString().split('T')[0]
  //           : new Date(inventory.createdAt).toISOString().split('T')[0],

  //         // We will calculate rate change in the next step
  //         previousRate: 0,
  //         rateChange: 0,
  //       }))
  //     );
  //     console.log("Flattened purchases:", allPurchases);

  //     // 3. Sort all purchases chronologically to calculate rate changes
  //     const sortedPurchases = allPurchases.sort(
  //       (a, b) => new Date(a.date) - new Date(b.date)
  //     );

  //     // 4. Calculate rate change for each purchase
  //     const finalData = sortedPurchases.map((purchase, index, array) => {
  //       // Find the previous purchase of the SAME item from the SAME supplier
  //       const previousPurchase = array
  //         .slice(0, index) // Only look at items before this one
  //         .reverse()      // Start from the most recent
  //         .find(
  //           (prev) =>
  //             prev.inventoryName === purchase.inventoryName &&
  //             String(prev.supplierId) === String(purchase.supplierId)
  //         );

  //       let rateChange = 0;
  //       let previousRate = 0;

  //       if (previousPurchase) {
  //         previousRate = parseFloat(previousPurchase.currentRate);
  //         const currentRate = parseFloat(purchase.currentRate);
  //         if (previousRate > 0) {
  //           rateChange = (((currentRate - previousRate) / previousRate) * 100).toFixed(2);
  //         }
  //       }

  //       return {
  //         ...purchase,
  //         previousRate: (previousRate || parseFloat(purchase.currentRate)).toFixed(2),
  //         rateChange: rateChange,
  //         isFirstTimePurchase: !previousPurchase,
  //       };
  //     });

  //     setPurchaseData(finalData);
  //     console.log("Transformed purchase data (final):", finalData);
  //   } catch (error) {
  //     console.error("Error in inventory transformation:", error);
  //   } finally {
  //     setIsDataLoading(false);
  //   }
  // }, [inventories, restaurantId]);
  // In PurchaseAnalytics.js

  useEffect(() => {
    try {
      const inventoriesValid = validateDataStructure(inventories, 'inventories');
      if (!inventoriesValid) {
        setPurchaseData([]);
        setIsDataLoading(false);
        return;
      }

      console.log("Starting inventory data transformation with NEW schema logic...");

      // 1. Filter inventories by the current restaurantId
      const filteredInventories = inventories.filter(
        (inventory) => String(inventory.restaurantId) === String(restaurantId)
      );
      console.log("Filtered Inventories for Restaurant:", filteredInventories);

      // 2. Flatten the supplierStocks array into a single list of purchases
      const allPurchases = filteredInventories.flatMap((inventory) =>
        // For each inventory, map its supplierStocks to a new format
        (inventory.supplierStocks || []).map((stock) => ({
          // Item-level details
          id: `${inventory._id}-${stock._id}`, // Create a unique ID for the row
          inventoryName: inventory.itemName,
          inventoryId: inventory._id.slice(-6),
          category: inventory.unit || 'General',

          // Purchase-specific details from supplierStocks
          supplier: stock.supplierName || 'N/A',
          supplierId: stock.supplierId,
          amount: stock.totalAmount || 0,
          quantity: stock.purchasedQuantity || 0,
          currentRate: (stock.pricePerUnit || 0).toFixed(2),
          date: stock.purchasedAt
            ? new Date(stock.purchasedAt).toISOString().split('T')[0]
            : new Date(inventory.createdAt).toISOString().split('T')[0],

          // We will calculate rate change in the next step
          previousRate: 0,
          rateChange: 0,
        }))
      );
      console.log("Flattened purchases:", allPurchases);

      // 3. Sort all purchases chronologically to calculate rate changes
      const sortedPurchases = allPurchases.sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      // 4. Calculate rate change for each purchase
      const finalData = sortedPurchases.map((purchase, index, array) => {
        // Find the previous purchase of the SAME item from the SAME supplier
        const previousPurchase = array
          .slice(0, index) // Only look at items before this one
          .reverse()      // Start from the most recent
          .find(
            (prev) =>
              prev.inventoryName === purchase.inventoryName &&
              String(prev.supplierId) === String(purchase.supplierId)
          );

        let rateChange = 0;
        let previousRate = 0;

        if (previousPurchase) {
          previousRate = parseFloat(previousPurchase.currentRate);
          const currentRate = parseFloat(purchase.currentRate);
          if (previousRate > 0) {
            rateChange = (((currentRate - previousRate) / previousRate) * 100).toFixed(2);
          }
        }

        return {
          ...purchase,
          previousRate: (previousRate || parseFloat(purchase.currentRate)).toFixed(2),
          rateChange: rateChange,
          isFirstTimePurchase: !previousPurchase,
        };
      });

      setPurchaseData(finalData);
      console.log("Transformed purchase data (final):", finalData);
    } catch (error) {
      console.error("Error in inventory transformation:", error);
    } finally {
      setIsDataLoading(false);
    }
  }, [inventories, restaurantId]);
  useEffect(() => {
    try {
      const menuItemsValid = validateDataStructure(menuItems, 'menuItems');
      const inventoriesValid = validateDataStructure(inventories, 'inventories');
      if (!menuItemsValid || !inventoriesValid) {
        setMenuItemsWithIngredients([]);
        return;
      }

      console.log("Starting menu items transformation with ACCURATE UNIT CONVERSION...");

      const filteredMenuItems = menuItems.filter(item => String(item.restaurantId) === String(restaurantId));
      const filteredInventories = inventories.filter(item => String(item.restaurantId) === String(restaurantId));

      const menuItemsWithCosts = filteredMenuItems.flatMap(menuItem => {
        // If menu item has sizes, create separate rows for each size
        if (menuItem.sizes && menuItem.sizes.length > 0) {
          return menuItem.sizes.map(size => {
            // Filter ingredients based on the specific size
            const ingredients = (menuItem.stockItems || [])
              .filter(stockItem => {
                // Only include ingredients that match the current size
                return stockItem.size === size.name || stockItem.size === size.name.toLowerCase();
              })
              .map(stockItem => {
                const inventory = filteredInventories.find(inv => String(inv._id) === String(stockItem.stockId));

                if (!inventory || !inventory.supplierStocks || inventory.supplierStocks.length === 0) {
                  return { name: "Unknown Item", totalCost: 0, costPerUnit: 0, currentRate: 0, previousRate: 0, rateChange: 0, supplier: 'N/A', unit: 'N/A', stockId: stockItem.stockId, quantity: stockItem.quantity };
                }

                const latestPurchase = [...inventory.supplierStocks].sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt))[0];

                // --- 👇 NEW UNIT CONVERSION LOGIC START 👇 ---

                const normalizeUnit = (u) => {
                  if (!u) return '';
                  u = u.toLowerCase().trim();
                  if (['g', 'gram', 'grams'].includes(u)) return 'gm';
                  if (['kilogram', 'kgs', 'kg.'].includes(u)) return 'kg';
                  if (['l', 'liter', 'liters'].includes(u)) return 'litre';
                  if (['mls'].includes(u)) return 'ml';
                  if (['piece', 'pieces', 'unit', 'units'].includes(u)) return 'pcs';
                  return u;
                };

                // Convert pricePerUnit → price per base unit (gm/ml/pcs)
                const getPricePerBaseUnit = (price, unit) => {
                  const u = normalizeUnit(unit);
                  switch (u) {
                    case 'kg': return price/1000; // ₹ per gram
                    case 'gm': return price;
                    case 'ltr': return price/1000; // ₹ per ml
                    case 'ml': return price;
                    case 'pcs': return price;
                    default: return price; // fallback
                  }
                };

                // Convert recipe quantity → base unit (gm/ml/pcs)
                const getQuantityInBaseUnit = (qty, unit) => {
                  const u = normalizeUnit(unit);
                  switch (u) {
                    case 'kg': return qty * 1000; // gm
                    case 'gm': return qty;
                    case 'ltr': return qty * 1000; // ml
                    case 'ml': return qty;
                    case 'pcs': return qty;
                    default: return qty;
                  }
                };

                const purchasePrice = latestPurchase.pricePerUnit || 0;
                const purchaseUnit = inventory.unit || 'pcs';
                const recipeQuantity = stockItem.quantity || 0;
                const recipeUnit = stockItem.unit || inventory.unit || 'pcs';

                const pricePerBaseUnit = getPricePerBaseUnit(purchasePrice, purchaseUnit);
                const recipeQuantityInBaseUnit = getQuantityInBaseUnit(recipeQuantity, recipeUnit);

                // ✅ Accurate total cost
                const totalCost = pricePerBaseUnit * recipeQuantityInBaseUnit;

                // ✅ FIXED: Calculate actual rate per recipe unit
                const recipeUnitInBaseUnits = getQuantityInBaseUnit(1, recipeUnit);
                const currentRatePerRecipeUnit = pricePerBaseUnit * recipeUnitInBaseUnits;

                const currentRate =  pricePerBaseUnit * recipeUnitInBaseUnits;

                return {
                  stockId: stockItem.stockId,
                  name: inventory.itemName,
                  quantity: recipeQuantity,
                  unit: recipeUnit,
                  size: stockItem.size || 'N/A', // ✅ ADD size field
                  totalCost: totalCost,
                  supplier: latestPurchase.supplierName || 'N/A',
                  currentRate: currentRate.toFixed(2), // This is the rate of the purchase (e.g., price per kg)
                  // Other properties can be added here if needed
                  previousRate: "0.00", // Note: Previous rate logic would need similar conversion
                  rateChange: 0,
                };
              });

            const totalIngredientCost = ingredients.reduce((sum, ing) => sum + ing.totalCost, 0);
            const profitMargin = size.price - totalIngredientCost;
            const profitPercentage = size.price > 0 ? ((profitMargin / size.price) * 100).toFixed(2) : 0;

            return {
              id: `${menuItem._id}-${size.name}`, // Unique ID for each size
              itemName: menuItem.itemName,
              menuId: menuItem.menuId,
              price: size.price,
              size: size.name, // Individual size name
              category: menuItem.sub_category || "General",
              ingredients,
              totalIngredientCost: totalIngredientCost,
              profitMargin: profitMargin.toFixed(2),
              profitPercentage,
              stock: menuItem.stockItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0,
              date: new Date(menuItem.createdAt).toISOString().split("T")[0],
            };
          });
        } else {
          // If no sizes, create a single row with default values
          const ingredients = (menuItem.stockItems || []).map(stockItem => {
            const inventory = filteredInventories.find(inv => String(inv._id) === String(stockItem.stockId));

            if (!inventory || !inventory.supplierStocks || inventory.supplierStocks.length === 0) {
              return { name: "Unknown Item", totalCost: 0, costPerUnit: 0, currentRate: 0, previousRate: 0, rateChange: 0, supplier: 'N/A', unit: 'N/A', stockId: stockItem.stockId, quantity: stockItem.quantity };
            }

            const latestPurchase = [...inventory.supplierStocks].sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt))[0];

            // --- 👇 NEW UNIT CONVERSION LOGIC START 👇 ---

            const normalizeUnit = (u) => {
              if (!u) return '';
              u = u.toLowerCase().trim();
              if (['g', 'gram', 'grams'].includes(u)) return 'gm';
              if (['kilogram', 'kgs', 'kg.'].includes(u)) return 'kg';
              if (['l', 'liter', 'liters'].includes(u)) return 'litre';
              if (['mls'].includes(u)) return 'ml';
              if (['piece', 'pieces', 'unit', 'units'].includes(u)) return 'pcs';
              return u;
            };

            // Convert pricePerUnit → price per base unit (gm/ml/pcs)
            const getPricePerBaseUnit = (price, unit) => {
              const u = normalizeUnit(unit);
              switch (u) {
                case 'kg': return price/1000; // ₹ per gram
                case 'gm': return price;
                case 'ltr': return price/1000; // ₹ per ml
                case 'ml': return price;
                case 'pcs': return price;
                default: return price; // fallback
              }
            };

            // Convert recipe quantity → base unit (gm/ml/pcs)
            const getQuantityInBaseUnit = (qty, unit) => {
              const u = normalizeUnit(unit);
              switch (u) {
                case 'kg': return qty * 1000; // gm
                case 'gm': return qty;
                case 'ltr': return qty * 1000; // ml
                case 'ml': return qty;
                case 'pcs': return qty;
                default: return qty;
              }
            };

            const purchasePrice = latestPurchase.pricePerUnit || 0;
            const purchaseUnit = inventory.unit || 'pcs';
            const recipeQuantity = stockItem.quantity || 0;
            const recipeUnit = stockItem.unit || inventory.unit || 'pcs';

            const pricePerBaseUnit = getPricePerBaseUnit(purchasePrice, purchaseUnit);
            const recipeQuantityInBaseUnit = getQuantityInBaseUnit(recipeQuantity, recipeUnit);

            // ✅ Accurate total cost
            const totalCost = pricePerBaseUnit * recipeQuantityInBaseUnit;

            // ✅ FIXED: Calculate actual rate per recipe unit
            const recipeUnitInBaseUnits = getQuantityInBaseUnit(1, recipeUnit);
            const currentRatePerRecipeUnit = pricePerBaseUnit * recipeUnitInBaseUnits;

            const currentRate =  pricePerBaseUnit * recipeUnitInBaseUnits;

            return {
              stockId: stockItem.stockId,
              name: inventory.itemName,
              quantity: recipeQuantity,
              unit: recipeUnit,
              size: stockItem.size || 'N/A', // ✅ ADD size field
              totalCost: totalCost,
              supplier: latestPurchase.supplierName || 'N/A',
              currentRate: currentRate.toFixed(2), // This is the rate of the purchase (e.g., price per kg)
              // Other properties can be added here if needed
              previousRate: "0.00", // Note: Previous rate logic would need similar conversion
              rateChange: 0,
            };
          });

          const totalIngredientCost = ingredients.reduce((sum, ing) => sum + ing.totalCost, 0);
          const profitMargin = menuItem.price - totalIngredientCost;
          const profitPercentage = menuItem.price > 0 ? ((profitMargin / menuItem.price) * 100).toFixed(2) : 0;

          return {
            id: menuItem._id,
            itemName: menuItem.itemName,
            menuId: menuItem.menuId,
            price: menuItem.price,
            size: 'Standard', // Default size name
            category: menuItem.sub_category || "General",
            ingredients,
            totalIngredientCost: totalIngredientCost,
            profitMargin: profitMargin.toFixed(2),
            profitPercentage,
            stock: menuItem.stockItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0,
            date: new Date(menuItem.createdAt).toISOString().split("T")[0],
          };
        }
      });

      setMenuItemsWithIngredients(menuItemsWithCosts);
    } catch (error) {
      console.error("Error in menu items transformation with unit conversion:", error);
    }
  }, [menuItems, inventories, restaurantId]);
  // useEffect(() => {
  //   try {
  //     // Validate data before processing
  //     const inventoriesValid = validateDataStructure(inventories, 'inventories');
  //     const suppliersValid = validateDataStructure(suppliers, 'suppliers');

  //     console.log("Inventory transformation validation:");
  //     console.log("Inventories valid:", inventoriesValid);
  //     console.log("Suppliers valid:", suppliersValid);

  //     // Allow inventory transformation even without suppliers
  //     if (inventoriesValid) {
  //       console.log("Starting inventory data transformation...");
  //       console.log("Current Restaurant ID:", restaurantId);
  //       console.log("All Inventories:", inventories);

  //     // Filter inventories by restaurant ID first
  //     const filteredInventories = inventories.filter(inventory => {
  //       const inventoryRestaurantId = inventory.restaurantId || inventory.restaurant;
  //       console.log("Inventory Restaurant ID:", inventoryRestaurantId, "Matches:", String(inventoryRestaurantId) === String(restaurantId));
  //       return String(inventoryRestaurantId) === String(restaurantId);
  //     });

  //     console.log("Filtered Inventories for Restaurant:", filteredInventories);
  //     console.log("Filtered inventories count:", filteredInventories.length);

  //     // Check if we have any inventories to process
  //     if (filteredInventories.length === 0) {
  //       console.log("No inventories found for restaurant ID:", restaurantId);
  //       setPurchaseData([]);
  //       setIsDataLoading(false);
  //       return;
  //     }

  //     // Filter suppliers by restaurant ID (with fallback for empty suppliers)
  //     const filteredSuppliers = suppliers.length > 0 ? suppliers.filter(supplier => {
  //       const supplierRestaurantId = supplier.restaurantId || supplier.restaurant;
  //       return String(supplierRestaurantId) === String(restaurantId);
  //     }) : [];

  //     console.log("Filtered Suppliers for Restaurant:", filteredSuppliers);
  //     console.log("Suppliers available:", suppliers.length > 0 ? "Yes" : "No");
  //     console.log("Total suppliers in Redux:", suppliers.length);

  //     // Sort filtered inventories by purchasedAt date to get chronological order
  //     const sortedInventories = [...filteredInventories].sort((a, b) => {
  //       const dateA = new Date(a.stock?.purchasedAt || a.createdAt);
  //       const dateB = new Date(b.stock?.purchasedAt || b.createdAt);
  //       return dateA - dateB;
  //     });

  //     const transformedData = sortedInventories.map((inventory, index) => {
  //       const supplier = filteredSuppliers.length > 0 ? filteredSuppliers.find(s => String(s._id) === String(inventory.supplierId)) : null;

  //       console.log("Processing inventory:", inventory.itemName);
  //       console.log("Supplier ID:", inventory.supplierId);
  //       console.log("Found supplier:", supplier?.supplierName || "No supplier found");
  //       console.log("Inventory stock data:", inventory.stock);

  //       // FIXED: Access amount and quantity from stock object
  //       const currentAmount = inventory.stock?.amount || 0;
  //       const currentQuantity = inventory.stock?.quantity || 0;

  //       console.log("Current amount:", currentAmount, "Current quantity:", currentQuantity);

  //       // Calculate current rate per unit
  //       const currentRate = currentQuantity > 0 ? currentAmount / currentQuantity : 0;

  //       console.log("Calculated current rate:", currentRate);

  //       // Find previous purchase of the same item from the same supplier
  //       const previousPurchase = sortedInventories
  //         .slice(0, index) // Only look at purchases before current one
  //         .reverse() // Start from most recent
  //         .find(prevInventory =>
  //           prevInventory.itemName === inventory.itemName &&
  //           String(prevInventory.supplierId) === String(inventory.supplierId)
  //         );

  //       let previousRate = 0;
  //       let rateChange = 0;
  //       let isFirstTimePurchase = !previousPurchase;

  //       if (previousPurchase && previousPurchase.stock?.amount && previousPurchase.stock?.quantity) {
  //         // Calculate previous rate from historical purchase
  //         previousRate = previousPurchase.stock.amount / previousPurchase.stock.quantity;

  //         // Calculate rate change percentage
  //         rateChange = previousRate > 0
  //           ? (((currentRate - previousRate) / previousRate) * 100).toFixed(2)
  //           : 0;
  //       } else {
  //         // First time purchase - no rate change
  //         previousRate = currentRate;
  //         rateChange = 0;
  //       }

  //       return {
  //         id: inventory._id,
  //         inventoryName: inventory.itemName,
  //         inventoryId: inventory._id.slice(-6),
  //         supplier: supplier?.supplierName || inventory.supplierName || 'No Supplier Data',
  //         supplierId: inventory.supplierId,
  //         suppliers: inventory.suppliers || [], // Add suppliers array
  //         category: inventory.unit || 'General',
  //         amount: currentAmount,
  //         quantity: currentQuantity,
  //         previousRate: previousRate.toFixed(2),
  //         currentRate: currentRate.toFixed(2),
  //         rateChange: rateChange,
  //         isFirstTimePurchase, // Flag to identify first-time purchases
  //         menuItem: inventory.itemName,
  //         usedQuantity: Math.floor(currentQuantity * 0.3), // Estimated usage
  //         date: inventory.stock?.purchasedAt
  //           ? new Date(inventory.stock.purchasedAt).toISOString().split('T')[0]
  //           : new Date(inventory.createdAt).toISOString().split('T')[0],
  //         createdAt: inventory.createdAt,
  //         updatedAt: inventory.updatedAt,
  //         purchasedAt: inventory.stock?.purchasedAt,
  //         previousPurchaseDate: previousPurchase?.stock?.purchasedAt || null,
  //       };
  //     });

  //     setPurchaseData(transformedData);
  //     console.log("Transformed purchase data:", transformedData);
  //     console.log("Purchase data set successfully, length:", transformedData.length);
  //     console.log("Sample transformed data:", transformedData.slice(0, 2));
  //     setIsDataLoading(false);
  //   } else {
  //     console.log("Inventory transformation skipped - missing data:");
  //     console.log("Inventories length:", inventories.length);
  //     console.log("Suppliers length:", suppliers.length);
  //     console.log("Inventories valid:", inventoriesValid);
  //     console.log("Suppliers valid:", suppliersValid);
  //   }
  //   } catch (error) {
  //     console.error("Error in inventory transformation:", error);
  //   }
  // }, [inventories, suppliers]);



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
      const totalRevenuePotential = filteredData.reduce((sum, item) => sum + (parseFloat(item.totalIngredientCost) || 0), 0);
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

  // Fallback: If no data is available, show empty state
  if (currentData.length === 0) {
    console.log("No data available for current view mode:", viewMode);
    console.log("Purchase data:", purchaseData);
    console.log("Menu items with ingredients:", menuItemsWithIngredients);
  }

  // Debug logging
  console.log("=== DEBUGGING DATA LOADING ===");
  console.log("View Mode:", viewMode);
  console.log("Purchase Data Length:", purchaseData.length);
  console.log("Menu Items with Ingredients Length:", menuItemsWithIngredients.length);
  console.log("Current Data Length:", currentData.length);
  console.log("Inventories from Redux:", inventories.length);
  console.log("Menu Items from Redux:", menuItems.length);
  console.log("Suppliers from Redux:", suppliers.length);
  console.log("Restaurant ID:", restaurantId);

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

  // Debug filtered data
  console.log("Filtered Data Length:", filteredData.length);
  console.log("Filtered Data Sample:", filteredData.slice(0, 2));
  console.log("Search Query:", searchQuery);
  console.log("Date Filter:", dateFilter);
  console.log("Category Filter:", categoryFilter);
  console.log("Supplier Filter:", supplierFilter);

  // Get unique categories based on view mode
  const availableCategories = [...new Set(currentData.map(item => item.category))];

  // Filter suppliers by restaurant ID for dropdown
  const filteredSuppliersForDropdown = suppliers.filter(supplier => {
    const supplierRestaurantId = supplier.restaurantId || supplier.restaurant;
    return String(supplierRestaurantId) === String(restaurantId);
  });

  const availableSuppliers = filteredSuppliersForDropdown.map(supplier => ({
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
      ["Total Ingredient Cost", `₹${summaryData.main.toFixed(2)}`],
      ["Total Ingredient Cost (Detailed)", `₹${summaryData.third.toFixed(2)}`],
      ["Total Profit Potential", `₹${summaryData.totalProfitPotential.toFixed(2)}`],
      ["Average Profit Margin per Item", `₹${summaryData.averageProfitMargin.toFixed(2)}`],
      ["Average Profit Percentage", `${summaryData.averageProfitPercentage.toFixed(2)}%`],
      [],
      // Menu items data
      ["Menu Item", "Menu ID", "Category", "Total Ingredient Cost", "Profit Margin", "Profit %", "Stock", "Active", "Date"],
      ...filteredData.map((item) => [
        item.itemName || '',
        item.menuId || '',
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
      doc.text(`Total Ingredient Cost: ₹${summaryData.main.toFixed(2)}`, 14, 45);
      doc.text(`Total Ingredient Cost (Detailed): ₹${summaryData.third.toFixed(2)}`, 14, 55);
      doc.text(`Total Profit Potential: ₹${summaryData.totalProfitPotential.toFixed(2)}`, 14, 65);
      doc.text(`Average Profit Margin: ₹${summaryData.averageProfitMargin}`, 14, 75);
      doc.text(`Average Profit %: ${summaryData.averageProfitPercentage}%`, 14, 85);

      doc.autoTable({
        startY: 95,
        head: [["Menu Item", "Ingredient Cost", "Profit Margin", "Profit %", "Stock"]],
        body: filteredData.map((item) => [
          item.itemName,
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
          `₹${(item.previousRate || 0).toFixed(1)}`,
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
    <Box sx={{
      p: 3,
      width: '100%',
      minWidth: '100%',
      overflow: 'hidden'
    }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        Purchase Analytics Dashboard
      </Typography>

      {/* View Mode Toggle */}
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
              <Button
                variant={viewMode === 'inventory' ? 'contained' : 'outlined'}
                startIcon={<Inventory />}
                onClick={() => setViewMode('inventory')}
                sx={{
                  minWidth: { xs: '100%', sm: 'auto' },
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  py: { xs: 1.5, sm: 1 },
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                Inventory Analytics
              </Button>
              <Button
                variant={viewMode === 'menu' ? 'contained' : 'outlined'}
                startIcon={<Restaurant />}
                onClick={() => setViewMode('menu')}
                sx={{
                  minWidth: { xs: '100%', sm: 'auto' },
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  py: { xs: 1.5, sm: 1 },
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                Menu Item Costs
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{
        mb: 3,
        width: '100%',
        minWidth: '100%'
      }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            borderRadius: 3,
            boxShadow: 3,
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <CardContent sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minHeight: '120px'
            }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ height: '100%' }}>
                {viewMode === 'inventory' ? <ShoppingCart color="primary" size={32} /> : <Restaurant color="primary" size={32} />}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" sx={{
                    fontWeight: 'bold',
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                    lineHeight: 1.2
                  }}>
                    {viewMode === 'inventory'
                      ? `₹${filteredData.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}`
                      : `₹${filteredData.reduce((sum, item) => sum + parseFloat(item.totalIngredientCost || 0), 0).toFixed(2)}`
                    }
                  </Typography>
                  <Typography color="text.secondary" sx={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    mt: 0.5
                  }}>
                    {viewMode === 'inventory' ? 'Total Purchases' : 'Total Ingredient Cost'}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            borderRadius: 3,
            boxShadow: 3,
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <CardContent sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minHeight: '120px'
            }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ height: '100%' }}>
                <Inventory color="secondary" size={32} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" sx={{
                    fontWeight: 'bold',
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                    lineHeight: 1.2
                  }}>
                    {viewMode === 'inventory'
                      ? filteredData.reduce((sum, item) => sum + item.quantity, 0)
                      : filteredData.length
                    }
                  </Typography>
                  <Typography color="text.secondary" sx={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    mt: 0.5
                  }}>
                    {viewMode === 'inventory' ? 'Total Quantity' : 'Menu Items'}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            borderRadius: 3,
            boxShadow: 3,
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <CardContent sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minHeight: '120px'
            }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ height: '100%' }}>
                <Kitchen color="success" size={32} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" sx={{
                    fontWeight: 'bold',
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                    lineHeight: 1.2
                  }}>
                    {viewMode === 'inventory'
                      ? availableCategories.length
                      // --- REPLACEMENT LOGIC START ---
                      : `₹${filteredData.length > 0
                        ? (
                          filteredData.reduce((sum, item) => sum + parseFloat(item.totalIngredientCost || 0), 0) /
                          filteredData.length
                        ).toFixed(2)
                        : '0.00'
                      }`
                      // --- REPLACEMENT LOGIC END ---
                    }
                  </Typography>
                  <Typography color="text.secondary" sx={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    mt: 0.5
                  }}>
                    {viewMode === 'inventory' ? 'Categories' : 'Total Ingredient Cost'}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            borderRadius: 3,
            boxShadow: 3,
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <CardContent sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minHeight: '120px'
            }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ height: '100%' }}>
                <TrendingUp color="error" size={32} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" sx={{
                    fontWeight: 'bold',
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                    lineHeight: 1.2
                  }}>
                    {viewMode === 'inventory'
                      ? filteredData.filter(item => parseFloat(item.rateChange) > 0).length
                      : filteredData.filter(item => parseFloat(item.profitPercentage) > 20).length
                    }
                  </Typography>
                  <Typography color="text.secondary" sx={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    mt: 0.5
                  }}>
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
      <Paper sx={{
        p: 3,
        borderRadius: 3,
        boxShadow: 3,
        width: '100%',
        minWidth: '100%',
        overflow: 'hidden'
      }}>
        {/* Loading State */}
        {isDataLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Loading data...
            </Typography>
          </Box>
        )}

        {/* Data Table Content */}
        {!isDataLoading && (
          <>
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

            <TableContainer sx={{
              width: '100%',
              minWidth: '100%',
              overflow: 'auto'
            }}>
              <Table sx={{
                borderRadius: 2,
                overflow: "hidden",
                width: '100%',
                minWidth: '100%'
              }}>
                {/* Enhanced Table Headers with Icons */}
                <TableHead>
                  <TableRow sx={{ backgroundColor: isDark ? theme.palette.primary.dark : theme.palette.info.dark }}>
                    {viewMode === 'inventory' ? (
                      [
                        { label: "Item Name", Icon: FileText },
                        { label: "ID", Icon: Hash },
                        { label: "Suppliers", Icon: Store },
                        { label: "Unit", Icon: Boxes },
                        { label: "Amount", Icon: IndianRupee },
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
                        { label: "Size", Icon: Package }, // ✅ ADD SIZE COLUMN
                        { label: "Ingredient Cost", Icon: ReceiptIndianRupee },
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
                  {filteredData && filteredData.length > 0 ? (
                    filteredData
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((item, idx) => (
                        <React.Fragment key={item.id}>
                          <TableRow
                            sx={{
                              backgroundColor: isDark ? (idx % 2 === 0 ? theme.palette.grey[900] : theme.palette.grey[800]) : (idx % 2 === 0 ? "#f9f9f9" : "white"),
                              cursor: 'pointer',
                              border: selectedGraphItem?.id === item.id ? `2px solid ${theme.palette.primary.main}` : 'none',
                              '&:hover': {
                                backgroundColor: isDark ? theme.palette.action.hover : "#e3f2fd",
                                transform: 'scale(1.01)',
                                transition: 'all 0.2s ease-in-out'
                              }
                            }}
                            onClick={() => {
                              if (viewMode === 'inventory') {
                                setSelectedGraphItem({
                                  id: item.id,
                                  name: item.inventoryName,
                                  amount: item.amount,
                                  quantity: item.quantity,
                                  currentRate: item.currentRate,
                                  previousRate: item.previousRate,
                                  rateChange: item.rateChange
                                });
                              }
                            }}
                          >
                            {viewMode === 'inventory' ? (
                              <>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" fontWeight="medium">{item.inventoryName}</Typography>
                                    {selectedGraphItem?.id === item.id && (
                                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ff5722' }} />
                                    )}
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" color="text.secondary">{item.inventoryId}</Typography>
                                </TableCell>
                                {/* // In PurchaseAnalytics.js -> TableBody -> React.Fragment -> TableRow */}

                                <TableCell>
                                  <Typography variant="body2">{item.supplier}</Typography>
                                </TableCell>
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
                                {/* Size Column - Now shows individual size */}
                                <TableCell>
                                  <Chip
                                    label={`${item.size} - ₹${item.price}`}
                                    variant="outlined"
                                    size="small"
                                    color="primary"
                                    sx={{ fontSize: '0.7rem', height: '20px' }}
                                  />
                                </TableCell>
                                {/* Ingredient Cost */}
                                <TableCell>
                                  <Typography variant="body2" color="warning.main" fontWeight="medium">
                                    ₹{parseFloat(item.totalIngredientCost).toFixed(2)}
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
                                      < ReceiptIndianRupee size={20} />
                                      <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                                        Ingredient Breakdown
                                      </Typography>
                                    </Box>
                                    <Table size="small">
                                      <TableHead>
                                        <TableRow sx={{ backgroundColor: isDark ? theme.palette.grey[800] : theme.palette.grey[200] }}>
                                          <TableCell sx={{ fontWeight: 'bold' }}>Ingredient</TableCell>
                                          <TableCell sx={{ fontWeight: 'bold' }}>Size</TableCell>
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
                                              <Chip
                                                label={ingredient.size || 'N/A'}
                                                variant="outlined"
                                                size="small"
                                                color="secondary"
                                                sx={{ fontSize: '0.7rem', height: '20px' }}
                                              />
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
                                                ₹{parseFloat(ingredient.totalCost).toFixed(2)}
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
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={viewMode === 'inventory' ? 8 : 5}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, py: 4 }}>
                          <Info size={24} color="gray" />
                          <Typography variant="body1" color="text.secondary">
                            {viewMode === 'inventory'
                              ? 'No inventory data available. Please check if data is loaded properly.'
                              : 'No menu items data available. Please check if data is loaded properly.'
                            }
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
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
          </>
        )}
      </Paper>
      {/* Charts Section - Only for inventory view */}
      {viewMode === 'inventory' && (
        <Grid container spacing={3} sx={{ mt: 3 }}>
          {/* Interactive Amount vs Quantity Chart */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Inventory Analytics - Amount vs Quantity
                </Typography>
                {selectedGraphItem && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={`Selected: ${selectedGraphItem.name}`}
                      color="primary"
                      variant="filled"
                      sx={{ fontWeight: 600 }}
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setSelectedGraphItem(null)}
                      sx={{ minWidth: 'auto', px: 1 }}
                    >
                      Clear
                    </Button>
                  </Stack>
                )}
              </Box>
              {filteredData.length > 0 ? (
                <BarChart
                  dataset={filteredData.map((item, index) => {
                    const dataPoint = {
                      id: item.id,
                      amount: parseFloat(item.amount) || 0,
                      quantity: parseFloat(item.quantity) || 0,
                      name: item.inventoryName,
                      currentRate: parseFloat(item.currentRate) || 0,
                      previousRate: parseFloat(item.previousRate) || 0,
                      rateChange: parseFloat(item.rateChange) || 0,
                      isSelected: selectedGraphItem?.id === item.id
                    };
                    console.log('Graph Data Point:', dataPoint);
                    return dataPoint;
                  })}
                  xAxis={[{
                    dataKey: "name",
                    label: "Items",
                    scaleType: 'band'
                  }]}
                  yAxis={[{
                    dataKey: "amount",
                    label: "Amount (₹)",
                    scaleType: 'linear'
                  }]}
                  series={[
                    {
                      dataKey: "amount",
                      label: "Amount (₹)",
                      color: "#2196f3",
                      highlightScope: { faded: 'global', highlighted: 'item' }
                    },
                    {
                      dataKey: "quantity",
                      label: "Quantity",
                      color: "#ff9800",
                      highlightScope: { faded: 'global', highlighted: 'item' }
                    }
                  ]}
                  colors={filteredData.map((item, index) => {
                    if (selectedGraphItem?.id === item.id) {
                      return '#ff5722'; // Orange for selected
                    }
                    // Colorful palette for bars
                    const colors = [
                      '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3',
                      '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a',
                      '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722',
                      '#795548', '#607d8b', '#9e9e9e'
                    ];
                    return colors[index % colors.length];
                  })}
                  height={400}
                  grid={{ vertical: true, horizontal: true }}
                  onItemClick={(event, itemData) => {
                    if (itemData) {
                      setSelectedGraphItem({
                        id: itemData.id,
                        name: itemData.name,
                        amount: itemData.amount,
                        quantity: itemData.quantity,
                        currentRate: itemData.currentRate,
                        previousRate: itemData.previousRate,
                        rateChange: itemData.rateChange
                      });
                    }
                  }}
                />
              ) : (
                <Alert severity="info">No data available for the selected filters</Alert>
              )}
            </Paper>
          </Grid>

          {/* Selected Item Details or Category Distribution */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
              {selectedGraphItem ? (
                <>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ff5722' }} />
                    Selected Item Details
                  </Typography>
                  <Box sx={{ p: 2, backgroundColor: isDark ? theme.palette.grey[800] : theme.palette.grey[50], borderRadius: 2 }}>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Item Name</Typography>
                        <Typography variant="body1" fontWeight="medium">{selectedGraphItem.name}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Amount</Typography>
                        <Typography variant="body1" fontWeight="medium" color="primary.main">
                          ₹{selectedGraphItem.amount}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Quantity</Typography>
                        <Typography variant="body1" fontWeight="medium" color="secondary.main">
                          {selectedGraphItem.quantity}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Current Rate</Typography>
                        <Typography variant="body1" fontWeight="medium" color="success.main">
                          ₹{selectedGraphItem.currentRate}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Previous Rate</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          ₹{selectedGraphItem.previousRate}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Rate Change</Typography>
                        <Chip
                          label={`${selectedGraphItem.rateChange > 0 ? '+' : ''}${selectedGraphItem.rateChange}%`}
                          color={getRateChangeColor(selectedGraphItem.rateChange)}
                          variant="filled"
                          size="small"
                          icon={selectedGraphItem.rateChange > 0 ? <TrendingUp /> : <TrendingDown />}
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                    </Stack>
                  </Box>
                </>
              ) : (
                <>
                  <Typography variant="h6" gutterBottom>
                    Items by Quantity
                  </Typography>
                  {filteredData.length > 0 ? (
                    <PieChart
                      series={[
                        {
                          data: filteredData.map((item, index) => {
                            const dataPoint = {
                              id: item.id,
                              value: parseFloat(item.quantity) || 0,
                              label: item.inventoryName,
                            };
                            console.log('Pie Chart Data Point:', dataPoint);
                            return dataPoint;
                          }),
                          highlightScope: { faded: 'global', highlighted: 'item' },
                          faded: { additionalRadius: -30, color: 'gray' },
                        },
                      ]}
                      colors={[
                        '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3',
                        '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a',
                        '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722',
                        '#795548', '#607d8b', '#9e9e9e'
                      ]}
                      sx={{
                        '& .MuiPieArc-root': {
                          fill: '#2196f3 !important'
                        }
                      }}
                      height={400}
                      onItemClick={(event, itemData) => {
                        if (itemData) {
                          const selectedItem = filteredData.find(item => item.id === itemData.id);
                          if (selectedItem) {
                            setSelectedGraphItem({
                              id: selectedItem.id,
                              name: selectedItem.inventoryName,
                              amount: selectedItem.amount,
                              quantity: selectedItem.quantity,
                              currentRate: selectedItem.currentRate,
                              previousRate: selectedItem.previousRate,
                              rateChange: selectedItem.rateChange
                            });
                          }
                        }
                      }}
                    />
                  ) : (
                    <Alert severity="info">No data available</Alert>
                  )}
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Charts Section - Only for menu view */}
      {viewMode === 'menu' && (
        <Grid container spacing={3} sx={{ mt: 3 }}>
          {/* Stock vs Ingredient Cost Bar Chart */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BarChart3 size={24} />
                Menu Items: Stock vs Ingredient Cost Analysis
              </Typography>
              {filteredData.length > 0 ? (
                <BarChart
                  dataset={filteredData.map((item, index) => ({
                    id: item.id,
                    menuItem: item.itemName,
                    stock: parseFloat(item.stock) || 0,
                    ingredientCost: parseFloat(item.totalIngredientCost) || 0,
                    profitMargin: parseFloat(item.profitMargin) || 0,
                    profitPercentage: parseFloat(item.profitPercentage) || 0,
                    index: index + 1
                  }))}
                  xAxis={[{
                    dataKey: "menuItem",
                    label: "Menu Items",
                    scaleType: 'band'
                  }]}
                  yAxis={[
                    {
                      dataKey: "stock",
                      label: "Stock Quantity",
                      scaleType: 'linear'
                    },
                    {
                      dataKey: "ingredientCost",
                      label: "Ingredient Cost (₹)",
                      scaleType: 'linear'
                    }
                  ]}
                  series={[
                    {
                      dataKey: "stock",
                      label: "Stock Quantity",
                      color: "#4caf50",
                      yAxisKey: "stock"
                    },
                    {
                      dataKey: "ingredientCost",
                      label: "Ingredient Cost (₹)",
                      color: "#ff9800",
                      yAxisKey: "ingredientCost"
                    }
                  ]}
                  colors={filteredData.map((item, index) => {
                    // Color based on profit percentage
                    const profit = parseFloat(item.profitPercentage) || 0;
                    if (profit > 50) return '#4caf50'; // Green for high profit
                    if (profit > 20) return '#ff9800'; // Orange for medium profit
                    return '#f44336'; // Red for low profit
                  })}
                  height={400}
                  grid={{ vertical: true, horizontal: true }}
                  onItemClick={(event, itemData) => {
                    if (itemData) {
                      console.log('Clicked menu item:', itemData);
                    }
                  }}
                />
              ) : (
                <Alert severity="info">No data available for the selected filters</Alert>
              )}
            </Paper>
          </Grid>

          {/* Menu Item Details Summary */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <UtensilsCrossed size={20} />
                Menu Items Summary
              </Typography>
              {filteredData.length > 0 ? (
                <Box sx={{ p: 2, backgroundColor: isDark ? theme.palette.grey[800] : theme.palette.grey[50], borderRadius: 2 }}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Total Menu Items</Typography>
                      <Typography variant="h4" fontWeight="bold" color="primary.main">
                        {filteredData.length}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Total Stock</Typography>
                      <Typography variant="h5" fontWeight="medium" color="success.main">
                        {filteredData.reduce((sum, item) => sum + (parseFloat(item.stock) || 0), 0)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Total Ingredient Cost</Typography>
                      <Typography variant="h5" fontWeight="medium" color="warning.main">
                        ₹{filteredData.reduce((sum, item) => sum + (parseFloat(item.totalIngredientCost) || 0), 0).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Average Profit %</Typography>
                      <Typography variant="h5" fontWeight="medium" color="info.main">
                        {filteredData.length > 0
                          ? (filteredData.reduce((sum, item) => sum + (parseFloat(item.profitPercentage) || 0), 0) / filteredData.length).toFixed(1)
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
                            {filteredData.filter(item => parseFloat(item.profitPercentage) > 50).length}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff9800' }} />
                            <Typography variant="body2">Medium Profit (20-50%)</Typography>
                          </Box>
                          <Typography variant="body2" fontWeight="medium">
                            {filteredData.filter(item => {
                              const profit = parseFloat(item.profitPercentage);
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
                            {filteredData.filter(item => parseFloat(item.profitPercentage) <= 20).length}
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
        </Grid>
      )}

      {/* Suppliers Modal */}
      <CModal
        visible={suppliersModalOpen}
        alignment="center"
        onClose={() => setSuppliersModalOpen(false)}
        size="lg"
      >
        <CModalHeader className="bg-light border-0">
          <CModalTitle className="fw-bold">
            📦 Suppliers for {selectedItemName}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="p-3 rounded" style={{ backgroundColor: '#f8f9fa' }}>
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: isDark ? theme.palette.grey[800] : theme.palette.grey[200] }}>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Supplier Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Item</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Quantity</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Unit</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Price</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Total Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedItemSuppliers.map((supplier, index) => (
                    <TableRow
                      key={supplier._id || index}
                      sx={{
                        '&:hover': { backgroundColor: isDark ? theme.palette.action.hover : theme.palette.grey[100] },
                        '&:nth-of-type(odd)': { backgroundColor: isDark ? theme.palette.grey[900] : '#f9f9f9' }
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {supplier.supplierName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {selectedItemName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {supplier.quantity || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {selectedItemUnit || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium" color="primary.main">
                          ₹{supplier.amount || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold" color="success.main">
                          ₹{supplier.total || 0}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <div className="mt-3">
              <Typography variant="caption" color="text.secondary">
                Total Suppliers: {selectedItemSuppliers.length}
              </Typography>
            </div>
          </div>
        </CModalBody>
        <CModalFooter className="d-flex justify-content-end gap-2 border-0">
          <CButton
            color="secondary"
            variant="outline"
            onClick={() => setSuppliersModalOpen(false)}
          >
            Close
          </CButton>
        </CModalFooter>
      </CModal>
    </Box>
  );
}