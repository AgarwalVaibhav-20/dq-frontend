// Extract all actions from GlobalShortcutListener's executeAction function
export const AVAILABLE_SHORTCUTS = [
  // --- MAIN NAVIGATION ---
  {
    category: 'Main Navigation',
    action: 'Go to Dashboard',
    route: '/dashboard',
    suggestedKeys: ['Ctrl', 'Shift', 'D'],
    description: 'Navigate to Dashboard page'
  },
  {
    category: 'Main Navigation',
    action: 'Go to Orders',
    route: '/orders',
    suggestedKeys: ['Ctrl', 'Shift', 'O'],
    description: 'Navigate to Orders page'
  },
  {
    category: 'Main Navigation',
    action: 'Go to Delivery',
    route: '/delivery',
    suggestedKeys: ['Ctrl', 'Shift', 'L'],
    description: 'Navigate to Delivery page'
  },
  {
    category: 'Main Navigation',
    action: 'Go to Restaurants',
    route: '/restaurants',
    suggestedKeys: ['Ctrl', 'Shift', 'R'],
    description: 'Navigate to Restaurants page'
  },
  {
    category: 'Main Navigation',
    action: 'Go to Suppliers',
    route: '/supplier',
    suggestedKeys: ['Ctrl', 'Shift', 'U'],
    description: 'Navigate to Suppliers page'
  },
  {
    category: 'Main Navigation',
    action: 'Go to Permissions (Waiter)',
    route: '/permission',
    suggestedKeys: ['Ctrl', 'Shift', 'W'],
    description: 'Navigate to Waiter Permissions page'
  },
  {
    category: 'Main Navigation',
    action: 'Go to Login Activity',
    route: '/login-activity',
    suggestedKeys: ['Ctrl', 'Shift', 'A'],
    description: 'Navigate to Login Activity page'
  },
  {
    category: 'Main Navigation',
    action: 'Go to POS',
    route: '/pos',
    suggestedKeys: ['Ctrl', 'Shift', 'P'],
    description: 'Navigate to POS page'
  },
  {
    category: 'Main Navigation',
    action: 'Go to Settings',
    route: '/setting',
    suggestedKeys: ['Ctrl', 'Shift', 'S'],
    description: 'Navigate to Settings page'
  },

  // --- ANALYTICS & REPORTS ---
  {
    category: 'Analytics & Reports',
    action: 'Go to Purchase Analytics',
    route: '/purchaseanalytics',
    suggestedKeys: ['Ctrl', 'Alt', 'P'],
    description: 'View purchase analytics'
  },
  {
    category: 'Analytics & Reports',
    action: 'Go to Sales Analytics',
    route: '/salesanalytics',
    suggestedKeys: ['Ctrl', 'Alt', 'S'],
    description: 'View sales analytics'
  },
  {
    category: 'Analytics & Reports',
    action: 'Go to Daily Report',
    route: '/daily-report',
    suggestedKeys: ['Ctrl', 'Alt', 'D'],
    description: 'View daily report'
  },
  {
    category: 'Analytics & Reports',
    action: 'Go to Payment Report',
    route: '/payment-report',
    suggestedKeys: ['Ctrl', 'Alt', 'Y'],
    description: 'View payment report'
  },
  {
    category: 'Analytics & Reports',
    action: 'Go to Customer Report',
    route: '/customer-report',
    suggestedKeys: ['Ctrl', 'Alt', 'C'],
    description: 'View customer report'
  },
  {
    category: 'Analytics & Reports',
    action: 'Go to Table Report',
    route: '/table-report',
    suggestedKeys: ['Ctrl', 'Alt', 'T'],
    description: 'View table report'
  },
  {
    category: 'Analytics & Reports',
    action: 'Go to Payment Type Report',
    route: '/payment-type-report',
    suggestedKeys: ['Ctrl', 'Alt', 'M'],
    description: 'View payment type report'
  },
  {
    category: 'Analytics & Reports',
    action: 'Go to Dashboard Statistics Report',
    route: '/dashboard-statistics-report',
    suggestedKeys: ['Ctrl', 'Alt', 'H'],
    description: 'View dashboard statistics'
  },
  {
    category: 'Analytics & Reports',
    action: 'Go to Due Report',
    route: '/due-report',
    suggestedKeys: ['Ctrl', 'Alt', 'U'],
    description: 'View due report'
  },
  {
    category: 'Analytics & Reports',
    action: 'Go to Transaction by Date Report',
    route: '/transactionByDate-report',
    suggestedKeys: ['Ctrl', 'Alt', 'N'],
    description: 'View transaction by date report'
  },
  {
    category: 'Analytics & Reports',
    action: 'Go to Tax Collection Report',
    route: '/tax-collection-report',
    suggestedKeys: ['Ctrl', 'Alt', 'X'],
    description: 'View tax collection report'
  },
  {
    category: 'Analytics & Reports',
    action: 'Go to Table Usage Report',
    route: '/table-usage-report',
    suggestedKeys: ['Ctrl', 'Alt', 'B'],
    description: 'View table usage report'
  },
  {
    category: 'Analytics & Reports',
    action: 'Go to Discount Usage Report',
    route: '/discount-usage-report',
    suggestedKeys: ['Ctrl', 'Alt', 'I'],
    description: 'View discount usage report'
  },
  {
    category: 'Analytics & Reports',
    action: 'Go to Average Order Report',
    route: '/average-order-report',
    suggestedKeys: ['Ctrl', 'Alt', 'A'],
    description: 'View average order report'
  },
  // {
  //   category: 'Analytics & Reports',
  //   action: 'Go to Payment Type Transaction Report',
  //   route: '/payment-type-transaction-report',
  //   suggestedKeys: ['Ctrl', 'Alt', 'R'],
  //   description: 'View payment type transaction report'
  // },
  {
    category: 'Analytics & Reports',
    action: 'Go to Total Revenue Report',
    route: '/total-revenue-report',
    suggestedKeys: ['Ctrl', 'Alt', 'V'],
    description: 'View total revenue report'
  },
  {
    category: 'Analytics & Reports',
    action: 'Go to Yearly Chart Report',
    route: '/yearly-chart-report',
    suggestedKeys: ['Ctrl', 'Alt', 'E'],
    description: 'View yearly chart report'
  },
  {
    category: 'Analytics & Reports',
    action: 'Go to Weekly Chart Report',
    route: '/weekly-chart-report',
    suggestedKeys: ['Ctrl', 'Alt', 'W'],
    description: 'View weekly chart report'
  },

  // --- MENU & STOCK ---
  {
    category: 'Menu & Stock',
    action: 'Go to Categories',
    route: '/category',
    suggestedKeys: ['Ctrl', 'M', 'C'],
    description: 'Navigate to Categories page'
  },
  {
    category: 'Menu & Stock',
    action: 'Go to SubCategories',
    route: '/subCategory',
    suggestedKeys: ['Ctrl', 'M', 'S'],
    description: 'Navigate to SubCategories page'
  },
  {
    category: 'Menu & Stock',
    action: 'Go to Stock',
    route: '/stock',
    suggestedKeys: ['Ctrl', 'M', 'K'],
    description: 'Navigate to Stock page'
  },
  {
    category: 'Menu & Stock',
    action: 'Go to Menu',
    route: '/menu',
    suggestedKeys: ['Ctrl', 'M', 'M'],
    description: 'Navigate to Menu page'
  },
  {
    category: 'Menu & Stock',
    action: 'Go to Waste',
    route: '/waste',
    suggestedKeys: ['Ctrl', 'M', 'W'],
    description: 'Navigate to Waste page'
  },

  // --- CUSTOMER & LOYALTY ---
  {
    category: 'Customer & Loyalty',
    action: 'Go to Customers',
    route: '/customers',
    suggestedKeys: ['Ctrl', 'C', 'C'],
    description: 'Navigate to Customers page'
  },
  {
    category: 'Customer & Loyalty',
    action: 'Go to Customer Loyalty',
    route: '/customerloyality',
    suggestedKeys: ['Ctrl', 'C', 'L'],
    description: 'Navigate to Customer Loyalty page'
  },
  {
    category: 'Customer & Loyalty',
    action: 'Go to Transactions',
    route: '/transactions',
    suggestedKeys: ['Ctrl', 'C', 'T'],
    description: 'Navigate to Transactions page'
  },
  {
    category: 'Customer & Loyalty',
    action: 'Go to Feedback',
    route: '/feedback',
    suggestedKeys: ['Ctrl', 'C', 'F'],
    description: 'Navigate to Feedback page'
  },
  {
    category: 'Customer & Loyalty',
    action: 'Go to Reservations',
    route: '/reservations',
    suggestedKeys: ['Ctrl', 'C', 'R'],
    description: 'Navigate to Reservations page'
  },
  {
    category: 'Customer & Loyalty',
    action: 'Go to Dues',
    route: '/dues',
    suggestedKeys: ['Ctrl', 'C', 'D'],
    description: 'Navigate to Dues page'
  },

  // --- MISC & OTHER ---
  {
    category: 'Miscellaneous',
    action: 'Go to Delivery Timing',
    route: '/delivery-timing',
    suggestedKeys: ['Ctrl', 'X', 'D'],
    description: 'Navigate to Delivery Timing page'
  },
  {
    category: 'Miscellaneous',
    action: 'Go to QR Code',
    route: '/qr-code',
    suggestedKeys: ['Ctrl', 'X', 'Q'],
    description: 'Navigate to QR Code page'
  },
  {
    category: 'Miscellaneous',
    action: 'Go to Banners',
    route: '/banners',
    suggestedKeys: ['Ctrl', 'X', 'B'],
    description: 'Navigate to Banners page'
  },
  {
    category: 'Miscellaneous',
    action: 'Go to Help',
    route: '/help',
    suggestedKeys: ['Ctrl', 'X', 'H'],
    description: 'Navigate to Help page'
  },
  {
    category: 'Miscellaneous',
    action: 'Go to License',
    route: '/license',
    suggestedKeys: ['Ctrl', 'X', 'L'],
    description: 'Navigate to License page'
  },
  {
    category: 'Miscellaneous',
    action: 'Go to Downloads',
    route: '/downloads',
    suggestedKeys: ['Ctrl', 'X', 'W'],
    description: 'Navigate to Downloads page'
  },

  // --- FUNCTIONAL ACTIONS ---
  // {
  //   category: 'Actions',
  //   action: 'New Sale',
  //   route: null,
  //   suggestedKeys: ['Ctrl', 'N'],
  //   description: 'Open new sale modal'
  // },
  // {
  //   category: 'Actions',
  //   action: 'Focus Search Bar',
  //   route: null,
  //   suggestedKeys: ['Ctrl', 'K'],
  //   description: 'Focus on global search bar'
  // }
];

// Group shortcuts by category
export const getShortcutsByCategory = () => {
  return AVAILABLE_SHORTCUTS.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {});
};

// Get all unique categories
export const getCategories = () => {
  return [...new Set(AVAILABLE_SHORTCUTS.map(s => s.category))];
};