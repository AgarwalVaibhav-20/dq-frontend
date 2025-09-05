
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { CButton, CSpinner, CCard, CCardBody } from "@coreui/react";
import { toast } from "react-toastify";
import {
  addMenuItem,
  deleteMenuItem,
  fetchMenuItems,
  updateMenuItem,
} from "../../redux/slices/menuSlice";
import CommonModal from "../../components/CommonModal";
import MenuItemForm from "../../components/MenuItemForm";
import MenuItemList from "../../components/MenuItemList";
import EditMenuItem from "../../components/EditMenuItem";
import EditStockModal from "../../components/EditStockModal";
import { fetchCategories } from "../../redux/slices/categorySlice";
import { fetchInventories } from "../../redux/slices/stockSlice";
import { fetchSubCategories } from "../../redux/slices/subCategorySlice";

const Menu = () => {
  const dispatch = useDispatch();
  const { menuItems, loading: menuItemsLoading } = useSelector(
    (state) => state.menuItems
  );
  const { categories } = useSelector((state) => state.category);
  const { inventories } = useSelector((state) => state.inventories);
  const restaurantId = useSelector((state) => state.auth.restaurantId);
  const token = useSelector((state) => state.auth.token);
  const { subCategories } = useSelector((state) => state.subCategory);

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

  // Fetch data
  useEffect(() => {
    if (restaurantId) {
      dispatch(fetchCategories({ restaurantId, token }));
      dispatch(fetchInventories({ restaurantId }));
      dispatch(fetchMenuItems({ restaurantId }));
    }
    if (token) {
      dispatch(fetchSubCategories({ token }));
    }
  }, [dispatch, restaurantId, token]);

  useEffect(() => {
    if (selectedMenu) {
      setFormData({
        itemName: selectedMenu.itemName,
        categoryId: selectedMenu.categoryId,
        itemImage: null,
        sub_category: selectedMenu.sub_category,
        price: selectedMenu.price,
        stockItems: selectedMenu.stockItems || [{ stockId: "", quantity: "" }],
      });
      setPreviewImage(selectedMenu.itemImage);
    }
  }, [selectedMenu]);

  // ----------------- Handlers -----------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "categoryId" ? { sub_category: "" } : {}), // reset subcategory
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
      await dispatch(addMenuItem({ ...formData, restaurantId })).unwrap();
      await dispatch(fetchMenuItems({ restaurantId }));
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
      formDataToSend.append("price", formData.price);

      if (formData.itemImage instanceof File) {
        formDataToSend.append("itemImage", formData.itemImage);
      }

      await dispatch(
        updateMenuItem({
          id: selectedMenu.id,
          formData: formDataToSend,
          restaurantId,
          token,
        })
      ).unwrap();

      await dispatch(fetchMenuItems({ restaurantId }));
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
      await dispatch(deleteMenuItem({ id: selectedMenu.id, restaurantId })).unwrap();
      setDeleteModalVisible(false);
    } catch (error) {
      toast.error("Failed to delete menu item");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------- UI -----------------
  return (
    <div className="container-fluid px-4">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center my-4">
        <h2 className="fw-bold mb-0 text-black">🍽️ Menu </h2>
        <CButton color="primary" className="px-4 rounded-pill fw-semibold" onClick={() => setModalVisible(true)}>
          + Add Menu
        </CButton>
      </div>

      {/* Content */}
      <CCard className="border-0 shadow-sm rounded-4">
        <CCardBody className="h-100">
          <MenuItemList
            menuItems={menuItems}
            menuItemsLoading={menuItemsLoading}
            setSelectedMenu={setSelectedMenu}
            setEditModalVisible={setEditModalVisible}
            setDeleteModalVisible={setDeleteModalVisible}
            setEditStockModalVisible={setEditStockModalVisible}
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

      {/* Add Menu Modal */}
      <CommonModal
        visible={modalVisible}
        onClose={handleCancel}
        title="Add Menu Item"
        onConfirm={handleAddMenuItem}
        confirmButtonText={isSubmitting ? <CSpinner size="sm" /> : "Save"}
        confirmButtonColor="primary"
        isLoading={isSubmitting}
        formId="menuItemForm"
      >
        <MenuItemForm
          formData={formData}
          handleInputChange={handleInputChange}
          handleImageChange={handleImageChange}
          categories={categories}
          inventories={inventories}
          subCategories={subCategories}
          previewImage={previewImage}
          formId="menuItemForm"
        />
      </CommonModal>

      {/* Edit Menu Modal */}
      <CommonModal
        visible={editModalVisible}
        onClose={handleCancel}
        title="Edit Menu Item"
        onConfirm={handleEditMenuItem}
        confirmButtonText={isSubmitting ? <CSpinner size="sm" /> : "Update"}
        confirmButtonColor="primary"
        isLoading={isSubmitting}
      >
        <EditMenuItem
          formData={formData}
          handleInputChange={handleInputChange}
          handleImageChange={handleImageChange}
          categories={categories}
          subCategories={subCategories}
          previewImage={previewImage}
          isEdit={true}
        />
      </CommonModal>

      {/* Delete Modal */}
      <CommonModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        title="Delete Menu Item"
        onConfirm={handleDeleteMenuItem}
        confirmButtonText={isSubmitting ? <CSpinner size="sm" /> : "Delete"}
        confirmButtonColor="danger"
        isLoading={isSubmitting}
      >
        <p className="text-muted">Are you sure you want to delete this menu item?</p>
      </CommonModal>
    </div>
  );
};

