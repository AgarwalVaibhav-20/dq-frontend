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

  // ✅ FIXED: Initialize sizes with correct field names
  const [formData, setFormData] = useState({
    menuId: "",
    itemName: "",
    categoryId: "",
    restaurantId: "",
    itemImage: "",
    sub_category: "",
    stock: 0,
    sizes: [{ name: "", price: "", enabled: true }], // Using 'name' to match frontend
    stockItems: [{ stockId: "", quantity: "" }],
    description: "",
    preparationTime: ""
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ------------------ Fetch Data ------------------
  useEffect(() => {
    const fetchData = async () => {
      if (!restaurantId || !token) return;
      try {
        await Promise.all([
          dispatch(fetchCategories({ restaurantId, token })),
          dispatch(fetchInventories({ token })),
          dispatch(fetchMenuItems({ token })),
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
      const transformedSizes = selectedMenu.sizes?.length
        ? selectedMenu.sizes.map(size => ({
          name: size.label || size.name || "",
          price: size.price || "",
          enabled: size.enabled !== undefined ? size.enabled : true
        }))
        : [{ name: "", price: "", enabled: true }];

      setFormData({
        menuId: selectedMenu.menuId || "",
        itemName: selectedMenu.itemName || "",
        categoryId: selectedMenu.categoryId || "",
        sub_category: selectedMenu.sub_category || "",
        itemImage: null,
        price: selectedMenu.price || "",
        sizes: transformedSizes,
        stockItems: selectedMenu.stockItems?.length
          ? selectedMenu.stockItems
          : [{ stockId: "", quantity: "" }],
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

  const handleCancel = () => {
    setFormData({
      menuId: "",
      itemName: "",
      categoryId: "",
      sub_category: "",
      itemImage: null,
      price: "",
      sizes: [{ name: "", price: "", enabled: true }], // Reset with correct format
      stockItems: [{ stockId: "", quantity: "" }],
      description: "",
      preparationTime: "",
    });

    setPreviewImage(null);
    setModalVisible(false);
    setEditModalVisible(false);
    setActiveTab("basic");
  };

  const handleAddMenuItem = async () => {
    setIsSubmitting(true);
    try {
      // ✅ Validate sizes before sending
      const validSizes = formData.sizes.filter(size =>
        size.name?.trim() && size.price && Number(size.price) > 0
      );

      const dataToSend = {
        ...formData,
        sizes: validSizes // Send only valid sizes
      };

      console.log("Sending sizes:", validSizes);

      await dispatch(addMenuItem({ ...dataToSend, token })).unwrap();
      await dispatch(fetchMenuItems({ restaurantId, token }));
      handleCancel();
      toast.success("Menu item added successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to add menu item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditMenuItem = async () => {
    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("itemName", formData.itemName);
      formDataToSend.append("categoryId", formData.categoryId);
      formDataToSend.append("sub_category", formData.sub_category);
      formDataToSend.append("price", formData.price);

      // ✅ Add sizes data
      if (formData.sizes) {
        ['small', 'medium', 'full'].forEach((size) => {
          formDataToSend.append(`sizes[${size}][enabled]`, formData.sizes[size]?.enabled || false);
          if (formData.sizes[size]?.price) {
            formDataToSend.append(`sizes[${size}][price]`, formData.sizes[size].price);
          }
        });
      }

      // ✅ Add stockItems if present
      if (formData.stockItems && formData.stockItems.length > 0) {
        const validStockItems = formData.stockItems.filter(
          (item) => item.stockId && item.quantity !== undefined
        );
        if (validStockItems.length > 0) {
          formDataToSend.append('stockItems', JSON.stringify(validStockItems));
        }
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
      await dispatch(fetchMenuItems({ restaurantId, token }));
      handleCancel();
      toast.success("Menu item updated successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to update menu item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMenuItem = async () => {
    setIsSubmitting(true);
    try {
      await dispatch(
        deleteMenuItem({ id: selectedMenu.id, restaurantId, token })
      ).unwrap();
      setDeleteModalVisible(false);
      toast.success("Menu item deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete menu item");
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
      await dispatch(fetchMenuItems({ restaurantId, token }));
      toast.success(`Menu item marked as ${newStatus}`);
    } catch (error) {
      toast.error(error.message || "Failed to update status");
    }
  };

  // ------------------ UI ------------------
  return (
    <div className="container-fluid px-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center my-4">
        <h2 className="fw-bold mb-0 text-black">🍽️ Menu </h2>
        <CButton
          color="primary"
          className="px-4 rounded-pill fw-semibold"
          onClick={() => setModalVisible(true)}
        >
          + Add Menu
        </CButton>
      </div>

      {/* Menu List */}
      <CCard className="border-0 shadow-sm rounded-4">
        <CCardBody className="h-100">
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
        <ul className="nav nav-tabs mb-3">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "basic" ? "active" : ""}`}
              onClick={() => setActiveTab("basic")}
            >
              Basic Info
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "inventory" ? "active" : ""}`}
              onClick={() => setActiveTab("inventory")}
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
              <label className="form-label">Menu Id</label>
              <input
                type="text"
                className="form-control"
                name="menuId"
                value={formData.menuId}
                onChange={handleInputChange}
                required
              />
              <label className="form-label">Item Name</label>
              <input
                type="text"
                className="form-control"
                name="itemName"
                value={formData.itemName}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Category */}
            <div className="mb-3">
              <label className="form-label">Category</label>
              <select
                name="categoryId"
                className="form-select"
                value={formData.categoryId}
                onChange={handleInputChange}
                required
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
              <label className="form-label">Sub Category</label>
              <select name="sub_category" className="form-select"
                value={formData.sub_category} onChange={handleInputChange} disabled={!formData.categoryId} >
                <option value="">Select Sub Category</option>
                {subCategories?.filter((sub) => sub.categoryId === formData.categoryId).map((sub) =>
                  (<option key={sub._id} value={sub._id}> {sub.sub_category_name} </option>))}
              </select>
            </div>

            {/* Base Price */}
            <div className="mb-3">
              <label className="form-label">Base Price</label>
              <input
                type="number"
                className="form-control"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* ✅ FIXED: Sizes section with validation */}
            <div className="mb-3">
              <label className="form-label">Food Sizes & Prices</label>

              {formData.sizes.map((size, index) => (
                <div key={index} className="d-flex align-items-center gap-2 mb-2">
                  {/* Size Name */}
                  <input
                    type="text"
                    className="form-control w-25"
                    placeholder="Size (e.g., Half Plate)"
                    value={size.name || ""}
                    onChange={(e) => {
                      const updatedSizes = [...formData.sizes];
                      updatedSizes[index].name = e.target.value;
                      setFormData((prev) => ({ ...prev, sizes: updatedSizes }));
                    }}
                  />

                  {/* Size Price */}
                  <input
                    type="number"
                    className="form-control w-25"
                    placeholder="Price"
                    value={size.price || ""}
                    onChange={(e) => {
                      const updatedSizes = [...formData.sizes];
                      updatedSizes[index].price = e.target.value;
                      setFormData((prev) => ({ ...prev, sizes: updatedSizes }));
                    }}
                  />

                  {/* Remove Button */}
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
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
              <label className="form-label">Item Image</label>
              <input
                type="file"
                className="form-control"
                onChange={handleImageChange}
              />
              {previewImage && (
                <img
                  src={previewImage}
                  alt="Preview"
                  className="img-thumbnail mt-2"
                  style={{ width: "100px", height: "100px", objectFit: "cover" }}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === "inventory" && (
          <div>
            <div className="d-flex gap-2 mb-3">
              <select
                className="form-select"
                value={formData.stockItems[0]?.stockId || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    stockItems: [
                      { ...prev.stockItems[0], stockId: e.target.value },
                    ],
                  }))
                }
              >
                <option value="">Select Inventory</option>
                {inventories?.map((inv) => (
                  <option key={inv._id} value={inv._id}>
                    {inv.itemName}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="form-control"
                placeholder="Quantity"
                value={formData.stockItems[0]?.quantity || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    stockItems: [
                      { ...prev.stockItems[0], quantity: e.target.value },
                    ],
                  }))
                }
              />
              <CButton color="success">Add</CButton>
            </div>
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