import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  CContainer,
  CCol,
  CRow,
  CSpinner,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CFormCheck,
  CBadge,
  CAlert,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CForm,
  CFormInput,
  CFormLabel,
  CFormTextarea,
  CCardFooter,
} from '@coreui/react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { BASE_URL } from '../../utils/constants'
import { fetchMenuItems } from '../../redux/slices/menuSlice'
import { useHotkeys } from 'react-hotkeys-hook';
import { FocusTrap } from 'focus-trap-react';
import {
  fetchCustomers,
  updateCustomerFrequency,
  addCustomer,
  addRewardPoints,
  deductRewardPoints
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
import { createOrder, updateOrderStatus } from '../../redux/slices/orderSlice'
import CustomerModal from '../../components/CustomerModal'
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
  const productListRef = useRef(null);  // For the entire ProductList container
  const cartRef = useRef(null);         // For the entire Cart container (pass to Cart)
  const [showHelpModal, setShowHelpModal] = useState(false);
  const { tableNumber: tableId } = useParams();
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const invoiceRef = useRef(null)
  const kotRef = useRef(null)
  const generateKOTRef = useRef(null)
  const generateInvoiceRef = useRef(null)
  const { tableNumber } = useParams()
  const [appliedDiscounts, setAppliedDiscounts] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null); // Store coupon data for max discount check
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
      return payload.restaurantId || payload.restaurant_id
    } catch (error) {
      console.error('Error decoding token:', error)
      return null
    }
  }

  const restaurantId = getRestaurantIdFromToken() || localStorage.getItem('restaurantId')
  const handleProductClick = useCallback((product) => {
    // This will trigger the size selection modal in ProductList
    // We’ll rely on ProductList’s internal handleProductClick for modal logic
  }, []);
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
  const [systems, setSystems] = useState([]); // Add systems state
  const [selectedSystem, setSelectedSystem] = useState(() => {
    const savedSystem = localStorage.getItem(`selectedSystem_${tableId}`)
    if (savedSystem) {
      try {
        const system = JSON.parse(savedSystem)
        // Validate system data - reject if it's invalid dine-in data or missing required fields
        if (system.systemName === 'dine-in' || system.systemName === 'Dine in' || system.systemName === 'Dine-in' || !system._id || !system.systemName || !system.chargeOfSystem) {
          localStorage.removeItem(`selectedSystem_${tableId}`)
          return null
        }
        return system
      } catch (error) {
        localStorage.removeItem(`selectedSystem_${tableId}`)
        return null
      }
    }
    return null
  })
  const [currentOrderId, setCurrentOrderId] = useState(null) // Store orderId after KOT generation

  // Get userId from Redux state or localStorage
  const userId = useSelector((state) => state.auth.userId) || localStorage.getItem('userId')
  const searchInputRef = useRef(null);
  const [cart, setCart] = useState(() => {
    // Make cart data user-specific by including userId in the key
    const currentUserId = userId || localStorage.getItem('userId')


    const savedCart = localStorage.getItem(`cart_${tableId}_${currentUserId}`)

    // If no user-specific cart, try to get from general cart (for backward compatibility)
    if (!savedCart) {
      const generalCart = localStorage.getItem(`cart_${tableId}`)
      if (generalCart) {
        // Migrate to user-specific storage
        localStorage.setItem(`cart_${tableId}_${currentUserId}`, generalCart)
        return JSON.parse(generalCart)
      }
    }
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
    searchInputRef.current?.focus();
  }, []);
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

  // Separate useEffect to validate selectedSystem when it changes
  useEffect(() => {
    if (token && restaurantId && selectedSystem && selectedSystem._id) {
      const validateSelectedSystem = async () => {
        try {
          const response = await fetch(`${BASE_URL}/api/settings?restaurantId=${restaurantId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          const data = await response.json()
          
          if (data.success && data.data) {
            const currentSystem = data.data.find(s => s._id === selectedSystem._id)
            if (!currentSystem) {
              // System was deleted, clear it
              setSelectedSystem(null)
              localStorage.removeItem(`selectedSystem_${tableId}`)
            } else {
              // System still exists, update it with current data (but keep it even if willOccupy is false)
              const updatedSystem = {
                ...selectedSystem,
                willOccupy: currentSystem.willOccupy,
                color: currentSystem.color || '',
                chargeOfSystem: parseInt(currentSystem.chargeOfSystem) || 0
              }
              // Only update if something actually changed to avoid infinite loops
              if (JSON.stringify(updatedSystem) !== JSON.stringify(selectedSystem)) {
                setSelectedSystem(updatedSystem)
                localStorage.setItem(`selectedSystem_${tableId}`, JSON.stringify(updatedSystem))
              }
            }
          }
        } catch (err) {
          console.error('Error validating system:', err)
        }
      }
      
      validateSelectedSystem()
    }
  }, [token, restaurantId, tableId]) // Only run when these change, not when selectedSystem changes

  // Handle navigation state for auto-opening KOT or Bill
  // This useEffect runs after component mounts and functions are defined
  useEffect(() => {
    // Check if we have navigation state to open KOT or Bill
    if (location.state && (location.state.openKOT || location.state.openBill)) {
      const openKOT = location.state.openKOT
      const openBill = location.state.openBill
      
      // Wait for component to fully mount and cart to load
      const timer = setTimeout(() => {
        // Check cart from localStorage (more reliable than state on initial load)
        const currentUserId = userId || localStorage.getItem('userId')
        const cartKey = `cart_${tableId}_${currentUserId}`
        const savedCart = JSON.parse(localStorage.getItem(cartKey) || '[]')
        
        // Use savedCart if available, otherwise use current cart state
        const cartToCheck = savedCart.length > 0 ? savedCart : cart
        
        if (openKOT) {
          if (cartToCheck.length > 0) {
            // Use ref to access function
            if (generateKOTRef.current) {
              generateKOTRef.current()
            } else {
              // If function not ready, try again after a short delay
              setTimeout(() => {
                if (generateKOTRef.current) {
                  generateKOTRef.current()
                } else {
                  toast.error('KOT generation is not ready. Please try again.', { autoClose: 3000 })
                }
              }, 500)
            }
          } else {
            toast.info('Cart is empty! Please add items to generate KOT.', { autoClose: 3000 })
          }
        } else if (openBill) {
          if (cartToCheck.length > 0) {
            // Use ref to access function
            if (generateInvoiceRef.current) {
              generateInvoiceRef.current()
            } else {
              // If function not ready, try again after a short delay
              setTimeout(() => {
                if (generateInvoiceRef.current) {
                  generateInvoiceRef.current()
                } else {
                  toast.error('Invoice generation is not ready. Please try again.', { autoClose: 3000 })
                }
              }, 500)
            }
          } else {
            toast.info('Cart is empty! Please add items to generate Invoice.', { autoClose: 3000 })
          }
        }
        
        // Clear the state to prevent re-triggering
        navigate(location.pathname, { replace: true, state: {} })
      }, 1200) // Delay to ensure everything is loaded and functions are defined
      
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

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
        // Transform the data to match expected format - show all systems regardless of willOccupy
        const transformedSystems = data.data
          .map(setting => ({
            _id: setting._id,
            systemName: setting.systemName,
            chargeOfSystem: parseInt(setting.chargeOfSystem) || 0,
            willOccupy: setting.willOccupy,
            color: setting.color
          }))

        console.log('All systems (including willOccupy: false):', transformedSystems)
        setSystems(transformedSystems); // Store systems for dropdown

        // Handle system selection based on count
        if (!selectedSystem) {
          if (transformedSystems.length === 1 && transformedSystems[0].chargeOfSystem > 0) {
            // Only one system - auto-select it
            setSelectedSystem(transformedSystems[0])
            localStorage.setItem(`selectedSystem_${tableId}`, JSON.stringify(transformedSystems[0]))
          } else if (transformedSystems.length > 1) {
            // Multiple systems - show selection modal
            // setShowSystemModal(true) // Commented out - modal not showing
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
    // setShowSystemModal(true) // Commented out - modal not showing
  }

  const handleSystemSelect = (system) => {
    setSelectedSystem(system)
    localStorage.setItem(`selectedSystem_${tableId}`, JSON.stringify(system))
    setShowSystemModal(false)
  }

  const handleSystemDropdownChange = (e) => {
    const selectedSystemId = e.target.value;
    if (selectedSystemId) {
      const system = systems.find(s => s._id === selectedSystemId);
      if (system) {
        setSelectedSystem(system);
        localStorage.setItem(`selectedSystem_${tableId}`, JSON.stringify(system));
      }
    } else {
      // Clear system selection when "None" is selected
      setSelectedSystem(null);
      localStorage.removeItem(`selectedSystem_${tableId}`);
    }
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
    // Reset orderId when cart is cleared
    setCurrentOrderId(null)
    
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
    setAppliedCoupon(null); // Reset applied coupon
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
    if (!discounts) {
      toast.error('Invalid discount data');
      return;
    }
    setAppliedDiscounts(discounts);
    // let totalDiscount = 0;
    // if (discounts.manualRewardPoints && discounts.manualRewardPoints.enabled) {
    //   totalDiscount += discounts.manualRewardPoints.discountAmount;
    // }
    // if (discounts.rewardPoints && discounts.rewardPoints.enabled) {
    //   totalDiscount += discounts.rewardPoints.discountAmount;
    // }
    // if (discounts.selectedItemDiscount && discounts.selectedItemDiscount.value) {
    //   totalDiscount += calculateItemSpecificDiscount(discounts.selectedItemDiscount);
    // }
    // if (discounts.coupon && discounts.coupon.value) {
    //   totalDiscount += discounts.coupon.amount;
    // }
    // setDiscount(totalDiscount);

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

    // Handle coupon discount
    if (discounts.coupon && discounts.coupon.value) {
      const { value, type, maxDiscountAmount } = discounts.coupon;
      
      // Store coupon data for max discount checks in calculateDiscountAmount
      setAppliedCoupon({
        id: discounts.coupon.id, // Add coupon ID for usage count increment
        value,
        type,
        maxDiscountAmount,
        code: discounts.coupon.code
      });
      
      toast.success(`Coupon discount applied: ${type === 'percentage' ? `${value}%` : `₹${value}`}`);
    }

    if (discounts.rewardPoints && discounts.rewardPoints.enabled) {
      const { pointsUsed, discountAmount } = discounts.rewardPoints;
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

    // 1. Check for Membership Discount FIRST
    // We assume membership discount overrides all other discounts.
    if (membershipDiscount && membershipDiscount.value > 0) {
      if (membershipDiscount.type === 'fixed') {
        totalDiscount = membershipDiscount.value;
      } else { // 'percentage'
        totalDiscount = (subtotal * membershipDiscount.value) / 100;
      }
      // Apply coupon discount with max discount check
      if (appliedCoupon && appliedCoupon.maxDiscountAmount) {
        if (appliedCoupon.type === 'percentage') {
          const calculatedDiscountAmount = (subtotal * appliedCoupon.value) / 100;
          totalDiscount = Math.min(calculatedDiscountAmount, appliedCoupon.maxDiscountAmount);
        } else if (appliedCoupon.type === 'fixed') {
          totalDiscount = Math.min(appliedCoupon.value, appliedCoupon.maxDiscountAmount);
        }
      } else {
        // Fallback to regular discount calculation
        return totalDiscount; // Return only membership discount
    }

    // 2. If NO membership discount, calculate other discounts

    // Add item-specific discounts (which are stored in the cart items)
      }
      
    cart.forEach(item => {
      if (item.discountAmount) {
        totalDiscount += Number(item.discountAmount);
      }
    });

    // Add coupon discount (if it exists)
    if (appliedDiscounts?.coupon?.amount) {
      totalDiscount += Number(appliedDiscounts.coupon.amount);
    }

    // Add reward points discount (if it exists)
    if (appliedDiscounts?.rewardPoints?.discountAmount) {
      totalDiscount += Number(appliedDiscounts.rewardPoints.discountAmount);
    }

    return totalDiscount;
  }, [calculateSubtotal, cart, membershipDiscount, appliedDiscounts, appliedCoupon]);

  const calculateTotal = useCallback(() => {
    const subtotal = calculateSubtotal();
    const totalTaxAmount = calculateTotalTaxAmount();
    const discountAmount = calculateDiscountAmount();
    const systemCharge = (selectedSystem && selectedSystem._id && selectedSystem.systemName && selectedSystem.chargeOfSystem > 0) ? Number(selectedSystem.chargeOfSystem || 0) : 0;
    const total = subtotal + totalTaxAmount + systemCharge - discountAmount - roundOff;



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
    
    // Note: Max discount check is now handled in calculateDiscountAmount function
    // No need to manually adjust discount here as it will be calculated automatically
  };

  const handleAddCustomer = (formValues) => {
    const token = localStorage.getItem("authToken");
    const restaurantId = localStorage.getItem("restaurantId");

    const customerData = { ...formValues, restaurantId, token };

    dispatch(addCustomer(customerData))
      .unwrap()
      .then((response) => {
        setSelectedCustomerName(response.name);
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

      // 2. Update customer frequency and total spent
      if (selectedCustomer) {
        await dispatch(updateCustomerFrequency({
          id: _id,
          frequency: freq,
          totalSpent: updatedTotalSpent
        })).unwrap();

        // 3. Deduct reward points if customer used them
        console.log('🔍 Checking reward points for deduction:', appliedDiscounts);
        if (appliedDiscounts?.rewardPoints?.pointsUsed && appliedDiscounts.rewardPoints.pointsUsed > 0) {
          console.log('💳 Deducting reward points:', appliedDiscounts.rewardPoints.pointsUsed);
          await dispatch(deductRewardPoints({
            customerId: _id,
            pointsToDeduct: appliedDiscounts.rewardPoints.pointsUsed
          })).unwrap();
          toast.success(`Reward points deducted successfully!`, { autoClose: 3000 });

        }

        // 4. Add reward points earned from menu items
        if (totalRewardPointsEarned > 0) {
          await dispatch(addRewardPoints({
            customerId: _id,
            pointsToAdd: totalRewardPointsEarned
          })).unwrap();

          toast.success(
            `🎉 Customer earned ${totalRewardPointsEarned} reward points from this order!`,
            { autoClose: 4000 }
          );
        }
      }

      // 🔥 NEW: 5. INCREMENT COUPON USAGE COUNT (only after successful payment)
      if (appliedCoupon && appliedCoupon.id) {
        console.log('🎫 Attempting to increment coupon usage count:', appliedCoupon);
        try {
          const orderTotal = calculateSubtotal();
          console.log('📊 Order total for coupon usage:', orderTotal);
          
          const response = await axios.post(`${BASE_URL}/api/coupon/apply`, {
            couponId: appliedCoupon.id,
            orderTotal: orderTotal
          }, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          console.log('✅ Coupon usage count incremented successfully:', response.data);
          toast.success(`🎫 Coupon ${appliedCoupon.code} usage count updated!`);
        } catch (error) {
          console.error('❌ Error incrementing coupon usage:', error);
          console.error('❌ Error response:', error.response?.data);
          // Don't fail the payment if coupon usage increment fails
          toast.warning('⚠️ Payment successful but coupon usage count update failed');
        }
      } else {
        console.log('⚠️ No coupon applied or coupon ID missing:', appliedCoupon);
      }

      // 🔥 NEW: 6. DEDUCT STOCK FROM INVENTORY (FIFO METHOD)

      // Prepare stock deduction data from cart
      // ✅ REMOVED: Manual stock deduction - automatic deduction already happens in InventoryService

      // 🔥 NEW: 6. Update order status to 'completed' if KOT was generated
      if (currentOrderId) {
        try {
          console.log('🔄 Updating order status to completed:', currentOrderId);
          const statusResult = await dispatch(updateOrderStatus({ 
            id: currentOrderId, 
            status: 'completed' 
          })).unwrap();
          console.log('✅ Order status updated successfully:', statusResult);
          toast.success('✅ Order completed!', { autoClose: 2000 });
        } catch (error) {
          console.error('❌ Error updating order status:', error);
          toast.warning('⚠️ Payment successful but order status update failed', { autoClose: 3000 });
        }
        // Reset orderId after update
        setCurrentOrderId(null);
      }

      // 🔥 NEW: 7. Handle unmerge logic if needed
      if (tableId.startsWith('merged_')) {
        const allMergedTables = JSON.parse(localStorage.getItem('mergedTables') || '[]');
        const updatedMergedTables = allMergedTables.filter(m => `merged_${m.id}` !== tableId);
        localStorage.setItem('mergedTables', JSON.stringify(updatedMergedTables));
        localStorage.removeItem(`cart_${tableId}`);
        localStorage.removeItem(`start_time_${tableId}`);
      }

      // 🔥 NEW: 8. Success - clear cart and navigate
      setShowPaymentModal(false);
      clearCart();
      setAppliedDiscounts(null);
      setAppliedCoupon(null); // Reset applied coupon
      
      // Clear system selection and system charge after payment
      setSelectedSystem(null);
      localStorage.removeItem(`selectedSystem_${tableId}`);
      
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
  
  // Store function reference in ref for useEffect access
  useEffect(() => {
    generateInvoiceRef.current = generateInvoice
  }, [generateInvoice])

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
    // Generate KOT for all items in cart, including same items and different sizes
    // This allows re-generating same items and different sizes
    if (cart.length === 0) {
      toast.info('Cart is empty! Please add items to generate KOT.', { autoClose: 3000 })
      return
    }
    
    try {
      // Calculate subtotal and tax for all cart items
      const kotSubtotal = cart.reduce((total, item) => total + (item.adjustedPrice * item.quantity), 0);
      const kotTaxAmount = cart.reduce((total, item) => total + (Number(item.taxAmount) || 0), 0);
      const kotDiscountAmount = (kotSubtotal * discount) / 100;
      const kotTotal = kotSubtotal + kotTaxAmount - kotDiscountAmount;
      const orderData = {
        token: localStorage.getItem('authToken'),
        restaurantId: localStorage.getItem('restaurantId'),
        userId: localStorage.getItem('userId'),
        tableNumber: tableNumber,
        customerName: selectedCustomerName,
        items: cart.map((item) => ({
          itemId: item._id || item.id,
          itemName: item.itemName,
          price: item.adjustedPrice,
          quantity: item.quantity,
          selectedSubcategoryId: item.selectedSubcategoryId || null,
          sizeId: item.sizeId || null,
          size: item.size || item.selectedSize || null,
          selectedSize: item.selectedSize || null,
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
      
      // Store orderId for later status update after payment
      const orderId = result?.data?._id || result?.data?.id || result?.order?._id || result?.order?.id
      if (orderId) {
        setCurrentOrderId(orderId)
        console.log('✅ Order ID stored for status update:', orderId)
      }
      
      toast.success('KOT generated successfully!', { autoClose: 3000 })

      // Update kotItems with all current cart items (including duplicates and different sizes)
      setKotItems((prevKotItems) => [...prevKotItems, ...cart])

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
  
  // Store function reference in ref for useEffect access
  useEffect(() => {
    generateKOTRef.current = generateKOT
  }, [generateKOT])

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
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't prevent default for Enter on product cards - let ProductList handle it
      const isProductCard = document.activeElement?.classList.contains('product-card');
      if (isProductCard && e.key === 'Enter') {
        // Let ProductList component handle Enter key for product cards
        return;
      }

      // Prevent default browser behavior for other keys
      if (['ArrowUp', 'ArrowDown', 'Escape'].includes(e.key)) {
        e.preventDefault();
      }

      // Shortcuts for modals
      if (e.ctrlKey && e.key === 'k') {
        generateKOT(); // Ctrl + K: Generate KOT
      }
      if (e.ctrlKey && e.key === 'b') {
        generateInvoice(); // Ctrl + B: Generate Invoice
      }
      if (e.ctrlKey && e.key === 'p') {
        setShowPaymentModal(true); // Ctrl + P: Open Payment Modal
      }
      if (e.ctrlKey && e.key === 't') {
        setShowTaxModal(true); // Ctrl + T: Open Tax Modal
      }
      if (e.ctrlKey && e.key === 'd') {
        setShowDiscountModal(true); // Ctrl + D: Open Discount Modal
      }
      if (e.ctrlKey && e.key === 'c') {
        setShowCustomerModal(true); // Ctrl + C: Open Customer Modal
      }
      if (e.ctrlKey && e.key === 'x') {
        clearCart(); // Ctrl + X: Clear Cart
      }

      // Product navigation - Use correct class name
      const products = document.querySelectorAll('.product-card');
      const currentFocused = document.activeElement;
      let index = Array.from(products).indexOf(currentFocused);

      if (products.length === 0) return; // Safety check

      if (e.key === 'ArrowDown' && index >= 0) {
        index = index < products.length - 1 ? index + 1 : 0;
        products[index]?.focus();
      }
      if (e.key === 'ArrowUp' && index >= 0) {
        index = index > 0 ? index - 1 : products.length - 1;
        products[index]?.focus();
      }
      // Enter key is handled by ProductList.js component's onKeyDown handler
      // It will call handleProductClickInternal which opens size selection modal
      // We don't add to cart directly here - let ProductList handle it
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredMenuItems, generateKOT, generateInvoice, clearCart, handleMenuItemClick]);

  // useEffect(() => {
  //   window.addEventListener('focusin');  // Logs on focus change
  //   return () => window.removeEventListener('focusin');
  // }, []);
  // import { useHotkeys } from 'react-hotkeys-hook';

  // Inside POSTableContent component
  // Ctrl shortcuts - enable globally but only if not in cart
  useHotkeys('ctrl+k', () => generateKOT(), {
    preventDefault: true,
    enable: () => !cartRef.current?.contains(document.activeElement)  // Disable if focused in cart
  });
  useHotkeys('ctrl+b', () => generateInvoice(), {
    preventDefault: true,
    enable: () => !cartRef.current?.contains(document.activeElement)
  });
  useHotkeys('ctrl+p', () => setShowPaymentModal(true), {
    preventDefault: true,
    enable: () => !cartRef.current?.contains(document.activeElement)
  });
  useHotkeys('ctrl+t', () => setShowTaxModal(true), {
    preventDefault: true,
    enable: () => !cartRef.current?.contains(document.activeElement)
  });
  useHotkeys('ctrl+d', () => setShowDiscountModal(true), {
    preventDefault: true,
    enable: () => !cartRef.current?.contains(document.activeElement)
  });
  useHotkeys('ctrl+c', () => {
    setShowCustomerModal(true);
    // Ensure focus happens after modal opens - use setTimeout to allow modal to render
    setTimeout(() => {
      const searchInput = document.querySelector('.customer-search-input');
      if (searchInput) {
        searchInput.focus();
      } else {
        // Try multiple times if not found immediately
        setTimeout(() => {
          const searchInput2 = document.querySelector('.customer-search-input');
          if (searchInput2) {
            searchInput2.focus();
          }
        }, 200);
        setTimeout(() => {
          const searchInput3 = document.querySelector('.customer-search-input');
          if (searchInput3) {
            searchInput3.focus();
          }
        }, 400);
      }
    }, 100);
  }, {
    preventDefault: true,
    enable: () => !cartRef.current?.contains(document.activeElement)
  });
  useHotkeys('ctrl+x', () => clearCart(), {
    preventDefault: true,
    enable: () => !cartRef.current?.contains(document.activeElement)
  });
  useHotkeys('ctrl+h', () => setShowHelpModal(true), {
    preventDefault: true,
    enable: () => !document.activeElement.tagName.match(/INPUT|SELECT|TEXTAREA/)
  });
  useHotkeys('ctrl+shift+r', () => setShowRoundOffModal(true), { preventDefault: true });
  useHotkeys('arrowleft, arrowright', (e) => {
    const categoryButtons = document.querySelectorAll('.category-button');
    if (categoryButtons.length === 0) {
      return;
    }

    let index = Array.from(categoryButtons).indexOf(document.activeElement);
    if (index === -1) {
      categoryButtons[0]?.focus();
      return;
    }

    if (e.key === 'ArrowRight') {
      index = index < categoryButtons.length - 1 ? index + 1 : 0; // Wrap around
      categoryButtons[index]?.focus();
    } else if (e.key === 'ArrowLeft') {
      index = index > 0 ? index - 1 : categoryButtons.length - 1; // Wrap around
      categoryButtons[index]?.focus();
    }
    e.preventDefault();
  }, { preventDefault: true, enable: () => productListRef.current?.contains(document.activeElement) });

  useHotkeys('arrowup, arrowdown', (e) => {
    const productCards = document.querySelectorAll('.product-card');
    if (productCards.length === 0) {
      return;
    }

    let index = Array.from(productCards).indexOf(document.activeElement);
    if (index === -1) {
      productCards[0]?.focus();
      return;
    }

    if (e.key === 'ArrowDown') {
      index = index < productCards.length - 1 ? index + 1 : 0; // Wrap around
      productCards[index]?.focus();
    } else if (e.key === 'ArrowUp') {
      index = index > 0 ? index - 1 : productCards.length - 1; // Wrap around
      productCards[index]?.focus();
    }
    e.preventDefault();
  }, {
    preventDefault: true,
    enable: () => productListRef.current?.contains(document.activeElement)
  });

  // Enter key for product cards is handled by ProductList.js component's onKeyDown
  // Don't add global handler here - it would interfere with size selection modal
  // useHotkeys('enter', ...) removed to allow ProductList to handle Enter key properly

  // Focus management: Switch between ProductList and Cart sections
  useHotkeys('arrowleft', (e) => {
    // Left Arrow: Move to ProductList
    const searchInput = document.querySelector('input[placeholder*="Search menu"]');
    if (searchInput && cartRef.current?.contains(document.activeElement)) {
      e.preventDefault();
      searchInput.focus();
    }
  }, { preventDefault: true });

  useHotkeys('arrowright', (e) => {
    // Right Arrow: Move from ProductList to Cart
    const searchInput = document.querySelector('input[placeholder*="Search menu"]');
    const isInProductList = searchInput && (searchInput === document.activeElement || productListRef.current?.contains(document.activeElement));
    
    if (isInProductList && !cartRef.current?.contains(document.activeElement)) {
      e.preventDefault();
      // Focus first cart item or customer select button
      const cartItem = document.querySelector('.cart-item');
      if (cartItem) {
        cartItem.focus();
      } else {
        // If no cart items, focus on customer select button
        const customerButton = document.querySelector('[title*="Press \'C\' to select customer"]');
        if (customerButton) {
          customerButton.focus();
        }
      }
    }
  }, { preventDefault: true });

  // Auto-focus on Categories when component mounts (as per requirement)
  useEffect(() => {
    const categoryButtons = document.querySelectorAll('.category-button');
    if (categoryButtons.length > 0) {
      categoryButtons[0].focus();
    }
  }, [categories]);

  return (
    <CContainer fluid className="p-5 bg-theme-aware">
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
            handleProductClick={handleProductClick}
            ref={productListRef}
            systems={systems}
            selectedSystem={selectedSystem}
            handleSystemDropdownChange={handleSystemDropdownChange}
          />
        </CCol>
        <CCol md={5} lg={4} className='mb-2'>
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
            theme={theme}
            ref={cartRef}
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
              className="btn-mobile-responsive footer-button"
              style={{ minWidth: 'fit-content', whiteSpace: 'nowrap' }}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  clearCart();
                } else if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  const buttons = document.querySelectorAll('.footer-button');
                  const currentIndex = Array.from(buttons).indexOf(e.currentTarget);
                  if (currentIndex > 0) {
                    buttons[currentIndex - 1]?.focus();
                  }
                } else if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  const buttons = document.querySelectorAll('.footer-button');
                  const currentIndex = Array.from(buttons).indexOf(e.currentTarget);
                  if (currentIndex < buttons.length - 1) {
                    buttons[currentIndex + 1]?.focus();
                  }
                }
              }}
            >
              Cancel
            </CButton>
            <CButton
              color="info"
              variant="outline"
              size="lg"
              onClick={generateKOT}
              className="btn-mobile-responsive footer-button"
              style={{ minWidth: 'fit-content', whiteSpace: 'nowrap' }}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  generateKOT();
                } else if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  const buttons = document.querySelectorAll('.footer-button');
                  const currentIndex = Array.from(buttons).indexOf(e.currentTarget);
                  if (currentIndex > 0) {
                    buttons[currentIndex - 1]?.focus();
                  }
                } else if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  const buttons = document.querySelectorAll('.footer-button');
                  const currentIndex = Array.from(buttons).indexOf(e.currentTarget);
                  if (currentIndex < buttons.length - 1) {
                    buttons[currentIndex + 1]?.focus();
                  }
                }
              }}
            >
              KOT
            </CButton>
            <CButton
              color="warning"
              variant="outline"
              size="lg"
              onClick={generateInvoice}
              className="btn-mobile-responsive footer-button"
              style={{ minWidth: 'fit-content', whiteSpace: 'nowrap' }}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  generateInvoice();
                } else if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  const buttons = document.querySelectorAll('.footer-button');
                  const currentIndex = Array.from(buttons).indexOf(e.currentTarget);
                  if (currentIndex > 0) {
                    buttons[currentIndex - 1]?.focus();
                  }
                } else if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  const buttons = document.querySelectorAll('.footer-button');
                  const currentIndex = Array.from(buttons).indexOf(e.currentTarget);
                  if (currentIndex < buttons.length - 1) {
                    buttons[currentIndex + 1]?.focus();
                  }
                }
              }}
            >
              Bill
            </CButton>
            <CButton
              color="success"
              size="lg"
              onClick={() => setShowPaymentModal(true)}
              className="btn-mobile-responsive footer-button"
              style={{ minWidth: 'fit-content', whiteSpace: 'nowrap' }}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setShowPaymentModal(true);
                } else if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  const buttons = document.querySelectorAll('.footer-button');
                  const currentIndex = Array.from(buttons).indexOf(e.currentTarget);
                  if (currentIndex > 0) {
                    buttons[currentIndex - 1]?.focus();
                  }
                } else if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  const buttons = document.querySelectorAll('.footer-button');
                  const currentIndex = Array.from(buttons).indexOf(e.currentTarget);
                  if (currentIndex < buttons.length - 1) {
                    buttons[currentIndex + 1]?.focus();
                  }
                }
              }}
            >
              Pay Now
            </CButton>
          </CCol>
        </CRow>
      </CCardFooter>

      {/* Modals and hidden components */}
      <FocusTrap active={showSubCategoryModal}>
        <SubCategorySelectionModal
          visible={showSubCategoryModal}
          onClose={() => setShowSubCategoryModal(false)}
          menuItem={selectedMenuItemForSubcategory}
          subCategories={subCategories}
          onAddToCartWithSubcategory={handleAddToCartWithSubcategory}
        />
      </FocusTrap>
      {/* System Selection Modal - Commented out as per user request */}
      {/* <FocusTrap active={showSystemModal}>
        <SystemSelectionModal
          showSystemModal={showSystemModal}
          setShowSystemModal={setShowSystemModal}
          onSystemSelect={handleSystemSelect}
          selectedSystem={selectedSystem}
        />
      </FocusTrap> */}
      <FocusTrap active={showKOTModal}>
        <KOTModal isVisible={showKOTModal} onClose={() => setShowKOTModal(false)}>
          <div
            style={{ textAlign: 'center' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handlePrint();
              if (e.key === 'Escape') setShowKOTModal(false);
            }}
          >
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
              aria-label="Print KOT"
            >
              Print
            </button>
          </div>
        </KOTModal>
      </FocusTrap>
      <FocusTrap active={showInvoiceModal}>
        <InvoiceModal isVisible={showInvoiceModal} onClose={() => setShowInvoiceModal(false)}>
          <div
            style={{ textAlign: 'center' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleInvoicePrint();
              if (e.key === 'Escape') setShowInvoiceModal(false);
            }}
          >
            <h3>Invoice Preview</h3>
            {invoiceImage && (
              <img
                src={invoiceImage}
                alt="Invoice Preview"
                style={{ width: '100%', marginBottom: '10px' }}
              />
            )}
            <div style={{ marginTop: '10px' }}>
              <button onClick={handleInvoicePrint} aria-label="Print Invoice">
                Print
              </button>
              <button onClick={handleSendEmail} aria-label="Send Invoice via Email">
                Send via Email
              </button>
            </div>
          </div>
        </InvoiceModal>
      </FocusTrap>
      <FocusTrap active={showTaxModal}>
        <TaxModal
          showTaxModal={showTaxModal}
          setShowTaxModal={setShowTaxModal}
          cart={cart}
          handleTaxSubmit={handleTaxSubmit}
        />
      </FocusTrap>
      <FocusTrap active={showDiscountModal}>
        <DiscountModal
          showDiscountModal={showDiscountModal}
          setShowDiscountModal={setShowDiscountModal}
          cart={cart}
          selectedCustomer={selectedCustomer}
          handleDiscountSubmit={handleDiscountSubmit}
        />
      </FocusTrap>
      <FocusTrap active={showRoundOffModal}>
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
      </FocusTrap>
      <FocusTrap active={showPaymentModal}>
        <PaymentModal
          showPaymentModal={showPaymentModal}
          setShowPaymentModal={setShowPaymentModal}
          paymentType={paymentType}
          setPaymentType={setPaymentType}
          splitPercentages={splitPercentages}
          setSplitPercentages={setSplitPercentages}
          handlePaymentSubmit={handlePaymentSubmit}
        />
      </FocusTrap>
      <FocusTrap active={showCustomerModal}>
        <CustomerModal
          showCustomerModal={showCustomerModal}
          setShowCustomerModal={setShowCustomerModal}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filteredCustomers={filteredCustomers}
          handleCustomerSelect={handleCustomerSelect}
          customerLoading={customerLoading}
          handleAddCustomer={handleAddCustomer}
          restaurantId={restaurantId}
        />
      </FocusTrap>
      <FocusTrap active={showDeleteModal}>
        <DeleteModal
          showDeleteModal={showDeleteModal}
          cancelDelete={cancelDelete}
          confirmDelete={confirmDelete}
        />
      </FocusTrap>
      <FocusTrap active={showHelpModal}>
        <CModal visible={showHelpModal} onClose={() => setShowHelpModal(false)}>
          <CModalHeader>
            <CModalTitle>Keyboard Shortcuts</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <ul>
              <li><strong>Ctrl + K</strong>: Generate KOT</li>
              <li><strong>Ctrl + B</strong>: Generate Invoice</li>
              <li><strong>Ctrl + P</strong>: Open Payment Modal</li>
              <li><strong>Ctrl + T</strong>: Open Tax Modal</li>
              <li><strong>Ctrl + D</strong>: Open Discount Modal</li>
              <li><strong>Ctrl + C</strong>: Open Customer Modal</li>
              <li><strong>Ctrl + X</strong>: Clear Cart</li>
              <li><strong>Ctrl + H</strong>: Show Help</li>
              <li><strong>Ctrl + Shift + R</strong>: Open Round Off Modal</li>
              <li><strong>Search Bar</strong>: ←/→ Switch • ↓ Categories</li>
              <li><strong>Categories</strong>: ←/→ Navigate • ↑ Search • ↓ Products</li>
              <li><strong>Products</strong>: ↑ Categories • ←/→/↓ Navigate Rows • Enter Add</li>
              <li><strong>Cart Items</strong>: ↑/↓ Navigate • ←/→ Adjust Qty • +/- Adjust Qty • Del Remove</li>
              <li><strong>Section Switch</strong>: ← ProductList • → Cart</li>
              <li><strong>Cart Buttons</strong>: ←/→ Navigate • T Tax • D Discount • R Round • C Customer</li>
              <li><strong>Footer Buttons</strong>: ←/→ Navigate • Enter Activate</li>
            </ul>
          </CModalBody>
          <CModalFooter>
            <CButton
              color="secondary"
              onClick={() => setShowHelpModal(false)}
              aria-label="Close help modal"
            >
              Close
            </CButton>
          </CModalFooter>
        </CModal>
      </FocusTrap>
      <div style={{ position: 'absolute', left: '-9999px' }}>
        <Invoice
          ref={invoiceRef}
          tableNumber={tableId}
          selectedCustomerName={selectedCustomerName}
          cart={cart}
          calculateSubtotal={calculateSubtotal}
          tax={calculateTotalTaxAmount()}
          calculateTaxAmount={calculateTotalTaxAmount}
          discount={discount}
          calculateDiscountAmount={calculateDiscountAmount}
          calculateTotal={calculateTotal}
          selectedSystem={selectedSystem}
        />
        <KOT
          ref={kotRef}
          tableNumber={tableId}
          cart={cart}
          selectedSystem={selectedSystem}
        />
      </div>
    </CContainer>
  )
}

export default POSTableContent