import React, { useState, useEffect, useCallback, useRef } from 'react'
import { CContainer, CRow, CCol, CButton, CCardFooter } from '@coreui/react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMenuItems } from '../../redux/slices/menuSlice'
import {
  fetchCustomers,
  updateCustomerFrequency,
  addCustomer,
  addRewardPoints,      // ADD THIS
  deductRewardPoints    // ADD THIS
} from '../../redux/slices/customerSlice'
import { createTransaction } from '../../redux/slices/transactionSlice'
import {
  fetchInventories
  // deductStock removed - automatic deduction handled by InventoryService
} from '../../redux/slices/stockSlice'
import { fetchSubCategories } from '../../redux/slices/subCategorySlice'
import { fetchCategories } from '../../redux/slices/categorySlice'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { createOrder } from '../../redux/slices/orderSlice'
import CustomerModal from '../../components/CustomerModal'
import { BASE_URL } from '../../utils/constants'
import ProductList from '../../components/ProductList'
import Cart from '../../components/Cart'
import Invoice from '../../components/Invoice'
import KOT from '../../components/KOT'
import KOTModal from '../../components/KOTModal'
import InvoiceModal from '../../components/InvoiceModal'
import TaxModal from '../../components/TaxModal'
import DiscountModal from '../../components/DiscountModal'
import PaymentModal from '../../components/PaymentModal'
import DeleteModal from '../../components/DeleteModal'
import RoundOffAmountModal from '../../components/RoundOffAmountModal'
import SubCategorySelectionModal from '../../components/SubCategorySelectionModal'
import SystemSelectionModal from '../../components/SystemSelectionModal'
// import { jwtDecode } from "jwt-decode";

