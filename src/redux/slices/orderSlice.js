import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { toast } from 'react-toastify'
import { BASE_URL } from '../../utils/constants'

// Create a new order
export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async ({
    customerId,
    items,
    totalAmount,
    status,
    deliveryId,
    restaurantId,
    userId,
    tableNumber,
    customerName,
    orderType,
    tax,
    discount,
    subtotal,
    orderId,
    kotGenerated,
    paymentStatus }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken')
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }

      const response = await axios.post(`${BASE_URL}/create/order`, {
        customerId,
        items,
        totalAmount,
        status,
        deliveryId,
        restaurantId,
        userId,
        tableNumber,
        customerName,
        orderType,
        tax,
        discount,
        subtotal,
        kotGenerated,
        paymentStatus,
        orderId
      }, { headers })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create order')
    }
  }
)

// Fetch all orders for a restaurant
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken')
      const headers = {
        Authorization: `Bearer ${token}`,
      }

      const response = await axios.get(`${BASE_URL}/all/order`, {
        headers,
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch orders')
    }
  },
)

// Fetch all delivery orders for a restaurant
export const fetchDeliveryOrders = createAsyncThunk(
  'orders/fetchDeliveryOrders',
  async ({ restaurantId, pageNo }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken')
      const headers = {
        Authorization: `Bearer ${token}`,
      }

      const response = await axios.get(
        `${BASE_URL}/getOrderByDelivery?restaurantId=${restaurantId}&page=${pageNo}`,
        {
          headers,
        },
      )
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch orders')
    }
  },
)
export const fetchCombinedOrders = createAsyncThunk(
  'orders/fetchCombinedOrders',
  async ({ tableNumber }, { rejectWithValue }) => {
    try {
      const restaurantId = localStorage.getItem('restaurantId')
      const token = localStorage.getItem('authToken')
      const headers = { Authorization: `Bearer ${token}` }

      const response = await axios.post(
        `${BASE_URL}/orders/active-tables?restaurantId=${restaurantId}`,
        { tableNumber, restaurantId },
        { headers }
      )

      return response.data // { success: true, orders: [...] }
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch combined orders')
    }
  }
);
// Fetch order by ID
export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async ({ id }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken')
      const headers = {
        Authorization: `Bearer ${token}`,
      }

      const response = await axios.get(`${BASE_URL}/orders/${id}`, {
        headers,
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch order details')
    }
  },
)

// Change order status
export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      console.log("Updating order:", id, status);  // 🔍 check here
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.put(`${BASE_URL}/orders/${id}/status`, { status }, { headers });
      return response.data;
    } catch (error) {
      console.error('Error in API:', error.response?.data);
      return rejectWithValue(error.response?.data?.error || 'Failed to change order status');
    }
  },
);


export const updateOrder = createAsyncThunk(
  'orders/updateOrder',
  async ({ id, tableNumber, restaurantId, user_id, orderDetails }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken')
      const headers = {
        Authorization: `Bearer ${token}`,
      }

      const response = await axios.put(
        `${BASE_URL}/orders/${id}`,
        {
          tableNumber,
          restaurantId,
          user_id,
          orderDetails,
        },
        { headers },
      )
      return response.data
    } catch (error) {
      console.error('Error in API:', error.response?.data)
      return rejectWithValue(error.response?.data?.error || 'Failed to update order')
    }
  },
)

// Fetch orders with notification status 0 for a restaurant
export const fetchNotificationOrders = createAsyncThunk(
  'orders/fetchNotificationOrders',
  async ({ restaurantId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken')
      const headers = {
        Authorization: `Bearer ${token}`,
      }

      const response = await axios.get(`${BASE_URL}/orders/notification/${restaurantId}`, {
        headers,
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch notification orders')
    }
  },
)

// Update order notification status
export const updateOrderNotificationStatus = createAsyncThunk(
  'orders/updateOrderNotificationStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken')
      const headers = {
        Authorization: `Bearer ${token}`,
      }

      const response = await axios.put(
        `${BASE_URL}/orders/status/notification/${id}`,
        { status },
        { headers },
      )
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update notification status')
    }
  },
)

// Delete an order by ID
export const deleteOrder = createAsyncThunk(
  'orders/deleteOrder',
  async ({ id }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken')
      const headers = {
        Authorization: `Bearer ${token}`,
      }

      const response = await axios.delete(`${BASE_URL}/orders/${id}`, { headers })
      return { id, message: response.data.message }
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete order')
    }
  },
)

