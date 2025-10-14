import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import { BASE_URL } from "../../utils/constants";

// ✅ Create new waste material
export const createWasteMaterial = createAsyncThunk(
    "waste/createWasteMaterial",
    async ({ wasteData, token }, { rejectWithValue }) => {
        try {
            const res = await axios.post(`${BASE_URL}/create/waste`, wasteData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.data.success) {
                toast.success(res.data.message || "Waste material added successfully");
                return res.data.waste;
            }

            return rejectWithValue("Failed to add waste material");
        } catch (error) {
            console.log(error, "error in createWasteMaterial");
            const errorMsg = error.response?.data?.message || "Failed to add waste material";
            toast.error(errorMsg);
            return rejectWithValue(errorMsg);
        }
    }
);

// ✅ Fetch all waste materials
export const fetchWasteMaterials = createAsyncThunk(
    "waste/fetchWasteMaterials",
    async ({ restaurantId, token }, { rejectWithValue }) => {
        try {
            const url = restaurantId
                ? `${BASE_URL}/all/wastes?restaurantId=${restaurantId}`
                : `${BASE_URL}/all/wastes`;

            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            return res.data.wastes || [];
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Failed to fetch waste materials";
            toast.error(errorMsg);
            return rejectWithValue(errorMsg);
        }
    }
);

// ✅ Update waste material
export const updateWasteMaterial = createAsyncThunk(
    "waste/updateWasteMaterial",
    async ({ id, updatedData, token }, { rejectWithValue }) => {
        try {
            // Fix: Use correct endpoint format
            const res = await axios.put(`${BASE_URL}/update/${id}`, updatedData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.data.success) {
                toast.success("Waste material updated successfully");
                return res.data.waste;
            }

            return rejectWithValue("Failed to update waste material");
        } catch (error) {
            console.log(error , "error updating")
            const errorMsg = error.response?.data?.message || "Failed to update waste material";
            toast.error(errorMsg);
            return rejectWithValue(errorMsg);
        }
    }
);

// ✅ Delete waste material
export const deleteWasteMaterial = createAsyncThunk(
    "waste/deleteWasteMaterial",
    async ({ id, token }, { rejectWithValue }) => {
        try {
            // Fix: Use correct endpoint format
            const res = await axios.delete(`${BASE_URL}/waste/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.data.success) {
                toast.success("Waste material deleted and stock restored");
                return id;
            }

            return rejectWithValue("Failed to delete waste material");
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Failed to delete waste material";
            toast.error(errorMsg);
            return rejectWithValue(errorMsg);
        }
    }
);

// 🔥 Slice
const wasteMaterialSlice = createSlice({
    name: "wastes",
    initialState: {
        wastes: [],
        loading: false,
        error: null,
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Create
            .addCase(createWasteMaterial.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createWasteMaterial.fulfilled, (state, action) => {
                state.loading = false;
                state.wastes.push(action.payload);
            })
            .addCase(createWasteMaterial.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch
            .addCase(fetchWasteMaterials.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWasteMaterials.fulfilled, (state, action) => {
                state.loading = false;
                state.wastes = action.payload;
            })
            .addCase(fetchWasteMaterials.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Update
            .addCase(updateWasteMaterial.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateWasteMaterial.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.wastes.findIndex((w) => w._id === action.payload._id);
                if (index !== -1) state.wastes[index] = action.payload;
            })
            .addCase(updateWasteMaterial.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Delete
            .addCase(deleteWasteMaterial.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteWasteMaterial.fulfilled, (state, action) => {
                state.loading = false;
                state.wastes = state.wastes.filter((w) => w._id !== action.payload);
            })
            .addCase(deleteWasteMaterial.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearError } = wasteMaterialSlice.actions;
export default wasteMaterialSlice.reducer;