export default Menu;

// import React, { useState, useEffect } from 'react'
// import { useSelector, useDispatch } from 'react-redux'
// import { CButton, CSpinner } from '@coreui/react'
// import { toast } from 'react-toastify'
// import {
//   addMenuItem,
//   deleteMenuItem,
//   fetchMenuItems,
//   updateMenuItem,
// } from '../../redux/slices/menuSlice'
// import CommonModal from '../../components/CommonModal'
// import MenuItemForm from '../../components/MenuItemForm'
// import MenuItemList from '../../components/MenuItemList'
// import EditMenuItem from '../../components/EditMenuItem'
// import EditStockModal from '../../components/EditStockModal'
// import { fetchCategories } from '../../redux/slices/categorySlice'
// import { fetchInventories } from '../../redux/slices/stockSlice'
// import { fetchSubCategories } from '../../redux/slices/subCategorySlice'

// const Menu = () => {
//   const dispatch = useDispatch()
//   const { menuItems, loading: menuItemsLoading } = useSelector((state) => state.menuItems)
//   const { categories, loading: categoryLoading } = useSelector((state) => state.category)
//   const { inventories, loading: inventoryLoading } = useSelector((state) => state.inventories)
//   const restaurantId = useSelector((state) => state.auth.restaurantId)
//   const token = useSelector((state) => state.auth.token)
//   const [modalVisible, setModalVisible] = useState(false)
//   const [deleteModalVisible, setDeleteModalVisible] = useState(false)
//   const [editModalVisible, setEditModalVisible] = useState(false)
//   const [selectedMenu, setSelectedMenu] = useState(null)
//   const [formData, setFormData] = useState({
//     itemName: '',
//     categoryId: '',
//     sub_category: '',
//     itemImage: null,
//     price: '',
//     stockItems: [{ stockId: '', quantity: '' }],
//   })
//   const [previewImage, setPreviewImage] = useState(null)
//   const [isSubmitting, setIsSubmitting] = useState(false)

//   const [editStockModalVisible, setEditStockModalVisible] = useState(false)
//   const [selectedStockItems, setSelectedStockItems] = useState([])
//   const { subCategories, loading } = useSelector((state) => state.subCategory)

//   // Fetch data on component mount
//   useEffect(() => {
//     dispatch(fetchCategories({ restaurantId, token }))
//     dispatch(fetchInventories({ restaurantId }))
//     dispatch(fetchMenuItems({ restaurantId }))
//   }, [dispatch, restaurantId, token])

