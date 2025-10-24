import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { CButton, CSpinner, CCard, CCardBody } from "@coreui/react";
import { toast } from "react-toastify";

import {
  addMenuItem,
  deleteMenuItem,
  fetchMenuItems,
  updateMenuItem,
  updateMenuItemStatus,
} from "../../redux/slices/menuSlice";
import { fetchCategories } from "../../redux/slices/categorySlice";
import { fetchSubCategories } from "../../redux/slices/subCategorySlice";
import { fetchInventories } from "../../redux/slices/stockSlice";

import CommonModal from "../../components/CommonModal";
import MenuItemList from "../../components/MenuItemList";
import EditStockModal from "../../components/EditStockModal";

const Menu = () => {
  const dispatch = useDispatch();
  const { menuItems, loading: menuItemsLoading } = useSelector(
    (state) => state.menuItems
  );
  const { categories } = useSelector((state) => state.category);
  const { inventories } = useSelector((state) => state.inventories);
  const { subCategories } = useSelector((state) => state.subCategory);
  const restaurantId = useSelector((state) => state.auth.restaurantId);
  const token = localStorage.getItem("authToken");

  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editStockModalVisible, setEditStockModalVisible] = useState(false);

  const [selectedMenu, setSelectedMenu] = useState(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [selectedSize, setSelectedSize] = useState(""); // New state for selected size

  // ✅ FIXED: Initialize with proper structure
  const [formData, setFormData] = useState({
    menuId: "",
    itemName: "",
    categoryId: "",
    restaurantId: "",
    itemImage: "",
    sub_category: "",
    stock: 0,
    sizes: [{ name: "", price: "", enabled: true }],
    stockItems: [{ stockId: "", quantity: "", unit: "", size: "", price: "" }],
    description: "",
    preparationTime: "",
    rewardPoints: 0
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ------------------ Fetch Data ------------------
  useEffect(() => {
    const fetchData = async () => {
      console.log('🔍 Menu Page Debug:');
      console.log('restaurantId:', restaurantId);
      console.log('token:', token ? 'Present' : 'Missing');
      
      if (!restaurantId || !token) {
        console.log('❌ Missing restaurantId or token');
        return;
      }
      
      try {
        console.log('✅ Fetching menu data with restaurantId:', restaurantId);
        await Promise.all([
          dispatch(fetchCategories({ restaurantId, token })),
          dispatch(fetchInventories({ token })),
          dispatch(fetchMenuItems({ restaurantId, token })),
        ]);

        const subCategoryResult = await dispatch(
          fetchSubCategories({ restaurantId, token })
        );
        if (fetchSubCategories.fulfilled.match(subCategoryResult)) {
          console.log("✅ SubCategories fetched:", subCategoryResult.payload);
        } else {
          console.error(
            "❌ SubCategories fetch failed:",
            subCategoryResult.error
          );
        }
      } catch (error) {
        console.error("❌ Error fetching data:", error);
        toast.error("Failed to fetch data");
      }
    };
    fetchData();
  }, [dispatch, restaurantId, token]);

  // ✅ FIXED: Handle existing menu data properly
  useEffect(() => {
    if (selectedMenu) {
      // Transform database sizes (with 'label') to frontend format (with 'name')
      const transformedSizes = Array.isArray(selectedMenu.sizes) && selectedMenu.sizes.length > 0
        ? selectedMenu.sizes.map(size => ({
          name: String(size.label || size.name || ""),
          price: Number(size.price) || "",
          enabled: size.enabled !== undefined ? size.enabled : true
        }))
        : [{ name: "", price: "", enabled: true }];

      // ✅ FIXED: Properly handle stockItems with units, size and price
      const transformedStockItems = selectedMenu.stockItems?.length
        ? selectedMenu.stockItems.map(item => ({
          stockId: item.stockId || "",
          quantity: item.quantity || "",
          unit: item.unit || "",
          size: item.size || "",
          price: item.price || ""
        }))
        : [{ stockId: "", quantity: "", unit: "", size: "", price: "" }];

      setFormData({
        menuId: selectedMenu.menuId || "",
        itemName: selectedMenu.itemName || "",
        categoryId: selectedMenu.categoryId?._id || "",
        sub_category: selectedMenu.sub_category || "",
        itemImage: null,
        price: selectedMenu.price || "",
        sizes: transformedSizes,
        stockItems: transformedStockItems,
        description: selectedMenu.description || "",
        preparationTime: selectedMenu.preparationTime || "",
      });
      setPreviewImage(selectedMenu.itemImage);
    }
  }, [selectedMenu]);

  // ------------------ Handlers ------------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "categoryId" ? { sub_category: "" } : {}),
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setFormData((prev) => ({ ...prev, itemImage: file }));
    setPreviewImage(URL.createObjectURL(file));
  };

  // ✅ FIXED: Add function to handle stock items properly
  const handleStockItemChange = (index, field, value) => {
    const updatedStockItems = [...formData.stockItems];
    updatedStockItems[index] = {
      ...updatedStockItems[index],
      [field]: value
    };
    
    // 🔍 DEBUG: Log stock item changes
    console.log("🔍 DEBUG - Stock item change:");
    console.log("index:", index, "field:", field, "value:", value);
    console.log("updatedStockItems[index]:", updatedStockItems[index]);
    
    setFormData(prev => ({ ...prev, stockItems: updatedStockItems }));
  };

  const addStockItem = () => {
    if (!selectedSize) {
      toast.error("Please select a size first", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }
    
    // Find the price for the selected size
    const selectedSizeData = formData.sizes.find(size => size.name === selectedSize);
    const sizePrice = selectedSizeData ? selectedSizeData.price : "";
    
    console.log("🔍 DEBUG - Add stock item:");
    console.log("selectedSize:", selectedSize);
    console.log("All formData.sizes:", formData.sizes);
    console.log("selectedSizeData:", selectedSizeData);
    console.log("sizePrice:", sizePrice);
    
    const newStockItem = { 
      stockId: "", 
      quantity: "", 
      unit: "", 
      size: selectedSize, 
      price: sizePrice 
    };
    
    console.log("🔍 DEBUG - New stock item:", newStockItem);
    
    setFormData(prev => ({
      ...prev,
      stockItems: [...prev.stockItems, newStockItem]
    }));
  };

  // Function to create stock items for all sizes
  const createStockItemsForAllSizes = () => {
    const allSizes = formData.sizes.filter(size => size.name?.trim() && size.price && Number(size.price) > 0);
    const allStockItems = [];
    
    allSizes.forEach(size => {
      // Check if stock items already exist for this size
      const existingItemsForSize = formData.stockItems.filter(item => item.size === size.name);
      
      if (existingItemsForSize.length === 0) {
        // Create a default stock item for this size
        allStockItems.push({
          stockId: "",
          quantity: "",
          unit: "",
          size: size.name,
          price: size.price
        });
      } else {
        // Keep existing items for this size
        allStockItems.push(...existingItemsForSize);
      }
    });
    
    setFormData(prev => ({
      ...prev,
      stockItems: allStockItems
    }));
  };

  // Update existing stock items when size changes
  const handleSizeChange = (newSize) => {
    console.log("🔍 DEBUG - Size change:", newSize);
    console.log("🔍 DEBUG - All formData.sizes:", formData.sizes);
    setSelectedSize(newSize);
    
    // Find the price for the selected size
    const selectedSizeData = formData.sizes.find(size => size.name === newSize);
    const sizePrice = selectedSizeData ? selectedSizeData.price : "";
    
    console.log("🔍 DEBUG - Selected size data:", selectedSizeData);
    console.log("🔍 DEBUG - Size price:", sizePrice);
    
    // Filter stock items for the selected size only
    if (newSize) {
      const filteredStockItems = formData.stockItems.filter(item => item.size === newSize);
      console.log("🔍 DEBUG - Filtered stock items for size:", newSize, filteredStockItems);
      // Don't update all items, just filter for current size
    }
  };

  const removeStockItem = (index) => {
    if (formData.stockItems.length > 1) {
      const updatedStockItems = formData.stockItems.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, stockItems: updatedStockItems }));
    }
  };

  const handleCancel = () => {
    setFormData({
      menuId: "",
      itemName: "",
      categoryId: "",
      sub_category: "",
      itemImage: null,
      price: "",
      sizes: [{ name: "", price: "", enabled: true }],
      stockItems: [{ stockId: "", quantity: "", unit: "", size: "", price: "" }],
      description: "",
      preparationTime: "",
    });

    setPreviewImage(null);
    setModalVisible(false);
    setEditModalVisible(false);
    setActiveTab("basic");
    setSelectedSize(""); // Reset selected size
  };
  const handleAddMenuItem = async () => {
    setIsSubmitting(true);
    try {
      const validSizes = formData.sizes.filter(size =>
        size.name?.trim() && size.price && Number(size.price) > 0
      );

      if (validSizes.length === 0) {
        toast.error("Please enter at least one size and price before saving.", {
          position: "top-center",
          autoClose: 3000,
        });
        setIsSubmitting(false);
        return;
      }

      const validStockItems = formData.stockItems.filter(item =>
        item.stockId?.trim() &&
        item.quantity &&
        Number(item.quantity) > 0 &&
        item.unit?.trim() &&
        item.size?.trim() &&  // ✅ ADD SIZE VALIDATION
        item.price &&          // ✅ ADD PRICE VALIDATION
        Number(item.price) > 0
      );

      // 🚨 NEW VALIDATION: Require at least one inventory
      if (validStockItems.length === 0) {
        toast.error("Inventory is required. Please select at least one stock item with size and price.", {
          position: "top-center",
          autoClose: 3000,
        });
        setActiveTab("inventory"); // 👈 Automatically switch to the inventory tab
        setIsSubmitting(false);
        return;
      }

      const dataToSend = {
        ...formData,
        restaurantId,
        sizes: validSizes,
        stockItems: validStockItems,
      };

      // 🔍 DEBUG: Log the data being sent
      console.log("🔍 DEBUG - Data being sent to backend:");
      console.log("validStockItems:", validStockItems);
      console.log("selectedSize:", selectedSize);
      console.log("Full dataToSend:", dataToSend);

      await dispatch(addMenuItem({ ...dataToSend, token })).unwrap();
      await dispatch(fetchMenuItems({ token, restaurantId }));
      handleCancel();
      toast.success("Menu item added successfully!");
    } catch (error) {
      console.error("❌ Add menu item error:", error);
      toast.error(error.message || "Failed to add menu item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // const handleAddMenuItem = async () => {
  //   setIsSubmitting(true);
  //   try {
  //     const validSizes = formData.sizes.filter(size =>
  //       size.name?.trim() && size.price && Number(size.price) > 0
  //     );

  //     // 🚨 Show erroring if no valid sizes
  //     if (validSizes.length === 0) {
  //       toast.error("Please enter at least one size and price before saving.", {
  //         position: "top-center",
  //         autoClose: 3000,
  //       });
  //       setIsSubmitting(false);
  //       return;
  //     }

  //     const validStockItems = formData.stockItems.filter(item =>
  //       item.stockId?.trim() &&
  //       item.quantity &&
  //       Number(item.quantity) > 0 &&
  //       item.unit?.trim()
  //     );

  //     const dataToSend = {
  //       ...formData,
  //       restaurantId,
  //       sizes: validSizes,
  //       stockItems: validStockItems
  //     };

  //     await dispatch(addMenuItem({ ...dataToSend, token })).unwrap();
  //     await dispatch(fetchMenuItems({ token, restaurantId }));
  //     handleCancel();
  //     toast.success("Menu item added successfully!");
  //   } catch (error) {
  //     console.error("❌ Add menu item error:", error);
  //     toast.error(error.message || "Failed to add menu item.");
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };


  const handleEditMenuItem = async () => {
    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("itemName", formData.itemName);
      formDataToSend.append("categoryId", formData.categoryId);
      formDataToSend.append("sub_category", formData.sub_category);
      formDataToSend.append("price", formData.price);
      formDataToSend.append("description", formData.description || "");
      formDataToSend.append("preparationTime", formData.preparationTime || "");

      // ✅ FIXED: Handle sizes properly
      const validSizes = formData.sizes.filter(size =>
        size.name?.trim() && size.price && Number(size.price) > 0
      );

      if (validSizes.length > 0) {
        // Convert to the format expected by backend
        const sizesForBackend = validSizes.map(size => ({
          name: size.name,
          label: size.name, // Backward compatibility
          price: Number(size.price),
          enabled: size.enabled !== undefined ? size.enabled : true
        }));
        formDataToSend.append("sizes", JSON.stringify(sizesForBackend));
      }

      // ✅ FIXED: Handle stockItems properly with validation including size and price
      const validStockItems = formData.stockItems.filter(item =>
        item.stockId?.trim() &&
        item.quantity &&
        Number(item.quantity) > 0 &&
        item.unit?.trim() &&
        item.size?.trim() &&  // ✅ ADD SIZE VALIDATION
        item.price &&          // ✅ ADD PRICE VALIDATION
        Number(item.price) > 0
      );

      if (validStockItems.length > 0) {
        const stockItemsForBackend = validStockItems.map(item => ({
          stockId: item.stockId,
          quantity: Number(item.quantity),
          unit: item.unit,
          size: item.size,           // ✅ ADD SIZE FIELD
          price: Number(item.price)  // ✅ ADD PRICE FIELD
        }));
        formDataToSend.append("stockItems", JSON.stringify(stockItemsForBackend));
        console.log("📦 Sending stockItems:", stockItemsForBackend);
      }

      if (formData.itemImage instanceof File) {
        formDataToSend.append("itemImage", formData.itemImage);
      }

      await dispatch(
        updateMenuItem({
          id: selectedMenu._id,
          formData: formDataToSend,
          restaurantId,
          token,
        })
      ).unwrap();

      await dispatch(fetchMenuItems({ token }));
      handleCancel();
      toast.success("Menu item updated successfully!");
    } catch (error) {
      console.error("❌ Update menu item error:", error);
      toast.error(error.message || "Failed to update menu item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // In Menu.js

  const handleDeleteMenuItem = async () => {
    setIsSubmitting(true);
    try {
      await dispatch(
        deleteMenuItem({ id: selectedMenu._id, token })
      ).unwrap();

      await dispatch(fetchMenuItems({ restaurantId, token }));

      setDeleteModalVisible(false);
      toast.success("Menu item deleted successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to delete menu item"); e
    } finally {
      setIsSubmitting(false);
    }
  };

  // ------------------ Status Handler ------------------
  const handleUpdateStatus = async (id, currentStatus) => {
    const newStatus =
      currentStatus === "available" ? "unavailable" : "available";
    try {
      await dispatch(
        updateMenuItemStatus({
          id: id,
          status: newStatus,
        })
      ).unwrap();
      await dispatch(fetchMenuItems({ token }));
      toast.success(`Menu item marked as ${newStatus}`);
    } catch (error) {
      toast.error(error.message || "Failed to update status");
    }
  };

  // ------------------ UI ------------------
  return (
    <div className="container-fluid px-2 px-md-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center my-3 my-md-4 gap-3">
        <h2 className="fw-bold mb-0 text-black" style={{ fontSize: '1.5rem' }}>🍽️ Menu </h2>
        <div className="d-flex justify-content-end">
          <CButton
            color="primary"
            className="w-100 w-md-auto"
            size="sm"
            style={{ 
              fontSize: '0.875rem', 
              padding: '0.375rem 0.75rem',
              minWidth: 'auto'
            }}
            onClick={() => {
              setFormData({
                menuId: "",
                itemName: "",
                categoryId: "",
                restaurantId: "",
                itemImage: "",
                sub_category: "",
                stock: 0,
                sizes: [{ name: "", price: "", enabled: true }],
                stockItems: [{ stockId: "", quantity: "", unit: "" }],
                description: "",
                preparationTime: "",
                rewardPoints: 0
              });
              setPreviewImage(null);
              setActiveTab("basic");
              setModalVisible(true);
            }}
          >
            + Add Menu
          </CButton>
        </div>
      </div>

      {/* Menu List */}
      <CCard className="border-0 shadow-sm rounded-4" style={{ overflow: 'hidden' }}>
        <CCardBody className="h-100 p-2 p-md-3">
          <MenuItemList
            menuItems={menuItems}
            menuItemsLoading={menuItemsLoading}
            setSelectedMenu={setSelectedMenu}
            setEditModalVisible={setEditModalVisible}
            setDeleteModalVisible={setDeleteModalVisible}
            setEditStockModalVisible={setEditStockModalVisible}
            onUpdateStatus={handleUpdateStatus}
          />
        </CCardBody>
      </CCard>

      {/* Stock Modal */}
      <EditStockModal
        visible={editStockModalVisible}
        onClose={() => setEditStockModalVisible(false)}
        stockItems={selectedMenu?.stockItems || []}
        inventories={inventories}
        setStockItems={(updated) =>
          setFormData((prev) => ({ ...prev, stockItems: updated }))
        }
      />

      {/* Add/Edit Modal with Tabs */}
      <CommonModal
        visible={modalVisible || editModalVisible}
        onClose={handleCancel}
        title={editModalVisible ? "Edit Menu Item" : "Add Menu Item"}
        onConfirm={editModalVisible ? handleEditMenuItem : handleAddMenuItem}
        confirmButtonText={editModalVisible ? "Update" : "Save Changes"}
        confirmButtonColor="primary"
        isLoading={isSubmitting}
      >
        {/* Tabs */}
        <ul className="nav nav-tabs mb-3" style={{ fontSize: '14px' }}>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "basic" ? "active" : ""}`}
              onClick={() => setActiveTab("basic")}
              style={{ fontSize: '14px', padding: '8px 16px' }}
            >
              Basic Info
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "inventory" ? "active" : ""}`}
              onClick={() => setActiveTab("inventory")}
              style={{ fontSize: '14px', padding: '8px 16px' }}
            >
              Inventory
            </button>
          </li>
        </ul>

        {/* Tab Content */}
        {activeTab === "basic" && (
          <div>
            {/* Item Name */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Menu Id</label>
              <input
                type="text"
                className="form-control"
                name="menuId"
                value={formData.menuId}
                onChange={handleInputChange}
                required
                style={{ fontSize: '14px' }}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Item Name</label>
              <input
                type="text"
                className="form-control"
                name="itemName"
                value={formData.itemName}
                onChange={handleInputChange}
                required
                style={{ fontSize: '14px' }}
              />
            </div>

            {/* Category */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Category</label>
              <select
                name="categoryId"
                className="form-select"
                value={formData.categoryId}
                onChange={handleInputChange}
                required
                style={{ fontSize: '14px' }}
              >
                <option value="">Select Category</option>
                {categories?.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.categoryName}
                  </option>
                ))}
              </select>
            </div>

            {/* Sub Category */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Sub Category</label>
              <select name="sub_category" className="form-select"
                value={formData.sub_category} onChange={handleInputChange} disabled={!formData.categoryId}
                style={{ fontSize: '14px' }} >
                <option value="">Select Sub Category</option>
                {subCategories?.filter((sub) => sub.categoryId === formData.categoryId).map((sub) =>
                  (<option key={sub._id} value={sub._id}> {sub.sub_category_name} </option>))}
              </select>
            </div>

            {/* Base Price */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Base Price</label>
              <input
                type="number"
                className="form-control"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                style={{ fontSize: '14px' }}
              />
            </div>

            {/* Reward System */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Reward Points</label>
              <input
                type="number"
                className="form-control"
                name="rewardPoints"
                value={formData.rewardPoints || 0}
                onChange={handleInputChange}
                min="0"
                placeholder="Enter reward points for this item"
                style={{ fontSize: '14px' }}
              />
              <small className="form-text text-muted" style={{ fontSize: '12px' }}>
                Points earned by customer when purchasing this item
              </small>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Food Sizes & Prices</label>

              {formData.sizes.map((size, index) => (
                <div key={index} className="d-flex flex-column flex-md-row align-items-center gap-2 mb-2">
                  {/* Size Name */}
                  <input
                    type="text"
                    className="form-control flex-fill"
                    placeholder="Size (e.g., Half Plate)"
                    value={size.name || ""}
                    onChange={(e) => {
                      const updatedSizes = [...formData.sizes];
                      updatedSizes[index].name = e.target.value;
                      console.log("🔍 DEBUG - Size name change:", e.target.value);
                      console.log("🔍 DEBUG - Updated sizes:", updatedSizes);
                      setFormData((prev) => ({ ...prev, sizes: updatedSizes }));
                    }}
                    style={{ fontSize: '14px' }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        toast.error("Please Write the size!", {
                          position: "top-center",
                          autoClose: 2000,
                        });
                      }
                    }}
                  />

                  {/* Size Price */}
                  <input
                    type="number"
                    className="form-control flex-fill"
                    placeholder="Price"
                    value={size.price || ""}
                    onChange={(e) => {
                      const updatedSizes = [...formData.sizes];
                      updatedSizes[index].price = e.target.value;
                      console.log("🔍 DEBUG - Size price change:", e.target.value);
                      console.log("🔍 DEBUG - Updated sizes:", updatedSizes);
                      setFormData((prev) => ({ ...prev, sizes: updatedSizes }));
                    }}
                    style={{ fontSize: '14px' }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        toast.error("Press Tab or click outside to move — Enter key is disabled here.", {
                          position: "top-center",
                          autoClose: 2000,
                        });
                      }
                    }}
                  />

                  {/* Remove Button */}
                  <button
                    type="button"
                    className="btn btn-danger btn-sm w-100 w-md-auto"
                    style={{ fontSize: '12px' }}
                    onClick={() => {
                      const updatedSizes = formData.sizes.filter((_, i) => i !== index);
                      setFormData((prev) => ({ ...prev, sizes: updatedSizes }));
                    }}
                  >
                    ✖
                  </button>
                </div>
              ))}

              {/* Add New Size */}
              <button
                type="button"
                className="btn btn-primary btn-sm mt-2"
                style={{ fontSize: '12px' }}
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    sizes: [...prev.sizes, { name: "", price: "", enabled: true }],
                  }))
                }
              >
                ➕ Add Size
              </button>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Item Image</label>
              <input
                type="file"
                className="form-control"
                onChange={handleImageChange}
                style={{ fontSize: '14px' }}
              />
              {previewImage && (
                <div className="d-flex justify-content-center mt-2">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="img-thumbnail"
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "cover",
                      maxWidth: "100%",
                      borderRadius: "8px"
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ✅ UPDATED: Inventory Tab with Size Selection */}
        {activeTab === "inventory" && (
          <div className="mb-3">
            {/* Size Selection */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Select Size for Inventory</label>
              <select
                className="form-select"
                value={selectedSize}
                onChange={(e) => handleSizeChange(e.target.value)}
                style={{ fontSize: '14px' }}
              >
                <option value="">Select Size First</option>
                {formData.sizes
                  .filter(size => size.name?.trim() && size.price)
                  .map((size, index) => (
                    <option key={index} value={size.name}>
                      {size.name} - ₹{size.price}
                    </option>
                  ))}
              </select>
              {!selectedSize && (
                <small className="text-muted">Please select a size from the Basic tab first</small>
              )}
            </div>

            {/* Stock Items for All Sizes */}
            {formData.sizes
              .filter(size => size.name?.trim() && size.price && Number(size.price) > 0)
              .map((size, sizeIndex) => (
                <div key={sizeIndex} className="mb-4">
                  <label className="form-label fw-semibold text-primary">
                    📦 Stock Items for {size.name} (₹{size.price})
                  </label>
                  
                  {formData.stockItems
                    .filter(item => item.size === size.name)
                    .map((stockItem, stockIndex) => {
                      // Find the actual index in the full stockItems array
                      const actualIndex = formData.stockItems.findIndex(item => 
                        item === stockItem
                      );
                      return (
                  <div key={stockIndex} className="d-flex flex-column flex-md-row gap-2 align-items-center mb-2">
                    {/* Size Display (Read-only) */}
                    <input
                      type="text"
                      className="form-control flex-fill"
                      value={stockItem.size || size.name}
                      readOnly
                      style={{ fontSize: '14px', backgroundColor: '#f8f9fa' }}
                    />

                    {/* Inventory Select */}
                    <select
                      className="form-select flex-fill"
                      value={stockItem.stockId || ""}
                      onChange={(e) => handleStockItemChange(actualIndex, 'stockId', e.target.value)}
                      style={{ fontSize: '14px' }}
                    >
                      <option value="">Select Inventory</option>
                      {inventories?.map((inv) => (
                        <option key={inv._id} value={inv._id}>
                          {inv.itemName}
                        </option>
                      ))}
                    </select>

                    {/* Quantity Input */}
                    <input
                      type="number"
                      className="form-control flex-fill"
                      placeholder="Quantity Used"
                      value={stockItem.quantity || ""}
                      onChange={(e) => handleStockItemChange(actualIndex, 'quantity', e.target.value)}
                      style={{ fontSize: '14px' }}
                    />

                    {/* Unit Select */}
                    <select
                      className="form-select flex-fill"
                      value={stockItem.unit || ""}
                      onChange={(e) => handleStockItemChange(actualIndex, 'unit', e.target.value)}
                      style={{ fontSize: '14px' }}
                    >
                      <option value="">Select Unit</option>
                      <option value="kg">kg</option>
                      <option value="gm">gm</option>
                      <option value="litre">litre</option>
                      <option value="ml">ml</option>
                      <option value="pcs">pcs</option>
                      <option value="mg">mg</option>
                    </select>

                    {/* Price Input for this size - HIDDEN */}
                    <input
                      type="number"
                      className="form-control flex-fill"
                      placeholder="Price for this size"
                      value={stockItem.price || ""}
                      onChange={(e) => handleStockItemChange(actualIndex, 'price', e.target.value)}
                      style={{ fontSize: '14px', display: 'none' }}
                    />

                    {/* Remove Button */}
                    <button
                      type="button"
                      className="btn btn-danger btn-sm w-100 w-md-auto"
                      style={{ fontSize: '12px' }}
                      onClick={() => removeStockItem(actualIndex)}
                      disabled={formData.stockItems.length === 1}
                    >
                      ✖
                    </button>
                  </div>
                      );
                    })}

                  {/* Add New Stock Item for this size */}
                  <button
                    type="button"
                    className="btn btn-success btn-sm mt-2"
                    style={{ fontSize: '12px' }}
                    onClick={() => {
                      setSelectedSize(size.name);
                      addStockItem();
                    }}
                  >
                    ➕ Add Stock Item for {size.name}
                  </button>
                </div>
              ))}

            {/* Create Stock Items for All Sizes */}
            <button
              type="button"
              className="btn btn-primary btn-sm mt-3"
              style={{ fontSize: '12px' }}
              onClick={createStockItemsForAllSizes}
            >
              🔄 Create Stock Items for All Sizes
            </button>
          </div>
        )}

      </CommonModal>

      {/* Delete Modal */}
      <CommonModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        title="Delete Menu Item"
        onConfirm={handleDeleteMenuItem}
        confirmButtonText="Delete"
        confirmButtonColor="danger"
        isLoading={isSubmitting}
      >
        <p className="text-muted">
          Are you sure you want to delete this menu item?
        </p>
      </CommonModal>
    </div>
  );
};

export default Menu;