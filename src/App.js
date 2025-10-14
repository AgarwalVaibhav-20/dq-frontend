import React, { Suspense, useEffect, useState, useRef, useMemo } from 'react'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { CSpinner, useColorModes } from '@coreui/react'
import { useDispatch, useSelector, shallowEqual } from 'react-redux'
import { onMessage, isSupported } from 'firebase/messaging'
//import { messaging } from './firebase'
import { toast } from 'react-toastify'
import { useParams } from "react-router-dom";
import './scss/style.scss'
import './scss/examples.scss'
import PrivateRoute from './components/PrivateRoute'
import SessionGuard from './components/SessionGuard'
import PermissionGuard from './components/PermissionGuard'
import PermissionDebug from './components/PermissionDebug'

// Permission mapping helper - Updated to match exact permission names from the list
const getPermissionForRoute = (routePath) => {
  const permissionMap = {
    'orders': 'Orders',
    'pos': 'POS',
    'dashboard': 'Overview',
    'delivery': 'Delivery',
    'customer-menu': 'Customer Menu',
    'restaurants': 'Restaurants',
    'purchaseanalytics': 'Purchase Analytics',
    'delivery-timing': 'Delivery Timing',
    'supplier': 'Inventory',
    'permission': 'Permission',
    'customerloyality': 'Customer Loyality',
    'salesanalytics': 'Sales Analytics',
    'qr-code': 'QR Code',
    'category': 'Category',
    'subCategory': 'SubCategory',
    'stock': 'Inventory',
    'menu': 'Menu',
    'banners': 'Banners',
    'customers': 'Customers',
    'transactions': 'Transactions',
    'account': 'Settings',
    'daily-report': 'Reports',
    'payment-report': 'Reports',
    'customer-report': 'Reports',
    'table-report': 'Reports',
    'payment-type-report': 'Reports',
    'dashboard-statistics-report': 'Reports',
    'due-report': 'Reports',
    'transactionByDate-report': 'Reports',
    'tax-collection-report': 'Reports',
    'table-usage-report': 'Reports',
    'discount-usage-report': 'Reports',
    'average-order-report': 'Reports',
    'payment-type-transaction-report': 'Reports',
    'total-revenue-report': 'Reports',
    'yearly-chart-report': 'Reports',
    'weekly-chart-report': 'Reports',
    'feedback': 'Feedbacks',
    'reservations': 'Reservations',
    'dues': 'Dues',
    'help': 'Help',
    'license': 'License',
    'downloads': 'Downloads'
  };

  return permissionMap[routePath] || null;
};
import './global.css'
import Reservation from './views/reservations/Reservation'
import Dues from './views/dues/Dues'
import Help from './views/help/Help'
import License from './views/license/License'
import Downloads from './views/downloads/Downloads'
// import PurchaseAnalytics from  './views/purchaseanalytics/PurchaseAnalytics.js'
// import CustomerLoyality from './views/customer loyality/CustomerLoylity.js'
import Delivery from './views/delivery/Delivery'
import { checkRestaurantPermission, debugProfile, forceLoadProfile } from './redux/slices/restaurantProfileSlice'
import { fetchUserProfile, syncLocalStorage } from './redux/slices/authSlice'
import store from './redux/store'

import TableRedirect from './views/tableredirect/TableRedirect.js'
import CustomerMenu from './views/customer-menu/CustomerMenu.js'
import DeliveryTiming from './views/deliveryTiming/DeliveryTiming'
import notificationSound from './assets/notification.mp3'
import WooOrders from './views/delivery/WooOrders'
import CustomerReport from './views/reports/CustomerReport'
import TableReport from './views/reports/TableReport'
import Banner from './views/banners/Banner'
import { fetchOrders } from './redux/slices/orderSlice'
import PaymentTypeReport from './views/reports/PaymentTypeReport'
import DashboardStatisticsReport from './views/reports/DashboardStatisticsReport'
import TransactionCountReport from './views/reports/TransactionCountReport'
import TaxCollectedReport from './views/reports/TaxCollectedReport'
import DueReport from './views/reports/DueRepoert.js'
import TableUsageReport from './views/reports/TableUsageReport'
import DiscountUsageReport from './views/reports/DiscountUsageReport'
import AverageOrderValueReport from './views/reports/AverageOrderValueReport'
import TransactionsByPaymentTypeReport from './views/reports/TransactionsByPaymentTypeReport'
import TotalRevenueReport from './views/reports/TotalRevenueReport'
import MostOrderedDishesReport from './views/reports/MostOrderedDishesReport'
import YearlyChartReport from './views/reports/YearlyChartReport'
import WeeklyChartReport from './views/reports/WeeklyChartReport'