//   useState(() => {
//     if (token) {
//       dispatch(fetchSubCategories({ token }))
//     }
//   }, [[token, dispatch]])


//   const filteredSubCategories = subCategories?.filter(
//     (sub) => sub.categoryId === Number(formData.categoryId),
//   )
//   // Menu.js
//   useEffect(() => {
//     if (selectedMenu) {
//       setFormData({
//         itemName: selectedMenu.itemName,
//         categoryId: selectedMenu.categoryId,
//         itemImage: null,
//         sub_category: selectedMenu.sub_category,
//         price: selectedMenu.price,
//         stockItems: selectedMenu.stockItems || [{ stockId: '', quantity: '' }],
//       })
//       setPreviewImage(selectedMenu.itemImage)
//     }
//   }, [selectedMenu])

//   const handleInputChange = (e) => {
//   const { name, value } = e.target;

//   setFormData((prevState) => {
//     // If category is changed, reset subCategoryId
//     if (name === "categoryId") {
//       return {
//         ...prevState,
//         categoryId: value,
//         sub_category: '', // reset subcategory when category changes
//       };
//     }

//     return {
//       ...prevState,
//       [name]: value,
//     };
//   });
// };



//   // Handle image changes
//   const handleImageChange = (e) => {
//     const file = e.target.files[0]
//     setFormData((prevState) => ({
//       ...prevState,
//       itemImage: file,
//     }))
//     setPreviewImage(URL.createObjectURL(file))
//   }

//   // Handle stock changes
//   const handleStockChange = (index, field, value) => {
//     const updatedStock = [...formData.stockItems]
//     updatedStock[index][field] = value
//     setFormData((prevState) => ({
//       ...prevState,
//       stockItems: updatedStock,
//     }))
//   }

//   // Add a new stock field
//   const addStockField = () => {
//     setFormData((prevState) => ({
//       ...prevState,
//       stockItems: [...prevState.stockItems, { stockId: '', quantity: '' }],
//     }))
//   }

//   // Reset form and close modals
//   const handleCancel = () => {
//     setFormData({
//       itemName: '',
//       categoryId: '',
//       itemImage: null,
//       price: '',
//       stockItems: [{ stockId: '', quantity: '' }],
//     })
//     setPreviewImage(null)
//     setModalVisible(false)
//     setEditModalVisible(false)
//   }

//   const handleAddMenuItem = async () => {
//     setIsSubmitting(true)
//     try {
//       await dispatch(addMenuItem({ ...formData, restaurantId })).unwrap()

//       await dispatch(fetchMenuItems({ restaurantId }))
//       handleCancel()
//       toast.success('Menu item added successfully!')
//     } catch (error) {
//       toast.error(error.message || 'Failed to add menu item.')
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   // Open the edit stock modal
//   const handleEditStock = (stockItems) => {
//     setSelectedStockItems(stockItems)
//     setEditStockModalVisible(true)
//   }

//   // Save changes to stock items
//   const handleSaveStock = (updatedStockItems) => {
//     // Update the state or make an API call to save the changes
//     console.log('Updated Stock Items:', updatedStockItems)
//     // Example: Update the formData state
//     setFormData((prevState) => ({
//       ...prevState,
//       stockItems: updatedStockItems,
//     }))
//   }

//   // Handle editing a menu item
//   const handleEditMenuItem = async () => {
//     setIsSubmitting(true)
//     try {
//       const formDataToSend = new FormData()

//       // formDataToSend.append('restaurantId', restaurantId)
//       formDataToSend.append('itemName', formData.itemName)
//       formDataToSend.append('categoryId', formData.categoryId)
//       formDataToSend.append('price', formData.price)

//       // Append image only if it's a new file
//       if (formData.itemImage instanceof File) {
//         formDataToSend.append('itemImage', formData.itemImage)
//       }

