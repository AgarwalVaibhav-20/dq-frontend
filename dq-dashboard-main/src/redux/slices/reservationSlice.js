import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import { BASE_URL } from "../../utils/constants";

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    Authorization: `Bearer ${token}`,
  };
};

// Fetch reservations by restaurant ID
export const fetchReservations = createAsyncThunk(
  "reservations/fetchReservations",
  async ({ restaurantId }, { rejectWithValue }) => {
    try {


      const response = await axios.get(
        `${BASE_URL}/reservations/AllByRestaurantId/${restaurantId}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to fetch reservations");
    }
  }
);

// Add a new reservation
export const addReservation = createAsyncThunk(
  "reservations/addReservation",
  async ({ restaurantId, startTime, endTime, customerId, payment, advance, notes, tableNumber }, { rejectWithValue }) => {
    try {

      const response = await axios.post(
        `${BASE_URL}/reservations`,
        { restaurantId, startTime, endTime, customerId, payment, advance, notes, tableNumber },
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to add reservation");
    }
  }
);

// Update a reservation
export const updateReservation = createAsyncThunk(
  "reservations/updateReservation",
  async ({ id, restaurantId, startTime, endTime, customerId, payment, advance, notes, tableNumber }, { rejectWithValue }) => {
    try {

      const response = await axios.put(
        `${BASE_URL}/reservations/${id}`,
        { restaurantId, startTime, endTime, customerId, payment, advance, notes, tableNumber },
        { headers: getAuthHeaders() }
      );
      return response.data.reservation;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update reservation");
    }
  }
);

// Delete a reservation
export const deleteReservation = createAsyncThunk(
  "reservations/deleteReservation",
  async ({ id }, { rejectWithValue }) => {
    try {

      const response = await axios.delete(`${BASE_URL}/reservations/${id}`, { headers: getAuthHeaders() });
      return { id, message: response.data.message };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete reservation");
    }
  }
);

// Slice
const reservationSlice = createSlice({
  name: "reservations",
  initialState: {
    reservations: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    // Fetch reservations
    builder
      .addCase(fetchReservations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReservations.fulfilled, (state, action) => {
        state.loading = false;
        state.reservations = action.payload;
      })
      .addCase(fetchReservations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error("Failed to fetch reservations.");
      });

    // Add reservation
    builder
      .addCase(addReservation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addReservation.fulfilled, (state, action) => {
        state.loading = false;
        state.reservations.push(action.payload.data);
        toast.success("Reservation added successfully!");
      })
      .addCase(addReservation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload || "Failed to add reservation.");
      });

      builder
      .addCase(updateReservation.pending, (state) => {
          state.loading = true;
          state.error = null;
      })
      .addCase(updateReservation.fulfilled, (state, action) => {
          state.loading = false;
  
          const updatedReservation = action.payload;
          const index = state.reservations.findIndex(
              (reservation) => reservation.reservationDetails.id === updatedReservation.id
          );
  
          if (index !== -1) {
              // Update the specific reservation details in the Redux state
              state.reservations[index].reservationDetails = {
                  ...state.reservations[index].reservationDetails,
                  ...updatedReservation,
              };
          }
  
          toast.success("Reservation updated successfully!");
      })
      .addCase(updateReservation.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
          toast.error(action.payload || "Failed to update reservation.");
      });
  

    // Delete reservation
    builder
      .addCase(deleteReservation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteReservation.fulfilled, (state, action) => {
        state.loading = false;
        state.reservations = state.reservations.filter(
          (reservation) => reservation.reservationDetails.id !== action.payload.id
        );
        toast.success("Reservation deleted successfully!");
      })
      .addCase(deleteReservation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload || "Failed to delete reservation.");
      });
  },
});

export default reservationSlice.reducer;