// Lazy Loading for pages
const Waste = React.lazy(() => import('./views/waste/Waste.js'))
const SubCategory = React.lazy(() => import('./views/subCategory/SubCategory'))
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))
const Login = React.lazy(() => import('./views/pages/login/Login'))
const Register = React.lazy(() => import('./views/pages/register/Register'))
const ResetPassword = React.lazy(() => import('./views/pages/resetpassword/ResetPassword'))
const CheckOtp = React.lazy(() => import('./views/pages/CheckOtp/CheckOtp.js'))
const ForgotPassword = React.lazy(() => import('./views/pages/forgotPassword/ForgotPassword'))
const Otp = React.lazy(() => import('./views/pages/otp/Otp'))
const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
const Orders = React.lazy(() => import('./views/orders/Orders'))
const SalesAnalytics = React.lazy(() => import('./views/salesanalytics/SalesAnalytics.js'))
const Waiter = React.lazy(() => import('./views/Permssion/Permission.js'))
const LoginActivity = React.lazy(() => import('./views/LoginActivity/LoginActivity.js'))
const PurchaseAnalytics = React.lazy(() => import('./views/purchaseanalytics/PurchaseAnalytics.js'))
const CustomerLoyality = React.lazy(() => import('./views/customer loyality/CustomerLoylity.js'))
const Restaurants = React.lazy(() => import('./views/restaurant/Restaurant.js'))
const Supplier = React.lazy(() => import('./views/inventory/supplier/Supplier'))
const QRCode = React.lazy(() => import('./views/qrCode/QRCode'))
const Category = React.lazy(() => import('./views/category/Category'))
const Stock = React.lazy(() => import('./views/inventory/stock/Stock'))
const Menu = React.lazy(() => import('./views/menu/Menu'))
const Customers = React.lazy(() => import('./views/customers/Customers'))
const Transactions = React.lazy(() => import('./views/transactions/Transactions'))
const POS = React.lazy(() => import('./views/pos/POS'))
const POSTableContent = React.lazy(() => import('./views/pos/POSTableContent'))
const Account = React.lazy(() => import('./views/account/Account'))
const Settings = React.lazy(() => import('./views/settings/Settings'))
const SystemSelection = React.lazy(() => import('./views/pos/SystemSelection'))
const DailyReport = React.lazy(() => import('./views/reports/DailyReport'))
const PaymentReport = React.lazy(() => import('./views/reports/PaymentReport'))
const Feedback = React.lazy(() => import('./views/feedbacks/Feedback'))
const Page404 = React.lazy(() => import('./views/pages/page404/Page404'))