//       // Send the request
//       await dispatch(
//         updateMenuItem({
//           id: selectedMenu.id,
//           formData: formDataToSend,
//           restaurantId,
//           token,
//         }),
//       ).unwrap()

//       // Refresh the menu items list
//       await dispatch(fetchMenuItems({ restaurantId }))

//       // Close the modal and reset form
//       handleCancel()
//       toast.success('Menu item updated successfully!')
//     } catch (error) {
//       toast.error(error.message || 'Failed to update menu item.')
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   // Handle deleting a menu item
//   const handledeleteMenuItem = async () => {
//     setIsSubmitting(true)
//     try {
//       await dispatch(deleteMenuItem({ id: selectedMenu.id, restaurantId })).unwrap()
//       setDeleteModalVisible(false)
//     } catch (error) {
//       console.error('Failed to delete menu item:', error)
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   return (
//     <div style={{ paddingLeft: '20px', paddingRight: '20px' }}>
//       <div
//         style={{
//           display: 'flex',
//           justifyContent: 'space-between',
//           alignItems: 'center',
//           marginBottom: '20px',
//         }}
//       >
//         <h2>Menu</h2>
//         <CButton color="primary" onClick={() => setModalVisible(true)}>
//           Add Menu
//         </CButton>
//       </div>
//       <MenuItemList
//         menuItems={menuItems}
//         menuItemsLoading={menuItemsLoading}
//         setSelectedMenu={setSelectedMenu}
//         setEditModalVisible={setEditModalVisible}
//         setDeleteModalVisible={setDeleteModalVisible}
//         setEditStockModalVisible={setEditStockModalVisible}
//       />
//       {/* Edit Stock Modal */}
//       <EditStockModal
//         visible={editStockModalVisible}
//         onClose={() => setEditStockModalVisible(false)}
//         stockItems={selectedMenu?.stockItems || []}
//         inventories={inventories}
//         setStockItems={(updatedStockItems) =>
//           setFormData((prevState) => ({
//             ...prevState,
//             stockItems: updatedStockItems,
//           }))
//         }
//       />
//       <CommonModal
//         visible={modalVisible}
//         onClose={handleCancel}
//         title="Add Menu Item"
//         onConfirm={handleAddMenuItem}
//         confirmButtonText={isSubmitting ? <CSpinner size="sm" /> : 'Save Changes'}
//         confirmButtonColor="primary"
//         isLoading={isSubmitting}
//         formId="menuItemForm"
//       >
//         <MenuItemForm
//           formData={formData}
//           handleInputChange={handleInputChange}
//           handleImageChange={handleImageChange}
//           handleStockChange={handleStockChange}
//           addStockField={addStockField}
//           categories={categories}
//           inventories={inventories}
//           previewImage={previewImage}
//           subCategories={subCategories}
//           onSubmit={handleAddMenuItem}
//           formId="menuItemForm"
//         />
//       </CommonModal>
//       <CommonModal
//         visible={editModalVisible}
//         onClose={handleCancel}
//         title="Edit Menu Item"
//         onConfirm={handleEditMenuItem}
//         confirmButtonText={isSubmitting ? <CSpinner size="sm" /> : 'Save Changes'}
//         confirmButtonColor="primary"
//         isLoading={isSubmitting}
//       >
//         <EditMenuItem
//           formData={formData}
//           handleInputChange={handleInputChange}
//           handleImageChange={handleImageChange}
//           categories={categories}
//           subCategories={subCategories}
//           previewImage={previewImage}
//           isEdit={true}
//         />
//       </CommonModal>
//       <CommonModal
//         visible={deleteModalVisible}
//         onClose={() => setDeleteModalVisible(false)}
//         title="Delete Menu Item"
//         onConfirm={handledeleteMenuItem}
//         confirmButtonText={isSubmitting ? <CSpinner size="sm" /> : 'Delete'}
//         confirmButtonColor="danger"
//         isLoading={isSubmitting}
//       >
//         Are you sure you want to delete this menu item?
//       </CommonModal>
//     </div>
//   )
// }

// export default Menu
