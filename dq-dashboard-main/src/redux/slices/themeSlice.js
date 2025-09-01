// src/redux/slices/themeSlice.js
import { createSlice } from '@reduxjs/toolkit';

const themeSlice = createSlice({
  name: 'theme',
  initialState: {
    sidebarShow: true,
    theme: 'light',
  },
  reducers: {
    // Action to update the state
    setTheme: (state, action) => {
      return { ...state, ...action.payload };
    },
  },
});

// Export the actions
export const { setTheme } = themeSlice.actions;

// Export the reducer
export default themeSlice.reducer;