const App = () => {
  const dispatch = useDispatch()
  const userId = localStorage.getItem('userId')
  // Get userId and token from localStorage (more reliable than useParams in this context)
  // const userId = localStorage.getItem('userId')
  const token = localStorage.getItem('authToken')

  // Make store and actions available in browser console for debugging
  React.useEffect(() => {
    window.store = store
    window.debugProfile = function () {
      try {
        const state = store.getState()
        // console.log('=== PROFILE DEBUG INFO ===')
        // console.log('Current profile state:', state.restaurantProfile.restaurantProfile)
        // console.log('localStorage profile:', localStorage.getItem('restaurantProfile'))
        // console.log('Profile state keys:', state.restaurantProfile.restaurantProfile ? Object.keys(state.restaurantProfile.restaurantProfile) : 'No profile')
        // console.log('localStorage keys:', localStorage.getItem('restaurantProfile') ? Object.keys(JSON.parse(localStorage.getItem('restaurantProfile'))) : 'No localStorage data')
        // console.log('========================')
        return 'Debug completed - check console logs'
      } catch (error) {
        console.error('Debug error:', error)
        return 'Debug failed - check console for error'
      }
    }
    window.forceLoadProfile = function () {
      try {
        store.dispatch(forceLoadProfile())
        // console.log('Profile loaded from localStorage')
        return 'Profile loaded successfully'
      } catch (error) {
        console.error('Force load error:', error)
        return 'Force load failed - check console for error'
      }
    }
    window.checkLocalStorage = function () {
      try {
        const profile = localStorage.getItem('restaurantProfile')
        // console.log('=== LOCALSTORAGE CHECK ===')
        // console.log('Raw localStorage data:', profile)
        if (profile) {
          const parsed = JSON.parse(profile)
          // console.log('Parsed profile data:', parsed)
          // console.log('Profile keys:', Object.keys(parsed))
        } else {
          // console.log('No profile data in localStorage')
        }
        // console.log('========================')
        return profile ? 'Profile found in localStorage' : 'No profile in localStorage'
      } catch (error) {
        // console.error('localStorage check error:', error)
        return 'localStorage check failed'
      }
    }
    // console.log('Debug functions available: window.debugProfile(), window.forceLoadProfile(), window.checkLocalStorage()')
  }, [])

  const { restaurantPermission } = useSelector((state) => ({
    restaurantPermission: state.restaurantProfile.restaurantPermission,
  }))

  const { role, user } = useSelector((state) => ({
    role: state.auth.role,
    user: state.auth.user
  }))

  // Debug logging
  console.log('🔍 App.js Debug:', {
    role,
    user,
    userPermissions: user?.permissions
  })

  const { restaurantId } = useSelector(
    (state) => ({
      restaurantId: state.auth.restaurantId,
    }),
    shallowEqual,
  )

  const audioRef = useRef(null)
  const [previousOrderCount, setPreviousOrderCount] = useState(0)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [permissionCheckAttempted, setPermissionCheckAttempted] = useState(false)
  const { orders, loading } = useSelector((state) => state.orders)

  const audioPlayer = useMemo(() => {
    return <audio ref={audioRef} src={notificationSound} preload="auto" />
  }, [])

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch((e) => {
        // console.log('Play prevented:', e)
      })
      toast.success('New order received!')
    }
  }

  // ✅ Fixed: Fetch orders with restaurantId
  useEffect(() => {
    if (restaurantId && window.location.pathname !== '/customer-menu') {
      dispatch(fetchOrders({ restaurantId }))
      const intervalId = setInterval(() => {
        dispatch(fetchOrders({ restaurantId }))
      }, 30000)

      return () => clearInterval(intervalId)
    }
  }, [dispatch, restaurantId])

  useEffect(() => {
    if (!loading && orders.length > 0) {
      if (isInitialLoad) {
        setPreviousOrderCount(orders.length)
        setIsInitialLoad(false)
      } else if (orders.length > previousOrderCount) {
        playNotificationSound()
        setPreviousOrderCount(orders.length)
      } else if (orders.length < previousOrderCount) {
        setPreviousOrderCount(orders.length)
      }
    }
  }, [orders, loading, previousOrderCount, isInitialLoad])

  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')

  // ✅ Fixed: Check permissions with userId and token
  useEffect(() => {
    if (userId && token && !permissionCheckAttempted && window.location.pathname !== '/customer-menu') {
      console.log('Checking permissions for userId:', userId)
      // Fetch user profile to get permissions
      dispatch(fetchUserProfile({ userId, token }))
        .then((result) => {
          // console.log('Permission check result:', result)
          setPermissionCheckAttempted(true)
        })
        .catch((error) => {
          // console.error('User profile fetch failed:', error)
          setPermissionCheckAttempted(true)
        })
    }
    //  else if (!userId || !token) {
    //   console.log('Missing userId or token for permission check')
    //   console.log('UserId:', userId ? 'Present' : 'Missing')
    //   console.log('Token:', token ? 'Present' : 'Missing')
    // }
  }, [dispatch, userId, token, permissionCheckAttempted])

  // ✅ Also check permissions when restaurantId changes (if needed)
  useEffect(() => {
    if (restaurantId && userId && token && permissionCheckAttempted && window.location.pathname !== '/customer-menu') {
      // Only re-check if restaurantId changes after initial check
      // console.log('Restaurant ID changed, re-checking permissions')
      dispatch(fetchUserProfile({ userId, token }))
    }
  }, [dispatch, restaurantId, userId, token, permissionCheckAttempted])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split('?')[1])
    const theme = urlParams.get('theme') && urlParams.get('theme').match(/^[A-Za-z0-9\s]+/)[0]
    if (theme) {
      setColorMode(theme)
    }

    if (!isColorModeSet()) {
      setColorMode('light')
    }
  }, [])

  useEffect(() => {
    const sessionStarted = localStorage.getItem('sessionStarted') === 'true';
    dispatch({ type: 'auth/setSessionStarted', payload: sessionStarted });

    // Sync localStorage with Redux state on app initialization
    dispatch(syncLocalStorage());
  }, [dispatch]);

  // ✅ Better loading state handling
  const isPermissionLoaded = restaurantPermission !== undefined || permissionCheckAttempted

  // ✅ Add debug logging
  // useEffect(() => {
  //   console.log('App State Debug:')
  //   console.log('- UserId:', userId)
  //   console.log('- Token:', token ? 'Present' : 'Missing')
  //   console.log('- RestaurantId:', restaurantId)
  //   console.log('- RestaurantPermission:', restaurantPermission)
  //   console.log('- Permission Check Attempted:', permissionCheckAttempted)
  //   console.log('- Is Permission Loaded:', isPermissionLoaded)
  // }, [userId, token, restaurantId, restaurantPermission, permissionCheckAttempted, isPermissionLoaded])

  return (
    <>
      {audioPlayer}
      <BrowserRouter>
        <Suspense
          fallback={
            <div className="pt-3 text-center">
              <CSpinner color="primary" variant="grow" />
              <div className="mt-2">Loading application...</div>
            </div>
          }
        >
          {/* ✅ Show loading while checking permissions */}
          {!isPermissionLoaded ? (
            <div className="pt-3 text-center" style={{ marginTop: '200px' }}>
              <CSpinner color="primary" variant="grow" />
              <div className="mt-2">Checking permissions...</div>
            </div>
          ) : (
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/otp" element={<Otp />} />
              <Route path="/forgotpassword" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path='/check-otp' element={<CheckOtp />} />
              <Route path='/customer-menu' element={<CustomerMenu />} />
              <Route path="table" element={<TableRedirect />} />

              {/* Private Routes */}
              <Route
                path="/*"
                element={
                  <PrivateRoute>
                    <SessionGuard>
                      <DefaultLayout />
                    </SessionGuard>
                  </PrivateRoute>
                }
              >
                {/* Nested Authenticated Routes */}
                {role === 'admin' ? (
                  // Admin के लिए सभी routes allowed हैं
                  <>
                    <Route index element={<LoginActivity />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="orders" element={<Orders />} />
                    <Route
                      path="delivery"
                      element={<WooOrders />}
                    />
                    {/* <Route path='customer-menu' element={<CustomerMenu />} /> */}
                    <Route path="restaurants" element={<Restaurants />} />
                    <Route path="purchaseanalytics" element={<PurchaseAnalytics />} />
                    <Route path="delivery-timing" element={<DeliveryTiming />} />
                    <Route path="supplier" element={<Supplier />} />
                    <Route path="permission" element={<Waiter />} />
                    <Route path="login-activity" element={<LoginActivity />} />

                    <Route path="customerloyality" element={<CustomerLoyality />} />
                    <Route path="salesanalytics" element={<SalesAnalytics />} />
                    <Route path="qr-code" element={<QRCode />} />
                    <Route path="category" element={<Category restaurantId={restaurantId} />} />
                    <Route path="subCategory" element={<SubCategory restaurantId={restaurantId} />} />
                    <Route path="stock" element={<Stock />} />
                    <Route path="menu" element={<Menu />} />
                    <Route path="banners" element={<Banner />} />
                    <Route path="customers" element={<Customers />} />
                    <Route path="transactions" element={<Transactions />} />
                    <Route path="pos" element={<POS />} />
                    <Route path="pos/system/:tableNumber" element={<SystemSelection />} />
                    {/* <Route path="table" element={<TableRedirect />} /> */}
                    <Route path="pos/system/tableNumber/:tableNumber" element={<POSTableContent />} />
                    <Route path="pos/tableNumber/:tableNumber" element={<POSTableContent />} />
                    <Route path="account/:userId" element={<Account />} />
                    <Route path="setting" element={<Settings />} />
                    <Route path="daily-report" element={<DailyReport />} />
                    <Route path="payment-report" element={<PaymentReport />} />
                    <Route path="customer-report" element={<CustomerReport />} />
                    <Route path="table-report" element={<TableReport />} />
                    <Route path="payment-type-report" element={<PaymentTypeReport />} />
                    <Route path="dashboard-statistics-report" element={<DashboardStatisticsReport />} />
                    <Route path="due-report" element={<DueReport />} />
                    <Route path="transactionByDate-report" element={<TransactionCountReport />} />
                    <Route path="tax-collection-report" element={<TaxCollectedReport />} />
                    <Route path="table-usage-report" element={<TableUsageReport />} />
                    <Route path="discount-usage-report" element={<DiscountUsageReport />} />
                    <Route path="average-order-report" element={<AverageOrderValueReport />} />
                    <Route path="payment-type-transaction-report" element={<TransactionsByPaymentTypeReport />} />
                    <Route path="total-revenue-report" element={<TotalRevenueReport />} />
                    <Route path="yearly-chart-report" element={<YearlyChartReport />} />
                    <Route path="weekly-chart-report" element={<WeeklyChartReport />} />
                    <Route path="feedback" element={<Feedback />} />
                    <Route path="reservations" element={<Reservation />} />
                    <Route path="dues" element={<Dues />} />
                    <Route path="help" element={<Help />} />
                    <Route path="license" element={<License />} />
                    <Route path="downloads" element={<Downloads />} />
                    <Route path="*" element={<Page404 />} />
                    <Route path="waste" element={<Waste />} />
                  </>
                ) : (
                  // Non-admin users के लिए permission-based routing
                  <>
                    <Route index element={
                      <PermissionGuard requiredPermissions={['Orders']}>
                        <Orders />
                      </PermissionGuard>
                    } />
                    <Route path="orders" element={
                      <PermissionGuard requiredPermissions={['Orders']}>
                        <Orders />
                      </PermissionGuard>
                    } />
                    {/* <Route path="waste" */}
                    <Route path="pos" element={
                      <PermissionGuard requiredPermissions={['POS']}>
                        <POS />
                      </PermissionGuard>
                    } />
                    <Route path="pos/system/:tableNumber" element={
                      <PermissionGuard requiredPermissions={['pos']}>
                        <SystemSelection />
                      </PermissionGuard>
                    } />
                    {/* <Route path="table/:restaurantId/:floorId/:tableNumber" element={
                      <PermissionGuard requiredPermissions={['pos']}>
                        <TableRedirect />
                      </PermissionGuard>
                    } /> */}
                    <Route path="pos/system/tableNumber/:tableNumber" element={
                      <PermissionGuard requiredPermissions={['pos']}>
                        <POSTableContent />
                      </PermissionGuard>
                    } />
                    <Route path="pos/tableNumber/:tableNumber" element={
                      <PermissionGuard requiredPermissions={['pos']}>
                        <POSTableContent />
                      </PermissionGuard>
                    } />

                    {/* Permission-based routes 
                    <Route path="dashboard" element={
                      <PermissionGuard requiredPermissions={['Overview']}>
                        <Dashboard />
                      </PermissionGuard>
                    } />
                    <Route path="delivery" element={
                      <PermissionGuard requiredPermissions={['Delivery']}>
                        <WooOrders />
                      </PermissionGuard>
                    } />
                    <Route path="customer-menu" element={
                      <PermissionGuard requiredPermissions={['Customer Menu']}>
                        <CustomerMenu />
                      </PermissionGuard>
                    } /> */}
                    <Route path="restaurants" element={
                      <PermissionGuard requiredPermissions={['Restaurants']}>
                        <Restaurants />
                      </PermissionGuard>
                    } />
                    <Route path="purchaseanalytics" element={
                      <PermissionGuard requiredPermissions={['Purchase Analytics']}>
                        <PurchaseAnalytics />
                      </PermissionGuard>
                    } />
                    <Route path="delivery-timing" element={
                      <PermissionGuard requiredPermissions={['Delivery Timing']}>
                        <DeliveryTiming />
                      </PermissionGuard>
                    } />
                    <Route path="supplier" element={
                      <PermissionGuard requiredPermissions={['Inventory']}>
                        <Supplier />
                      </PermissionGuard>
                    } />
                    <Route path="permission" element={
                      <PermissionGuard requiredPermissions={['Permission']}>
                        <Waiter />
                      </PermissionGuard>
                    } />
                    <Route path="login-activity" element={<LoginActivity />} />
                    <Route path="customerloyality" element={
                      <PermissionGuard requiredPermissions={['Customer Loyality']}>
                        <CustomerLoyality />
                      </PermissionGuard>
                    } />
                    <Route path="salesanalytics" element={
                      <PermissionGuard requiredPermissions={['Sales Analytics']}>
                        <SalesAnalytics />
                      </PermissionGuard>
                    } />
                    <Route path="qr-code" element={
                      <PermissionGuard requiredPermissions={['QR Code']}>
                        <QRCode />
                      </PermissionGuard>
                    } />
                    <Route path="category" element={
                      <PermissionGuard requiredPermissions={['Category']}>
                        <Category restaurantId={restaurantId} />
                      </PermissionGuard>
                    } />
                    <Route path="subCategory" element={
                      <PermissionGuard requiredPermissions={['SubCategory']}>
                        <SubCategory restaurantId={restaurantId} />
                      </PermissionGuard>
                    } />
                    <Route path="stock" element={
                      <PermissionGuard requiredPermissions={['Inventory']}>
                        <Stock />
                      </PermissionGuard>
                    } />
                    <Route path="menu" element={
                      <PermissionGuard requiredPermissions={['Menu']}>
                        <Menu />
                      </PermissionGuard>
                    } />
                    <Route path="banners" element={
                      <PermissionGuard requiredPermissions={['Banners']}>
                        <Banner />
                      </PermissionGuard>
                    } />
                    <Route path="customers" element={
                      <PermissionGuard requiredPermissions={['Customers']}>
                        <Customers />
                      </PermissionGuard>
                    } />
                    <Route path="transactions" element={
                      <PermissionGuard requiredPermissions={['Transactions']}>
                        <Transactions />
                      </PermissionGuard>
                    } />
                    <Route path="account/:userId" element={<Account />} />
                    <Route path="setting" element={
                      <PermissionGuard requiredPermissions={['Settings']}>
                        <Settings />
                      </PermissionGuard>
                    } />

                    {/* Report routes with permissions */}
                    <Route path="daily-report" element={
                      <PermissionGuard requiredPermissions={['Reports']}>
                        <DailyReport />
                      </PermissionGuard>
                    } />
                    <Route path="payment-report" element={
                      <PermissionGuard requiredPermissions={['Reports']}>
                        <PaymentReport />
                      </PermissionGuard>
                    } />
                    <Route path="customer-report" element={
                      <PermissionGuard requiredPermissions={['Reports']}>
                        <CustomerReport />
                      </PermissionGuard>
                    } />
                    <Route path="table-report" element={
                      <PermissionGuard requiredPermissions={['Reports']}>
                        <TableReport />
                      </PermissionGuard>
                    } />
                    <Route path="payment-type-report" element={
                      <PermissionGuard requiredPermissions={['Reports']}>
                        <PaymentTypeReport />
                      </PermissionGuard>
                    } />
                    <Route path="dashboard-statistics-report" element={
                      <PermissionGuard requiredPermissions={['Reports']}>
                        <DashboardStatisticsReport />
                      </PermissionGuard>
                    } />
                    <Route path="due-report" element={
                      <PermissionGuard requiredPermissions={['Reports']}>
                        <DueReport />
                      </PermissionGuard>
                    } />
                    <Route path="transactionByDate-report" element={
                      <PermissionGuard requiredPermissions={['Reports']}>
                        <TransactionCountReport />
                      </PermissionGuard>
                    } />
                    <Route path="tax-collection-report" element={
                      <PermissionGuard requiredPermissions={['Reports']}>
                        <TaxCollectedReport />
                      </PermissionGuard>
                    } />
                    <Route path="table-usage-report" element={
                      <PermissionGuard requiredPermissions={['Reports']}>
                        <TableUsageReport />
                      </PermissionGuard>
                    } />
                    <Route path="discount-usage-report" element={
                      <PermissionGuard requiredPermissions={['Reports']}>
                        <DiscountUsageReport />
                      </PermissionGuard>
                    } />
                    <Route path="average-order-report" element={
                      <PermissionGuard requiredPermissions={['Reports']}>
                        <AverageOrderValueReport />
                      </PermissionGuard>
                    } />
                    <Route path="payment-type-transaction-report" element={
                      <PermissionGuard requiredPermissions={['Reports']}>
                        <TransactionsByPaymentTypeReport />
                      </PermissionGuard>
                    } />
                    <Route path="total-revenue-report" element={
                      <PermissionGuard requiredPermissions={['Reports']}>
                        <TotalRevenueReport />
                      </PermissionGuard>
                    } />
                    <Route path="yearly-chart-report" element={
                      <PermissionGuard requiredPermissions={['Reports']}>
                        <YearlyChartReport />
                      </PermissionGuard>
                    } />
                    <Route path="weekly-chart-report" element={
                      <PermissionGuard requiredPermissions={['Reports']}>
                        <WeeklyChartReport />
                      </PermissionGuard>
                    } />
                    <Route path="feedback" element={
                      <PermissionGuard requiredPermissions={['Feedbacks']}>
                        <Feedback />
                      </PermissionGuard>
                    } />
                    <Route path="reservations" element={
                      <PermissionGuard requiredPermissions={['Reservations']}>
                        <Reservation />
                      </PermissionGuard>
                    } />
                    <Route path="dues" element={
                      <PermissionGuard requiredPermissions={['Dues']}>
                        <Dues />
                      </PermissionGuard>
                    } />
                    <Route path="help" element={
                      <PermissionGuard requiredPermissions={['Help']}>
                        <Help />
                      </PermissionGuard>
                    } />
                    <Route path="license" element={
                      <PermissionGuard requiredPermissions={['License']}>
                        <License />
                      </PermissionGuard>
                    } />
                    <Route path="downloads" element={
                      <PermissionGuard requiredPermissions={['Downloads']}>
                        <Downloads />
                      </PermissionGuard>
                    } />
                    <Route path="debug-permissions" element={<PermissionDebug />} />
                    <Route path="test-access" element={
                      <div style={{ padding: '20px' }}>
                        <h2>✅ Test Access - This page should be accessible</h2>
                        <p>If you can see this, the routing is working!</p>
                        <p>Current role: {role}</p>
                        <p>User permissions: {JSON.stringify(user?.permissions || [])}</p>
                      </div>
                    } />
                    <Route path="*" element={<Page404 />} />
                  </>
                )}
              </Route>
            </Routes>
          )}
        </Suspense>
      </BrowserRouter>

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  )
}

export default App