// Slice
const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    orders: [],
    deliveryOrders: [],
    combinedOrders: [],
    deliveryOrdersLoading: false,
    orderDetails: null,
    notificationOrders: [],
    newOrderCount: 0,
    loading: false,
    notificationLoading: false,
    error: null,
  },
  reducers: {
    resetNewOrderCount: (state) => {
      state.newOrderCount = 0
    },
    clearOrderError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // Create order
    builder
      .addCase(createOrder.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false
        // Add the new order to the beginning of the orders array
        state.orders.unshift(action.payload.data || action.payload.order || action.payload)
        toast.success('Order created successfully!')
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error('Failed to create order.')
      })
      .addCase(fetchCombinedOrders.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCombinedOrders.fulfilled, (state, action) => {
        state.loading = false
        state.combinedOrders = action.payload.orders
      })
      .addCase(fetchCombinedOrders.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // Fetch orders
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false
        state.orders = action.payload.data
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error('Failed to fetch orders.')
      })

    // Fetch notifications
    builder
      .addCase(fetchNotificationOrders.pending, (state) => {
        state.notificationLoading = true
        state.error = null
      })
      .addCase(fetchNotificationOrders.fulfilled, (state, action) => {
        state.notificationLoading = false
        state.notificationOrders = action.payload
      })
      .addCase(fetchNotificationOrders.rejected, (state, action) => {
        state.notificationLoading = false
        state.error = action.payload
        toast.error('Failed to fetch orders.')
      })

    // Fetch delivery orders
    builder
      .addCase(fetchDeliveryOrders.pending, (state) => {
        state.deliveryOrdersLoading = true
        state.error = null
      })
      .addCase(fetchDeliveryOrders.fulfilled, (state, action) => {
        state.deliveryOrdersLoading = false
        state.deliveryOrders = action.payload.data
      })
      .addCase(fetchDeliveryOrders.rejected, (state, action) => {
        state.deliveryOrdersLoading = false
        state.error = action.payload
        toast.error('Failed to fetch orders.')
      })

    // Fetch order by ID
    builder
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false
        state.orderDetails = action.payload.data
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error('Failed to fetch order details.')
      })

    // Change order status
    builder
      .addCase(updateOrderStatus.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false
        const updatedOrder = action.payload.order

        const index = state.orders.findIndex((order) => order.order_id === updatedOrder.id)
        if (index !== -1) {
          state.orders[index] = { ...state.orders[index], status: updatedOrder.status }
        } else {
          console.log('Order not found.')
        }
        toast.success('Order status updated successfully!')
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error('Failed to change order status.')
      })

    // Update order
    builder
      .addCase(updateOrder.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateOrder.fulfilled, (state, action) => {
        state.loading = false
        const updatedOrder = action.payload

        // Find the index of the updated order in the state.orders array
        const index = state.orders.findIndex((order) => order.order_id === updatedOrder.order_id)

        if (index !== -1) {
          // Replace the existing order with the updated order
          state.orders[index] = {
            ...state.orders[index], // Keep existing properties
            ...updatedOrder, // Override with updated properties
          }
        } else {
          console.log('Order not found in the state.')
        }

        toast.success('Order updated successfully!')
      })
      .addCase(updateOrder.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error('Failed to update order.')
      })

    // Update notification status
    builder
      .addCase(updateOrderNotificationStatus.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateOrderNotificationStatus.fulfilled, (state, action) => {
        state.loading = false
        const updatedOrder = action.payload.data
        const index = state.orders.findIndex((order) => order.id === updatedOrder.id)
        if (index !== -1) {
          state.orders[index].notification_status = updatedOrder.notification_status
        }
        toast.success('Notification status updated successfully!')
      })
      .addCase(updateOrderNotificationStatus.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload.data
        toast.error('Failed to update notification status.')
      })

    // Delete order
    builder
      .addCase(deleteOrder.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.loading = false
        state.orders = state.orders.filter((order) => order.id !== action.payload.id)
        toast.success('Order deleted successfully!')
      })
      .addCase(deleteOrder.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error('Failed to delete order.')
      })
  },
})

export const { resetNewOrderCount, clearOrderError } = orderSlice.actions

export default orderSlice.reducer
