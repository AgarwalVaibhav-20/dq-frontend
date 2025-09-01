import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { toast } from 'react-toastify'

// Thunk for sending bulk email
export const sendBulkEmail = createAsyncThunk(
  'bulkEmail/send',
  async ({ restaurantId, subject, title, body }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken')
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
      const response = await axios.post('https://rest.dicui.org/api/admin/send-bulk-email', {
        restaurantId,
        subject,
        title,
        body,
      } , { headers })
      console.log(response.data)
      return response.data

    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send bulk email'
      return rejectWithValue(message)
    }
  },
)

const sendBulkEmailSlice = createSlice({
  name: 'bulkEmail',
  initialState: {
    loading: false,
    success: false,
    error: null,
  },
  reducers: {
    resetBulkEmailStatus: (state) => {
      state.loading = false
      state.success = false
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendBulkEmail.pending, (state) => {
        state.loading = true
        state.success = false
        state.error = null
      })
      .addCase(sendBulkEmail.fulfilled, (state) => {
        state.loading = false
        state.success = true
        toast.success('Bulk email sent successfully!')
      })
      .addCase(sendBulkEmail.rejected, (state, action) => {
        state.loading = false
        state.success = false
        state.error = action.payload
        toast.error(`Error: ${action.payload}`)
      })
  },
})

export const { resetBulkEmailStatus } = sendBulkEmailSlice.actions

export default sendBulkEmailSlice.reducer
