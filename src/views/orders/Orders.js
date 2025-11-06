import React, { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DataGrid } from '@mui/x-data-grid'
import { fetchOrders, updateOrderStatus } from '../../redux/slices/orderSlice'
import { CButton, CSpinner, CCard, CCardBody, CCardHeader, CCol, CRow, CFormSelect, CFormInput, CFormLabel } from '@coreui/react'
import CustomToolbar from '../../utils/CustomToolbar'
import { format } from 'date-fns'
import { useMediaQuery } from '@mui/material'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { getRestaurantProfile } from '../../redux/slices/restaurantProfileSlice'
import { CModal, CModalHeader, CModalBody } from '@coreui/react'
import KOT from '../../components/KOT'
import Invoice from '../../components/Invoice'
import KOTModal from '../../components/KOTModal'
import InvoiceModal from '../../components/InvoiceModal'
import { toast } from 'react-toastify';
import { createTransaction, getDailyCashBalance } from '../../redux/slices/transactionSlice'
import PaymentModal from '../../components/PaymentModal'
import DiscountModal from '../../components/DiscountModal'
import TaxModal from '../../components/TaxModal'
import { FocusTrap } from 'focus-trap-react';
import { updateOrder } from '../../redux/slices/orderSlice'
const Order = () => {
  const [invoiceContent, setInvoiceContent] = useState(null)
  const [pdfDoc, setPdfDoc] = useState(null)
  const dispatch = useDispatch()
  const { orders, loading } = useSelector((state) => state.orders)
  // const restaurantId = useSelector((state) => state.auth.restaurantId)
  const [showKOT, setShowKOT] = useState(false)
  const [showBill, setShowBill] = useState(false)
  const [showKOTModal, setShowKOTModal] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [kotImage, setKOTImage] = useState(null)
  const [invoiceImage, setInvoiceImage] = useState(null)

  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const isMobile = useMediaQuery('(max-width:600px)')
  const { restaurantProfile } = useSelector((state) => state.restaurantProfile)
  const token = localStorage.getItem("authToken")
  const restaurantId = localStorage.getItem('restaurantId');
  // const isMobile = useMediaQuery('(max-width:600px)')
  const isTablet = useMediaQuery('(max-width:992px)')
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  //payment adding 
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentType, setPaymentType] = useState('')
  const [splitPercentages, setSplitPercentages] = useState({ online: 0, cash: 0, due: 0 })
  
  // Discount and Tax modals
  const [showDiscountModal, setShowDiscountModal] = useState(false)
  const [showTaxModal, setShowTaxModal] = useState(false)

  // Handle Discount Submit - Update order with discount
  const handleDiscountSubmit = async (discounts) => {
    if (!selectedOrder || !discounts) {
      toast.error('Invalid discount data');
      return;
    }

    try {
      setIsUpdatingStatus(true);
      
      // Calculate total discount amount from all discount sources
      let totalDiscountAmount = 0;
      let discountPercentage = 0;
      let discountType = null;

      // Handle item-specific discount
      if (discounts.selectedItemDiscount && discounts.selectedItemDiscount.ids && discounts.selectedItemDiscount.ids.length > 0) {
        const { value, type } = discounts.selectedItemDiscount;
        const selectedItems = selectedOrder.items?.filter(item => {
          const itemId = item._id || item.itemId || item.id;
          return discounts.selectedItemDiscount.ids.includes(itemId.toString());
        }) || [];

        if (type === 'percentage') {
          discountPercentage = value;
          totalDiscountAmount = selectedItems.reduce((sum, item) => {
            const itemTotal = (item.price || 0) * (item.quantity || 1);
            return sum + (itemTotal * value / 100);
          }, 0);
        } else if (type === 'fixed') {
          totalDiscountAmount = value * selectedItems.length;
        }
        discountType = type;
      }

      // Handle coupon discount
      if (discounts.coupon && discounts.coupon.value) {
        const { value, type } = discounts.coupon;
        const subtotal = selectedOrder.subtotal || 0;
        
        if (type === 'percentage') {
          const couponDiscount = (subtotal * value) / 100;
          const maxDiscount = discounts.coupon.maxDiscountAmount || Infinity;
          totalDiscountAmount += Math.min(couponDiscount, maxDiscount);
        } else {
          totalDiscountAmount += value;
        }
        discountType = type;
      }

      // Handle reward points discount
      if (discounts.rewardPoints && discounts.rewardPoints.enabled) {
        totalDiscountAmount += discounts.rewardPoints.discountAmount || 0;
      }

      // Handle manual reward points
      if (discounts.manualRewardPoints && discounts.manualRewardPoints.enabled) {
        totalDiscountAmount += discounts.manualRewardPoints.discountAmount || 0;
      }

      // Update order with discount
      const orderId = selectedOrder._id || selectedOrder.order_id;
      const result = await dispatch(updateOrder({
        id: orderId,
        discountAmount: Number(totalDiscountAmount.toFixed(2)),
        discountPercentage: discountPercentage || 0,
        discountType: discountType || 'fixed',
      })).unwrap();

      // Update local state
      setSelectedOrder({
        ...selectedOrder,
        discountAmount: Number(totalDiscountAmount.toFixed(2)),
        discountPercentage: discountPercentage || 0,
        discountType: discountType || 'fixed',
        totalAmount: result.data?.totalAmount || selectedOrder.totalAmount,
      });

      // Refresh orders list
      await dispatch(fetchOrders({ token, restaurantId }));

      toast.success(`Discount applied successfully! Amount: ₹${totalDiscountAmount.toFixed(2)}`);
      setShowDiscountModal(false);
    } catch (error) {
      console.error('Error applying discount:', error);
      toast.error('Failed to apply discount');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle Remove Discount - Remove discount from order
  const handleRemoveDiscount = async () => {
    if (!selectedOrder) {
      toast.error('No order selected');
      return;
    }

    try {
      setIsUpdatingStatus(true);

      // Update order to remove discount
      const orderId = selectedOrder._id || selectedOrder.order_id;
      const result = await dispatch(updateOrder({
        id: orderId,
        discountAmount: 0,
        discountPercentage: 0,
        discountType: null,
      })).unwrap();

      // Update local state
      setSelectedOrder({
        ...selectedOrder,
        discountAmount: 0,
        discountPercentage: 0,
        discountType: null,
        totalAmount: result.data?.totalAmount || selectedOrder.totalAmount,
      });

      // Refresh orders list
      await dispatch(fetchOrders({ token, restaurantId }));

      toast.success('Discount removed successfully!');
    } catch (error) {
      console.error('Error removing discount:', error);
      toast.error('Failed to remove discount');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle Tax Submit - Update order with tax
  const handleTaxSubmit = async (selectedItemIds, taxValue, taxType, taxName) => {
    if (!selectedOrder || !selectedItemIds || selectedItemIds.length === 0) {
      toast.error('Please select items to apply tax');
      return;
    }

    try {
      setIsUpdatingStatus(true);

      // Calculate total tax amount
      const selectedItems = selectedOrder.items?.filter(item => {
        const itemId = item._id || item.itemId || item.id;
        return selectedItemIds.includes(itemId.toString());
      }) || [];

      let totalTaxAmount = 0;
      let taxPercentage = 0;

      if (taxType === 'percentage') {
        taxPercentage = taxValue;
        totalTaxAmount = selectedItems.reduce((sum, item) => {
          const itemTotal = (item.price || 0) * (item.quantity || 1);
          return sum + (itemTotal * taxValue / 100);
        }, 0);
      } else if (taxType === 'fixed') {
        totalTaxAmount = taxValue * selectedItems.length;
      }

      // Update order with tax
      const orderId = selectedOrder._id || selectedOrder.order_id;
      const result = await dispatch(updateOrder({
        id: orderId,
        taxAmount: Number(totalTaxAmount.toFixed(2)),
        taxPercentage: taxPercentage || 0,
        taxType: taxType,
      })).unwrap();

      // Update local state
      setSelectedOrder({
        ...selectedOrder,
        taxAmount: Number(totalTaxAmount.toFixed(2)),
        taxPercentage: taxPercentage || 0,
        taxType: taxType,
        totalAmount: result.data?.totalAmount || selectedOrder.totalAmount,
      });

      // Refresh orders list
      await dispatch(fetchOrders({ token, restaurantId }));

      toast.success(`${taxName || 'Tax'} applied successfully! Amount: ₹${totalTaxAmount.toFixed(2)}`);
      setShowTaxModal(false);
    } catch (error) {
      console.error('Error applying tax:', error);
      toast.error('Failed to apply tax');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Add this handler function (adapt split logic from POSTableContent's handlePaymentSubmit if needed)
  const handlePaymentSubmit = async (paymentData) => {
    try {
      setIsUpdatingStatus(true)
      const orderId = selectedOrder._id || selectedOrder.order_id
      
      // Calculate total amount after discount (discount के बाद का amount)
      const subtotal = Number(selectedOrder.subtotal || selectedOrder.totalAmount || 0)
      const discountAmount = Number(selectedOrder.discountAmount || selectedOrder.discount || 0)
      const taxAmount = Number(selectedOrder.taxAmount || selectedOrder.tax || 0)
      const systemCharge = Number(selectedOrder.systemCharge || 0)
      const roundOff = Number(selectedOrder.roundOff || 0)
      const total = Math.max(0, subtotal - discountAmount + taxAmount + systemCharge + roundOff)

      // Map items to transaction format (backend expects itemId, itemName, price, quantity)
      const cartItems = selectedOrder.items?.map(item => {
        const itemId = item.itemId || item._id || item.id
        const itemName = item.itemName || item.item_name || 'Unknown Item'
        const quantity = Number(item.quantity) || 1
        // Calculate price: if price exists use it, else calculate from subtotal
        const price = item.price ? Number(item.price) : (item.subtotal ? Number(item.subtotal) / quantity : 0)
        
        // Validate required fields
        if (!itemId || !itemName || !price || !quantity) {
          console.error('Invalid item:', item)
          throw new Error(`Item missing required fields: itemId=${itemId}, itemName=${itemName}, price=${price}, quantity=${quantity}`)
        }
        
        return {
          itemId: itemId, // ✅ Backend expects itemId, not id
          itemName: itemName,
          price: price,
          quantity: quantity,
          size: item.size || null,
          selectedSubcategoryId: item.selectedSubcategoryId || null,
          subtotal: price * quantity
        }
      }) || selectedOrder.order_details?.map(item => {
        const itemId = item.itemId || item._id || item.id
        const itemName = item.item_name || item.itemName || 'Unknown Item'
        const quantity = Number(item.quantity) || 1
        const price = Number(item.price) || 0
        
        if (!itemId || !itemName || !price || !quantity) {
          console.error('Invalid item:', item)
          throw new Error(`Item missing required fields`)
        }
        
        return {
          itemId: itemId,
          itemName: itemName,
          price: price,
          quantity: quantity,
          size: item.size || null,
          selectedSubcategoryId: item.selectedSubcategoryId || null,
          subtotal: price * quantity
        }
      }) || []

      // Validate cartItems
      if (!cartItems || cartItems.length === 0) {
        throw new Error('No items found in order')
      }

      // Handle payment types - split or single
      let paymentTypes = []
      
      // Check if it's a split payment (has percentages set)
      const isSplitPayment = paymentType === 'Split' || 
        (splitPercentages.cash > 0 || splitPercentages.online > 0 || splitPercentages.due > 0)
      
      if (isSplitPayment) {
        // Split payment - create multiple transactions
        const cashTotal = total * (splitPercentages.cash / 100)
        const onlineTotal = total * (splitPercentages.online / 100)
        const dueTotal = total * (splitPercentages.due / 100)

        paymentTypes = [
          { type: 'Cash', amount: cashTotal, percent: splitPercentages.cash },
          { type: 'Online', amount: onlineTotal, percent: splitPercentages.online },
          { type: 'Due', amount: dueTotal, percent: splitPercentages.due }
        ].filter(pt => pt.percent > 0)
      } else {
        // Single payment - use the selected payment type
        const paymentTypeToUse = paymentType || paymentData?.type || 'Cash'
        paymentTypes = [
          { type: paymentTypeToUse, amount: total, percent: 100 }
        ]
      }
      
      // Validate that we have at least one payment type
      if (paymentTypes.length === 0) {
        throw new Error('No payment type selected')
      }

      // Update order totalAmount and subtotal before creating transaction (discount के बाद का amount)
      await dispatch(updateOrder({
        id: orderId,
        subtotal: total, // Save discount के बाद का amount in subtotal
        totalAmount: total, // Save discount के बाद का amount
      }));

      let allTransactions = []
      for (const pt of paymentTypes) {
        const transactionPayload = {
          username: localStorage.getItem('username') || 'admin',
          token,
          userId: localStorage.getItem('userId'),
          tableNumber: selectedOrder.tableNumber,
          items: cartItems, // Pro-rate items if needed, but pass full for now
          sub_total: subtotal, // Original subtotal
          tax: (taxAmount || 0) * (pt.amount / total),
          discount: (discountAmount || 0) * (pt.amount / total),
          total: pt.amount, // Discount के बाद का amount for this payment
          type: pt.type,
          restaurantId,
          customerId: selectedOrder.customerId?._id || selectedOrder.customerId || null,
          transactionId: `${Date.now()}-${pt.type}`, // Unique per split
          roundOff: (roundOff || 0) * (pt.amount / total),
          systemCharge: (systemCharge || 0) * (pt.amount / total),
          notes: paymentData.notes || ''
        }

        const result = await dispatch(createTransaction(transactionPayload))
        if (result.type === 'transactions/createTransaction/fulfilled') {
          allTransactions.push(result.payload.transaction)
        } else {
          throw new Error(`Failed to create ${pt.type} transaction`)
        }
      }

      // After all transactions, update order status
      const statusResult = await dispatch(updateOrderStatus({ id: orderId, status: 'completed' }))
      if (statusResult.type === 'orders/updateOrderStatus/fulfilled') {
        // Final update: Ensure totalAmount and subtotal are saved with discount applied (discount के बाद का amount)
        await dispatch(updateOrder({
          id: orderId,
          subtotal: total, // Save discount के बाद का amount in subtotal
          totalAmount: total, // Final total amount after discount
        }));

        toast.success(`Order completed! Payment processed: ${paymentTypes.map(pt => `${pt.type}: ₹${pt.amount.toFixed(2)}`).join(', ')}`)
        setShowPaymentModal(false)
        closeSidebar()
        dispatch(fetchOrders({ token, restaurantId })) // Refresh list
        
        // 🔥 IMPORTANT: Refresh daily cash balance after payment (same as POS page)
        await dispatch(getDailyCashBalance({
          token,
          restaurantId
        }))
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Failed to process payment. Order not completed.')
    } finally {
      setIsUpdatingStatus(false)
      setSplitPercentages({ online: 0, cash: 0, due: 0 }) // Reset splits
    }
  }
  // Refs for KOT and Invoice components
  const kotRef = useRef(null)
  const invoiceRef = useRef(null)

  useEffect(() => {
    if (token && restaurantId) {
      dispatch(fetchOrders({ token, restaurantId }))
    }
  }, [dispatch, token, restaurantId])

  useEffect(() => {
    if (restaurantId) {
      dispatch(getRestaurantProfile({ restaurantId }))
    }
  }, [])
  const handleStatusChange = async (_id, newStatus) => {
    try {
      setIsUpdatingStatus(true);
      console.log('Updating order status:', _id, newStatus);
      console.log('Selected order object:', selectedOrder);

      // Use the correct ID field - try both _id and order_id
      const orderId = selectedOrder._id || selectedOrder.order_id || _id;
      console.log('Using order ID:', orderId);

      const result = await dispatch(updateOrderStatus({ id: orderId, status: newStatus }));

      if (result.type === 'orders/updateOrderStatus/fulfilled') {
        console.log('Status updated successfully');
        // Refresh the orders list
        dispatch(fetchOrders({ token }));
        closeSidebar();
      } else {
        console.error('Failed to update status:', result.payload);
        // alert('Failed to update order status. Please try again.');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      // alert('Error updating order status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  const generateKOT = (order) => {
    try {
      setSelectedOrder(order)

      // Get cart items from either items or order_details
      const cartItems = order.items?.map(item => ({
        id: item._id || item.id || item.itemId,
        itemName: item.itemName || item.item_name,
        price: item.price || item.subtotal,
        quantity: item.quantity,
        notes: item.notes || ''
      })) || order.order_details?.map(item => ({
        id: item._id || item.id,
        itemName: item.item_name,
        price: item.price,
        quantity: item.quantity,
        notes: item.notes || ''
      })) || []

      console.log('KOT Order:', order)
      console.log('KOT Cart Items:', cartItems)
      console.log('KOT Order Items:', order.items)
      console.log('KOT Order Details:', order.order_details)

      if (cartItems.length === 0) {
        toast.error('No items found in this order', { autoClose: 3000 })
        return
      }

      const kotElement = kotRef.current
      if (!kotElement) {
        toast.error('KOT component not found', { autoClose: 3000 })
        return
      }

      // Make the element visible temporarily for html2canvas
      kotElement.style.position = 'absolute'
      kotElement.style.left = '0'
      kotElement.style.top = '0'
      kotElement.style.visibility = 'visible'
      kotElement.style.zIndex = '9999'

      // Wait a bit for the component to render
      setTimeout(() => {
        html2canvas(kotElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: kotElement.offsetWidth,
          height: kotElement.offsetHeight
        })
          .then((canvas) => {
            const imgData = canvas.toDataURL('image/png')
            setKOTImage(imgData)
            setShowKOTModal(true)
            toast.success('KOT generated successfully!', { autoClose: 2000 })
          })
          .catch((error) => {
            console.error('KOT generation error:', error)
            toast.error(`Error generating KOT preview: ${error.message}`, { autoClose: 3000 })
          })
          .finally(() => {
            // Hide the element again
            kotElement.style.position = 'absolute'
            kotElement.style.left = '-9999px'
            kotElement.style.top = '-9999px'
            kotElement.style.visibility = 'hidden'
          })
      }, 300)
    } catch (error) {
      console.error('KOT generation error:', error)
      toast.error(`Error generating KOT: ${error.message}`, { autoClose: 3000 })
    }
  }


  const generateInvoicePDF = (transactionDetails) => {
    const doc = new jsPDF({
      unit: 'mm',
      format: [80, 160],
    })

    const pageWidth = 80
    let y = 8
    const centerText = (text, yPos, fontSize = 10, fontStyle = 'normal') => {
      // doc.setFont('helvetica', fontStyle)
      doc.setFont('Courier', fontStyle)
      doc.setFontSize(fontSize)
      doc.text(text, pageWidth / 2, yPos, { align: 'center' })
    }

    const line = () => {
      doc.setLineWidth(0.1)
      doc.line(5, y, pageWidth - 5, y)
      y += 4
    }

    centerText(restaurantProfile?.restName || 'Restaurant Name', y, 15)
    y += 5
    centerText(restaurantProfile.address || 'Address Line', y, 8)
    y += 4
    centerText(`PinCode: ${restaurantProfile.pinCode || 'XXXXXX'} `, y, 8)
    y += 4
    centerText(`Ph: ${restaurantProfile.phoneNumber || 'N/A'}`, y, 8)
    y += 5
    line()

    centerText('INVOICE', y, 10, 'bold')
    y += 6

    centerText(`Date: ${new Date(transactionDetails.createdAt).toLocaleString()}`, y, 8)
    y += 4
    centerText(`Table: ${transactionDetails?.table_number || 'N/A'}`, y, 8)
    y += 4
    centerText(`Customer: ${transactionDetails?.user.name || 'Walk-in'}`, y, 8)
    y += 5
    line()

    centerText('Items', y, 9, 'bold')
    y += 5

    transactionDetails.order_details?.forEach((item) => {
      const lineItem1 = `${item.item_name} x${item.quantity}`
      centerText(lineItem1, y, 8)
      y += 4
      const lineItem2 = ` Rs. ${(item.price * item.quantity).toFixed(2)}`
      centerText(lineItem2, y, 8)
      y += 4
    })

    y += 1
    line()

    centerText(`Total: Rs ${transactionDetails.total.toFixed(2)}`, y, 10, 'bold')
    y += 6

    line()
    y += 10
    centerText('--- Thank you for your visit ---', y, 10)

    return doc
  }

  const handleDownload = () => {
    if (pdfDoc) {
      pdfDoc.save(`Invoice.pdf`)
    }
  }

  const handlePrint = () => {
    if (pdfDoc) {
      const printWindow = window.open('', '_blank')
      const pdfString = pdfDoc.output('datauristring')
      printWindow.document.write(`<iframe width='100%' height='100%' src='${pdfString}'></iframe>`)
      printWindow.document.close()
    }
  }

  const generateBill = (order) => {
    try {
      setSelectedOrder(order)

      // Get cart items from either items or order_details
      const cartItems = order.items?.map(item => ({
        id: item._id || item.id || item.itemId,
        itemName: item.itemName || item.item_name,
        price: item.price || item.subtotal,
        quantity: item.quantity,
        notes: item.notes || ''
      })) || order.order_details?.map(item => ({
        id: item._id || item.id,
        itemName: item.item_name,
        price: item.price,
        quantity: item.quantity,
        notes: item.notes || ''
      })) || []

      console.log('Invoice Order:', order)
      console.log('Invoice Cart Items:', cartItems)
      console.log('Invoice Order Items:', order.items)
      console.log('Invoice Order Details:', order.order_details)

      if (cartItems.length === 0) {
        toast.error('No items found in this order', { autoClose: 3000 })
        return
      }

      const invoiceElement = invoiceRef.current
      if (!invoiceElement) {
        toast.error('Invoice component not found', { autoClose: 3000 })
        return
      }

      // Make the element visible temporarily for html2canvas
      invoiceElement.style.position = 'absolute'
      invoiceElement.style.left = '0'
      invoiceElement.style.top = '0'
      invoiceElement.style.visibility = 'visible'
      invoiceElement.style.zIndex = '9999'

      // Wait a bit for the component to render
      setTimeout(() => {
        html2canvas(invoiceElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: invoiceElement.offsetWidth,
          height: invoiceElement.offsetHeight
        })
          .then((canvas) => {
            const imgData = canvas.toDataURL('image/png')
            console.log('Invoice canvas generated:', canvas)
            console.log('Invoice image data length:', imgData.length)
            console.log('Invoice image data preview:', imgData.substring(0, 100))
            setInvoiceImage(imgData)
            setShowInvoiceModal(true)
            toast.success('Invoice generated successfully!', { autoClose: 2000 })
          })
          .catch((error) => {
            console.error('Invoice generation error:', error)
            toast.error(`Error generating invoice: ${error.message}`, { autoClose: 3000 })
          })
          .finally(() => {
            // Hide the element again
            invoiceElement.style.position = 'absolute'
            invoiceElement.style.left = '-9999px'
            invoiceElement.style.top = '-9999px'
            invoiceElement.style.visibility = 'hidden'
          })
      }, 300)
    } catch (error) {
      console.error('Invoice generation error:', error)
      toast.error(`Error generating invoice: ${error.message}`, { autoClose: 3000 })
    }
  }

  const handleKOTPrint = () => {
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

  const handleInvoicePrint = () => {
    const printWindow = window.open()
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
        <img src="${invoiceImage}" style="width: 2in;" />
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
  // const handleInvoicePrint = async () => {
  //   const input = document.getElementById('invoice-section')
  //   if (!input) return

  //   const canvas = await html2canvas(input)
  //   const imgData = canvas.toDataURL('image/png')
  //   const pdf = new jsPDF('p', 'mm', 'a4')
  //   const imgProps = pdf.getImageProperties(imgData)
  //   const pdfWidth = pdf.internal.pageSize.getWidth()
  //   const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

  //   pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
  //   pdf.autoPrint()
  //   window.open(pdf.output('bloburl'), '_blank')
  // }

  const closeSidebar = () => setSelectedOrder(null)

  // Filter and sort logic
  const filteredAndSortedOrders = orders
    ?.filter((order) => {
      const matchesSearch =
        order.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.tableNumber?.toString().includes(searchTerm) ||
        order.items?.some(item =>
          item.itemName?.toLowerCase().includes(searchTerm.toLowerCase())
        )

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter

      const matchesDate = (() => {
        if (dateFilter === 'all') return true
        const orderDate = new Date(order.createdAt)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const thisWeek = new Date(today)
        thisWeek.setDate(thisWeek.getDate() - 7)

        switch (dateFilter) {
          case 'today':
            return orderDate.toDateString() === today.toDateString()
          case 'yesterday':
            return orderDate.toDateString() === yesterday.toDateString()
          case 'thisWeek':
            return orderDate >= thisWeek
          case 'thisMonth':
            return orderDate.getMonth() === today.getMonth() && orderDate.getFullYear() === today.getFullYear()
          default:
            return true
        }
      })()

      return matchesSearch && matchesStatus && matchesDate
    })
    ?.sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case 'orderId':
          aValue = a.orderId || ''
          bValue = b.orderId || ''
          break
        case 'customerName':
          aValue = a.customerName || ''
          bValue = b.customerName || ''
          break
        case 'subtotal':
          aValue = parseFloat(a.subtotal) || 0
          bValue = parseFloat(b.subtotal) || 0
          break
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  // Mobile Card Component
  const OrderCard = ({ order, index }) => (
    <CCard className="mb-3 shadow-sm border-0" style={{ borderRadius: '12px' }}>
      <CCardBody className="p-3">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h6 className="fw-bold mb-1 text-primary">#{order.orderId}</h6>
            <small className="text-muted">
              {order.createdAt
                ? (() => {
                  try {
                    return format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm');
                  } catch {
                    return "—";
                  }
                })()
                : "—"}
            </small>

          </div>
          <div style={getStatusStyle(order.status)} className="px-2 py-1 rounded-pill">
            <small className="fw-bold">
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </small>
          </div>
        </div>

        <div className="mb-2">
          <div className="d-flex justify-content-between">
            <span className="text-muted small">Customer:</span>
            <span className="fw-semibold small">{order.customerName || 'N/A'}</span>
          </div>
          <div className="d-flex justify-content-between">
            <span className="text-muted small">Table:</span>
            <span className="fw-semibold small">{order.tableNumber || 'N/A'}</span>
          </div>
          <div className="d-flex justify-content-between">
            <span className="text-muted small">Total:</span>
            <span className="fw-bold text-success">₹{order.subtotal || 0}</span>
          </div>
        </div>

        {order.items && order.items.length > 0 && (
          <div className="mb-2">
            <small className="text-muted">Items:</small>
            <div className="mt-1">
              {order.items.slice(0, 2).map((item, idx) => (
                <div key={idx} className="small text-truncate">
                  {item.itemName} (x{item.quantity})
                </div>
              ))}
              {order.items.length > 2 && (
                <small className="text-muted">+{order.items.length - 2} more items</small>
              )}
            </div>
          </div>
        )}

        <div className="d-flex gap-2 mt-3">
          <CButton
            color="primary"
            size="sm"
            className="flex-fill"
            onClick={() => setSelectedOrder(order)}
          >
            View Details
          </CButton>
        </div>
      </CCardBody>
    </CCard>
  )

  // Style based on status
  const getStatusStyle = (status) => ({
    padding: '2px 10px',
    borderRadius: '15px',
    color: 'white',
    textAlign: 'center',
    backgroundColor:
      status === 'completed' ? '#4CAF50' : status === 'cancelled' ? '#F44336' : '#FFC107',
  })

  const columns = [
    {
      field: 'orderId',
      headerName: 'Order #',
      flex: 0.8,
      minWidth: 130,
      headerClassName: 'header-style',
    },
    {
      field: 'items',
      headerName: 'Items',
      flex: 1.5,
      minWidth: 200,
      headerClassName: 'header-style',
      valueGetter: (params) =>
        params.row.items?.length
          ? params.row.items.map((item) => `${item.itemName} (×${item.quantity})`).join(', ')
          : 'N/A',
    },
    {
      field: 'customerName',
      headerName: 'Customer',
      flex: 0.8,
      minWidth: 120,
      headerClassName: 'header-style',
      valueGetter: (params) => params.row.customerName || 'Walk-in',
    },
    {
      field: 'tableNumber',
      headerName: 'Table',
      flex: 0.4,
      minWidth: 80,
      headerClassName: 'header-style',
      renderCell: (params) => <span>#{params.value || 'N/A'}</span>,
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.6,
      minWidth: 110,
      headerClassName: 'header-style',
      renderCell: (params) => (
        <div style={getStatusStyle(params.value)}>
          {params.value.charAt(0).toUpperCase() + params.value.slice(1)}
        </div>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Date & Time',
      flex: 1,
      minWidth: 160,
      headerClassName: 'header-style',
      valueGetter: (params) => format(new Date(params.row.createdAt), 'dd MMM yyyy, HH:mm'),
    },
    {
      field: 'subtotal',
      headerName: 'Total',
      flex: 0.5,
      minWidth: 100,
      headerClassName: 'header-style',
      renderCell: (params) => <span className="fw-bold text-success">₹{params.row.subtotal || 0}</span>,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.6,
      minWidth: 120,
      headerClassName: 'header-style',
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <CButton
          color="primary"
          size="sm"
          onClick={() => setSelectedOrder(params.row)}
        >
          View
        </CButton>
      ),
    },
  ]

  // Replace your DataGrid component with this:



  return (
    <div style={{ paddingLeft: '20px', paddingRight: '20px' }}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .mobile-orders-container {
            padding: 0;
          }
          
          @media (max-width: 768px) {
            .mobile-orders-container .card {
              margin-bottom: 1rem;
              border-radius: 12px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            
            .mobile-orders-container .card-body {
              padding: 1rem;
            }
            
            .filter-section {
              margin-bottom: 1rem;
            }
            
            .filter-section .card-body {
              padding: 1rem;
            }
            
            .filter-section .row {
              margin: 0;
            }
            
            .filter-section .col {
              padding: 0.25rem;
            }
            
            .filter-section .form-label {
              font-size: 0.875rem;
              font-weight: 600;
              margin-bottom: 0.25rem;
            }
            
            .filter-section .form-control,
            .filter-section .form-select {
              font-size: 0.875rem;
              padding: 0.5rem;
            }
            
            .filter-section .btn {
              font-size: 0.875rem;
              padding: 0.5rem 1rem;
            }
          }
          
          @media (max-width: 576px) {
            .mobile-orders-container .card-body {
              padding: 0.75rem;
            }
            
            .mobile-orders-container .fw-bold {
              font-size: 0.9rem;
            }
            
            .mobile-orders-container .small {
              font-size: 0.75rem;
            }
            
            .mobile-orders-container .btn {
              font-size: 0.8rem;
              padding: 0.4rem 0.8rem;
            }
          }
        `}
      </style>
      <div className="text-center mb-4">
        <h2 className="mb-0">Orders</h2>
      </div>


      {/* Filter Section */}
      <CCard className="mb-4 shadow-sm filter-section">
        <CCardHeader>
          <h5 className="mb-0">Filters & Search</h5>
        </CCardHeader>
        <CCardBody>
          <CRow className="g-3">
            <CCol xs={12} sm={6} md={3}>
              <div className="mb-3">
                <CFormLabel>Search</CFormLabel>
                <CFormInput
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CCol>
            <CCol xs={12} sm={6} md={2}>
              <div className="mb-3">
                <CFormLabel>Status</CFormLabel>
                <CFormSelect
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Complete</option>
                  <option value="reject">Rejected</option>
                </CFormSelect>
              </div>
            </CCol>
            <CCol xs={12} sm={6} md={2}>
              <div className="mb-3">
                <CFormLabel>Date Range</CFormLabel>
                <CFormSelect
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="thisWeek">This Week</option>
                  <option value="thisMonth">This Month</option>
                </CFormSelect>
              </div>
            </CCol>
            <CCol xs={12} sm={6} md={2}>
              <div className="mb-3">
                <CFormLabel>Sort By</CFormLabel>
                <CFormSelect
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="createdAt">Date</option>
                  <option value="orderId">Order ID</option>
                  <option value="customerName">Customer</option>
                  <option value="subtotal">Total Amount</option>
                </CFormSelect>
              </div>
            </CCol>
            <CCol xs={12} sm={6} md={2}>
              <div className="mb-3">
                <CFormLabel>Order</CFormLabel>
                <CFormSelect
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </CFormSelect>
              </div>
            </CCol>
            <CCol xs={12} md={1} className="d-flex align-items-end">
              <CButton
                color="secondary"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setDateFilter('all')
                  setSortBy('createdAt')
                  setSortOrder('desc')
                }}
                className="w-100"
              >
                Clear
              </CButton>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <CSpinner color="primary" variant="grow" />
        </div>
      ) : (
        <>
          {isMobile ? (
            // Mobile Card View
            <div className="mobile-orders-container">
              {filteredAndSortedOrders?.length === 0 ? (
                <CCard>
                  <CCardBody className="text-center py-5">
                    <div className="text-muted">
                      <i className="cil-shopping-cart" style={{ fontSize: '3rem' }}></i>
                      <p className="mt-3 mb-0">No orders found</p>
                      <small>Try adjusting your filters</small>
                    </div>
                  </CCardBody>
                </CCard>
              ) : (
                filteredAndSortedOrders?.map((order, index) => (
                  <OrderCard key={order.id || order._id || index} order={order} index={index} />
                ))
              )}
            </div>
          ) : (
            // Desktop Table View
            <div style={{ overflowX: 'auto', width: '100%', minWidth: '800px', display: 'flex', flexDirection: 'column' }}>
              <DataGrid
                style={{ height: 'auto', width: '100%', minHeight: '400px', backgroundColor: 'white', flex: 1 }}
                autoHeight
                rows={filteredAndSortedOrders?.map((order, index) => ({
                  ...order,
                  sno: index + 1,
                })) || []}
                getRowId={(row) => row.id || row.data?.id || Math.random()}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10]}
                slots={{ Toolbar: CustomToolbar }}
                sx={{
                  '& .header-style': {
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    whiteSpace: 'nowrap',
                    overflow: 'visible',
                    textOverflow: 'unset',
                  },
                  '& .MuiDataGrid-columnHeaderTitle': {
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    whiteSpace: 'nowrap',
                    overflow: 'visible',
                    textOverflow: 'unset',
                  },
                  '& .MuiDataGrid-columnHeader': {
                    padding: '8px 16px',
                    minHeight: '56px !important',
                  },
                  '& .MuiDataGrid-cell': {
                    padding: '8px 16px',
                    fontSize: '0.9rem',
                  },
                  '@media (max-width: 600px)': {
                    '& .MuiDataGrid-columnHeaderTitle': {
                      fontSize: '0.9rem',
                    },
                    '& .MuiDataGrid-cell': {
                      fontSize: '0.8rem',
                    },
                  },
                }}
              />
            </div>
          )}
        </>
      )}

      {/* KOT Modal */}
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
            onClick={handleKOTPrint}
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

      {/* Invoice Modal */}
      <InvoiceModal isVisible={showInvoiceModal} onClose={() => setShowInvoiceModal(false)}>
        <div style={{ textAlign: 'center' }}>
          <h3>Invoice Preview</h3>
          {console.log('Invoice Modal - invoiceImage:', invoiceImage)}
          {console.log('Invoice Modal - showInvoiceModal:', showInvoiceModal)}
          {invoiceImage ? (
            <div>
              <img
                src={invoiceImage}
                alt="Invoice Preview"
                style={{
                  width: '100%',
                  marginBottom: '10px',
                  maxWidth: '400px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                onLoad={() => console.log('Invoice image loaded successfully')}
                onError={(e) => {
                  console.error('Invoice image failed to load:', e)
                  toast.error('Failed to load invoice image', { autoClose: 3000 })
                }}
              />
              <p style={{ fontSize: '12px', color: '#666', margin: '5px 0' }}>
                Invoice generated successfully
              </p>
            </div>
          ) : (
            <div style={{ padding: '20px', color: '#666', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>📄</div>
              <p>Generating invoice...</p>
              <p style={{ fontSize: '12px' }}>Invoice Image State: {invoiceImage ? 'Available' : 'Not Available'}</p>
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid #f3f3f3',
                borderTop: '2px solid #3498db',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '10px auto'
              }}></div>
            </div>
          )}
          <button
            onClick={handleInvoicePrint}
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
      </InvoiceModal>

      {invoiceContent && (
        <CModal visible={showBill} onClose={() => setShowBill(false)}>
          <CModalHeader>Invoice Preview</CModalHeader>
          <CModalBody>
            <iframe
              src={pdfDoc?.output('datauristring')}
              style={{ width: '100%', height: '400px', border: 'none' }}
              title="Invoice Preview"
            ></iframe>
            <div className="mt-3 d-flex justify-content-between">
              <CButton color="primary" onClick={handleDownload}>
                Download
              </CButton>
              <CButton color="secondary" onClick={handlePrint}>
                Print
              </CButton>
            </div>
          </CModalBody>
        </CModal>
      )}


      {selectedOrder && (
        <div
          className="custom-scrollbar"
          style={{
            position: 'fixed',
            top: '0',
            right: '0',
            height: '100vh',
            width: isMobile ? '100%' : isTablet ? '60%' : '450px',
            background: 'white',
            boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)',
            zIndex: 1050,
            overflowY: 'auto',
            transition: 'transform 0.3s ease',
          }}
        >
          {/* Sidebar Header */}
          <div
            style={{
              position: 'sticky',
              top: 0,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '1.5rem',
              zIndex: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h5 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>
                Order #{selectedOrder.orderId}
              </h5>
              <button
                onClick={closeSidebar}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: 'white',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.3)'
                  e.target.style.transform = 'rotate(90deg)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)'
                  e.target.style.transform = 'rotate(0deg)'
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Sidebar Content */}
          <div style={{ padding: '1.5rem' }}>
            {/* Order Information Section */}
            <div
              style={{
                background: '#f9fafb',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.25rem',
              }}
            >
              <h6 style={{ fontWeight: '700', color: '#1f2937', marginBottom: '1rem', fontSize: '1rem' }}>
                📋 Order Information
              </h6>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>
                  <span style={{ color: '#6b7280', fontWeight: '500', fontSize: '0.875rem' }}>Order Number</span>
                  <span style={{ color: '#1f2937', fontWeight: '600', fontSize: '0.9375rem' }}>{selectedOrder.orderId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>
                  <span style={{ color: '#6b7280', fontWeight: '500', fontSize: '0.875rem' }}>Status</span>
                  <div style={getStatusStyle(selectedOrder.status)}>
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', fontWeight: '500', fontSize: '0.875rem' }}>Date & Time</span>
                  <span style={{ color: '#1f2937', fontWeight: '600', fontSize: '0.9375rem', textAlign: 'right' }}>
                    {format(new Date(selectedOrder.createdAt), 'dd MMM yyyy, HH:mm')}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Details Section */}
            <div
              style={{
                background: '#f9fafb',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.25rem',
              }}
            >
              <h6 style={{ fontWeight: '700', color: '#1f2937', marginBottom: '1rem', fontSize: '1rem' }}>
                👤 Customer Details
              </h6>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>
                  <span style={{ color: '#6b7280', fontWeight: '500', fontSize: '0.875rem' }}>Name</span>
                  <span style={{ color: '#1f2937', fontWeight: '600', fontSize: '0.9375rem' }}>
                    {selectedOrder.customerName || 'Walk-in'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>
                  <span style={{ color: '#6b7280', fontWeight: '500', fontSize: '0.875rem' }}>Addres</span>
                  <span style={{ color: '#1f2937', fontWeight: '600', fontSize: '0.9375rem' }}>
                    {selectedOrder.customerAddress || 'Walk-in'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>
                  <span style={{ color: '#6b7280', fontWeight: '500', fontSize: '0.875rem' }}>Table Number</span>
                  <span style={{ color: '#1f2937', fontWeight: '600', fontSize: '0.9375rem' }}>
                    #{selectedOrder.tableNumber || 'N/A'}
                  </span>
                </div>
                {(selectedOrder.customerAddress || selectedOrder.customerId?.address) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280', fontWeight: '500', fontSize: '0.875rem' }}>Address</span>
                    <span style={{ color: '#1f2937', fontWeight: '600', fontSize: '0.9375rem', textAlign: 'right', maxWidth: '60%' }}>
                      {selectedOrder.customerAddress || selectedOrder.customerId?.address}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items Section */}
            <div
              style={{
                background: '#f9fafb',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.25rem',
              }}
            >
              <h6 style={{ fontWeight: '700', color: '#1f2937', marginBottom: '1rem', fontSize: '1rem' }}>
                🍽️ Order Items
              </h6>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {selectedOrder.items?.map((item, index) => (
                  <li
                    key={index}
                    style={{
                      background: 'white',
                      padding: '0.75rem',
                      marginBottom: '0.5rem',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>
                        {item.itemName}
                      </div>
                      <small style={{ color: '#6b7280' }}>Qty: {item.quantity}</small>
                    </div>
                    <span style={{ fontWeight: '700', color: '#10b981', fontSize: '1rem' }}>
                      ₹{item.subtotal}
                    </span>
                  </li>
                )) || selectedOrder.order_details?.map((item, index) => (
                  <li
                    key={index}
                    style={{
                      background: 'white',
                      padding: '0.75rem',
                      marginBottom: '0.5rem',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>
                        {item.item_name}
                      </div>
                      <small style={{ color: '#6b7280' }}>Qty: {item.quantity}</small>
                    </div>
                    <span style={{ fontWeight: '700', color: '#10b981', fontSize: '1rem' }}>
                      ₹{item.price * item.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Order Total Section */}
            <div
              style={{
                background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
              }}
            >
              <h6 style={{ fontWeight: '700', color: '#1f2937', marginBottom: '1rem', fontSize: '1rem' }}>
                💰 Order Summary
              </h6>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Subtotal */}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>
                  <span style={{ color: '#6b7280', fontWeight: '500', fontSize: '0.875rem' }}>Subtotal</span>
                  <span style={{ color: '#1f2937', fontWeight: '600', fontSize: '0.9375rem' }}>
                    ₹{selectedOrder.subtotal || selectedOrder.totalAmount || 0}
                  </span>
                </div>

                {/* Discount */}
                {(selectedOrder.discountAmount > 0 || selectedOrder.discount > 0 || selectedOrder.discountPercentage > 0) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                      <span style={{ color: '#6b7280', fontWeight: '500', fontSize: '0.875rem' }}>
                        Discount
                        {selectedOrder.discountPercentage > 0 && (
                          <span style={{ color: '#10b981', marginLeft: '0.25rem' }}>
                            ({selectedOrder.discountPercentage}%)
                          </span>
                        )}
                        {selectedOrder.discountType && (
                          <span style={{ color: '#6b7280', marginLeft: '0.25rem', fontSize: '0.75rem' }}>
                            ({selectedOrder.discountType === 'bogo' ? 'BOGO' : selectedOrder.discountType === 'percentage' ? 'Percentage' : 'Fixed'})
                          </span>
                        )}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: '#10b981', fontWeight: '600', fontSize: '0.9375rem' }}>
                        -₹{selectedOrder.discountAmount || selectedOrder.discount || 0}
                      </span>
                      <button
                        onClick={handleRemoveDiscount}
                        disabled={isUpdatingStatus || selectedOrder.status === 'completed'}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: isUpdatingStatus || selectedOrder.status === 'completed' ? 'not-allowed' : 'pointer',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          opacity: isUpdatingStatus || selectedOrder.status === 'completed' ? 0.5 : 1,
                        }}
                        title="Remove Discount"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                {/* Tax */}
                {(selectedOrder.taxAmount > 0 || selectedOrder.tax > 0 || selectedOrder.taxPercentage > 0) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ color: '#6b7280', fontWeight: '500', fontSize: '0.875rem' }}>
                      Tax
                      {selectedOrder.taxPercentage > 0 && (
                        <span style={{ color: '#6b7280', marginLeft: '0.25rem' }}>
                          ({selectedOrder.taxPercentage}%)
                        </span>
                      )}
                    </span>
                    <span style={{ color: '#1f2937', fontWeight: '600', fontSize: '0.9375rem' }}>
                      ₹{selectedOrder.taxAmount || selectedOrder.tax || 0}
                    </span>
                  </div>
                )}

                {/* System Charge */}
                {selectedOrder.systemCharge > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ color: '#6b7280', fontWeight: '500', fontSize: '0.875rem' }}>System Charge</span>
                    <span style={{ color: '#1f2937', fontWeight: '600', fontSize: '0.9375rem' }}>
                      ₹{selectedOrder.systemCharge}
                    </span>
                  </div>
                )}

                {/* Round Off */}
                {selectedOrder.roundOff && selectedOrder.roundOff !== 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ color: '#6b7280', fontWeight: '500', fontSize: '0.875rem' }}>Round Off</span>
                    <span style={{ color: '#1f2937', fontWeight: '600', fontSize: '0.9375rem' }}>
                      {selectedOrder.roundOff > 0 ? '+' : ''}₹{Math.abs(selectedOrder.roundOff)}
                    </span>
                  </div>
                )}

                {/* Total Amount */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '2px solid #e5e7eb' }}>
                  <span style={{ fontSize: '1.125rem', fontWeight: '700', color: '#1f2937' }}>
                    Total Amount
                  </span>
                  <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
                    ₹{(() => {
                      // Total Amount = Subtotal + Tax + System Charge + Round Off (discount के बिना)
                      const subtotal = Number(selectedOrder.subtotal || selectedOrder.totalAmount || 0);
                      const taxAmount = Number(selectedOrder.taxAmount || selectedOrder.tax || 0);
                      const systemCharge = Number(selectedOrder.systemCharge || 0);
                      const roundOff = Number(selectedOrder.roundOff || 0);
                      const total = subtotal + taxAmount + systemCharge + roundOff;
                      return Math.max(0, total).toFixed(2);
                    })()}
                  </span>
                </div>
              </div>
            </div>

            {/* Discount and Tax Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
              <CButton
                color="warning"
                variant="outline"
                onClick={() => setShowDiscountModal(true)}
                disabled={isUpdatingStatus || selectedOrder.status === 'completed'}
                style={{ borderRadius: '8px', fontWeight: '600', padding: '0.75rem' }}
              >
                💰 Discount
              </CButton>

              <CButton
                color="info"
                variant="outline"
                onClick={() => setShowTaxModal(true)}
                disabled={isUpdatingStatus || selectedOrder.status === 'completed'}
                style={{ borderRadius: '8px', fontWeight: '600', padding: '0.75rem' }}
              >
                📊 Tax
              </CButton>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
              <CButton
                color="success"
                onClick={() => setShowPaymentModal(true)}
                disabled={isUpdatingStatus || selectedOrder.status === 'completed'}
                style={{ borderRadius: '8px', fontWeight: '600', padding: '0.75rem' }}
              >
                {isUpdatingStatus ? <CSpinner size="sm" /> : '✓ Complete'}
              </CButton>

              <CButton
                color="danger"
                onClick={() => handleStatusChange(selectedOrder._id || selectedOrder.order_id, 'cancelled')}
                disabled={isUpdatingStatus || selectedOrder.status === 'cancelled'}
                style={{ borderRadius: '8px', fontWeight: '600', padding: '0.75rem' }}
              >
                {isUpdatingStatus ? <CSpinner size="sm" /> : '✗ Reject'}
              </CButton>

              <CButton
                color="primary"
                variant="outline"
                onClick={() => generateKOT(selectedOrder)}
                style={{ borderRadius: '8px', fontWeight: '600', padding: '0.75rem' }}
              >
                📄 Generate KOT
              </CButton>

              <CButton
                color="info"
                variant="outline"
                onClick={() => generateBill(selectedOrder)}
                style={{ borderRadius: '8px', fontWeight: '600', padding: '0.75rem' }}
              >
                🧾 Generate Bill
              </CButton>
            </div>
          </div>
        </div>
      )}

      {/* Add custom scrollbar styling - place this in your <style> tag */}
      <style>
        {`
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 10px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 10px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #555;
    }
  `}
      </style>

      {/* Payment Modal - Place outside sidebar */}
      <FocusTrap active={showPaymentModal}>
        <PaymentModal
          showPaymentModal={showPaymentModal}
          setShowPaymentModal={setShowPaymentModal}
          paymentType={paymentType}
          setPaymentType={setPaymentType}
          splitPercentages={splitPercentages}
          setSplitPercentages={setSplitPercentages}
          handlePaymentSubmit={handlePaymentSubmit}
          totalAmount={selectedOrder?.subtotal || selectedOrder?.totalAmount || 0}
          orderId={selectedOrder?._id || selectedOrder?.order_id}
        />
      </FocusTrap>

      {/* Discount Modal */}
      <FocusTrap active={showDiscountModal}>
        <DiscountModal
          showDiscountModal={showDiscountModal}
          setShowDiscountModal={setShowDiscountModal}
          cart={selectedOrder?.items?.map(item => ({
            id: item._id || item.itemId || item.id,
            itemName: item.itemName || item.item_name,
            price: item.price || item.adjustedPrice || 0,
            quantity: item.quantity || 1,
            adjustedPrice: item.price || item.adjustedPrice || 0,
            subtotal: item.subtotal || (item.price * item.quantity) || 0,
          })) || []}
          selectedCustomer={selectedOrder?.customerId ? {
            _id: selectedOrder.customerId._id || selectedOrder.customerId,
            earnedPoints: selectedOrder.customerId?.earnedPoints || 0,
            rewardCustomerPoints: selectedOrder.customerId?.rewardCustomerPoints || 0,
            rewardByAdminPoints: selectedOrder.customerId?.rewardByAdminPoints || 0,
          } : null}
          handleDiscountSubmit={handleDiscountSubmit}
        />
      </FocusTrap>

      {/* Tax Modal */}
      <FocusTrap active={showTaxModal}>
        <TaxModal
          showTaxModal={showTaxModal}
          setShowTaxModal={setShowTaxModal}
          cart={selectedOrder?.items?.map(item => ({
            id: item._id || item.itemId || item.id,
            itemName: item.itemName || item.item_name,
            price: item.price || item.adjustedPrice || 0,
            quantity: item.quantity || 1,
            adjustedPrice: item.price || item.adjustedPrice || 0,
            subtotal: item.subtotal || (item.price * item.quantity) || 0,
          })) || []}
          handleTaxSubmit={handleTaxSubmit}
        />
      </FocusTrap>


      {/* Hidden KOT and Invoice components for generation */}
      {selectedOrder && (
        <>
          <div style={{
            position: 'absolute',
            left: '-9999px',
            top: '-9999px',
            visibility: 'hidden',
            width: '2in',
            maxWidth: '2in'
          }}>
            <KOT
              ref={kotRef}
              tableNumber={selectedOrder.tableNumber || selectedOrder.table_number || 'N/A'}
              cart={selectedOrder.items?.map(item => ({
                id: item._id || item.id || item.itemId,
                itemName: item.itemName || item.item_name,
                price: item.price || (item.subtotal / (item.quantity || 1)),
                adjustedPrice: item.price || (item.subtotal / (item.quantity || 1)),
                quantity: item.quantity || 1,
                subtotal: item.subtotal || (item.price * (item.quantity || 1)),
                taxAmount: item.taxAmount || 0,
                notes: item.notes || ''
              })) || selectedOrder.order_details?.map(item => ({
                id: item._id || item.id,
                itemName: item.item_name,
                price: item.price,
                adjustedPrice: item.price,
                quantity: item.quantity,
                subtotal: item.price * item.quantity,
                taxAmount: item.taxAmount || 0,
                notes: item.notes || ''
              })) || []}
              subtotal={selectedOrder.subtotal}
              discountAmount={selectedOrder.discountAmount || selectedOrder.discount || 0}
              discountPercentage={selectedOrder.discountPercentage || 0}
              taxAmount={selectedOrder.taxAmount || selectedOrder.tax || 0}
              taxPercentage={selectedOrder.taxPercentage || 0}
              systemCharge={selectedOrder.systemCharge || 0}
              roundOff={selectedOrder.roundOff || 0}
            />
          </div>

          <div style={{
            position: 'absolute',
            left: '-9999px',
            top: '-9999px',
            visibility: 'hidden',
            width: '2in',
            maxWidth: '2in'
          }}>
            <Invoice
              ref={invoiceRef}
              tableNumber={selectedOrder.tableNumber || selectedOrder.table_number || 'N/A'}
              selectedCustomerName={selectedOrder.customerName || selectedOrder.user?.name || 'Walk-in Customer'}
              cart={selectedOrder.items?.map(item => ({
                id: item._id || item.id || item.itemId,
                itemName: item.itemName || item.item_name,
                price: item.price || item.subtotal,
                quantity: item.quantity,
                notes: item.notes || ''
              })) || selectedOrder.order_details?.map(item => ({
                id: item._id || item.id,
                itemName: item.item_name,
                price: item.price,
                quantity: item.quantity,
                notes: item.notes || ''
              })) || []}
              calculateSubtotal={() => selectedOrder.subtotal || 0}
              tax={selectedOrder.taxPercentage || 0}
              calculateTaxAmount={() => selectedOrder.taxAmount || 0}
              discount={selectedOrder.discountPercentage || 0}
              calculateDiscountAmount={() => selectedOrder.discountAmount || 0}
              calculateTotal={() => selectedOrder.totalAmount || selectedOrder.subtotal || 0}
            />
          </div>
        </>
      )}
    </div>
  )
}

export default Order
