import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

import { BASE_URL } from '../../utils/constants'

export const configureHeaders = (token) => ({
    headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    },
})

export const addFloor = createAsyncThunk(
    "floors/addFloor",
    async ({ id, name }, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("authToken");
            if (!token) {
                throw new Error("No authentication token found");
            }
            
            const res = await axios.post(
                `${BASE_URL}/add/floors/${id}`,   // ✅ id in URL
                { name: name.trim() },           // ✅ only name in body
                configureHeaders(token)
            );

            toast.success("Floor added successfully");
            return res.data.data;
        } catch (err) {
            const errorMessage =
                err.response?.data?.message || "Failed to add floor";
            toast.error(errorMessage);
            return rejectWithValue({
                message: errorMessage,
                status: err.response?.status || 500,
            });
        }
    }
);


// Get Floors for a restaurant
export const getFloors = createAsyncThunk(
    "floors/getFloors",
    async (restaurantId, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("authToken");
            if (!token) {
                throw new Error("No authentication token found");
            }
            
            const res = await axios.get(`${BASE_URL}/get/floors/${restaurantId}`, configureHeaders(token));

            return res.data.data;
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to fetch floors");
            return rejectWithValue(err.response?.data);
        }
    }
);

// Count tables per floor
export const getFloorStats = createAsyncThunk(
    "floors/getFloorStats",
    async (restaurantId, { rejectWithValue }) => {
        try {
            const res = await axios.get(`${BASE_URL}/floors/${restaurantId}/stats`);
            return res.data.data;
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to fetch stats");
            return rejectWithValue(err.response?.data);
        }
    }
);

// ------------------ Slice ------------------
const floorSlice = createSlice({
    name: "floors",
    initialState: {
        floors: [],
        items: [], // Keep this for backward compatibility if needed
        stats: [],
        loading: false,
        error: null,
    },
    reducers: {
        // Add a manual floor (useful for optimistic updates)
        addFloorManually: (state, action) => {
            state.floors.push(action.payload);
        },
        // Clear floors
        clearFloors: (state) => {
            state.floors = [];
            state.items = [];
        }
    },
    extraReducers: (builder) => {
        builder
            // Add Floor
            .addCase(addFloor.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addFloor.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;
                // 🔥 FIX: Add to floors array instead of items
                state.floors.push(action.payload);
                // Also add to items for backward compatibility
                state.items.push(action.payload);
            })
            .addCase(addFloor.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Get Floors
            .addCase(getFloors.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getFloors.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;
                state.floors = action.payload || [];
                state.items = action.payload || []; // Keep both in sync
            })
            .addCase(getFloors.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Get Floor Stats
            .addCase(getFloorStats.pending, (state) => {
                state.loading = true;
            })
            .addCase(getFloorStats.fulfilled, (state, action) => {
                state.loading = false;
                state.stats = action.payload || [];
            })
            .addCase(getFloorStats.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { addFloorManually, clearFloors } = floorSlice.actions;
export default floorSlice.reducer;

// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axios from "axios";
// import { toast } from "react-toastify";

// import { BASE_URL } from '../../utils/constants'

// export const configureHeaders = (token) => ({
//     headers: {
//         Authorization: `Bearer ${token}`,
//         'Content-Type': 'application/json',
//     },
// })
// export const addFloor = createAsyncThunk(
//     "floors/addFloor",
//     async ({ restaurantId, name }, { rejectWithValue }) => {
//         try {
//             const token = localStorage.getItem("authToken");
//             const res = await axios.post(
//                 `${BASE_URL}/add/floors`,
//                 { restaurantId, name: name.trim() }, // Ensure trimmed name
//                 configureHeaders(token)
//             );
//             toast.success("Floor added successfully");
//             return res.data.data;
//         } catch (err) {
//             console.error('API Error:', err.response?.data); // Debug log

//             let errorMessage = "Failed to add floor";

//             if (err.response?.data?.message) {
//                 errorMessage = err.response.data.message;

//                 // Handle specific duplicate key error
//                 if (errorMessage.includes('E11000 duplicate key') ||
//                     errorMessage.includes('already exists')) {
//                     errorMessage = "A floor with this name already exists";
//                 }
//             } else if (err.response?.status === 409) {
//                 errorMessage = "A floor with this name already exists";
//             }

//             toast.error(errorMessage);
//             return rejectWithValue({
//                 message: errorMessage,
//                 status: err.response?.status || 500
//             });
//         }
//     }
// );
// // export const addFloor = createAsyncThunk(
// //     "floors/addFloor",
// //     async ({ restaurantId, name }, { rejectWithValue }) => {
// //         try {
// //             const token = localStorage.getItem("authToken");
// //             const res = await axios.post(`${BASE_URL}/add/floors`, { restaurantId, name }, configureHeaders(token));
// //             toast.success("Floor added successfully");
// //             return res.data.data;
// //         } catch (err) {
// //             console.error('API Error:', err.response?.data); // Debug log
// //             toast.error(err.response?.data?.message || "Failed to add floor");
// //             return rejectWithValue(err.response?.data);
// //         }
// //     }
// // );

// // Get Floors for a restaurant
// export const getFloors = createAsyncThunk(
//     "floors/getFloors",
//     async (restaurantId, { rejectWithValue }) => {
//         try {
//             const res = await axios.get(`${BASE_URL}/get/floors/${restaurantId}`);
//             return res.data.data;
//         } catch (err) {
//             console.log("API Error:", err.response?.data); // Debug log
//             toast.error(err.response?.data?.message || "Failed to fetch floors");
//             return rejectWithValue(err.response?.data);
//         }
//     }
// );

// // Count tables per floor
// export const getFloorStats = createAsyncThunk(
//     "floors/getFloorStats",
//     async (restaurantId, { rejectWithValue }) => {
//         try {
//             const res = await axios.get(`${BASE_URL}/floors/${restaurantId}/stats`);
//             return res.data.data;
//         } catch (err) {
//             toast.error(err.response?.data?.message || "Failed to fetch stats");
//             return rejectWithValue(err.response?.data);
//         }
//     }
// );

// // ------------------ Slice ------------------
// const floorSlice = createSlice({
//     name: "floors",
//     initialState: {
//         floors: [],
//         items: [],
//         stats: [],
//         loading: false,
//         error: null,
//     },
//     reducers: {},
//     extraReducers: (builder) => {
//         builder
//             // Add Floor
//             .addCase(addFloor.pending, (state) => {
//                 state.loading = true;
//             })
//             .addCase(addFloor.fulfilled, (state, action) => {
//                 state.loading = false;
//                 state.floors.push(action.payload); // ✅ Push to floors array instead of items
//             })
//             .addCase(addFloor.rejected, (state, action) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })

//             // Get Floors
//             .addCase(getFloors.pending, (state) => {
//                 state.loading = true;
//             })
//             .addCase(getFloors.fulfilled, (state, action) => {
//                 state.loading = false;
//                 state.floors = action.payload; // Make sure this line exists
//             })
//             .addCase(getFloors.rejected, (state, action) => {
//                 state.loading = false;
//                 state.error = action.payload;
//             })

//             // Get Floor Stats
//             .addCase(getFloorStats.fulfilled, (state, action) => {
//                 state.stats = action.payload;
//             });
//     },
// });

// export default floorSlice.reducer;
