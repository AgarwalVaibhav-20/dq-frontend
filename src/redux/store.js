// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import themeReducer from './slices/themeSlice'
import qrReducer from './slices/qrSlice'
import categoryReducer from './slices/categorySlice'
import supplierReducer from './slices/supplierSlice'
import stockReducer from './slices/stockSlice'
import menuReducer from './slices/menuSlice'
import customerReducer from './slices/customerSlice'
import transactionReducer from './slices/transactionSlice'
import orderReducer from './slices/orderSlice'
import restaurantProfileReducer from './slices/restaurantProfileSlice'
import reportReducer from './slices/reportSlice'
import dashboardReducer from './slices/dashboardSlice'
import feedbackReducer from './slices/feedbackSlice'
import sidebarReducer from './slices/sidebarSlice'
import reservationReducer from './slices/reservationSlice'
import dueReducer from './slices/duesSlice'
import deliveryTimingReducer from './slices/deliveryTimingSlice'
import subCategoryReducer from './slices/subCategorySlice'
import sendBulkEmailReducer from './slices/SendBulkEmailSlice'
import bannerReducer from './slices/bannerSlice'
import couponReducer from "./slices/coupenSlice";
// import restaurantReducer from './slices/restaurantSlice'
import floorSlices from './slices/floorSlices'
import memeberSlice from './slices/memberSlice'
// import floorRedux from './slices/FloorRedux'
import tableReducer from './slices/tableSlice'
import wasteSlice from './slices/wasteSlice';
import spinAndWinReducer from './slices/spinAndWinSlice';
import shortcutsReducer from './slices/keyboardShortcutSlice';
// Configure the Redux store
const store = configureStore({
  reducer: {
    spinAndWin: spinAndWinReducer,
    shortcuts: shortcutsReducer,
    members:memeberSlice,
    floors: floorSlices,
    tables: tableReducer,
    // restaurants: restaurantReducer,
    auth: authReducer,
    theme: themeReducer,
    qr: qrReducer,
    category: categoryReducer,
    suppliers: supplierReducer,
    inventories: stockReducer,
    menuItems: menuReducer,
    customers: customerReducer,
    transactions: transactionReducer,
    orders: orderReducer,
    restaurantProfile: restaurantProfileReducer,
    reports: reportReducer,
    dashboard: dashboardReducer,
    feedbacks: feedbackReducer,
    sidebar: sidebarReducer,
    reservations: reservationReducer,
    dues: dueReducer,
    deliveryTimings: deliveryTimingReducer,
    subCategory: subCategoryReducer,
    bulkEmail: sendBulkEmailReducer,
    banner: bannerReducer,
    coupons: couponReducer, 
    wastes:wasteSlice,
  },
})
// console.log " Store -> ", store)
export default store
