// store/memberSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import { BASE_URL } from "../../utils/constants";


export const fetchMembers = createAsyncThunk(
  "members/fetchMembers",
  async ({ _ }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("authToken");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const response = await axios.get(`${BASE_URL}/all/members`, { headers });
      console.log("fetch member", response.data)

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message
      );
    }
  }
);


export const addMember = createAsyncThunk(
  "members/addMember",
  async (memberData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("authToken");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const response = await axios.post(`${BASE_URL}/add/members`, memberData, {
        headers,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add member"
      );
    }
  }
);

export const updateMember = createAsyncThunk(
  "members/updateMember",
  async ({ id, memberData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("authToken");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const response = await axios.put(
        `${BASE_URL}/update/member/${id}`,
        memberData,
        { headers }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update member"
      );
    }
  }
);

// Delete a member
export const deleteMember = createAsyncThunk(
  "members/deleteMember",
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("authToken");
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      await axios.delete(`${BASE_URL}/delete/member/${id}`, { headers });
      return id;
    } catch (error) {
      console.error(error)
      console.log("error deleting member", error)
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete member"
      );
    }
  }
);

// ------------- Slice -----------------
const memberSlice = createSlice({
  name: "members",
  initialState: { members: [], loading: false, error: null },
  reducers: {
    clearError: (state) => { state.error = null; },
    setLoading: (state, action) => { state.loading = action.payload; },
  },
  extraReducers: (builder) => {
    // Fetch members
    builder
      .addCase(fetchMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.members = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      });

    // Add member
    builder
      .addCase(addMember.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(addMember.fulfilled, (state, action) => { state.loading = false; state.members = [action.payload, ...state.members]; })
      .addCase(addMember.rejected, (state, action) => { state.loading = false; state.error = action.payload; toast.error(action.payload || "Failed to add member."); });

    // Update member
    builder
      .addCase(updateMember.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateMember.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.members.findIndex((m) => m._id === action.payload._id);
        if (index !== -1) state.members[index] = action.payload;
      })
      .addCase(updateMember.rejected, (state, action) => { state.loading = false; state.error = action.payload; toast.error(action.payload || "Failed to update member."); });

    // Delete member
    builder
      .addCase(deleteMember.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteMember.fulfilled, (state, action) => { state.loading = false; state.members = state.members.filter((m) => m._id !== action.payload); })
      .addCase(deleteMember.rejected, (state, action) => { state.loading = false; state.error = action.payload; toast.error(action.payload || "Failed to delete member."); });
  },
});


export const { clearError, setLoading } = memberSlice.actions;
export default memberSlice.reducer;
