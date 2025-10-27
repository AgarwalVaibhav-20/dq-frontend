import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import { BASE_URL } from "../../utils/constants";

// Helper function for headers
const configureHeaders = (token, isFormData = false) => ({
    headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
    },
});

// ✅ Fetch all shortcuts for a restaurant
export const fetchShortcuts = createAsyncThunk(
    "shortcuts/fetchShortcuts",
    async (_, { rejectWithValue }) => {
        try {
            const restaurantId = localStorage.getItem('restaurantId');
            const token = localStorage.getItem("authToken");

            const response = await axios.get(
                `${BASE_URL}/all/keys`,
                {
                    params: restaurantId ? { restaurantId } : {},
                    ...configureHeaders(token)
                }
            );

            console.log("fetch shortcuts", response.data);
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to fetch shortcuts"
            );
        }
    }
);

// ✅ Create a new shortcut
export const createShortcut = createAsyncThunk(
    "shortcuts/createShortcut",
    async (shortcutData, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("authToken");
            const headers = {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            };

            const response = await axios.post(
                `${BASE_URL}/create/shortcutkey`,
                shortcutData,
                { headers }
            );

            return response.data;
        } catch (error) {
            console.log(error, "error creating shortcut");
            return rejectWithValue(
                error.response?.data?.message || "Failed to create shortcut"
            );
        }
    }
);

// ✅ Update a shortcut
export const updateShortcut = createAsyncThunk(
    "shortcuts/updateShortcut",
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("authToken");
            const headers = {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            };

            const response = await axios.put(
                `${BASE_URL}/keys/updating/${id}`,
                data,
                { headers }
            );

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to update shortcut"
            );
        }
    }
);

// ✅ Delete a shortcut
export const deleteShortcut = createAsyncThunk(
    "shortcuts/deleteShortcut",
    async (id, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("authToken");
            const headers = {
                Authorization: `Bearer ${token}`,
            };

            await axios.delete(`${BASE_URL}/keys/deleting/${id}`, { headers });
            return id;
        } catch (error) {
            console.error(error);
            console.log("error deleting shortcut", error);
            return rejectWithValue(
                error.response?.data?.message || "Failed to delete shortcut"
            );
        }
    }
);

// ------------- Slice -----------------
const keyboardShortcutSlice = createSlice({
    name: "shortcuts",
    initialState: {
        shortcuts: [],
        loading: false,
        error: null
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
    },
    extraReducers: (builder) => {
        // Fetch shortcuts
        builder
            .addCase(fetchShortcuts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchShortcuts.fulfilled, (state, action) => {
                state.loading = false;

                // Extract the array correctly
                if (Array.isArray(action.payload?.data)) {
                    state.shortcuts = action.payload.data;
                } else if (Array.isArray(action.payload)) {
                    state.shortcuts = action.payload;
                } else {
                    state.shortcuts = [];
                }
            })
            .addCase(fetchShortcuts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                toast.error(action.payload);
            });

        // Add shortcut
        builder
            .addCase(createShortcut.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createShortcut.fulfilled, (state, action) => {
                state.loading = false;
                // Use action.payload.data if your API wraps it
                const newShortcut = action.payload.data || action.payload;
                state.shortcuts = [newShortcut, ...state.shortcuts];
            })
            .addCase(createShortcut.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                toast.error(action.payload || "Failed to add shortcut.");
            });

        // Update shortcut
        builder
            .addCase(updateShortcut.pending, (state) => {
                // We don't set loading = true for toggles
                // to make the UI feel faster.
                // state.loading = true; 
                state.error = null;
            })
            .addCase(updateShortcut.fulfilled, (state, action) => {
                state.loading = false;
                 // Use action.payload.data if your API wraps it
                const updatedShortcut = action.payload.data || action.payload;
                const index = state.shortcuts.findIndex((s) => s._id === updatedShortcut._id);
                if (index !== -1) {
                    state.shortcuts[index] = updatedShortcut;
                }
            })
            .addCase(updateShortcut.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                toast.error(action.payload || "Failed to update shortcut.");
            });

        // Delete shortcut
        builder
            .addCase(deleteShortcut.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteShortcut.fulfilled, (state, action) => {
                state.loading = false;
                state.shortcuts = state.shortcuts.filter((s) => s._id !== action.payload);
            })
            .addCase(deleteShortcut.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                toast.error(action.payload || "Failed to delete shortcut.");
            });
    },
});

export const { clearError, setLoading } = keyboardShortcutSlice.actions;
export default keyboardShortcutSlice.reducer;
