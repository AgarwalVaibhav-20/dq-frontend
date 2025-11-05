import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBanners } from '../../redux/slices/bannerSlice';
import { fetchCustomers, addCustomer } from '../../redux/slices/customerSlice';
import { fetchMenuItems } from '../../redux/slices/menuSlice';
import { fetchCategories } from '../../redux/slices/categorySlice';
import { createOrder } from '../../redux/slices/orderSlice'; // <-- IMPORT createOrder
import { useLocation } from 'react-router-dom';
import {
    useColorModes,
} from '@coreui/react';

const RestaurantOrderingApp = () => {
    const { search } = useLocation();
    const query = new URLSearchParams(search);
    const [tableNumber, setTableNumber] = useState(
        query.get('table') || localStorage.getItem('tableNumber') || '1'
    );
    const { colorMode, setColorMode } = useColorModes('coreui-free-react-admin-template-theme');
    useEffect(() => {
        setColorMode("light")
        localStorage.setItem('tableNumber', tableNumber);
    }, [tableNumber]);

    const token = localStorage.getItem('authToken');
    const dispatch = useDispatch();
    const { banners } = useSelector((state) => state.banner);
    const { menuItems } = useSelector((state) => state.menuItems);
    const { categories } = useSelector(state => state.category);
    // --> Get customers from the Redux store
    const { customers } = useSelector((state) => state.customers);
    const restaurantId = localStorage.getItem('restaurantId');
    useEffect(() => {

        if (restaurantId) {
            // Pass token if available, otherwise use public APIs
            dispatch(fetchBanners({ token, restaurantId }));
            dispatch(fetchMenuItems({ token, restaurantId }));
            // --> Fetch customers when the component loads
            if (token) {
                dispatch(fetchCustomers({ token, restaurantId }));
            }
            dispatch(fetchCategories({ token, restaurantId }));
        }
    }, [dispatch, restaurantId, token]);

    const [cart, setCart] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [cartOpen, setCartOpen] = useState(false);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [selectedSizes, setSelectedSizes] = useState({});

    // Customer form state
    const [customerForm, setCustomerForm] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        orderType: 'In Restaurant',
        address: '',
        link: ''
    });
    const [existingCustomer, setExistingCustomer] = useState(null);
    const [customerError, setCustomerError] = useState('');
    
    // Spin wheel discount state
    const [spinDiscount, setSpinDiscount] = useState(null);

    // --> Pre-fill form from localStorage on initial load (with restaurantId)
    useEffect(() => {
        if (!restaurantId) return;
        
        // Get customer data specific to current restaurant
        const customerKey = `currentCustomer_${restaurantId}`;
        const savedCustomer = localStorage.getItem(customerKey);
        
        if (savedCustomer) {
            const customer = JSON.parse(savedCustomer);
            setCustomerForm({
                name: customer.name || '',
                email: customer.email || '',
                phoneNumber: customer.phoneNumber || '',
                orderType: 'In Restaurant', // Keep default
                address: customer.address || '',
                link: customer.link || ''
            });
            if (customer.phoneNumber && customers.length > 0) {
                checkExistingCustomer(customer.phoneNumber);
            }
        } else {
            // Reset form if no customer data for this restaurant
            setCustomerForm({
                name: '',
                email: '',
                phoneNumber: '',
                orderType: 'In Restaurant',
                address: '',
                link: ''
            });
            setExistingCustomer(null);
        }
    }, [customers, restaurantId]); // Depend on customers and restaurantId to ensure correct data

    // Load spin discount from localStorage on mount
    useEffect(() => {
        if (!restaurantId || !tableNumber) return;
        
        const spinDiscountKey = `spinDiscount_${restaurantId}_${tableNumber}`;
        const savedDiscount = localStorage.getItem(spinDiscountKey);
        
        if (savedDiscount) {
            try {
                const discountData = JSON.parse(savedDiscount);
                setSpinDiscount(discountData);
                console.log('✅ Spin discount loaded:', discountData);
            } catch (error) {
                console.error('Error parsing spin discount:', error);
            }
        }
    }, [restaurantId, tableNumber]);

    const activeMenuItems = menuItems.filter(item => item.status === 1);
    console.log('Active menuItems (status === 1):', activeMenuItems);
    const menuCategories = ['All', ...new Set(activeMenuItems.map(item => item.categoryName).filter(Boolean))];
    const filteredItems = selectedCategory === 'All' ?
        activeMenuItems :
        activeMenuItems.filter(item => item.categoryName === selectedCategory);
    console.log('Filtered items to display:', filteredItems);

    const addToCart = (item, selectedSize = null) => {
        const itemKey = selectedSize ? `${item._id}-${selectedSize.size || selectedSize.price}` : item._id;
        const price = selectedSize ? Number(selectedSize.price) : Number(item.price);
        const displayName = selectedSize ? `${item.itemName} (${selectedSize.size || `₹${selectedSize.price}`})` : item.itemName;
        const existingItem = cart.find(cartItem => cartItem.key === itemKey);

        if (existingItem) {
            setCart(cart.map(cartItem => cartItem.key === itemKey ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem));
        } else {
            setCart([...cart, { ...item, key: itemKey, displayName, price, selectedSize, quantity: 1 }]);
        }
    };

    const updateQuantity = (itemKey, delta) => {
        setCart(cart.map(item =>
            item.key === itemKey ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        ).filter(item => item.quantity > 0));
    };

    const removeFromCart = (itemKey) => setCart(cart.filter(item => item.key !== itemKey));
    const getTotalPrice = () => cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const getTotalItems = () => cart.reduce((total, item) => total + item.quantity, 0);
    
    // Calculate discount amount from spin wheel
    const calculateSpinDiscount = () => {
        if (!spinDiscount || !spinDiscount.discountType) return 0;
        
        const subtotal = Number(getTotalPrice()) || 0;
        
        // Handle BOGO (Buy One Get One Free) - discount = lowest priced item in cart
        if (spinDiscount.discountType === 'bogo' || spinDiscount.isBOGO) {
            if (cart.length === 0) return 0;
            // Find the lowest priced item in cart
            const lowestPriceItem = cart.reduce((min, item) => {
                const itemTotal = Number(item.price) * Number(item.quantity);
                return itemTotal < min.price ? { price: itemTotal, item } : min;
            }, { price: Infinity, item: null });
            
            // Return the price of the lowest priced item (as number)
            return lowestPriceItem.price !== Infinity ? Number(lowestPriceItem.price.toFixed(2)) : 0;
        }
        
        if (spinDiscount.discountType === 'percentage' && spinDiscount.discountPercentage > 0) {
            const percentage = Number(spinDiscount.discountPercentage) || 0;
            const calculatedDiscount = (subtotal * percentage) / 100;
            return Number(calculatedDiscount.toFixed(2)); // Return as number with 2 decimal places
        } else if (spinDiscount.discountType === 'fixed' && spinDiscount.discountAmount > 0) {
            const fixedAmount = Number(spinDiscount.discountAmount) || 0;
            return Number(Math.min(fixedAmount, subtotal).toFixed(2)); // Don't exceed subtotal
        }
        
        return 0;
    };
    
    const getDiscountedTotal = () => {
        const subtotal = getTotalPrice();
        const discount = calculateSpinDiscount();
        return Math.max(0, subtotal - discount);
    };

    // MODIFIED: Check current restaurant's customer data only and compare restaurantId
    const handleCheckout = () => {
        if (cart.length === 0) return;

        // Check only current restaurant's customer data
        const customerKey = `currentCustomer_${restaurantId}`;
        const savedCustomer = localStorage.getItem(customerKey);

        if (savedCustomer) {
            const customerData = JSON.parse(savedCustomer);
            const storedRestaurantId = customerData?.restaurantId;
            
            // Compare stored restaurantId with current restaurantId
            if (storedRestaurantId && storedRestaurantId === restaurantId) {
                // Same restaurant - direct order placement
                console.log("✅ Same restaurant detected. Placing order directly for restaurant:", restaurantId);
                setCartOpen(false); // Close the cart
                placeOrder(customerData); // Call our reusable order function
            } else {
                // Different restaurant ID - ask for details
                console.log("⚠️ Different restaurant detected. Saved:", storedRestaurantId, "Current:", restaurantId);
                console.log("Opening form to collect customer details for new restaurant");
                setCartOpen(false);
                setCheckoutOpen(true);
            }
        } else {
            // No customer data for this restaurant - open form
            console.log("No customer data found for restaurant:", restaurantId);
            console.log("Opening form to collect customer details");
            setCartOpen(false);
            setCheckoutOpen(true);
        }
    };

    const handlePhoneChange = (e) => {
        const phone = e.target.value;
        setCustomerForm({ ...customerForm, phoneNumber: phone });
        checkExistingCustomer(phone);
    };

    // NEW REUSABLE FUNCTION to handle the actual order creation
    const placeOrder = async (customerData) => {
        try {
            const restaurantId = localStorage.getItem('restaurantId');
            const userId = localStorage.getItem('userId');
            const subtotal = getTotalPrice();
            const discountAmount = calculateSpinDiscount();
            const taxAmount = 0; // Add tax if needed in future
            const systemCharge = 0; // Add system charge if needed in future
            const roundOff = 0; // Add round off if needed in future
            
            // Calculate total amount after applying discount
            // totalAmount = subtotal - discount + tax + systemCharge + roundOff
            const totalAmount = Math.max(0, subtotal - discountAmount + taxAmount + systemCharge + roundOff);

            const orderPayload = {
                customerId: customerData._id,
                restaurantId,
                userId: userId || restaurantId,
                items: cart.map(item => ({
                    itemId: item._id,
                    itemName: item.displayName,
                    price: item.price,
                    quantity: item.quantity,
                    size: item.selectedSize?.name || item.selectedSize || null, // ✅ ADD SIZE FIELD
                    subtotal: item.price * item.quantity,
                    selectedSubcategoryId: item.selectedSize?._id || null
                })),
                subtotal: Number(subtotal) || 0,
                discountAmount: Number(discountAmount) || 0, // Discount amount saved
                discountPercentage: Number(spinDiscount?.discountPercentage) || 0,
                discountType: spinDiscount?.discountType || null,
                totalAmount: Number(totalAmount.toFixed(2)) || 0, // Total after discount applied
                tableNumber,
                customerName: customerData.name,
                customerAddress: customerData.address || '',
            };
            
            console.log('📦 Order Payload:', {
                subtotal: orderPayload.subtotal,
                discountAmount: orderPayload.discountAmount,
                discountPercentage: orderPayload.discountPercentage,
                discountType: orderPayload.discountType,
                totalAmount: orderPayload.totalAmount,
                calculation: `${orderPayload.subtotal} - ${orderPayload.discountAmount} = ${orderPayload.totalAmount}`,
                discountAmountType: typeof orderPayload.discountAmount,
                discountPercentageType: typeof orderPayload.discountPercentage
            });

            await dispatch(createOrder({ token, ...orderPayload })).unwrap();

            // Remove discount from localStorage after successful order placement
            if (spinDiscount) {
                const spinDiscountKey = `spinDiscount_${restaurantId}_${tableNumber}`;
                localStorage.removeItem(spinDiscountKey);
                setSpinDiscount(null);
                console.log('✅ Spin discount removed from localStorage after order placement');
            }

            // Reset cart and close any open dialogs
            setCart([]);
            setCartOpen(false);
            setCheckoutOpen(false);
            
            // Reset customer form including link
            setCustomerForm({
                name: '',
                email: '',
                phoneNumber: '',
                orderType: 'In Restaurant',
                address: '',
                link: ''
            });

            alert('Order placed successfully!');

        } catch (error) {
            setCustomerError('Failed to process order. Please try again.');
            console.error('Order submission error:', error);
            // If it fails, we should probably show the checkout form again to allow correction
            setCheckoutOpen(true);
        }
    };

    const checkExistingCustomer = (phone) => {
        if (phone.length >= 10) {
            const customer = customers.find(c => c.phoneNumber === phone);
            if (customer) {
                setExistingCustomer(customer);
                setCustomerForm({
                    ...customerForm,
                    name: customer.name,
                    email: customer.email || '',
                    phoneNumber: phone,
                    address: customer.address || ''
                });
                setCustomerError('');
            } else {
                setExistingCustomer(null);
            }
        } else {
            setExistingCustomer(null);
        }
    };

    // MODIFIED to use the new placeOrder function
    const handleSubmitOrder = async () => {
        if (!customerForm.name || !customerForm.phoneNumber) {
            setCustomerError('Name and Phone Number are required');
            return;
        }
        if (customerForm.phoneNumber.length < 10) {
            setCustomerError('Please enter a valid phone number');
            return;
        }

        try {
            let customerData;

            if (!existingCustomer) {
                const resultAction = await dispatch(addCustomer({ token, ...customerForm })).unwrap();
                customerData = resultAction.customer || resultAction;
            } else {
                customerData = existingCustomer;
            }

            if (!customerData || !customerData._id) {
                console.error("Invalid customerData:", customerData);
                throw new Error("Customer creation failed or returned invalid data");
            }

            // Store customer data with restaurantId to support multiple restaurants
            const customerKey = `currentCustomer_${restaurantId}`;
            localStorage.setItem(customerKey, JSON.stringify({
                _id: customerData._id,
                name: customerData.name,
                email: customerData.email,
                phoneNumber: customerData.phoneNumber,
                address: customerData.address,
                restaurantId: restaurantId, // Store restaurantId with customer data for comparison
            }));
            console.log("✅ Customer data saved for restaurant:", restaurantId);

            await placeOrder(customerData);

        } catch (error) {
            setCustomerError('Failed to save customer details. Please try again.');
            console.error('Customer submission error:', error);
        }

    }; // --> UPDATED ORDER SUBMISSION LOGIC
    // const handleSubmitOrder = async () => {
    //     if (!customerForm.name || !customerForm.phoneNumber) {
    //         setCustomerError('Name and Phone Number are required');
    //         return;
    //     }
    //     if (customerForm.phoneNumber.length < 10) {
    //         setCustomerError('Please enter a valid phone number');
    //         return;
    //     }

    //     try {
    //         const restaurantId = localStorage.getItem('restaurantId');
    //         let customerData;

    //         if (!existingCustomer) {
    //             const resultAction = await dispatch(addCustomer({ token, ...customerForm })).unwrap();
    //             customerData = resultAction.customer; // Assuming backend returns { message, customer }
    //         } else {
    //             customerData = existingCustomer;
    //         }

    //         localStorage.setItem('currentCustomer', JSON.stringify({
    //             name: customerData.name,
    //             email: customerData.email,
    //             phoneNumber: customerData.phoneNumber,
    //             address: customerData.address,
    //         }));

    //         const orderData = {
    //             customerId: customerData._id,
    //             restaurantId,
    //             items: cart.map(item => ({
    //                 menuItemId: item._id,
    //                 itemName: item.displayName,
    //                 price: item.price,
    //                 quantity: item.quantity,
    //                 size: item.selectedSize?.size || null
    //             })),
    //             total: getTotalPrice(),
    //             tableNumber,
    //             orderType: customerForm.orderType,
    //         };

    //         // Step 4: Dispatch the action to create the order
    //         await dispatch(createOrder({ token, orderData })).unwrap();

    //         // Step 5: Reset everything on success
    //         setCart([]);
    //         setCheckoutOpen(false);
    //         setCustomerForm({ name: '', email: '', phoneNumber: '', orderType: 'In Restaurant', address: '' });
    //         setExistingCustomer(null);
    //         setCustomerError('');
    //         // Optional: clear the saved customer from localStorage after a successful order
    //         localStorage.removeItem('currentCustomer');

    //     } catch (error) {
    //         setCustomerError('Failed to process order. Please try again.');
    //         console.error('Order submission error:', error);
    //     }
    // };

    // --- The rest of your component's JSX remains the same ---
    // (I'm omitting the JSX for brevity as it doesn't need changes)
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src="/favicon.ico" alt="Logo" className="w-10 h-10 rounded" />
                        <span className="text-xl font-bold">DQ</span>
                    </div>
                    <button
                        onClick={() => setCartOpen(true)}
                        className="relative p-2 hover:bg-gray-100 rounded-full"
                    >
                        <ShoppingCart className="w-6 h-6" />
                        {getTotalItems() > 0 && (
                            <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                {getTotalItems()}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            {/* Banner */}
            {banners.length > 0 ? (
                <div className="relative h-64 overflow-hidden">
                    <img
                        src={banners[0]?.banner_1}
                        alt="Banner"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0  bg-opacity-40 flex items-center justify-center">
                        <div className="text-center text-white">
                            <h1 className="text-4xl font-bold mb-2">Welcome to Old 90's</h1>
                            <p className="text-xl">Scan & Order Your Favorite Dishes</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-purple-800 text-white py-16 text-center">
                    <h1 className="text-4xl font-bold mb-2">Welcome to Old 90's</h1>
                    <p className="text-xl">Scan & Order Your Favorite Dishes</p>
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <h2 className="text-2xl font-bold text-center mb-6">Table Number: {tableNumber}</h2>

                {/* Category Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {menuCategories.map(category => {
                        const categoryData = categories.find(c => c.categoryName === category);
                        return (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-lg whitespace-nowrap font-medium transition-colors ${selectedCategory === category
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                {categoryData?.categoryImage && category !== 'All' && (
                                    <img
                                        src={categoryData.categoryImage}
                                        alt={category}
                                        className="w-6 h-6 rounded-full object-cover"
                                    />
                                )}
                                {category}
                            </button>
                        );
                    })}
                </div>

                {/* Menu Items Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
                    {filteredItems.map(item => {
                        const hasSizes = item.sizes && item.sizes.length > 0;
                        const selectedSize = hasSizes ? selectedSizes[item._id] : null;

                        return (
                            <div
                                key={item._id}
                                className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col justify-between h-[480px] sm:h-[500px] w-full max-w-[360px] mx-auto transition-transform hover:scale-[1.02]"
                            >
                                <img
                                    src={item.itemImage || 'https://via.placeholder.com/300x200?text=No+Image'}
                                    alt={item.itemName}
                                    className="w-full h-48 object-cover"
                                />
                                <div className="p-4 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold mb-1">{item.itemName}</h3>
                                        <p className="text-gray-600 text-sm mb-2">{item.categoryName}</p>

                                        {hasSizes ? (
                                            <div className="mb-3">
                                                <p className="text-sm font-medium mb-2">Select Size:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {item.sizes.map((sizeOption, idx) => {
                                                        const sizeKey = `${item._id}-${sizeOption?.sizes?.name || sizeOption.price}`;
                                                        const itemInCart = cart.find(c => c.key === sizeKey);

                                                        return (
                                                            <button
                                                                key={idx}
                                                                onClick={() => setSelectedSizes({ ...selectedSizes, [item._id]: sizeOption })}
                                                                className={`relative px-3 py-2 rounded-lg border text-sm flex-grow flex flex-col items-center justify-center transition-all ${selectedSizes[item._id]?.price === sizeOption.price
                                                                    ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-500'
                                                                    : 'border-gray-300 hover:border-purple-400'
                                                                    }`}
                                                            >
                                                                {itemInCart && (
                                                                    <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center z-10">
                                                                        {itemInCart.quantity}
                                                                    </span>
                                                                )}
                                                                <span>{sizeOption.name || `Option ${idx + 1}`}</span>
                                                                <span className="font-bold text-purple-600 mt-1">₹ {sizeOption.price}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xl font-bold text-purple-600 mb-3">
                                                ₹ {item.price.toFixed(2)}
                                            </p>
                                        )}
                                    </div>

                                    <div className="mt-4">
                                        {hasSizes ? (
                                            <button
                                                onClick={() => {
                                                    if (!selectedSize) {
                                                        alert('Please select a size first!');
                                                        return;
                                                    }
                                                    addToCart(item, selectedSize);
                                                }}
                                                className={`w-full py-3 rounded-lg font-semibold transition-colors text-white ${!selectedSize
                                                    ? 'bg-gray-400 cursor-not-allowed'
                                                    : 'bg-purple-600 hover:bg-purple-700'
                                                    }`}
                                                disabled={!selectedSize}
                                            >
                                                {selectedSize ? `Add ${selectedSize.size || `(₹ ${selectedSize.price})`}` : 'Select a Size'}
                                            </button>
                                        ) : (
                                            (() => {
                                                const cartItem = cart.find(c => c.key === item._id);
                                                if (cartItem) {
                                                    return (
                                                        <div className="flex items-center justify-center gap-4">
                                                            <button
                                                                onClick={() => updateQuantity(cartItem.key, -1)}
                                                                className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-200 text-purple-800 font-bold text-lg hover:bg-purple-300 transition"
                                                            > <Minus size={20} /> </button>
                                                            <span className="font-bold text-xl w-8 text-center">{cartItem.quantity}</span>
                                                            <button
                                                                onClick={() => updateQuantity(cartItem.key, 1)}
                                                                className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-200 text-purple-800 font-bold text-lg hover:bg-purple-300 transition"
                                                            > <Plus size={20} /> </button>
                                                        </div>
                                                    );
                                                } else {
                                                    return (
                                                        <button
                                                            onClick={() => addToCart(item)}
                                                            className='w-full py-3 rounded-lg font-semibold transition-colors text-white bg-purple-600 hover:bg-purple-700'
                                                        > Add to Cart </button>
                                                    );
                                                }
                                            })()
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Cart Dialog */}
            {cartOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        {/* Cart Header */}
                        <div className="p-4 border-b flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <ShoppingCart className="w-6 h-6 text-purple-600" />
                                <h2 className="text-xl font-bold text-gray-800">Your Order</h2>
                            </div>
                            <button onClick={() => setCartOpen(false)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                                <X className="w-6 h-6 text-gray-600" />
                            </button>
                        </div>

                        {/* Cart Body */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                            {cart.length === 0 ? (
                                <div className="text-center text-gray-500 py-16">
                                    <p className="font-semibold text-lg">Your cart is empty</p>
                                    <p className="text-sm">Add some delicious items from the menu!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {cart.map(item => (
                                        <div key={item.key} className="flex flex-col gap-3 p-3 border bg-white rounded-lg shadow-sm">
                                            <button onClick={() => removeFromCart(item.key)} className="p-2 self-start hover:bg-red-100 text-red-500 rounded-full"><Trash2 className="w-5 h-5" /></button>
                                            <div className="flex gap-2 self-start">
                                                <img src={item.itemImage || 'https://via.placeholder.com/80x80'} alt={item.displayName} className="w-20 h-20 object-cover rounded-md" />
                                                <div className="flex flex-col gap-1">
                                                    <h3 className="font-bold text-gray-800">
                                                        {item.itemName}
                                                        {item.selectedSize?.size && (<span className="text-sm font-medium text-gray-500"> ({item.selectedSize.size})</span>)}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">{item.categoryName}</p>
                                                    <p className="text-purple-600 font-semibold mt-1">
                                                        ₹{item.price.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => updateQuantity(item.key, -1)} className="p-1.5 h-7 w-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition"><Minus className="w-4 h-4" /></button>
                                                <span className="font-semibold w-8 text-center text-lg">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.key, 1)} className="p-1.5 h-7 w-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition"><Plus className="w-4 h-4" /></button>
                                            </div>
                                            <p className="font-bold self-center text-lg text-gray-800 w-24 text-right">₹{(item.price * item.quantity).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Cart Footer with Summary */}
                        {cart.length > 0 && (
                            <div className="p-4 border-t bg-white">
                                {/* Spin Discount Banner */}
                                {spinDiscount && spinDiscount.discountType && (
                                    <div className="mb-3 p-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg text-white text-center">
                                        <p className="text-sm font-semibold mb-1">🎉 Spin Wheel Discount Applied!</p>
                                        <p className="text-lg font-bold">
                                            {spinDiscount.winnerText || 
                                             (spinDiscount.discountType === 'percentage' 
                                              ? `${spinDiscount.discountPercentage}% OFF` 
                                              : `₹${spinDiscount.discountAmount} OFF`)}
                                        </p>
                                    </div>
                                )}

                                <hr className="my-3" />

                                {/* Order Summary */}
                                <div className="space-y-2 mb-3">
                                    <div className="flex items-center justify-between text-gray-700">
                                        <span>Subtotal</span>
                                        <span>₹ {getTotalPrice().toFixed(2)}</span>
                                    </div>
                                    {spinDiscount && calculateSpinDiscount() > 0 && (
                                        <div className="flex items-center justify-between text-green-600 font-semibold">
                                            <span>
                                                Discount 
                                                {spinDiscount.discountType === 'percentage' && ` (${spinDiscount.discountPercentage}%)`}
                                            </span>
                                            <span>-₹ {calculateSpinDiscount().toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between text-xl font-bold bg-purple-100 text-purple-800 p-3 rounded-lg">
                                    <span>Total</span>
                                    <span>₹ {getTotalPrice().toFixed(2)}</span>
                                </div>
                                {spinDiscount && calculateSpinDiscount() > 0 && (
                                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <p className="text-xs text-yellow-800 text-center">
                                            💡 Discount will be saved in order but not applied to payment
                                        </p>
                                    </div>
                                )}

                                <button onClick={handleCheckout} className="mt-4 w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors text-lg">
                                    Place Order ({getTotalItems()} items)
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Checkout Dialog */}
            {checkoutOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b flex items-center justify-between">
                            <h2 className="text-xl font-bold">User Details</h2>
                            <button
                                onClick={() => setCheckoutOpen(false)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {customerError && (
                                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                                    {customerError}
                                </div>
                            )}
                            {existingCustomer && (
                                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
                                    Welcome back, {existingCustomer.name}!
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Phone Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={customerForm.phoneNumber}
                                        onChange={handlePhoneChange}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                        placeholder="Enter phone number"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={customerForm.name}
                                        onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                        placeholder="Enter name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={customerForm.email}
                                        onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                        placeholder="Enter email"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Order Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={customerForm.orderType}
                                        onChange={(e) => setCustomerForm({ ...customerForm, orderType: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                    >
                                        <option value="In Restaurant">In Restaurant</option>
                                        <option value="Takeaway">Takeaway</option>
                                        <option value="Delivery">Delivery</option>
                                    </select>
                                </div>

                                {(customerForm.orderType === 'Delivery' || customerForm.orderType === 'Takeaway') && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Address</label>
                                        <textarea
                                            value={customerForm.address}
                                            onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                            rows="3"
                                            placeholder="Enter address"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium mb-1">Link (Optional)</label>
                                    <input
                                        type="url"
                                        value={customerForm.link || ''}
                                        onChange={(e) => setCustomerForm({ ...customerForm, link: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                        placeholder="Enter any link"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t">
                            <button
                                onClick={handleSubmitOrder}
                                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                            >
                                Submit Order
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default RestaurantOrderingApp;

// import React, { useState, useEffect } from 'react';
// import { ShoppingCart, Plus, Minus, Trash2, X } from 'lucide-react';
// import { useDispatch, useSelector } from 'react-redux';
// import { fetchBanners } from '../../redux/slices/bannerSlice';
// import { fetchCustomers, addCustomer } from '../../redux/slices/customerSlice';
// import { fetchMenuItems } from '../../redux/slices/menuSlice';
// import { createOrder } from '../../redux/slices/orderSlice';
// import { fetchCategories } from '../../redux/slices/categorySlice';
// import { fetchSubCategories } from '../../redux/slices/subCategorySlice';
// import { useLocation } from 'react-router-dom';

// const RestaurantOrderingApp = () => {
//     const { search } = useLocation();
//     const query = new URLSearchParams(search);
//     const [tableNumber, setTableNumber] = useState(
//         query.get('table') || localStorage.getItem('tableNumber') || '1'
//     );
//     useEffect(() => {
//         localStorage.setItem('tableNumber', tableNumber);
//     }, [tableNumber]);

//     const token = localStorage.getItem('authToken');
//     const dispatch = useDispatch();
//     const { banners } = useSelector((state) => state.banner);
//     const { menuItems } = useSelector((state) => state.menuItems);
//     const { categories } = useSelector(state => state.category);
//     const { customers } = useSelector((state) => state.customers);

//     useEffect(() => {
//         if (token) {
//             dispatch(fetchBanners({ token }));
//             dispatch(fetchMenuItems(token));
//             dispatch(fetchCustomers(token));
//         }
//     }, [dispatch, token]);

//     const [cart, setCart] = useState([]);
//     const [selectedCategory, setSelectedCategory] = useState('All');
//     const [cartOpen, setCartOpen] = useState(false);
//     const [checkoutOpen, setCheckoutOpen] = useState(false);
//     const [selectedSizes, setSelectedSizes] = useState({});

//     // Customer form state
//     const [customerForm, setCustomerForm] = useState({
//         name: '',
//         email: '',
//         phoneNumber: '',
//         orderType: 'In Restaurant',
//         address: ''
//     });
//     const [existingCustomer, setExistingCustomer] = useState(null);
//     const [customerError, setCustomerError] = useState('');

//     const activeMenuItems = menuItems.filter(item => item.status === 1);
//     const menuCategories = ['All', ...new Set(activeMenuItems.map(item => item.categoryName).filter(Boolean))];
//     const filteredItems = selectedCategory === 'All'
//         ? activeMenuItems
//         : activeMenuItems.filter(item => item.categoryName === selectedCategory);

//     const addToCart = (item, selectedSize = null) => {
//         // FIX: Use price as a fallback for key and display name if size name is missing
//         const itemKey = selectedSize ? `${item._id}-${selectedSize.size || selectedSize.price}` : item._id;
//         const price = selectedSize ? Number(selectedSize.price) : Number(item.price);
//         const displayName = selectedSize ? `${item.itemName} (${selectedSize.size || `₹${selectedSize.price}`})` : item.itemName;

//         const existingItem = cart.find(cartItem => cartItem.key === itemKey);

//         if (existingItem) {
//             setCart(
//                 cart.map(cartItem =>
//                     cartItem.key === itemKey
//                         ? { ...cartItem, quantity: cartItem.quantity + 1 }
//                         : cartItem
//                 )
//             );
//         } else {
//             setCart([
//                 ...cart,
//                 {
//                     ...item,
//                     key: itemKey,
//                     displayName,
//                     price,
//                     selectedSize,
//                     quantity: 1,
//                 },
//             ]);
//         }
//     };

//     const updateQuantity = (itemKey, delta) => {
//         setCart(cart.map(item =>
//             item.key === itemKey
//                 ? { ...item, quantity: Math.max(0, item.quantity + delta) }
//                 : item
//         ).filter(item => item.quantity > 0));
//     };

//     const removeFromCart = (itemKey) => {
//         setCart(cart.filter(item => item.key !== itemKey));
//     };

//     const getTotalPrice = () => {
//         return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
//     };

//     const getTotalItems = () => {
//         return cart.reduce((total, item) => total + item.quantity, 0);
//     };

//     const handleCheckout = () => {
//         if (cart.length === 0) return;
//         setCartOpen(false);
//         setCheckoutOpen(true);
//     };
//     const handlePhoneChange = (e) => {
//         const phone = e.target.value;
//         setCustomerForm({ ...customerForm, phoneNumber: phone });
//         checkExistingCustomer(phone);
//     };

//     const handleSubmitOrder = async () => {
//         if (!customerForm.name || !customerForm.phoneNumber) {
//             setCustomerError('Name and Phone Number are required');
//             return;
//         }
//         if (customerForm.phoneNumber.length < 10) {
//             setCustomerError('Please enter a valid phone number');
//             return;
//         }

//         try {
//             const token = localStorage.getItem('authToken');
//             const restaurantId = localStorage.getItem('restaurantId');
//             let customerData;

//             // 1. Check if the customer is new
//             if (!existingCustomer) {
//                 // Dispatch action to create a new customer and wait for the result
//                 const newCustomerAction = await dispatch(
//                     addCustomer({
//                         token,
//                         customerData: { ...customerForm, restaurantId }
//                     })
//                 ).unwrap(); // .unwrap() will return the fulfilled action payload or throw an error

//                 customerData = newCustomerAction.customer; // Assuming the backend returns the created customer object
//                 console.log('Created new customer:', customerData);

//             } else {
//                 // Use the existing customer's data
//                 customerData = existingCustomer;
//                 console.log('Using existing customer:', customerData);
//             }

//             // 2. Store customer info in localStorage for this session
//             localStorage.setItem('currentCustomer', JSON.stringify({
//                 name: customerData.name,
//                 email: customerData.email,
//                 phoneNumber: customerData.phoneNumber,
//                 address: customerData.address,
//             }));

//             // 3. Prepare the final order payload with the customer's ID
//             const orderData = {
//                 customerId: customerData._id, // Use the ID from the new or existing customer
//                 items: cart.map(item => ({
//                     menuItemId: item._id,
//                     itemName: item.displayName,
//                     price: item.price,
//                     quantity: item.quantity,
//                     size: item.selectedSize?.size || null
//                 })),
//                 total: getTotalPrice(),
//                 tableNumber,
//                 orderType: customerForm.orderType,
//                 restaurantId,
//             };

//             // 4. Dispatch the action to create the order
//             await dispatch(createOrder({ token, orderData })).unwrap();

//             console.log('Order placed successfully:', orderData);
//             alert('Order placed successfully!');

//             // 5. Reset everything
//             setCart([]);
//             setCheckoutOpen(false);
//             setCustomerForm({
//                 name: '',
//                 email: '',
//                 phoneNumber: '',
//                 orderType: 'In Restaurant',
//                 address: ''
//             });
//             setExistingCustomer(null);
//             setCustomerError('');

//         } catch (error) {
//             setCustomerError('Failed to process order. Please try again.');
//             console.error('Order submission error:', error);
//         }
//     };

//     const checkExistingCustomer = (phone) => {
//         if (phone.length >= 10) {
//             const customer = customers.find(c => c.phoneNumber === phone);
//             if (customer) {
//                 setExistingCustomer(customer);
//                 setCustomerForm({
//                     ...customerForm,
//                     name: customer.name,
//                     email: customer.email || '',
//                     phoneNumber: phone,
//                     address: customer.address || ''
//                 });
//                 setCustomerError('');
//             } else {
//                 setExistingCustomer(null);
//             }
//         }
//     };
//     return (
//         <div className="min-h-screen bg-gray-50">
//             {/* Header */}
//             <header className="sticky top-0 z-50 bg-white shadow-sm">
//                 <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
//                     <div className="flex items-center gap-2">
//                         <img src="/favicon.ico" alt="Logo" className="w-10 h-10 rounded" />
//                         <span className="text-xl font-bold">DQ</span>
//                     </div>
//                     <button
//                         onClick={() => setCartOpen(true)}
//                         className="relative p-2 hover:bg-gray-100 rounded-full"
//                     >
//                         <ShoppingCart className="w-6 h-6" />
//                         {getTotalItems() > 0 && (
//                             <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
//                                 {getTotalItems()}
//                             </span>
//                         )}
//                     </button>
//                 </div>
//             </header>

//             {/* Banner */}
//             {banners.length > 0 ? (
//                 <div className="relative h-64 overflow-hidden">
//                     <img
//                         src={banners[0]?.banner_1}
//                         alt="Banner"
//                         className="w-full h-full object-cover"
//                     />
//                     <div className="absolute inset-0  bg-opacity-40 flex items-center justify-center">
//                         <div className="text-center text-white">
//                             <h1 className="text-4xl font-bold mb-2">Welcome to Old 90's</h1>
//                             <p className="text-xl">Scan & Order Your Favorite Dishes</p>
//                         </div>
//                     </div>
//                 </div>
//             ) : (
//                 <div className="bg-purple-800 text-white py-16 text-center">
//                     <h1 className="text-4xl font-bold mb-2">Welcome to Old 90's</h1>
//                     <p className="text-xl">Scan & Order Your Favorite Dishes</p>
//                 </div>
//             )}

//             {/* Main Content */}
//             <div className="max-w-7xl mx-auto px-4 py-6">
//                 <h2 className="text-2xl font-bold text-center mb-6">Table Number: {tableNumber}</h2>

//                 {/* Category Tabs */}
//                 <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
//                     {menuCategories.map(category => {
//                         const categoryData = categories.find(c => c.categoryName === category);
//                         return (
//                             <button
//                                 key={category}
//                                 onClick={() => setSelectedCategory(category)}
//                                 className={`flex items-center gap-2 px-6 py-3 rounded-lg whitespace-nowrap font-medium transition-colors ${selectedCategory === category
//                                     ? 'bg-purple-600 text-white'
//                                     : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
//                                     }`}
//                             >
//                                 {categoryData?.categoryImage && category !== 'All' && (
//                                     <img
//                                         src={categoryData.categoryImage}
//                                         alt={category}
//                                         className="w-6 h-6 rounded-full object-cover"
//                                     />
//                                 )}
//                                 {category}
//                             </button>
//                         );
//                     })}
//                 </div>

//                 {/* Menu Items Grid */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
//                     {filteredItems.map(item => {
//                         const hasSizes = item.sizes && item.sizes.length > 0;
//                         const selectedSize = hasSizes ? selectedSizes[item._id] : null;

//                         return (
//                             <div
//                                 key={item._id}
//                                 className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col justify-between h-[480px] sm:h-[500px] w-full max-w-[360px] mx-auto transition-transform hover:scale-[1.02]"
//                             >
//                                 <img
//                                     src={item.itemImage || 'https://via.placeholder.com/300x200?text=No+Image'}
//                                     alt={item.itemName}
//                                     className="w-full h-48 object-cover"
//                                 />
//                                 <div className="p-4 flex-1 flex flex-col justify-between">
//                                     <div>
//                                         <h3 className="text-lg font-bold mb-1">{item.itemName}</h3>
//                                         <p className="text-gray-600 text-sm mb-2">{item.categoryName}</p>

//                                         {hasSizes ? (
//                                             <div className="mb-3">
//                                                 <p className="text-sm font-medium mb-2">Select Size:</p>
//                                                 <div className="flex flex-wrap gap-2">
//                                                     {item.sizes.map((sizeOption, idx) => {
//                                                         const sizeKey = `${item._id}-${sizeOption?.sizes?.name || sizeOption.price}`;
//                                                         const itemInCart = cart.find(c => c.key === sizeKey);

//                                                         return (
//                                                             <button
//                                                                 key={idx}
//                                                                 onClick={() => setSelectedSizes({ ...selectedSizes, [item._id]: sizeOption })}
//                                                                 className={`relative px-3 py-2 rounded-lg border text-sm flex-grow flex flex-col items-center justify-center transition-all ${selectedSizes[item._id]?.price === sizeOption.price
//                                                                     ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-500'
//                                                                     : 'border-gray-300 hover:border-purple-400'
//                                                                     }`}
//                                                             >
//                                                                 {itemInCart && (
//                                                                     <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center z-10">
//                                                                         {itemInCart.quantity}
//                                                                     </span>
//                                                                 )}
//                                                                 <span>{sizeOption.name || `Option ${idx + 1}`}</span>
//                                                                 <span className="font-bold text-purple-600 mt-1">₹ {sizeOption.price}</span>
//                                                             </button>
//                                                         );
//                                                     })}
//                                                 </div>
//                                             </div>
//                                         ) : (
//                                             <p className="text-xl font-bold text-purple-600 mb-3">
//                                                 ₹ {item.price.toFixed(2)}
//                                             </p>
//                                         )}
//                                     </div>

//                                     <div className="mt-4">
//                                         {hasSizes ? (
//                                             <button
//                                                 onClick={() => {
//                                                     if (!selectedSize) {
//                                                         alert('Please select a size first!');
//                                                         return;
//                                                     }
//                                                     addToCart(item, selectedSize);
//                                                 }}
//                                                 className={`w-full py-3 rounded-lg font-semibold transition-colors text-white ${!selectedSize
//                                                     ? 'bg-gray-400 cursor-not-allowed'
//                                                     : 'bg-purple-600 hover:bg-purple-700'
//                                                     }`}
//                                                 disabled={!selectedSize}
//                                             >
//                                                 {selectedSize ? `Add ${selectedSize.size || `(₹ ${selectedSize.price})`}` : 'Select a Size'}
//                                             </button>
//                                         ) : (
//                                             (() => {
//                                                 const cartItem = cart.find(c => c.key === item._id);
//                                                 if (cartItem) {
//                                                     return (
//                                                         <div className="flex items-center justify-center gap-4">
//                                                             <button
//                                                                 onClick={() => updateQuantity(cartItem.key, -1)}
//                                                                 className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-200 text-purple-800 font-bold text-lg hover:bg-purple-300 transition"
//                                                             > <Minus size={20} /> </button>
//                                                             <span className="font-bold text-xl w-8 text-center">{cartItem.quantity}</span>
//                                                             <button
//                                                                 onClick={() => updateQuantity(cartItem.key, 1)}
//                                                                 className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-200 text-purple-800 font-bold text-lg hover:bg-purple-300 transition"
//                                                             > <Plus size={20} /> </button>
//                                                         </div>
//                                                     );
//                                                 } else {
//                                                     return (
//                                                         <button
//                                                             onClick={() => addToCart(item)}
//                                                             className='w-full py-3 rounded-lg font-semibold transition-colors text-white bg-purple-600 hover:bg-purple-700'
//                                                         > Add to Cart </button>
//                                                     );
//                                                 }
//                                             })()
//                                         )}
//                                     </div>
//                                 </div>
//                             </div>
//                         );
//                     })}
//                 </div>
//             </div>

//             {/* Cart Dialog */}
//             {cartOpen && (
//                 <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
//                     <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
//                         {/* Cart Header */}
//                         <div className="p-4 border-b flex items-center justify-between">
//                             <div className="flex items-center gap-3">
//                                 <ShoppingCart className="w-6 h-6 text-purple-600" />
//                                 <h2 className="text-xl font-bold text-gray-800">Your Order</h2>
//                             </div>
//                             <button onClick={() => setCartOpen(false)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
//                                 <X className="w-6 h-6 text-gray-600" />
//                             </button>
//                         </div>

//                         {/* Cart Body */}
//                         <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
//                             {cart.length === 0 ? (
//                                 <div className="text-center text-gray-500 py-16">
//                                     <p className="font-semibold text-lg">Your cart is empty</p>
//                                     <p className="text-sm">Add some delicious items from the menu!</p>
//                                 </div>
//                             ) : (
//                                 <div className="space-y-3">
//                                     {cart.map(item => (
//                                         <div key={item.key} className="flex gap-4 p-3 border bg-white rounded-lg shadow-sm items-center">
//                                             <img src={item.itemImage || 'https://via.placeholder.com/80x80'} alt={item.displayName} className="w-20 h-20 object-cover rounded-md" />
//                                             <div className="flex-1">
//                                                 <h3 className="font-bold text-gray-800">
//                                                     {item.itemName}
//                                                     {item.selectedSize?.size && (<span className="text-sm font-medium text-gray-500"> ({item.selectedSize.size})</span>)}
//                                                 </h3>
//                                                 <p className="text-sm text-gray-500">{item.categoryName}</p>
//                                                 <p className="text-purple-600 font-semibold mt-1">
//                                                     ₹{item.price.toFixed(2)}
//                                                 </p>
//                                             </div>
//                                             <div className="flex items-center gap-3">
//                                                 <button onClick={() => updateQuantity(item.key, -1)} className="p-1.5 h-7 w-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition"><Minus className="w-4 h-4" /></button>
//                                                 <span className="font-semibold w-8 text-center text-lg">{item.quantity}</span>
//                                                 <button onClick={() => updateQuantity(item.key, 1)} className="p-1.5 h-7 w-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition"><Plus className="w-4 h-4" /></button>
//                                             </div>
//                                             <p className="font-bold text-lg text-gray-800 w-24 text-right">₹{(item.price * item.quantity).toFixed(2)}</p>
//                                             <button onClick={() => removeFromCart(item.key)} className="p-2 self-center hover:bg-red-100 text-red-500 rounded-full transition"><Trash2 className="w-5 h-5" /></button>
//                                         </div>
//                                     ))}
//                                 </div>
//                             )}
//                         </div>

//                         {/* Cart Footer with Summary */}
//                         {cart.length > 0 && (
//                             <div className="p-4 border-t bg-white">

//                                 <hr className="my-3" />

//                                 <div className="flex items-center justify-between text-xl font-bold bg-purple-100 text-purple-800 p-3 rounded-lg">
//                                     <span>Total</span>
//                                     <span>₹ {getTotalPrice().toFixed(2)}</span>
//                                 </div>

//                                 <button onClick={handleCheckout} className="mt-4 w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors text-lg">
//                                     Place Order ({getTotalItems()} items)
//                                 </button>
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             )}

//             {/* Checkout Dialog remains the same */}
//             {checkoutOpen && (
//                 <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
//                     <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
//                         <div className="p-4 border-b flex items-center justify-between">
//                             <h2 className="text-xl font-bold">User Details</h2>
//                             <button
//                                 onClick={() => setCheckoutOpen(false)}
//                                 className="p-1 hover:bg-gray-100 rounded"
//                             >
//                                 <X className="w-6 h-6" />
//                             </button>
//                         </div>

//                         <div className="flex-1 overflow-y-auto p-4">
//                             {customerError && (
//                                 <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
//                                     {customerError}
//                                 </div>
//                             )}
//                             {existingCustomer && (
//                                 <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
//                                     Welcome back, {existingCustomer.name}!
//                                 </div>
//                             )}

//                             <div className="space-y-4">
//                                 <div>
//                                     <label className="block text-sm font-medium mb-1">
//                                         Phone Number <span className="text-red-500">*</span>
//                                     </label>
//                                     <input
//                                         type="tel"
//                                         value={customerForm.phoneNumber}
//                                         onChange={handlePhoneChange}
//                                         className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
//                                         placeholder="Enter phone number"
//                                     />
//                                 </div>

//                                 <div>
//                                     <label className="block text-sm font-medium mb-1">
//                                         Name <span className="text-red-500">*</span>
//                                     </label>
//                                     <input
//                                         type="text"
//                                         value={customerForm.name}
//                                         onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
//                                         className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
//                                         placeholder="Enter name"
//                                     />
//                                 </div>

//                                 <div>
//                                     <label className="block text-sm font-medium mb-1">Email</label>
//                                     <input
//                                         type="email"
//                                         value={customerForm.email}
//                                         onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
//                                         className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
//                                         placeholder="Enter email"
//                                     />
//                                 </div>

//                                 <div>
//                                     <label className="block text-sm font-medium mb-1">
//                                         Order Type <span className="text-red-500">*</span>
//                                     </label>
//                                     <select
//                                         value={customerForm.orderType}
//                                         onChange={(e) => setCustomerForm({ ...customerForm, orderType: e.target.value })}
//                                         className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
//                                     >
//                                         <option value="In Restaurant">In Restaurant</option>
//                                         <option value="Takeaway">Takeaway</option>
//                                         <option value="Delivery">Delivery</option>
//                                     </select>
//                                 </div>

//                                 {(customerForm.orderType === 'Delivery' || customerForm.orderType === 'Takeaway') && (
//                                     <div>
//                                         <label className="block text-sm font-medium mb-1">Address</label>
//                                         <textarea
//                                             value={customerForm.address}
//                                             onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
//                                             className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
//                                             rows="3"
//                                             placeholder="Enter address"
//                                         />
//                                     </div>
//                                 )}
//                             </div>
//                         </div>

//                         <div className="p-4 border-t">
//                             <button
//                                 onClick={handleSubmitOrder}
//                                 className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
//                             >
//                                 Submit Order
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}

//         </div>
//     );
// };

// export default RestaurantOrderingApp;