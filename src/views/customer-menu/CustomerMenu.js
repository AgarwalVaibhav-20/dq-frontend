import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBanners } from '../../redux/slices/bannerSlice';
import { fetchCustomers, addCustomer } from '../../redux/slices/customerSlice';
import { fetchMenuItems } from '../../redux/slices/menuSlice';
import { fetchCategories } from '../../redux/slices/categorySlice';
import { fetchSubCategories } from '../../redux/slices/subCategorySlice';
import { useLocation } from 'react-router-dom';
const RestaurantOrderingApp = () => {
    const { search } = useLocation();
    const query = new URLSearchParams(search);
    const [tableNumber, setTableNumber] = useState(
        query.get('table') || localStorage.getItem('tableNumber') || '1'
    );
    useEffect(() => {
        // Keep localStorage updated
        localStorage.setItem('tableNumber', tableNumber);
    }, [tableNumber]);
    const token = localStorage.getItem('authToken')
    const [bannerData, setBannerData] = useState({
        banner_1: null,
        banner_2: null,
        banner_3: null,
    })
    const dispatch = useDispatch()
    const { banners, loading, loadingUpdate } = useSelector((state) => state.banner)
    const { menuItems, loading: menuItemsLoading } = useSelector(
        (state) => state.menuItems
    );
    const { categories } = useSelector(state => state.category);

    useEffect(() => {
        if (token) {
            dispatch(fetchBanners({ token }));
            dispatch(fetchMenuItems(token))
        }
    }, [dispatch, token]);

    useEffect(() => {
        console.log(banners, "banners");
        console.log(menuItems, " menuItems")
        console.log(banners[0]?.banner_1, "banners[0]?.banner_1")
    }, [banners, menuItems]);


    const [cart, setCart] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [cartOpen, setCartOpen] = useState(false);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    // const [tableNumber] = useState('1');
    const [selectedSizes, setSelectedSizes] = useState({});

    // Customer form state
    const [customerForm, setCustomerForm] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        orderType: 'In Restaurant',
        address: ''
    });
    const [existingCustomer, setExistingCustomer] = useState(null);
    const [customerError, setCustomerError] = useState('');

    // Filter only active menu items (status = 1)
    const activeMenuItems = menuItems.filter(item => item.status === 1);

    // Get unique categories from menu items
    const menuCategories = ['All', ...new Set(activeMenuItems.map(item => item.categoryName).filter(Boolean))];

    const filteredItems = selectedCategory === 'All'
        ? activeMenuItems
        : activeMenuItems.filter(item => item.categoryName === selectedCategory);

    const addToCart = (item, selectedSize = null) => {
        // create a unique key (includes size if applicable)
        const itemKey = selectedSize ? `${item._id}-${selectedSize.size}` : item._id;

        // decide correct price and display name
        const price = selectedSize ? Number(selectedSize.price) : Number(item.price);
        const displayName = selectedSize
            ? `${item.itemName} (${selectedSize.size})`
            : item.itemName;

        // check if item with this key already exists
        const existingItem = cart.find(cartItem => cartItem.key === itemKey);

        if (existingItem) {
            // update quantity if item already exists
            setCart(
                cart.map(cartItem =>
                    cartItem.key === itemKey
                        ? { ...cartItem, quantity: cartItem.quantity + 1 }
                        : cartItem
                )
            );
        } else {
            // add new item with correct size, price, and name
            setCart([
                ...cart,
                {
                    ...item,
                    key: itemKey,
                    displayName,
                    price,
                    selectedSize,
                    quantity: 1,
                },
            ]);
        }

        // reset selected size for that item (optional)
        if (selectedSize) {
            setSelectedSizes(prev => ({ ...prev, [item._id]: null }));
        }
    };


    const updateQuantity = (itemKey, delta) => {
        setCart(cart.map(item =>
            item.key === itemKey
                ? { ...item, quantity: Math.max(0, item.quantity + delta) }
                : item
        ).filter(item => item.quantity > 0));
    };

    const removeFromCart = (itemKey) => {
        setCart(cart.filter(item => item.key !== itemKey));
    };

    const getTotalPrice = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getTotalItems = () => {
        return cart.reduce((total, item) => total + item.quantity, 0);
    };

    const handleCheckout = () => {
        if (cart.length === 0) return;
        setCartOpen(false);
        setCheckoutOpen(true);
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
        }
    };

    const handlePhoneChange = (e) => {
        const phone = e.target.value;
        setCustomerForm({ ...customerForm, phoneNumber: phone });
        checkExistingCustomer(phone);
    };

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
            const token = localStorage.getItem('authToken');
            const restaurantId = localStorage.getItem('restaurantId');

            // If customer doesn't exist, create new customer
            if (!existingCustomer) {
                // In your actual app:
                // await dispatch(addCustomer({ token, ...customerForm, restaurantId })).unwrap();
                console.log('Creating new customer:', customerForm);
            }

            const orderData = {
                customer: existingCustomer || customerForm,
                items: cart.map(item => ({
                    menuItemId: item._id,
                    itemName: item.displayName,
                    price: item.price,
                    quantity: item.quantity,
                    size: item.selectedSize?.size || null
                })),
                total: getTotalPrice(),
                tableNumber,
                orderType: customerForm.orderType,
                restaurantId,
                timestamp: new Date().toISOString()
            };

            console.log('Order placed:', orderData);
            alert('Order placed successfully!');

            setCart([]);
            setCheckoutOpen(false);
            setCustomerForm({
                name: '',
                email: '',
                phoneNumber: '',
                orderType: 'In Restaurant',
                address: ''
            });
            setExistingCustomer(null);
            setCustomerError('');
        } catch (error) {
            setCustomerError('Failed to process order. Please try again.');
            console.error('Order error:', error);
        }
    };

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
                        const inCart = cart.find(c => c.key === item._id || c._id === item._id);
                        const hasSizes = item.sizes && item.sizes.length > 0;

                        return (
                            <div
                                key={item._id}
                                className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col justify-between 
             h-[480px] sm:h-[500px] w-full max-w-[360px] mx-auto transition-transform hover:scale-[1.02]"
                            >

                                <img
                                    src={item.itemImage || 'https://via.placeholder.com/300x200?text=No+Image'}
                                    alt={item.itemName}
                                    className="w-full h-48 object-cover"
                                />
                                <div className="p-4">
                                    <h3 className="text-lg font-bold mb-1">{item.itemName}</h3>
                                    <p className="text-gray-600 text-sm mb-2">{item.categoryName}</p>

                                    {item.stockItems && item.stockItems.length > 0 && (
                                        <div className="mb-3">
                                            <p className="text-xs text-gray-500 mb-1">Ingredients:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {item.stockItems.map((stock, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded"
                                                    >
                                                        {stock.stockName}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {hasSizes ? (
                                        item.sizes.length === 1 ? (
                                            // ✅ Only one size — show price directly
                                            <p className="text-xl font-bold text-purple-600 mb-3">
                                                ₹ {item.sizes[0].price.toFixed(2)}
                                            </p>
                                        ) : (
                                            // ✅ Multiple sizes — show selection
                                            <div className="mb-3">
                                                <p className="text-sm font-medium mb-2">Select Size:</p>
                                                <div className="space-y-2 flex">
                                                    {item.sizes.map((sizeOption, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() =>
                                                                setSelectedSizes({ ...selectedSizes, [item._id]: sizeOption })
                                                            }
                                                            className={`w-full px-3 py-2 rounded border text-sm flex justify-center items-center ${selectedSizes[item._id]?.size === sizeOption.size
                                                                ? 'border-purple-600 bg-purple-50'
                                                                : 'border-gray-300 hover:border-purple-400'
                                                                }`}
                                                        >
                                                            <span>{sizeOption.size}</span>
                                                            <span className="font-bold text-purple-600">₹ {sizeOption.price}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    ) : (
                                        // ✅ No sizes — show regular price
                                        <p className="text-xl font-bold text-purple-600 mb-3">
                                            ₹ {item.price.toFixed(2)}
                                        </p>
                                    )}


                                    <button
                                        onClick={() => {
                                            if (hasSizes) {
                                                const selectedSize = selectedSizes[item._id];
                                                if (!selectedSize) {
                                                    alert('Please select a size before adding to cart');
                                                    return;
                                                }
                                                addToCart(item, selectedSize);
                                            } else {
                                                addToCart(item);
                                            }
                                        }}
                                        className={`w-full py-2 rounded-lg font-medium transition-colors ${hasSizes && !selectedSizes[item._id]
                                            ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                                            : inCart
                                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                                : 'bg-purple-600 hover:bg-purple-700 text-white'
                                            }`}
                                        disabled={hasSizes && !selectedSizes[item._id]}
                                    >
                                        {hasSizes && !selectedSizes[item._id]
                                            ? 'Select Size'
                                            : inCart
                                                ? 'Added to Cart'
                                                : 'Add to Cart'}
                                    </button>

                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Cart Dialog */}
            {cartOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b flex items-center justify-between">
                            <h2 className="text-xl font-bold">Your Cart</h2>
                            <button
                                onClick={() => setCartOpen(false)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {cart.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">Your cart is empty</p>
                            ) : (
                                <div className="space-y-4">
                                    {cart.map(item => (
                                        <div key={item.key} className="flex gap-4 pb-4 border-b">
                                            <img
                                                src={item.itemImage || 'https://via.placeholder.com/80x80'}
                                                alt={item.displayName}
                                                className="w-20 h-20 object-cover rounded"
                                            />
                                            <div className="flex-1">
                                                <h3 className="font-semibold">
                                                    {item.itemName}
                                                    {item.selectedSize?.size && (
                                                        <span className="text-sm text-gray-500"> ({item.selectedSize.size})</span>
                                                    )}
                                                </h3>
                                                <p className="text-sm text-gray-600">{item.categoryName}</p>
                                                <p className="text-purple-600 font-bold">
                                                    ₹ {(item.price * item.quantity).toFixed(2)}{' '}
                                                    <span className="text-xs text-gray-500 ml-1">
                                                        ({item.quantity} × ₹{item.price.toFixed(2)})
                                                    </span>
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => updateQuantity(item.key, -1)}
                                                    className="p-1 hover:bg-gray-100 rounded"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="font-semibold w-8 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.key, 1)}
                                                    className="p-1 hover:bg-gray-100 rounded"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => removeFromCart(item.key)}
                                                    className="p-1 hover:bg-red-100 text-red-600 rounded ml-2"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="pt-4 flex items-center justify-between text-xl font-bold">
                                        <span>Total:</span>
                                        <span className="text-purple-600">₹ {getTotalPrice().toFixed(2)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t">
                            <button
                                onClick={handleCheckout}
                                disabled={cart.length === 0}
                                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                            >
                                Place Order
                            </button>
                        </div>
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

            {/* Fixed View Cart Button */}
            {cart.length > 0 && !cartOpen && !checkoutOpen && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-11/12 max-w-xl z-40">
                    <button
                        onClick={() => setCartOpen(true)}
                        className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-lg transition-colors text-lg"
                    >
                        {getTotalItems()} items added to Cart - View Cart
                    </button>
                </div>
            )}
        </div>
    );
};

export default RestaurantOrderingApp;