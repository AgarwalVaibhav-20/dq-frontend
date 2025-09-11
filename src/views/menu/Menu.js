import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { CButton, CSpinner, CCard, CCardBody } from "@coreui/react";
import { toast } from "react-toastify";

import {
  addMenuItem,
  deleteMenuItem,
  fetchMenuItems,
  updateMenuItem,
  updateMenuItemStatus
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
  // const token = useSelector((state) => state.auth.token);
  const token = localStorage.getItem('authToken')

  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editStockModalVisible, setEditStockModalVisible] = useState(false);

  const [selectedMenu, setSelectedMenu] = useState(null);
  const [formData, setFormData] = useState({
    itemName: "",
    categoryId: "",
    sub_category: "",
    itemImage: null,
    price: "",
    stockItems: [{ stockId: "", quantity: "" }],
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
          dispatch(fetchInventories({ restaurantId, token })),
          dispatch(fetchMenuItems({ token })),
        ]);

        const subCategoryResult = await dispatch(
          fetchSubCategories({ restaurantId, token })
        );
        if (fetchSubCategories.fulfilled.match(subCategoryResult)) {
          console.log("✅ SubCategories fetched:", subCategoryResult.payload);
        } else {
          console.error("❌ SubCategories fetch failed:", subCategoryResult.error);
        }
      } catch (error) {
        console.error("❌ Error fetching data:", error);
        toast.error("Failed to fetch data");
      }
    };
    fetchData();
  }, [dispatch, restaurantId, token]);

  // ------------------ Handle selected menu ------------------
  useEffect(() => {
    if (selectedMenu) {
      setFormData({
        itemName: selectedMenu.itemName,
        categoryId: selectedMenu.categoryId,
        sub_category: selectedMenu.sub_category,
        itemImage: null,
        price: selectedMenu.price,
        stockItems: selectedMenu.stockItems || [{ stockId: "", quantity: "" }],
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
      itemName: "",
      categoryId: "",
      sub_category: "",
      itemImage: null,
      price: "",
      stockItems: [{ stockId: "", quantity: "" }],
    });
    setPreviewImage(null);
    setModalVisible(false);
    setEditModalVisible(false);
  };

  const handleAddMenuItem = async () => {
    setIsSubmitting(true);
    try {
      await dispatch(addMenuItem({ ...formData, token })).unwrap();
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
      await dispatch(deleteMenuItem({ id: selectedMenu.id, restaurantId, token })).unwrap();
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
    const newStatus = currentStatus === "available" ? "unavailable" : "available";
    try {
      await dispatch(
        updateMenuItemStatus({
          id: params.row._id || params.row.id, 
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

      {/* Add/Edit Modal */}
      <CommonModal
        visible={modalVisible || editModalVisible}
        onClose={handleCancel}
        title={editModalVisible ? "Edit Menu Item" : "Add Menu Item"}
        onConfirm={editModalVisible ? handleEditMenuItem : handleAddMenuItem}
        confirmButtonText={editModalVisible ? "Update" : "Save"}
        confirmButtonColor="primary"
        isLoading={isSubmitting}
      >
        {/* Inputs */}
        <div>
          <div className="mb-3">
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

          <div className="mb-3">
            <label className="form-label">Sub Category</label>
            <select
              name="sub_category"
              className="form-select"
              value={formData.sub_category}
              onChange={handleInputChange}
              disabled={!formData.categoryId}
            >
              <option value="">Select Sub Category</option>
              {subCategories
                ?.filter((sub) => sub.categoryId === formData.categoryId)
                .map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.sub_category_name}
                  </option>
                ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Price</label>
            <input
              type="number"
              className="form-control"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Item Image</label>
            <input type="file" className="form-control" onChange={handleImageChange} />
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
        <p className="text-muted">Are you sure you want to delete this menu item?</p>
      </CommonModal>
    </div>
  );
};

export default Menu;
