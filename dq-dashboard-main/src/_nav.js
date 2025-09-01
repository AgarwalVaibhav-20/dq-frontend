import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilStar,
  cilRestaurant,
  cilPizza,
  cilMenu,
  cilMoney,
  cilPeople,
  cilQrCode,
  cilLibrary,
  cilWallet,
  cilCommentSquare,
  cilSettings,
  cibDocusign,
  cilNewspaper,
  cibIndeed,
  cibMessenger,
  cilImage,
} from '@coreui/icons'
import { CNavGroup, CNavItem} from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Overview',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'POS',
    to: '/pos',
    icon: <CIcon icon={cilMoney} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Category',
    to: '/category',
    icon: <CIcon icon={cilMenu} customClassName="nav-icon"/>,
  },
  //  adding subcategory
  {
    component: CNavItem,
    name: 'SubCategory',
    to: '/subCategory',
    icon: <CIcon icon={cilMenu} customClassName="nav-icon"/>,
  },
  {
    component: CNavItem,
    name: 'Menu',
    to: '/menu',
    icon: <CIcon icon={cilPizza} customClassName="nav-icon"/>,
  },
  {
    component: CNavItem,
    name: 'Orders',
    to: '/orders',
    icon: <CIcon icon={cilRestaurant} customClassName="nav-icon"/>,
  },
  {
    component: CNavItem,
    name: 'Delivery',
    to: '/delivery',
    icon: <CIcon icon={cilRestaurant} customClassName="nav-icon"/>,
  },
  {
    component: CNavItem,
    name: 'Delivery Timing',
    to: '/delivery-timing',
    icon: <CIcon icon={cilRestaurant} customClassName="nav-icon"/>,
  },
  {
    component: CNavItem,
    name: 'Transactions',
    to: '/transactions',
    icon: <CIcon icon={cilWallet} customClassName="nav-icon"/>,
  },
  {
    component: CNavItem,
    name: 'Customers',
    to: '/customers',
    icon: <CIcon icon={cilPeople} customClassName="nav-icon"/>,
  },
  {
    component: CNavItem,
    name: 'QR Code',
    to: '/qr-code',
    icon: <CIcon icon={cilQrCode} customClassName="nav-icon"/>,
  },
  {
    component: CNavItem,
    name: 'Reservations',
    to: '/reservations',
    icon: <CIcon icon={cilQrCode} customClassName="nav-icon"/>,
  },
  {
    component: CNavItem,
    name: 'Dues',
    to: '/dues',
    icon: <CIcon icon={cilMoney} customClassName="nav-icon"/>,
  },
  {
    component: CNavItem,
    name: 'Feedbacks',
    to: '/feedback',
    icon: <CIcon icon={cibMessenger} customClassName="nav-icon"/>,
  },
  {
    component: CNavItem,
    name: 'Banners',
    to: '/banners',
    icon: <CIcon icon={cilImage} customClassName="nav-icon"/>,
  },


  {
    component: CNavGroup,
    name: 'Inventory',
    icon: <CIcon icon={cilLibrary} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Notifications',
        to: '/notifications',
      },
      {
        component: CNavItem,
        name: 'Account',
        to: '/account',
      },
      {
        component: CNavItem,
        name: 'Settings',
        to: '/settings',
      },
      {
        component: CNavItem,
        name: 'Supplier',
        to: '/supplier',
      },
      {
        component: CNavItem,
        name: 'Stock',
        to: '/stock',
      },
    ],
  },
  {
    component: CNavGroup,
    name: 'Reports',
    icon: <CIcon icon={cilCommentSquare} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Daily Report',
        to: '/daily-report',
      },
      {
        component: CNavItem,
        name: 'Payment Report',
        to: '/payment-report',
      },
      {
        component: CNavItem,
        name: 'Customer Report',
        to: '/customer-report',
      },
      {
        component: CNavItem,
        name: 'Table Report',
        to: '/table-report',
      },
      {
        component: CNavItem,
        name: 'Payment Type Report',
        to: '/payment-type-report',
      },
      {
        component: CNavItem,
        name: 'Dahsboard Statistics Report',
        to: '/dashboard-statistics-report',
      },
      {
        component: CNavItem,
        name: 'Tax Collection Report',
        to: '/tax-collection-report',
      },
      {
        component: CNavItem,
        name: 'Transaction By Date Report',
        to: '/transactionByDate-report',
      },
      {
        component: CNavItem,
        name: 'Table Usage Report',
        to: '/table-usage-report',
      },
      {
        component: CNavItem,
        name: 'Discount Usage Report',
        to: '/discount-usage-report',
      },
      {
        component: CNavItem,
        name: 'Average Order Report',
        to: '/average-order-report',
      },
      {
        component: CNavItem,
        name: 'Payment Type Transaction Report',
        to: '/payment-type-transaction-report',
      },
      {
        component: CNavItem,
        name: 'Total Revenue Report',
        to: '/total-revenue-report',
      },
      // {
      //   component: CNavItem,
      //   name: 'Most Ordered Dishes',
      //   to: '/most-ordered-dishes-report',
      // },
      {
        component: CNavItem,
        name: 'Yearly Chart Report',
        to: '/yearly-chart-report',
      },
      {
        component: CNavItem,
        name: 'Weekly Chart Report',
        to: '/weekly-chart-report',
      },
    
    ],
  },
  {
    component: CNavItem,
    name: 'Help',
    to: '/help',
    icon: <CIcon icon={cibIndeed} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Settings',
    to: '/account',
    icon: <CIcon icon={cilSettings} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Downloads',
    to: '/downloads',
    icon: <CIcon icon={cibDocusign} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'License',
    to: '/license',
    icon: <CIcon icon={cilNewspaper} customClassName="nav-icon" />,
  },
]

export default _nav