const POSTableContent = () => {
  const { tableNumber: tableId } = useParams();
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const invoiceRef = useRef(null)
  const kotRef = useRef(null)
  const { tableNumber } = useParams()
  const [appliedDiscounts, setAppliedDiscounts] = useState(null);
  const { customers, loading: customerLoading } = useSelector((state) => state.customers)
  const { menuItems, loading: menuItemsLoading } = useSelector((state) => state.menuItems)
  const { categories, loading: categoryLoading } = useSelector((state) => state.category)
  const { subCategories, loading: subCategoryLoading } = useSelector((state) => state.subCategory)

  const authState = useSelector((state) => state.auth)
  const theme = useSelector((state) => state.theme.theme)
  const token = localStorage.getItem('authToken')

  // Extract restaurantId from JWT token
  const getRestaurantIdFromToken = () => {
    try {
      if (!token) return null
      const payload = JSON.parse(atob(token.split('.')[1]))
      console.log('🔍 Token payload:', payload)
      return payload.restaurantId || payload.restaurant_id
    } catch (error) {
      console.error('Error decoding token:', error)
      return null
    }
  }

  const restaurantId = getRestaurantIdFromToken() || localStorage.getItem('restaurantId')

  // Debug: Log restaurantId to console (commented for production)
  // console.log('POSTableContent - restaurantId:', restaurantId)
  // console.log('POSTableContent - localStorage restaurantId:', localStorage.getItem('restaurantId'))
  // console.log('POSTableContent - authState:', authState)


  // Debug: Log restaurantId to console
  console.log('🔍 POSTableContent Debug:', {
    restaurantId,
    tokenFromLocalStorage: localStorage.getItem('restaurantId'),
    authState,
    tokenExists: !!token
  })

  // Fallback: If restaurantId is missing, try to get it from user profile or redirect
  useEffect(() => {
    if (!localStorage.getItem('restaurantId') && token && authState.restaurantId) {
      console.warn('RestaurantId is missing, restoring from auth state...')
      localStorage.setItem('restaurantId', authState.restaurantId)
      // console.log('RestaurantId restored from auth state:', authState.restaurantId)
    } else if (!localStorage.getItem('restaurantId') && token) {
      console.warn('No restaurantId found in auth state or localStorage. Using fallback for testing.')
      localStorage.setItem('restaurantId', '68d23850f227fcf59cfacf80')
    }
  }, [token, authState.restaurantId])

  const [showKOTModal, setShowKOTModal] = useState(false)
  const [kotImage, setKOTImage] = useState('')
  const [kotItems, setKotItems] = useState([])

  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [invoiceImage, setInvoiceImage] = useState('')

  const [elapsedTime, setElapsedTime] = useState(0)
  const [tax, setTax] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [roundOff, setRoundOff] = useState(0)
  const [showTaxModal, setShowTaxModal] = useState(false)
  const [showRoundOffModal, setShowRoundOffModal] = useState(false)
  const [showDiscountModal, setShowDiscountModal] = useState(false)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomerName, setSelectedCustomerName] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [membershipDiscount, setMembershipDiscount] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentType, setPaymentType] = useState('')
  const [splitPercentages, setSplitPercentages] = useState({ online: 0, cash: 0, due: 0 })
  const [searchProduct, setSearchProduct] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false)
  const [selectedMenuItemForSubcategory, setSelectedMenuItemForSubcategory] = useState(null)
  const [showSystemModal, setShowSystemModal] = useState(false)
  const [selectedSystem, setSelectedSystem] = useState(() => {
    const savedSystem = localStorage.getItem(`selectedSystem_${tableId}`)
    if (savedSystem) {
      try {
        const system = JSON.parse(savedSystem)
        // Validate system data - reject if it's invalid dine-in data or missing required fields
        if (system.systemName === 'dine-in' || system.systemName === 'Dine in' || system.systemName === 'Dine-in' || !system._id || !system.systemName || !system.chargeOfSystem) {
          console.log('Invalid system data found, clearing:', system)
          localStorage.removeItem(`selectedSystem_${tableId}`)
          return null
        }
        return system
      } catch (error) {
        console.log('Corrupted system data found, clearing')
        localStorage.removeItem(`selectedSystem_${tableId}`)
        return null
      }
    }
    return null
  })

  // Get userId from Redux state or localStorage
  const userId = useSelector((state) => state.auth.userId) || localStorage.getItem('userId')

  const [cart, setCart] = useState(() => {
    // Make cart data user-specific by including userId in the key
    const currentUserId = userId || localStorage.getItem('userId')
    console.log('🔍 User Debug:', {
      tableId,
      currentUserId,
      authState: { userId, restaurantId }
    })

    const savedCart = localStorage.getItem(`cart_${tableId}_${currentUserId}`)

    // If no user-specific cart, try to get from general cart (for backward compatibility)
    if (!savedCart) {
      const generalCart = localStorage.getItem(`cart_${tableId}`)
      if (generalCart) {
        console.log('🔍 Found general cart, migrating to user-specific:', generalCart)
        // Migrate to user-specific storage
        localStorage.setItem(`cart_${tableId}_${currentUserId}`, generalCart)
        return JSON.parse(generalCart)
      }
    }

    console.log('🔍 Cart Debug:', {
      tableId,
      currentUserId,
      savedCart,
      parsedCart: savedCart ? JSON.parse(savedCart) : null
    })
    return savedCart ? JSON.parse(savedCart) : []
  })

  const [startTime, setStartTime] = useState(() => {
    // Make start time user-specific by including userId in the key
    const currentUserId = userId || localStorage.getItem('userId')
    const savedStartTime = localStorage.getItem(`start_time_${tableId}_${currentUserId}`)

    // If no user-specific start time, try to get from general start time (for backward compatibility)
    if (!savedStartTime) {
      const generalStartTime = localStorage.getItem(`start_time_${tableId}`)
      if (generalStartTime) {
        console.log('🔍 Found general start time, migrating to user-specific:', generalStartTime)
        // Migrate to user-specific storage
        localStorage.setItem(`start_time_${tableId}_${currentUserId}`, generalStartTime)
        return new Date(generalStartTime)
      }
    }

    return savedStartTime ? new Date(savedStartTime) : null
  })
  const [mobilePrintOptions, setMobilePrintOptions] = useState({
    show: false,
    pdfUrl: null,
    message: '',
  })

  useEffect(() => {
    if (startTime) {
      const interval = setInterval(() => {
        const now = new Date()
        setElapsedTime(Math.floor((now - startTime) / 1000))
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [startTime])

  useEffect(() => {
    if (token && restaurantId) {
      // console.log('Fetching data with restaurantId:', restaurantId)
      dispatch(fetchMenuItems({ token, restaurantId }))
      dispatch(fetchCustomers({ token, restaurantId }))
      dispatch(fetchCategories({ token, restaurantId }))
      dispatch(fetchSubCategories({ token, restaurantId }))

      // Auto-fetch and select system if available
      fetchAndSelectSystem()
    } else {
      // console.log('Missing token or restaurantId:', { token: !!token, restaurantId })
    }
  }, [dispatch, token, restaurantId])


  // Function to fetch and auto-select system
  const fetchAndSelectSystem = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/settings?restaurantId=${restaurantId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (data.success && data.data && data.data.length > 0) {
        // Transform the data to match expected format and filter by willOccupy
        const transformedSystems = data.data
          .filter(setting => setting.willOccupy === true) // Only show systems with willOccupy: true
          .map(setting => ({
            _id: setting._id,
            systemName: setting.systemName,
            chargeOfSystem: parseInt(setting.chargeOfSystem) || 0,
            willOccupy: setting.willOccupy,
            color: setting.color
          }))

        console.log('Filtered systems (willOccupy: true):', transformedSystems)

        // Handle system selection based on count
        if (!selectedSystem) {
          if (transformedSystems.length === 1 && transformedSystems[0].chargeOfSystem > 0) {
            // Only one system - auto-select it
            console.log('Auto-selecting single system:', transformedSystems[0])
            setSelectedSystem(transformedSystems[0])
            localStorage.setItem(`selectedSystem_${tableId}`, JSON.stringify(transformedSystems[0]))
          } else if (transformedSystems.length > 1) {
            // Multiple systems - show selection modal
            console.log('Multiple systems found, showing selection modal')
            setShowSystemModal(true)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching systems:', error)
    }
  }

  useEffect(() => {
    // Make cart data user-specific by including userId in the key
    const currentUserId = userId || localStorage.getItem('userId')
    localStorage.setItem(`cart_${tableId}_${currentUserId}`, JSON.stringify(cart))
  }, [cart, tableId, userId])

  // Check if system is selected when component mounts - DISABLED
  // useEffect(() => {
  //   // console.log('POSTableContent - Checking selectedSystem:', selectedSystem)
  //   if (!selectedSystem) {
  //     // console.log('POSTableContent - No system selected, opening modal')
  //     // If no system is selected, open the system selection modal
  //     setShowSystemModal(true)
  //   }
  // }, [selectedSystem])

  // Also check on component mount - DISABLED
  // useEffect(() => {
  //   // console.log('POSTableContent - Component mounted, checking system for table:', tableId)
  //   const savedSystem = localStorage.getItem(`selectedSystem_${tableId}`)
  //   // console.log('POSTableContent - Saved system from localStorage:', savedSystem)

  //   if (!savedSystem) {
  //     // console.log('POSTableContent - No saved system found, opening modal')
  //     setShowSystemModal(true)
  //   }
  // }, [tableId])

  const handleDeleteClick = (item) => {
    setItemToDelete(item)
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (itemToDelete) {
      removeFromCart(itemToDelete.id)
      setShowDeleteModal(false)
      setItemToDelete(null)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setItemToDelete(null)
  }

  const filteredCustomers = customers?.filter((customer) =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredMenuItems = React.useMemo(() => {
    let items = menuItems;

    // Filter by selected category
    if (selectedCategoryId) {
      items = items?.filter(item => {
        const itemCategoryId = typeof item.categoryId === 'object'
          ? item.categoryId._id
          : item.categoryId;
        return itemCategoryId === selectedCategoryId;
      });
    }

    // Enhanced search: Search by itemName OR menuId
    return items?.filter((product) => {
      const searchLower = searchProduct.toLowerCase().trim();

      // If search is empty, show all items
      if (!searchLower) return true;

      const itemNameMatch = product.itemName?.toLowerCase().includes(searchLower);
      const menuIdMatch = product.menuId?.toLowerCase().includes(searchLower);

      // Return true if either itemName or menuId matches
      return itemNameMatch || menuIdMatch;
    });
  }, [menuItems, selectedCategoryId, searchProduct]);


  const handleAddToCartWithSubcategory = useCallback((item) => {
    const itemId = item._id || item.id;
    const sizeId = item.sizeId || null; // Get the sizeId from the item

    const existingItemIndex = cart.findIndex(
      (cartItem) => {
        const cartItemId = cartItem._id || cartItem.id;
        const cartItemSizeId = cartItem.sizeId || null;
        // We now check for product ID, subcategory ID, AND size ID to define a unique item
        return cartItemId === itemId &&
          cartItem.selectedSubcategoryId === item.selectedSubcategoryId &&
          cartItemSizeId === sizeId;
      }
    );

    if (existingItemIndex > -1) {
      setCart(prevCart =>
        prevCart.map((cartItem, index) => {
          if (index === existingItemIndex) {
            const newQuantity = cartItem.quantity + 1;
            return {
              ...cartItem,
              quantity: newQuantity,
              // Recalculate tax amount if item has tax
              taxAmount: cartItem.taxPercentage ?
                (cartItem.adjustedPrice * newQuantity * cartItem.taxPercentage) / 100 : 0

            };
          }
          return cartItem;
        }),
      );
    } else {
      // Create a unique cart item ID by combining item ID and size ID
      const cartItemId = `${itemId}${item.sizeId ? `_${item.sizeId}` : ''}`;
      const newCartItem = {
        ...item,
        id: cartItemId, // Use our new unique ID
        _id: item._id,
        quantity: 1,
        price: Number(item.adjustedPrice) || 0,
        taxType: null,
        taxPercentage: 0,
        fixedTaxAmount: 0,
        taxAmount: 0
      };
      setCart(prevCart => [...prevCart, newCartItem]);
    }

    if (!startTime) {
      const now = new Date();
      setStartTime(now);
      // Make start time user-specific by including userId in the key
      const currentUserId = userId || localStorage.getItem('userId')
      localStorage.setItem(`start_time_${tableNumber}_${currentUserId}`, now.toISOString());
    }
    setShowSubCategoryModal(false);
    setSelectedMenuItemForSubcategory(null);
  }, [cart, startTime, tableNumber]);

  const handleMenuItemClick = useCallback((product) => {
    console.log('handleMenuItemClick called with:', product.itemName);

    // Skip subcategory check for now - direct add to cart
    // const relevantSubcategoriesExist = subCategories.some(sub => sub.category_id === product.categoryId);

    // if (relevantSubcategoriesExist) {
    //   setSelectedMenuItemForSubcategory(product);
    //   setShowSubCategoryModal(true);
    // } else {
    // A product is considered unique based on its ID AND its size ID.
    const productId = product._id || product.id;
    const sizeId = product.sizeId || null; // sizeId comes from ProductList.js

    const existingItemIndex = cart.findIndex((item) => {
      const cartItemId = item._id || item.id;
      const cartItemSizeId = item.sizeId || null; // use 'item' here
      return cartItemId === productId && cartItemSizeId === sizeId;
    });

    if (existingItemIndex > -1) {
      setCart(prevCart =>
        prevCart.map((item, index) => {
          if (index === existingItemIndex) {
            const newQuantity = item.quantity + 1;
            return {
              ...item,
              quantity: newQuantity,
              // Recalculate tax amount if item has tax
              taxAmount: item.taxPercentage ?
                (item.adjustedPrice * newQuantity * item.taxPercentage) / 100 : 0
            };
          }
          return item;
        })
      );
    } else {
      // Create a unique cart item ID by combining product ID and size ID
      const cartItemId = `${productId}${product.sizeId ? `_${product.sizeId}` : ''}`;
      const newCartItem = {
        ...product,
        id: cartItemId,
        _id: product._id,
        quantity: 1,
        price: Number(product.adjustedPrice) || Number(product.price) || 0,
        adjustedPrice: Number(product.adjustedPrice) || Number(product.price) || 0, // IMPORTANT: always set adjustedPrice
        taxType: null,
        taxPercentage: 0,
        fixedTaxAmount: 0,
        taxAmount: 0
      };

      setCart(prevCart => [...prevCart, newCartItem]);
    }

    if (!startTime) {
      const now = new Date();
      setStartTime(now);
      // Make start time user-specific by including userId in the key
      const currentUserId = userId || localStorage.getItem('userId')
      localStorage.setItem(`start_time_${tableNumber}_${currentUserId}`, now.toISOString());
    }
    // }
  }, [cart, startTime, tableNumber]);

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setSelectedCustomerName(customer.name)
    setShowCustomerModal(false)
  }

  const handleSystemChange = () => {
    // Open system selection modal instead of navigating
    setShowSystemModal(true)
  }

  const handleSystemSelect = (system) => {
    setSelectedSystem(system)
    localStorage.setItem(`selectedSystem_${tableId}`, JSON.stringify(system))
    setShowSystemModal(false)
  }

  const handleSearchProduct = (e) => {
    setSearchProduct(e.target.value)
  }

  // The 'addToCart' function is now just a wrapper for the new logic, which can be removed if not used elsewhere
  const addToCart = (product) => {
    handleMenuItemClick(product);
  };

  // FIXED: Remove from cart with proper ID handling
  const removeFromCart = (productId) => {
    const updatedCart = cart.filter((item) => {
      const cartItemId = item._id || item.id;
      return cartItemId !== productId;
    });
    setCart(updatedCart);

    if (updatedCart.length === 0) {
      setStartTime(null)
      setElapsedTime(0)
      localStorage.removeItem(`start_time_${tableId}`)
    }
  }

  const clearCart = () => {
    // Check if it's a merged table by its ID format
    if (tableId.startsWith('merged_')) {
      if (window.confirm('Are you sure you want to cancel? This will unmerge the tables and restore their original orders.')) {
        // 1. Get all merged tables from localStorage
        const allMergedTables = JSON.parse(localStorage.getItem('mergedTables') || '[]')
        const mergedTable = allMergedTables.find(m => `merged_${m.id}` === tableId)

        if (mergedTable) {
          // 2. Restore individual carts from the merged order
          const ordersPerTable = {}
          mergedTable.combinedOrders.forEach((order) => {
            // Find the original table for the item
            const targetTable = order.originalTable || mergedTable.tables[0]
            if (!ordersPerTable[targetTable]) {
              ordersPerTable[targetTable] = []
            }
            // Remove the 'originalTable' property before restoring
            const { originalTable, ...cleanOrder } = order
            ordersPerTable[targetTable].push(cleanOrder)
          })

          Object.entries(ordersPerTable).forEach(([tableNumber, orders]) => {
            // Make cart data user-specific by including userId in the key
            const currentUserId = userId || localStorage.getItem('userId')
            localStorage.setItem(`cart_${tableNumber}_${currentUserId}`, JSON.stringify(orders))
            // Restore start time if it exists
            if (mergedTable.startTime) {
              // Make start time user-specific by including userId in the key
              const currentUserId = userId || localStorage.getItem('userId')
              localStorage.setItem(`start_time_${tableNumber}_${currentUserId}`, mergedTable.startTime)
            }
          })

          // 3. Remove the merged table from the list
          const updatedMergedTables = allMergedTables.filter(m => `merged_${m.id}` !== tableId)
          localStorage.setItem('mergedTables', JSON.stringify(updatedMergedTables))

          // 4. Clean up localStorage for the merged table
          localStorage.removeItem(`cart_${tableId}`)
          localStorage.removeItem(`start_time_${tableId}`)
        }

        // 5. Navigate back to the main POS screen
        navigate('/pos')
        // toast.info('Order cancelled and tables have been unmerged.')
        return // Stop further execution
      } else {
        return // User cancelled the confirmation
      }
      // --- This is the original logic for non-merged tables ---
    }
    setCart([])
    setRoundOff(0)
    setStartTime(null)
    setElapsedTime(0)
    setSelectedCustomer(null);
    setSelectedCustomerName('');
    localStorage.removeItem(`cart_${tableId}_${userId}`)
    localStorage.removeItem(`start_time_${tableId}_${userId}`)

    // toast.info('Order has been cancelled.')
  }

  const handleTaxSubmit = (selectedItemIds, taxValue, taxType, taxName) => {
    setCart(prevCart =>
      prevCart.map(item => {
        // The selectedItemIds are now the unique composite IDs (e.g., 'prod1_size1')
        if (selectedItemIds.includes(item.id)) { // <-- Correctly use item.id
          let taxAmount = 0;
          let taxPercentage = 0;
          let fixedTaxAmount = 0;

          if (taxType === 'percentage') {
            taxPercentage = taxValue;
            taxAmount = (item.adjustedPrice * item.quantity * taxValue) / 100;
          } else if (taxType === 'fixed') {
            // Fixed amount is per item, not affected by quantity in this logic
            fixedTaxAmount = taxValue;
            taxAmount = taxValue;
          }

          return {
            ...item,
            taxType: taxType,
            taxPercentage: taxPercentage,
            fixedTaxAmount: fixedTaxAmount,
            taxAmount: taxAmount,
            taxName: taxName || 'Tax' // Store the tax name
          };
        }
        return item;
      })
    );

    toast.success(`${taxName || 'Tax'} applied to ${selectedItemIds.length} item(s)!`);
  };

  // const handleDiscountSubmit = (discounts) => {
  //   console.log('Received discounts:', discounts);

  //   // Handle item-specific discounts
  //   if (discounts.selectedItemDiscount && discounts.selectedItemDiscount.ids && discounts.selectedItemDiscount.ids.length > 0) {
  //     const { ids, value, type } = discounts.selectedItemDiscount;

  //     setCart(prevCart =>
  //       prevCart.map(item => {
  //         if (ids.includes(item.id)) {
  //           let discountAmount = 0;
  //           let discountPercentage = 0;
  //           let fixedDiscountAmount = 0;

  //           if (type === 'percentage') {
  //             discountPercentage = value;
  //             discountAmount = (item.adjustedPrice * item.quantity * value) / 100;
  //           } else if (type === 'fixed') {
  //             fixedDiscountAmount = value;
  //             discountAmount = value;
  //           }

  //           return {
  //             ...item,
  //             discountType: type,
  //             discountPercentage: discountPercentage,
  //             fixedDiscountAmount: fixedDiscountAmount,
  //             discountAmount: discountAmount
  //           };
  //         }
  //         return item;
  //       })
  //     );

  //     toast.success(`${type === 'percentage' ? 'Percentage' : 'Fixed'} discount applied to ${ids.length} item(s)!`);
  //   }

  //   // Handle coupon discounts
  //   if (discounts.coupon && discounts.coupon.value) {
  //     const { value, type } = discounts.coupon;

  //     if (type === 'percentage') {
  //       setDiscount(value);
  //       toast.success(`Coupon discount of ${value}% applied to entire order!`);
  //     } else if (type === 'fixed') {
  //       const subtotal = calculateSubtotal();
  //       const percentageEquivalent = (value / subtotal) * 100;
  //       setDiscount(percentageEquivalent);
  //       toast.success(`Fixed coupon discount of ₹${value} applied!`);
  //     }
  //   }

  //   // NEW: Handle reward points discount
  //   if (discounts.rewardPoints && discounts.rewardPoints.enabled) {
  //     const { pointsUsed, discountAmount } = discounts.rewardPoints;

  //     // Store reward points discount separately
  //     setAppliedDiscounts(prev => ({
  //       ...prev,
  //       rewardPoints: {
  //         pointsUsed,
  //         discountAmount
  //       }
  //     }));

  //     toast.success(`Reward points discount of ₹${discountAmount.toFixed(2)} applied!`);
  //   }

  //   setShowDiscountModal(false);
  // };
  const handleDiscountSubmit = (discounts) => {
    console.log('Received discounts:', discounts);

    if (discounts.selectedItemDiscount && discounts.selectedItemDiscount.ids && discounts.selectedItemDiscount.ids.length > 0) {
      const { ids, value, type } = discounts.selectedItemDiscount;
      setCart(prevCart =>
        prevCart.map(item => {
          if (ids.includes(item.id)) {
            let discountAmount = 0;
            let discountPercentage = 0;
            let fixedDiscountAmount = 0;

            if (type === 'percentage') {
              discountPercentage = value;
              discountAmount = (item.adjustedPrice * item.quantity * value) / 100;
            } else if (type === 'fixed') {
              fixedDiscountAmount = value;
              discountAmount = value;
            }

            return {
              ...item,
              discountType: type,
              discountPercentage: discountPercentage,
              fixedDiscountAmount: fixedDiscountAmount,
              discountAmount: discountAmount
            };
          }
          return item;
        })
      );
      toast.success(`${type === 'percentage' ? 'Percentage' : 'Fixed'} discount applied to ${ids.length} item(s)!`);
    }

    if (discounts.coupon && discounts.coupon.value) {
      const { value, type } = discounts.coupon;
      if (type === 'percentage') {
        setDiscount(value);
        toast.success(`Coupon discount of ${value}% applied to entire order!`);
      } else if (type === 'fixed') {
        const subtotal = calculateSubtotal();
        const percentageEquivalent = (value / subtotal) * 100;
        setDiscount(percentageEquivalent);
        toast.success(`Fixed coupon discount of ₹${value} applied!`);
      }
    }

    if (discounts.rewardPoints && discounts.rewardPoints.enabled) {
      const { pointsUsed, discountAmount } = discounts.rewardPoints;
      console.log('🎁 Setting Reward Points Discount:', { pointsUsed, discountAmount });
      setAppliedDiscounts(prev => ({
        ...prev,
        rewardPoints: {
          pointsUsed,
          discountAmount
        }
      }));
      toast.success(`Reward points discount of ₹${discountAmount.toFixed(2)} applied!`);
    }

    setShowDiscountModal(false);
  };

  const handleRoundOffSubmit = (roundOffValue) => {
    setRoundOff(roundOffValue)
    setShowRoundOffModal(false)
    setInputValue('')
  }

  const calculateSubtotal = useCallback(() => {
    return cart.reduce((total, item) => total + item.quantity * item.adjustedPrice, 0)
  }, [cart])

  const calculateTotalTaxAmount = useCallback(() => {
    return cart.reduce((total, item) => total + (Number(item.taxAmount) || 0), 0);
  }, [cart]);

  // const calculateDiscountAmount = useCallback(() => {
  //   const subtotal = calculateSubtotal();
  //   let totalDiscount = 0;

  //   // This logic correctly handles fixed vs percentage for memberships.
  //   if (membershipDiscount && membershipDiscount.value > 0) {
  //     if (membershipDiscount.type === 'fixed') {
  //       totalDiscount = membershipDiscount.value;
  //     } else { // 'percentage'
  //       totalDiscount = (subtotal * membershipDiscount.value) / 100;
  //     }
  //   } else {
  //     // Handles manual and item-specific discounts
  //     totalDiscount = (subtotal * discount) / 100;
  //     cart.forEach(item => {
  //       if (item.discountAmount) totalDiscount += Number(item.discountAmount);
  //     });
  //   }

  //   return totalDiscount;
  // }, [calculateSubtotal, discount, cart, membershipDiscount]);
  const calculateDiscountAmount = useCallback(() => {
    const subtotal = calculateSubtotal();
    let totalDiscount = 0;

    if (membershipDiscount && membershipDiscount.value > 0) {
      if (membershipDiscount.type === 'fixed') {
        totalDiscount = membershipDiscount.value;
      } else {
        totalDiscount = (subtotal * membershipDiscount.value) / 100;
      }
    } else {
      totalDiscount = (subtotal * discount) / 100;
      cart.forEach(item => {
        if (item.discountAmount) totalDiscount += Number(item.discountAmount);
      });
    }

    if (appliedDiscounts?.rewardPoints?.discountAmount) {
      console.log('🎁 Reward Points Discount:', appliedDiscounts.rewardPoints.discountAmount);
      totalDiscount += Number(appliedDiscounts.rewardPoints.discountAmount);
    }

    console.log('Total Discount:', totalDiscount);
    return totalDiscount;
  }, [calculateSubtotal, discount, cart, membershipDiscount, appliedDiscounts]);

  const calculateTotal = useCallback(() => {
    const subtotal = calculateSubtotal();
    const totalTaxAmount = calculateTotalTaxAmount();
    const discountAmount = calculateDiscountAmount();
    const systemCharge = (selectedSystem && selectedSystem._id && selectedSystem.systemName && selectedSystem.chargeOfSystem > 0) ? Number(selectedSystem.chargeOfSystem || 0) : 0;
    const total = subtotal + totalTaxAmount + systemCharge - discountAmount - roundOff;

    console.log('🧮 Total Calculation:', {
      subtotal,
      totalTaxAmount,
      discountAmount,
      systemCharge,
      roundOff,
      total
    });

    return total;
  }, [calculateSubtotal, calculateTotalTaxAmount, calculateDiscountAmount, roundOff, selectedSystem]);
  // Initialize inputValue when round off modal opens
  useEffect(() => {
    if (showRoundOffModal) {
      const currentTotal = calculateSubtotal() + calculateTotalTaxAmount() - calculateDiscountAmount();
      setInputValue(currentTotal.toString());
    }
  }, [showRoundOffModal, calculateSubtotal, calculateTotalTaxAmount, calculateDiscountAmount]);

  useEffect(() => {
    const subtotal = calculateSubtotal();

    if (
      selectedCustomer &&
      selectedCustomer.membershipId &&
      selectedCustomer.membershipId.status === 'active' &&
      selectedCustomer.membershipId.discount > 0
    ) {
      const membership = selectedCustomer.membershipId;

      if (subtotal >= membership.minSpend) {
        const discountValue = Number(membership.discount);
        const discountType = membership.discountType || 'percentage';

        setMembershipDiscount({ value: discountValue, type: discountType });
        toast.info(
          `Applied ${discountType === 'fixed' ? `₹${discountValue}` : `${discountValue}%`
          } membership discount for ${selectedCustomer.name}.`
        );
      } else {
        // If spend is not met, ensure no membership discount is applied
        setMembershipDiscount({ value: 0, type: 'percentage' });

        // --- FIXED SECTION ---
        // Provides feedback to the user when minimum spend is not met
        if (subtotal > 0 && membership.minSpend > 0) {
          toast.warn(
            `Add items worth ₹${(membership.minSpend - subtotal).toFixed(2)} more to unlock the membership discount.`
          );
        }
        // --- END FIXED SECTION ---
      }
    } else {
      // If no customer or no active membership, reset the discount
      setMembershipDiscount({ value: 0, type: 'percentage' });
    }
  }, [selectedCustomer, cart, calculateSubtotal]);
  // --- MODIFIED CODE BLOCK ---
  // This useEffect now depends on the cart to re-evaluate the discount
  // if items are added or removed.
  // POSTableContent.js: lines 681-714
  // POSTableContent.js: Modify the block starting around line 681

  // useEffect(() => {
  //   const subtotal = calculateSubtotal();

  //   if (
  //     selectedCustomer &&
  //     selectedCustomer.membershipId &&
  //     selectedCustomer.membershipId.status === 'active' &&
  //     selectedCustomer.membershipId.discount > 0
  //   ) {
  //     const membership = selectedCustomer.membershipId;

  //     if (subtotal >= membership.minSpend) {
  //       const discountValue = Number(membership.discount);
  //       const discountType = membership.discountType || 'percentage';

  //       setMembershipDiscount({ value: discountValue, type: discountType });
  //       toast.info(
  //         `Applied ${discountType === 'fixed' ? `₹${discountValue}` : `${discountValue}%`
  //         } membership discount for ${selectedCustomer.name}.`
  //       );
  //     } else {
  //       // If spend is not met, ensure no membership discount is applied
  //       setMembershipDiscount({ value: 0, type: 'percentage' });

  //       // ✨ --- START: ADD THESE NEW LINES --- ✨
  //       // This provides feedback to the user
  //       if (subtotal > 0 && membership.minSpend > 0) {
  //         toast.warn(
  //           `Add items worth ₹${(membership.minSpend - subtotal).toFixed(2)} more to unlock the membership discount.`
  //         );
  //       }
  //       // ✨ --- END: ADD THESE NEW LINES --- ✨
  //     }
  //   } else {
  //     setMembershipDiscount({ value: 0, type: 'percentage' });
  //   }
  // }, [selectedCustomer, cart, calculateSubtotal]);
  // useEffect(() => {
  //   const subtotal = calculateSubtotal(); // Calculate subtotal first

  //   if (
  //     selectedCustomer &&
  //     selectedCustomer.membershipId &&
  //     selectedCustomer.membershipId.status === 'active' &&
  //     selectedCustomer.membershipId.discount > 0
  //   ) {
  //     const membership = selectedCustomer.membershipId;

  //     // FIX 2: Check if subtotal meets the minimum spend requirement
  //     if (subtotal >= membership.minSpend) {
  //       const discountValue = Number(membership.discount);
  //       const discountType = membership.discountType || 'percentage'; // Safely default to percentage

  //       setMembershipDiscount({ value: discountValue, type: discountType });
  //       setDiscount(0); // Reset any manual discount

  //       // FIX 1 & 3: Display the correct discount type in the notification
  //       toast.info(
  //         `Applied ${discountType === 'fixed' ? `₹${discountValue}` : `${discountValue}%`
  //         } membership discount for ${selectedCustomer.name}.`
  //       );
  //     } else {
  //       // If spend is not met, ensure no membership discount is applied
  //       setMembershipDiscount({ value: 0, type: 'percentage' });
  //     }
  //   } else {
  //     // If no customer or no active membership, reset the discount
  //     setMembershipDiscount({ value: 0, type: 'percentage' });
  //   }
  // }, [selectedCustomer, cart, calculateSubtotal]); // Dependency array now includes cart
  // // --- END OF MODIFIED CODE BLOCK ---

  // FIXED: Quantity change handler with proper ID matching
  const handleQuantityChange = (itemId, newQty) => {
    if (newQty < 1) return;

    const updatedCart = cart.map((item) => {
      const currentItemId = item._id || item.id;
      if (currentItemId === itemId) {
        const updatedItem = { ...item, quantity: newQty };

        // Recalculate tax amount based on tax type
        if (item.taxType === 'percentage' && item.taxPercentage > 0) {
          updatedItem.taxAmount = (item.adjustedPrice * newQty * item.taxPercentage) / 100;
        } else if (item.taxType === 'fixed' && item.fixedTaxAmount > 0) {
          updatedItem.taxAmount = item.fixedTaxAmount; // Fixed amount doesn't change with quantity
        }

        return updatedItem;
      }
      return item;
    });
    setCart(updatedCart);
  };

  const handleAddCustomer = (formValues) => {
    const token = localStorage.getItem("authToken");
    const restaurantId = localStorage.getItem("restaurantId");

    const customerData = { ...formValues, restaurantId, token };

    dispatch(addCustomer(customerData))
      .unwrap()
      .then((response) => {
        setSelectedCustomerName(response.customer.name);
        setShowCustomerModal(false);
      })
      .catch((error) => {
        toast.error('Failed to add customer: ' + error.message);
      });
  };
  const handlePaymentSubmit = async () => {
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    const restaurantId = localStorage.getItem('restaurantId');

    if (!token || !restaurantId) {
      toast.error('Authentication required');
      return;
    }

    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    const { _id, frequency, totalSpent } = selectedCustomer || {};

    let freq = frequency + 1;
    let updatedTotalSpent = totalSpent + calculateTotal();

    // Calculate total reward points earned from menu items in cart
    const totalRewardPointsEarned = cart.reduce((total, item) => {
      const itemRewardPoints = Number(item.rewardPoints) || 0;
      return total + (itemRewardPoints * item.quantity);
    }, 0);

    console.log('🎁 Total Reward Points to be added:', totalRewardPointsEarned);

    const payload = {
      token,
      userId,
      restaurantId,
      tableNumber: tableId.startsWith('merged_')
        ? `Merged (${tableId.substring(0, 15)}...)`
        : tableNumber,
      items: cart?.map((item) => ({
        itemId: item._id || item.id,
        itemName: item.itemName,
        price: item.adjustedPrice,
        quantity: item.quantity,
        size: item.selectedSize || item.size || null, // ✅ ADD SIZE FIELD
        selectedSubcategoryId: item.selectedSubcategoryId || null,
        subtotal: item.adjustedPrice * item.quantity,
        taxType: item.taxType || null,
        taxPercentage: item.taxPercentage || 0,
        fixedTaxAmount: item.fixedTaxAmount || 0,
        taxAmount: item.taxAmount || 0,
        rewardPoints: item.rewardPoints || 0
      })),
      tax: calculateTotalTaxAmount(),
      discount: calculateDiscountAmount(),
      discountAmount: calculateDiscountAmount(),
      customerId: selectedCustomer?._id || null,
      roundOff: roundOff,
      systemCharge: selectedSystem ? Number(selectedSystem.chargeOfSystem) : 0,
      sub_total: calculateSubtotal(),
      type: paymentType,
      total: calculateTotal(),
      rewardPointsUsed: appliedDiscounts?.rewardPoints?.pointsUsed || 0,
      rewardPointsEarned: totalRewardPointsEarned,
    };

    if (paymentType === "split") {
      payload.split_details = {
        cash: splitPercentages.cash || 0,
        online: splitPercentages.online || 0,
        due: splitPercentages.due || 0,
      };
    }

    try {
      // 1. Create transaction
      const result = await dispatch(createTransaction(payload)).unwrap();
      console.log('✅ Transaction created:', result);

      // 2. Update customer frequency and total spent
      if (selectedCustomer) {
        await dispatch(updateCustomerFrequency({
          id: _id,
          frequency: freq,
          totalSpent: updatedTotalSpent
        })).unwrap();
        console.log('✅ Customer frequency updated');

        // 3. Deduct reward points if customer used them
        if (appliedDiscounts?.rewardPoints?.pointsUsed > 0) {
          await dispatch(deductRewardPoints({
            customerId: _id,
            pointsToDeduct: appliedDiscounts.rewardPoints.pointsUsed
          })).unwrap();

          console.log(`✅ Deducted ${appliedDiscounts.rewardPoints.pointsUsed} points`);
        }

        // 4. Add reward points earned from menu items
        if (totalRewardPointsEarned > 0) {
          await dispatch(addRewardPoints({
            customerId: _id,
            pointsToAdd: totalRewardPointsEarned
          })).unwrap();

          console.log(`✅ Added ${totalRewardPointsEarned} points`);
          toast.success(
            `🎉 Customer earned ${totalRewardPointsEarned} reward points from this order!`,
            { autoClose: 4000 }
          );
        }
      }

      // 🔥 NEW: 5. DEDUCT STOCK FROM INVENTORY (FIFO METHOD)
      console.log('📦 Starting stock deduction...');

      // Prepare stock deduction data from cart
      // ✅ REMOVED: Manual stock deduction - automatic deduction already happens in InventoryService
      console.log('📦 Stock deduction will be handled automatically by InventoryService');

      // 6. Handle unmerge logic if needed
      if (tableId.startsWith('merged_')) {
        const allMergedTables = JSON.parse(localStorage.getItem('mergedTables') || '[]');
        const updatedMergedTables = allMergedTables.filter(m => `merged_${m.id}` !== tableId);
        localStorage.setItem('mergedTables', JSON.stringify(updatedMergedTables));
        localStorage.removeItem(`cart_${tableId}`);
        localStorage.removeItem(`start_time_${tableId}`);
      }

      // 7. Success - clear cart and navigate
      setShowPaymentModal(false);
      clearCart();
      setAppliedDiscounts(null);
      toast.success('✅ Payment processed successfully!');
      navigate('/pos');

    } catch (error) {
      console.error("❌ Error submitting payment:", error);

      // Better error messaging
      if (error.message && error.message.includes('Insufficient stock')) {
        toast.error(`⚠️ ${error.message}`, { autoClose: 5000 });
      } else {
        toast.error('Failed to process payment: ' + (error.message || 'Unknown error'));
      }
    }
  };
  // const handlePaymentSubmit = async () => {
  //   const token = localStorage.getItem('authToken');
  //   const userId = localStorage.getItem('userId');
  //   const restaurantId = localStorage.getItem('restaurantId');

  //   if (!token || !restaurantId) {
  //     toast.error('Authentication required');
  //     return;
  //   }

  //   if (cart.length === 0) {
  //     toast.error('Cart is empty');
  //     return;
  //   }

  //   // if (!selectedCustomer) {
  //   //   toast.error('Please select a customer');
  //   //   return;
  //   // }

  //   const { _id, frequency, totalSpent } = selectedCustomer || {};

  //   let freq = frequency + 1;
  //   let updatedTotalSpent = totalSpent + calculateTotal();

  //   // ✅ Calculate total reward points earned from menu items in cart
  //   const totalRewardPointsEarned = cart.reduce((total, item) => {
  //     const itemRewardPoints = Number(item.rewardPoints) || 0;
  //     return total + (itemRewardPoints * item.quantity);
  //   }, 0);

  //   console.log('🎁 Total Reward Points to be added:', totalRewardPointsEarned);

  //   const payload = {
  //     token,
  //     userId,
  //     restaurantId,
  //     tableNumber: tableId.startsWith('merged_')
  //       ? `Merged (${tableId.substring(0, 15)}...)`
  //       : tableNumber,
  //     items: cart?.map((item) => ({
  //       itemId: item._id || item.id,
  //       itemName: item.itemName,
  //       price: item.adjustedPrice,
  //       quantity: item.quantity,
  //       selectedSubcategoryId: item.selectedSubcategoryId || null,
  //       subtotal: item.adjustedPrice * item.quantity,
  //       taxType: item.taxType || null,
  //       taxPercentage: item.taxPercentage || 0,
  //       fixedTaxAmount: item.fixedTaxAmount || 0,
  //       taxAmount: item.taxAmount || 0,
  //       rewardPoints: item.rewardPoints || 0
  //     })),
  //     tax: calculateTotalTaxAmount(),
  //     discount: calculateDiscountAmount(),
  //     discountAmount: calculateDiscountAmount(),
  //     customerId: selectedCustomer?._id || null,

  //     roundOff: roundOff,
  //     systemCharge: (selectedSystem && selectedSystem._id && selectedSystem.systemName && selectedSystem.chargeOfSystem > 0) ? Number(selectedSystem.chargeOfSystem) : 0,
  //     sub_total: calculateSubtotal(),
  //     total: calculateTotal(),
  //     type: paymentType,
  //     rewardPointsUsed: appliedDiscounts?.rewardPoints?.pointsUsed || 0,
  //     rewardPointsEarned: totalRewardPointsEarned
  //   };

  //   if (paymentType === "split") {
  //     payload.split_details = {
  //       cash: splitPercentages.cash || 0,
  //       online: splitPercentages.online || 0,
  //       due: splitPercentages.due || 0,
  //     };
  //   }

  //   try {
  //     // 1. Create transaction
  //     const result = await dispatch(createTransaction(payload)).unwrap();
  //     console.log('✅ Transaction created:', result);

  //     // 2. Update customer frequency and total spent
  //     if (selectedCustomer) {
  //       await dispatch(updateCustomerFrequency({
  //         id: _id,
  //         frequency: freq,
  //         totalSpent: updatedTotalSpent
  //       })).unwrap();
  //       console.log('✅ Customer frequency updated');

  //       // 3. ✅ DEDUCT reward points if customer used them (checkbox was checked)
  //       if (appliedDiscounts?.rewardPoints?.pointsUsed > 0) {
  //         await dispatch(deductRewardPoints({
  //           customerId: _id,
  //           pointsToDeduct: appliedDiscounts.rewardPoints.pointsUsed
  //         })).unwrap();

  //         console.log(`✅ Deducted ${appliedDiscounts.rewardPoints.pointsUsed} points`);
  //       }

  //       // 4. ✅ ADD reward points earned from menu items
  //       if (totalRewardPointsEarned > 0) {
  //         await dispatch(addRewardPoints({
  //           customerId: _id,
  //           pointsToAdd: totalRewardPointsEarned
  //         })).unwrap();

  //         console.log(`✅ Added ${totalRewardPointsEarned} points`);
  //         toast.success(
  //           `🎉 Customer earned ${totalRewardPointsEarned} reward points from this order!`,
  //           { autoClose: 4000 }
  //         );
  //       }

  //     }


  //     // 5. Handle unmerge logic if needed
  //     if (tableId.startsWith('merged_')) {
  //       const allMergedTables = JSON.parse(localStorage.getItem('mergedTables') || '[]');
  //       const updatedMergedTables = allMergedTables.filter(m => `merged_${m.id}` !== tableId);
  //       localStorage.setItem('mergedTables', JSON.stringify(updatedMergedTables));
  //       localStorage.removeItem(`cart_${tableId}`);
  //       localStorage.removeItem(`start_time_${tableId}`);
  //     }

  //     // 6. Success - clear cart and navigate
  //     setShowPaymentModal(false);
  //     clearCart();
  //     setAppliedDiscounts(null);
  //     toast.success('✅ Payment processed successfully!');
  //     navigate('/pos');

  //   } catch (error) {
  //     console.error("❌ Error submitting payment:", error);
  //     toast.error('Failed to process payment: ' + (error.message || 'Unknown error'));
  //   }
  // };

  const generateInvoice = () => {
    const invoiceElement = invoiceRef.current

    if (!invoiceElement) return

    invoiceElement.style.display = 'block'

    html2canvas(invoiceElement, { scale: 2, useCORS: true })
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png')
        setInvoiceImage(imgData)
        setShowInvoiceModal(true)
      })
      .catch((error) => {
        toast.error(`Error generating invoice: ${error}`, { autoClose: 3000 })
      })
      .finally(() => {
        invoiceElement.style.display = 'none'
      })
  }

  const handleInvoicePrint = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    if (isMobile) {
      if (/Android/i.test(navigator.userAgent)) {
        handleAndroidPrint();
      } else if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        handleMobileDownload('ios');
      } else {
        handleMobileDownload('other');
      }
    } else {
      const printWindow = window.open();
      if (printWindow) {
        printWindow.document.write(`
        <html>
          <head>
            <title>Invoice Print</title>
            <style>
              @page {
                size: 2in auto;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
                text-align: center;
              }
              img {
                width: 2in;
              }
            </style>
          </head>
          <body>
            <img src="${invoiceImage}" />
            <script>
              window.onload = function() {
                window.print();
                setTimeout(() => window.close(), 100);
              };
            </script>
          </body>
        </html>
      `);
        printWindow.document.close();
      }
    }
  };

  const handleAndroidPrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
      <html>
        <head>
          <title>Print Invoice</title>
          <style>
            @page {
              size: auto;
              margin: 0mm;
            }
            body {
              margin: 0;
            }
            img {
              width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          <img src="${invoiceImage}" />
          <script>
            setTimeout(() => {
              window.print();
              setTimeout(() => window.close(), 1000);
            }, 500);
          </script>
        </body>
      </html>
    `);
      printWindow.document.close();
    } else {
      setMobilePrintOptions({
        show: true,
        pdfUrl: invoiceImage,
        message: 'Please allow popups to print. Then tap the image and select "Print" from your browser menu.'
      });
    }
  };

  const handleMobileDownload = (platform) => {
    import('jspdf').then((jsPDF) => {
      const { jsPDF: JSPDF } = jsPDF;
      const doc = new JSPDF({
        orientation: 'portrait',
        unit: 'in',
        format: [2, 8],
      });

      const img = new Image();
      img.src = invoiceImage;
      img.onload = () => {
        const ratio = img.height / img.width;
        const imgHeight = 2 * ratio;

        doc.addImage(invoiceImage, 'PNG', 0, 0, 2, imgHeight);

        if (platform === 'ios') {
          const pdfOutput = doc.output('blob');
          const pdfUrl = URL.createObjectURL(pdfOutput);

          setMobilePrintOptions({
            show: true,
            pdfUrl,
            message:
              'iOS devices require you to download the PDF and print from Files or another app.',
          });
        } else if (platform === 'android') {
          const pdfOutput = doc.output('blob');
          const pdfUrl = URL.createObjectURL(pdfUrl);

          setMobilePrintOptions({
            show: true,
            pdfUrl,
            message: "Download the PDF and use your device's print service or a printing app.",
          });
        } else {
          const pdfOutput = doc.output('blob');
          const pdfUrl = URL.createObjectURL(pdfOutput);

          setMobilePrintOptions({
            show: true,
            pdfUrl,
            message: 'Download the invoice as PDF to print from another app.',
          });
        }
      };
    }).catch((error) => {
      toast.error(`Error preparing mobile print: ${error}`, { autoClose: 3000 });
    });
  };

  const handleSendEmail = () => {
    alert('Send via Email functionality to be implemented.')
  }

  const generateKOT = async () => {
    const newItems = cart.filter((item) => {
      const cartItemId = item._id || item.id;
      return !kotItems.some((kot) => {
        const kotItemId = kot._id || kot.id;
        return kotItemId === cartItemId;
      });
    });

    if (newItems.length === 0) {
      toast.info('No new items to generate KOT!', { autoClose: 3000 })
      return
    }

    try {
      // Calculate subtotal and tax for new items
      const kotSubtotal = newItems.reduce((total, item) => total + (item.adjustedPrice * item.quantity), 0);
      const kotTaxAmount = newItems.reduce((total, item) => total + (Number(item.taxAmount) || 0), 0);
      const kotDiscountAmount = (kotSubtotal * discount) / 100;
      const kotTotal = kotSubtotal + kotTaxAmount - kotDiscountAmount;
      // console.log("opprotypo", selectedCustomerName)
      const orderData = {
        token: localStorage.getItem('authToken'),
        restaurantId: localStorage.getItem('restaurantId'),
        userId: localStorage.getItem('userId'),
        tableNumber: tableNumber,
        customerName: selectedCustomerName,
        items: newItems.map((item) => ({
          itemId: item._id || item.id,
          itemName: item.itemName,
          price: item.adjustedPrice,
          quantity: item.quantity,
          selectedSubcategoryId: item.selectedSubcategoryId || null,
          subtotal: item.adjustedPrice * item.quantity,
          taxPercentage: item.taxPercentage || 0,
          taxAmount: item.taxAmount || 0
        })),
        orderType: 'KOT',
        status: 'pending',
        tax: kotTaxAmount, // Use calculated tax amount
        discount: discount,
        subtotal: kotSubtotal,
        totalAmount: kotTotal,
        kotGenerated: true,
        paymentStatus: 'pending'
      }

      const result = await dispatch(createOrder(orderData)).unwrap()
      // console.log('Order created successfully:', result)
      toast.success('Order saved successfully!', { autoClose: 3000 })

      setKotItems((prevKotItems) => [...prevKotItems, ...newItems])

      const kotElement = kotRef.current
      if (!kotElement) return

      kotElement.style.display = 'block'

      html2canvas(kotElement, { scale: 2 })
        .then((canvas) => {
          const imgData = canvas.toDataURL('image/png')
          setKOTImage(imgData)
          setShowKOTModal(true)
        })
        .catch((error) => {
          toast.error(`Error generating KOT preview: ${error}`, { autoClose: 3000 })
        })
        .finally(() => {
          kotElement.style.display = 'none'
        })

    } catch (error) {
      console.error('Error creating order:', error)
      toast.error(`Failed to save order: ${error}`, { autoClose: 3000 })
    }
  }

  const handlePrint = () => {
    const printWindow = window.open()
    if (printWindow) {
      printWindow.document.write(`
     <html>
      <head>
        <title>KOT Print</title>
        <style>
          @page {
            size: 2in auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            text-align: center;
          }
          img {
            width: 2in;
          }
        </style>
      </head>
      <body>
        <img src="${kotImage}" style="width: 2in;" />
        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => window.close(), 100);
          };
        </script>
      </body>
    </html>
    `)
      printWindow.document.close()
    }
  }

  const MobilePrintOptionsModal = ({ isVisible, options, onClose }) => {
    if (!isVisible || !options) return null

    const isAndroid = /Android/i.test(navigator.userAgent)

    return (
      <div className="mobile-print-modal" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div className="modal-content" style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          maxWidth: '90%',
          maxHeight: '90%',
          overflow: 'auto'
        }}>
          <h3>Print Options</h3>
          <p>{options.message}</p>

          {isAndroid && (
            <div className="android-options" style={{ marginBottom: '15px' }}>
              <p><strong>Android Printing Instructions:</strong></p>
              <ol style={{ textAlign: 'left', paddingLeft: '20px' }}>
                <li>Download the PDF using the button below</li>
                <li>Open your Downloads folder</li>
                <li>Tap on the invoice.pdf file</li>
                <li>Select "Print" from the menu options</li>
                <li>Choose your printer</li>
              </ol>
            </div>
          )}

          <div className="button-group" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <a
              href={options.pdfUrl}
              download="invoice.pdf"
              className="btn btn-primary"
              style={{
                padding: '10px 15px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                textDecoration: 'none',
                textAlign: 'center'
              }}
            >
              Download PDF
            </a>

            <button
              onClick={() => {
                handleSendEmail()
                onClose()
              }}
              className="btn btn-secondary"
              style={{
                padding: '10px 15px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              Send via Email
            </button>
          </div>

          <button
            onClick={onClose}
            className="btn btn-light mt-3"
            style={{
              padding: '10px 15px',
              backgroundColor: '#f8f9fa',
              color: '#212529',
              border: '1px solid #ddd',
              borderRadius: '4px',
              marginTop: '15px',
              width: '100%'
            }}
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <CContainer fluid className="p-3" style={{ backgroundColor: '#f0f2f5' }}>
      <CRow>
        <CCol md={7} lg={8}>
          <ProductList
            searchProduct={searchProduct}
            handleSearchProduct={handleSearchProduct}
            tableNumber={tableNumber}
            menuItemsLoading={menuItemsLoading || categoryLoading || subCategoryLoading}
            filteredMenuItems={filteredMenuItems}
            onMenuItemClick={handleMenuItemClick}
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            setSelectedCategoryId={setSelectedCategoryId}
          />
        </CCol>
        <CCol md={5} lg={4}>
          <Cart
            selectedCustomerName={selectedCustomerName}
            setShowCustomerModal={setShowCustomerModal}
            startTime={startTime}
            elapsedTime={elapsedTime}
            cart={cart}
            setCart={setCart}
            handleQuantityChange={handleQuantityChange}
            handleDeleteClick={handleDeleteClick}
            calculateSubtotal={calculateSubtotal}
            calculateTotalTaxAmount={calculateTotalTaxAmount}
            calculateDiscountAmount={calculateDiscountAmount}
            getDiscountAmount={calculateDiscountAmount}
            calculateTotal={calculateTotal}
            tax={tax}
            discount={discount}
            setDiscount={setDiscount}
            appliedDiscounts={appliedDiscounts}
            setAppliedDiscounts={setAppliedDiscounts}
            roundOff={roundOff}
            setShowTaxModal={setShowTaxModal}
            membershipDiscount={membershipDiscount}
            membershipName={selectedCustomer?.membershipName}
            isDiscountDisabled={membershipDiscount?.value > 0}
            setShowDiscountModal={setShowDiscountModal}
            setShowRoundOffModal={setShowRoundOffModal}
            selectedSystem={selectedSystem}
            onSystemChange={handleSystemChange}
          />
        </CCol>
      </CRow>
      <CCardFooter className="p-3 mt-3 shadow-lg" style={{ borderRadius: '15px', backgroundColor: '#fff' }}>
        <CRow className="align-items-center">
          <CCol md={4}>
            <h4 className="fw-bold mb-0">
              Total: ₹{calculateTotal().toFixed(2)}
            </h4>
          </CCol>
          {/* System display removed - system will work in background */}
          <CCol md={8} className="d-flex justify-content-end gap-2 flex-wrap">
            <CButton
              color="danger"
              variant="outline"
              size="lg"
              onClick={clearCart}
              className="btn-mobile-responsive"
              style={{ minWidth: 'fit-content', whiteSpace: 'nowrap' }}
            >
              Cancel
            </CButton>
            <CButton
              color="info"
              variant="outline"
              size="lg"
              onClick={generateKOT}
              className="btn-mobile-responsive"
              style={{ minWidth: 'fit-content', whiteSpace: 'nowrap' }}
            >
              KOT
            </CButton>
            <CButton
              color="warning"
              variant="outline"
              size="lg"
              onClick={generateInvoice}
              className="btn-mobile-responsive"
              style={{ minWidth: 'fit-content', whiteSpace: 'nowrap' }}
            >
              Bill
            </CButton>
            <CButton
              color="success"
              size="lg"
              onClick={() => setShowPaymentModal(true)}
              className="btn-mobile-responsive"
              style={{ minWidth: 'fit-content', whiteSpace: 'nowrap' }}
            >
              Pay Now
            </CButton>
          </CCol>
        </CRow>
      </CCardFooter>

      {/* Modals and hidden components */}
      <SubCategorySelectionModal
        visible={showSubCategoryModal}
        onClose={() => setShowSubCategoryModal(false)}
        menuItem={selectedMenuItemForSubcategory}
        subCategories={subCategories}
        onAddToCartWithSubcategory={handleAddToCartWithSubcategory}
      />

      {/* System Selection Modal */}
      <SystemSelectionModal
        showSystemModal={showSystemModal}
        setShowSystemModal={setShowSystemModal}
        onSystemSelect={handleSystemSelect}
        selectedSystem={selectedSystem}
      />

      <KOTModal isVisible={showKOTModal} onClose={() => setShowKOTModal(false)}>
        <div style={{ textAlign: 'center' }}>
          <h3>KOT Preview</h3>
          {kotImage && (
            <img
              src={kotImage}
              alt="KOT Preview"
              style={{ width: '100%', marginBottom: '10px' }}
            />
          )}
          <button
            onClick={handlePrint}
            style={{
              margin: '0 10px',
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Print
          </button>
        </div>
      </KOTModal>

      <InvoiceModal isVisible={showInvoiceModal} onClose={() => setShowInvoiceModal(false)}>
        <div style={{ textAlign: 'center' }}>
          <h3>Invoice Preview</h3>
          {invoiceImage && (
            <img
              src={invoiceImage}
              alt="Invoice Preview"
              style={{ width: '100%', marginBottom: '10px' }}
            />
          )}
          <div style={{ marginTop: '10px' }}>
            <button onClick={handleInvoicePrint}>Print</button>
            <button onClick={handleSendEmail}>Send via Email</button>
          </div>
        </div>
      </InvoiceModal>

      <div style={{ position: 'absolute', left: '-9999px' }}>
        <Invoice
          ref={invoiceRef}
          tableNumber={tableNumber}
          selectedCustomerName={selectedCustomerName}
          cart={cart}
          calculateSubtotal={calculateSubtotal}
          tax={calculateTotalTaxAmount()} // Pass total tax amount
          calculateTaxAmount={calculateTotalTaxAmount} // Pass function
          discount={discount}
          calculateDiscountAmount={calculateDiscountAmount}
          calculateTotal={calculateTotal}
          selectedSystem={selectedSystem}
        />
      </div>

      <div style={{ position: 'absolute', left: '-9999px' }}>
        <KOT
          ref={kotRef}
          tableNumber={tableNumber}
          cart={cart.filter((item) => !kotItems.includes(item))}
          selectedSystem={selectedSystem}
        />
      </div>

      {/* FIXED: TaxModal with proper props */}
      <TaxModal
        showTaxModal={showTaxModal}
        setShowTaxModal={setShowTaxModal}
        cart={cart}
        handleTaxSubmit={handleTaxSubmit}
      />

      <DiscountModal
        showDiscountModal={showDiscountModal}
        setShowDiscountModal={setShowDiscountModal}
        cart={cart}
        selectedCustomer={selectedCustomer} // ADD THIS LINE
        handleDiscountSubmit={handleDiscountSubmit}
      />
      <RoundOffAmountModal
        showRoundOffModal={showRoundOffModal}
        setShowRoundOffModal={setShowRoundOffModal}
        inputValue={inputValue}
        setInputValue={setInputValue}
        roundOff={roundOff}
        setRoundOff={setRoundOff}
        handleRoundOffSubmit={handleRoundOffSubmit}
        subtotal={calculateSubtotal()}
        tax={calculateTotalTaxAmount()}
        discount={calculateDiscountAmount()}
        cart={cart}
      />

      <PaymentModal
        showPaymentModal={showPaymentModal}
        setShowPaymentModal={setShowPaymentModal}
        paymentType={paymentType}
        setPaymentType={setPaymentType}
        splitPercentages={splitPercentages}
        setSplitPercentages={setSplitPercentages}
        handlePaymentSubmit={handlePaymentSubmit}


      />

      <DeleteModal
        showDeleteModal={showDeleteModal}
        cancelDelete={cancelDelete}
        confirmDelete={confirmDelete}
      />

      <CustomerModal
        showCustomerModal={showCustomerModal}
        setShowCustomerModal={setShowCustomerModal}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filteredCustomers={filteredCustomers}
        handleCustomerSelect={handleCustomerSelect}
        customerLoading={customerLoading}
        handleAddCustomer={handleAddCustomer}
        restaurantId={localStorage.getItem('restaurantId')}
      />

      <MobilePrintOptionsModal
        isVisible={mobilePrintOptions.show}
        options={mobilePrintOptions}
        onClose={() => setMobilePrintOptions({ ...mobilePrintOptions, show: false })}
      />
    </CContainer>
  )
}

export default POSTableContent