// redux/slices/sidebarSlice.js
import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  sidebarShow: true, // Sidebar is visible by default
  sidebarUnfoldable: false, // Sidebar is foldable by default
}

const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarShow = !state.sidebarShow
    },
    setSidebarShow: (state, action) => {
      state.sidebarShow = action.payload
    },
    toggleUnfoldable: (state) => {
      state.sidebarUnfoldable = !state.sidebarUnfoldable
    },
  },
})

export const { toggleSidebar, setSidebarShow, toggleUnfoldable } = sidebarSlice.actions
export default sidebarSlice.reducer
