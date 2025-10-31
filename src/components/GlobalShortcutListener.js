import { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
// ---
// IMPORT ANY ACTIONS YOU WANT TO TRIGGER
// e.g., import { openNewSaleModal } from './redux/slices/modalSlice'; 
// ---

/**
 * This component renders nothing.
 * It sits at the top level of your app and listens for keyboard shortcuts.
 * Place it inside your main App.js or Layout.js,
 * wrapped by the Redux Provider and Router.
 */
const GlobalShortcutListener = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Get all shortcuts from the Redux store
    const { shortcuts, loading } = useSelector((state) => state.shortcuts);

    const handleKeyDown = useCallback((event) => {
        // 1. Don't fire shortcuts if the user is typing in an input,
        //    textarea, or select box.
        const targetElement = event.target;
        const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(targetElement.tagName);

        if (isTyping) {
            return;
        }

        // 2. Build the string for the keys that were just pressed
        const pressedKeys = [];
        if (event.ctrlKey) pressedKeys.push('Ctrl');
        if (event.shiftKey) pressedKeys.push('Shift');
        if (event.altKey) pressedKeys.push('Alt');
        if (event.metaKey) pressedKeys.push('Meta'); // For Cmd key on Mac

        const key = event.key;
        if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
            // Use toUpperCase() for single letters to match how you save them
            const displayKey = key.length === 1 ? key.toUpperCase() : key;
            if (!pressedKeys.includes(displayKey)) {
                pressedKeys.push(displayKey);
            }
        }

        // Sort the pressed keys and join with '+'
        const pressedKeyString = pressedKeys.sort().join('+');

        if (loading || shortcuts.length === 0 || !pressedKeyString) {
            return;
        }

        // 3. Find a matching shortcut
        for (const shortcut of shortcuts) {
            // ---
            // 4. CHECK IF THE SHORTCUT IS ACTIVE
            // We treat 'undefined' or 'true' as active. Only 'false' is inactive.
            // ---
            if (shortcut.isActive === false) {
                continue; // Skip this shortcut, it's disabled
            }

            // 5. Check all key combinations for this shortcut
            for (const keyCombo of shortcut.keys) {
                // Sort the saved combination and join with '+'
                const savedKeyString = [...keyCombo.combination].sort().join('+');

                // 6. Compare the pressed keys with the saved keys
                if (pressedKeyString === savedKeyString) {
                    // ---
                    // 7. WE FOUND A MATCH!
                    // ---
                    console.log(`Shortcut matched: ${shortcut.action}`);

                    // Stop the browser's default action (e.g., Ctrl+S saving the page)
                    event.preventDefault();

                    // Execute the action (e.g., navigate to a page)
                    executeAction(shortcut.action);

                    // Stop searching once we find a match
                    return;
                }
            }
        }

    }, [shortcuts, loading, dispatch, navigate]); // Dependencies for useCallback

    /**
     * This function maps the "action" string (from your settings)
     * to an actual function in your app (like navigation or opening a modal).
     * * !!! YOU MUST UPDATE THIS FUNCTION !!!
     * Add a 'case' for every 'action' string you create in the settings.
     */
    const executeAction = (actionName) => {
        switch (actionName) {
            // --- MAIN NAVIGATION ---
            case 'Go to Dashboard':
                navigate('/dashboard');
                break;
            case 'Go to Orders':
                navigate('/orders');
                break;
            case 'Go to Delivery':
                navigate('/delivery');
                break;
            case 'Go to Restaurants':
                navigate('/restaurants');
                break;
            case 'Go to Suppliers':
                navigate('/supplier');
                break;
            case 'Go to Permissions (Waiter)':
                navigate('/permission');
                break;
            case 'Go to Login Activity':
                navigate('/login-activity');
                break;
            case 'Go to POS':
                navigate('/pos');
                break;
            case 'Go to Settings':
                navigate('/setting'); // Note: your route path is 'setting'
                break;

            // --- ANALYTICS & REPORTS ---
            case 'Go to Purchase Analytics':
                navigate('/purchaseanalytics');
                break;
            case 'Go to Sales Analytics':
                navigate('/salesanalytics');
                break;
            case 'Go to Daily Report':
                navigate('/daily-report');
                break;
            case 'Go to Payment Report':
                navigate('/payment-report');
                break;
            case 'Go to Customer Report':
                navigate('/customer-report');
                break;
            case 'Go to Table Report':
                navigate('/table-report');
                break;
            case 'Go to Payment Type Report':
                navigate('/payment-type-report');
                break;
            case 'Go to Dashboard Statistics Report':
                navigate('/dashboard-statistics-report');
                break;
            case 'Go to Due Report':
                navigate('/due-report');
                break;
            case 'Go to Transaction by Date Report':
                navigate('/transactionByDate-report');
                break;
            case 'Go to Tax Collection Report':
                navigate('/tax-collection-report');
                break;
            case 'Go to Table Usage Report':
                navigate('/table-usage-report');
                break;
            case 'Go to Discount Usage Report':
                navigate('/discount-usage-report');
                break;
            case 'Go to Average Order Report':
                navigate('/average-order-report');
                break;
            // case 'Go to Payment Type Transaction Report':
            //     navigate('/payment-type-transaction-report');
            //     break;
            case 'Go to Total Revenue Report':
                navigate('/total-revenue-report');
                break;
            case 'Go to Yearly Chart Report':
                navigate('/yearly-chart-report');
                break;
            case 'Go to Weekly Chart Report':
                navigate('/weekly-chart-report');
                break;

            // --- MENU & STOCK ---
            case 'Go to Categories':
                navigate('/category');
                break;
            case 'Go to SubCategories':
                navigate('/subCategory');
                break;
            case 'Go to Stock':
                navigate('/stock');
                break;
            case 'Go to Menu':
                navigate('/menu');
                break;
            case 'Go to Waste':
                navigate('/waste');
                break;

            // --- CUSTOMER & LOYALTY ---
            case 'Go to Customers':
                navigate('/customers');
                break;
            case 'Go to Customer Loyalty':
                navigate('/customerloyality');
                break;
            case 'Go to Transactions':
                navigate('/transactions');
                break;
            case 'Go to Feedback':
                navigate('/feedback');
                break;
            case 'Go to Reservations':
                navigate('/reservations');
                break;
            case 'Go to Dues':
                navigate('/dues');
                break;

            // --- MISC & OTHER ---
            case 'Go to Delivery Timing':
                navigate('/delivery-timing');
                break;
            case 'Go to QR Code':
                navigate('/qr-code');
                break;
            case 'Go to Banners':
                navigate('/banners');
                break;
            case 'Go to Help':
                navigate('/help');
                break;
            case 'Go to License':
                navigate('/license');
                break;
            case 'Go to Downloads':
                navigate('/downloads');
                break;

            // --- FUNCTIONAL ACTIONS (Examples) ---
            case 'New Sale':
                // Example: dispatch an action to open your "New Sale" modal
                // dispatch(openNewSaleModal());
                console.log('Action: Would open New Sale modal');
                break;

            case 'Focus Search Bar':
                // Example: focus a global search bar
                document.getElementById('global-search-bar')?.focus();
                break;

            default:
                console.warn(`No action defined for shortcut: ${actionName}`);
        }
    };

    // 6. Attach the 'keydown' listener to the window
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);

        // Cleanup function to remove the listener when the component unmounts
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]); // Re-attach if handleKeyDown changes

    // This component does not render any visible HTML
    return null;
};

export default GlobalShortcutListener;

