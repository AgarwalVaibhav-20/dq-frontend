import React, { useState, useEffect, useCallback, useRef } from 'react'
import { CContainer, CRow, CCol, CButton, CCardFooter } from '@coreui/react'
import { useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMenuItems } from '../../redux/slices/menuSlice'
import { fetchCustomers, addCustomer } from '../../redux/slices/customerSlice'
import { createTransaction } from '../../redux/slices/transactionSlice'
import { fetchSubCategories } from '../../redux/slices/subCategorySlice'
import { fetchCategories } from '../../redux/slices/categorySlice'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { createOrder } from '../../redux/slices/orderSlice'
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

const POSTableContent = () => {
  const dispatch = useDispatch()
  const invoiceRef = useRef(null)
  const kotRef = useRef(null)
  const { tableNumber } = useParams()
  const { customers, loading: customerLoading } = useSelector((state) => state.customers)
  const { menuItems, loading: menuItemsLoading } = useSelector((state) => state.menuItems)
  const { categories, loading: categoryLoading } = useSelector((state) => state.category)
  const { subCategories, loading: subCategoryLoading } = useSelector((state) => state.subCategory)

  const restaurantId = useSelector((state) => state.auth.restaurantId)
  const theme = useSelector((state) => state.theme.theme)

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
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentType, setPaymentType] = useState('')
  const [splitPercentages, setSplitPercentages] = useState({ online: 0, cash: 0, due: 0 })
  const [searchProduct, setSearchProduct] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false)
  const [selectedMenuItemForSubcategory, setSelectedMenuItemForSubcategory] = useState(null)

  const userId = localStorage.getItem('userId')
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem(`cart_${tableNumber}`)
    return savedCart ? JSON.parse(savedCart) : []
  })

  const [startTime, setStartTime] = useState(() => {
    const savedStartTime = localStorage.getItem(`start_time_${tableNumber}`)
    return savedStartTime ? new Date(savedStartTime) : null
  })
  const [mobilePrintOptions, setMobilePrintOptions] = useState({
    show: false,
    pdfUrl: null,
    message: '',
  })
  const token = localStorage.getItem('authToken');

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
    if (token) {
      dispatch(fetchMenuItems({ token }))
      dispatch(fetchCustomers({ token }))
      dispatch(fetchCategories({ token }))
      dispatch(fetchSubCategories({ token }))
    }
  }, [dispatch, restaurantId])

  useEffect(() => {
    localStorage.setItem(`cart_${tableNumber}`, JSON.stringify(cart))
  }, [cart, tableNumber])

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
    if (selectedCategoryId) {
      items = items?.filter(item => item.categoryId === selectedCategoryId);
    }
    return items?.filter((product) =>
      product.itemName?.toLowerCase().includes(searchProduct.toLowerCase()),
    );
  }, [menuItems, selectedCategoryId, searchProduct]);

  const handleAddToCartWithSubcategory = useCallback((item) => {
    const itemId = item._id || item.id;
    const existingItemIndex = cart.findIndex(
      (cartItem) => {
        const cartItemId = cartItem._id || cartItem.id;
        return cartItemId === itemId && cartItem.selectedSubcategoryId === item.selectedSubcategoryId;
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
                (cartItem.price * newQuantity * cartItem.taxPercentage) / 100 : 0
            };
          }
          return cartItem;
        }),
      );
    } else {
      const newCartItem = {
        ...item,
        id: itemId,
        _id: item._id,
        quantity: 1,
        price: Number(item.price) || 0,
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
      localStorage.setItem(`start_time_${tableNumber}`, now.toISOString());
    }
    setShowSubCategoryModal(false);
    setSelectedMenuItemForSubcategory(null);
  }, [cart, startTime, tableNumber]);

  const handleMenuItemClick = useCallback((product) => {
    const relevantSubcategoriesExist = subCategories.some(sub => sub.category_id === product.categoryId);

    if (relevantSubcategoriesExist) {
      setSelectedMenuItemForSubcategory(product);
      setShowSubCategoryModal(true);
    } else {
      const productId = product._id || product.id;
      const existingItemIndex = cart.findIndex((item) => {
        const cartItemId = item._id || item.id;
        return cartItemId === productId;
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
                  (item.price * newQuantity * item.taxPercentage) / 100 : 0
              };
            }
            return item;
          })
        );
      } else {
        const newCartItem = {
          ...product,
          id: productId,
          _id: product._id,
          quantity: 1,
          price: Number(product.price) || 0,
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
        localStorage.setItem(`start_time_${tableNumber}`, now.toISOString());
      }
    }
  }, [cart, startTime, tableNumber, subCategories]);

  const handleCustomerSelect = (customer) => {
    setSelectedCustomerName(customer.name)
    setShowCustomerModal(false)
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
      localStorage.removeItem(`start_time_${tableNumber}`)
    }
  }

  const clearCart = () => {
    setCart([])
    setRoundOff(0)
    setStartTime(null)
    setElapsedTime(0)
    localStorage.removeItem(`cart_${tableNumber}`)
    localStorage.removeItem(`start_time_${tableNumber}`)
  }

  const handleTaxSubmit = (selectedItemIds, taxValue, taxType) => {
    setCart(prevCart =>
      prevCart.map(item => {
        const itemId = item._id || item.id;
        if (selectedItemIds.includes(itemId)) {
          let taxAmount = 0;
          let taxPercentage = 0;
          let fixedTaxAmount = 0;

          if (taxType === 'percentage') {
            taxPercentage = taxValue;
            taxAmount = (item.price * item.quantity * taxValue) / 100;
          } else if (taxType === 'fixed') {
            fixedTaxAmount = taxValue;
            taxAmount = taxValue; // Fixed amount per item (not multiplied by quantity)
          }

          return {
            ...item,
            taxType: taxType, // Store the tax type
            taxPercentage: taxPercentage,
            fixedTaxAmount: fixedTaxAmount,
            taxAmount: taxAmount
          };
        }
        return item;
      })
    );

    toast.success(`${taxType === 'percentage' ? 'Percentage' : 'Fixed'} tax applied to ${selectedItemIds.length} item(s)!`);
  };

  const handleDiscountSubmit = (selectedItemIds, discountValue, discountType) => {
    setCart(prevCart =>
      prevCart.map(item => {
        const itemId = item._id || item.id;
        if (selectedItemIds.includes(itemId)) {
          let discountAmount = 0;
          let discountPercentage = 0;
          let fixedDiscountAmount = 0;

          if (discountType === 'percentage') {
            discountPercentage = discountValue;
            discountAmount = (item.price * item.quantity * discountValue) / 100;
          } else if (discountType === 'fixed') {
            fixedDiscountAmount = discountValue;
            discountAmount = discountValue;
          }

          return {
            ...item,
            discountType: discountType,
            discountPercentage: discountPercentage,
            fixedDiscountAmount: fixedDiscountAmount,
            discountAmount: discountAmount
          };
        }
        return item;
      })
    );

    toast.success(`${discountType === 'percentage' ? 'Percentage' : 'Fixed'} discount applied to ${selectedItemIds.length} item(s)!`);
  };

  const handleRoundOffSubmit = () => {
    setRoundOff(Number(inputValue))
    setShowRoundOffModal(false)
    setInputValue('')
  }

  const calculateSubtotal = useCallback(() => {
    return cart.reduce((total, item) => total + item.quantity * item.price, 0)
  }, [cart])

  const calculateTotalTaxAmount = useCallback(() => {
    return cart.reduce((total, item) => total + (Number(item.taxAmount) || 0), 0);
  }, [cart]);

  const calculateDiscountAmount = () => {
    const subtotal = calculateSubtotal()
    return (subtotal * discount) / 100
  }

  const calculateTotal = useCallback(() => {
    const subtotal = calculateSubtotal()
    const totalTaxAmount = calculateTotalTaxAmount()
    const discountAmount = (subtotal * discount) / 100
    return subtotal + totalTaxAmount - discountAmount - roundOff
  }, [calculateSubtotal, calculateTotalTaxAmount, discount, roundOff])

  // FIXED: Quantity change handler with proper ID matching
  const handleQuantityChange = (itemId, newQty) => {
    if (newQty < 1) return;

    const updatedCart = cart.map((item) => {
      const currentItemId = item._id || item.id;
      if (currentItemId === itemId) {
        const updatedItem = { ...item, quantity: newQty };

        // Recalculate tax amount based on tax type
        if (item.taxType === 'percentage' && item.taxPercentage > 0) {
          updatedItem.taxAmount = (item.price * newQty * item.taxPercentage) / 100;
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

    if (!token) {
      toast.error('Authentication token missing');
      return;
    }

    if (!restaurantId) {
      toast.error('Restaurant ID missing');
      return;
    }

    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    const payload = {
      token,
      userId,
      restaurantId,
      tableNumber,
      items: cart?.map((item) => ({
        itemId: item._id || item.id,
        itemName: item.itemName,
        price: item.price,
        quantity: item.quantity,
        selectedSubcategoryId: item.selectedSubcategoryId || null,
        subtotal: item.price * item.quantity,
        taxType: item.taxType || null,
        taxPercentage: item.taxPercentage || 0,
        fixedTaxAmount: item.fixedTaxAmount || 0,
        taxAmount: item.taxAmount || 0
      })),
      tax: calculateTotalTaxAmount(),
      discount,
      sub_total: calculateSubtotal(),
      total: calculateTotal(),
      type: paymentType,
    };

    if (paymentType === "split") {
      payload.split_details = {
        cash: splitPercentages.cash || 0,
        online: splitPercentages.online || 0,
        due: splitPercentages.due || 0,
      };
    }

    try {
      const result = await dispatch(createTransaction(payload)).unwrap();
      console.log('Transaction created:', result);
      setShowPaymentModal(false);
      clearCart();
      toast.success('Payment processed successfully!');
    } catch (error) {
      console.error("Error submitting payment:", error);
      toast.error('Failed to process payment: ' + (error.message || 'Unknown error'));
    }
  };

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
      const kotSubtotal = newItems.reduce((total, item) => total + (item.price * item.quantity), 0);
      const kotTaxAmount = newItems.reduce((total, item) => total + (Number(item.taxAmount) || 0), 0);
      const kotDiscountAmount = (kotSubtotal * discount) / 100;
      const kotTotal = kotSubtotal + kotTaxAmount - kotDiscountAmount;

      const orderData = {
        token: localStorage.getItem('authToken'),
        restaurantId: localStorage.getItem('restaurantId'),
        userId: localStorage.getItem('userId'),
        tableNumber: tableNumber,
        customerName: selectedCustomerName || 'Walk-in Customer',
        items: newItems.map((item) => ({
          itemId: item._id || item.id,
          itemName: item.itemName,
          price: item.price,
          quantity: item.quantity,
          selectedSubcategoryId: item.selectedSubcategoryId || null,
          subtotal: item.price * item.quantity,
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
      console.log('Order created successfully:', result)
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
            calculateTotal={calculateTotal}
            tax={tax}
            discount={discount}
            roundOff={roundOff}
            setShowTaxModal={setShowTaxModal}
            setShowDiscountModal={setShowDiscountModal}
            setShowRoundOffModal={setShowRoundOffModal}
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
          <CCol md={8} className="d-flex justify-content-end gap-2">
            <CButton color="danger" variant="outline" size="lg" onClick={clearCart}>Cancel</CButton>
            <CButton color="info" variant="outline" size="lg" onClick={generateKOT}>KOT</CButton>
            <CButton color="warning" variant="outline" size="lg" onClick={generateInvoice}>Bill</CButton>
            <CButton color="success" size="lg" onClick={() => setShowPaymentModal(true)}>Pay Now</CButton>
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
        />
      </div>

      <div style={{ position: 'absolute', left: '-9999px' }}>
        <KOT
          ref={kotRef}
          tableNumber={tableNumber}
          cart={cart.filter((item) => !kotItems.includes(item))}
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
        cart={cart} // This was missing!
        handleDiscountSubmit={handleDiscountSubmit}
      />
      <RoundOffAmountModal
        showRoundOffModal={showRoundOffModal}
        setShowRoundOffModal={setShowRoundOffModal}
        inputValue={inputValue}
        setInputValue={setInputValue}
        handleRoundOffSubmit={handleRoundOffSubmit}
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