import React, { useState, useEffect } from 'react'
import {
  CButton,
  CModal,
  CModalBody,
  CModalHeader,
  CModalFooter,
  CFormInput,
  CRow, CCol,
  CFormSelect,
  CCard,
  CCardBody,
  CSpinner,
  CForm,
} from '@coreui/react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchSubCategories,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
} from '../../redux/slices/subCategorySlice'
import { fetchCategories } from '../../redux/slices/categorySlice'
import { toast } from 'react-toastify'

export default function SubCategory() {
  const [modalVisible, setModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [subCategoryName, setSubCategoryName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [editedSubCategory, setEditedSubCategory] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('All')
  const [dropdownOpen, setDropdownOpen] = useState({})

  const dispatch = useDispatch()
  const token = useSelector((state) => state.auth.token)
  const restaurantId = useSelector((state) => state.auth.restaurantId)
  const { subCategories, loading: subCategoriesLoading } = useSelector((state) => state.subCategory)
  const { categories, loading: categoriesLoading } = useSelector((state) => state.category)

  useEffect(() => {
    if (token && restaurantId) {
      dispatch(fetchSubCategories({ token, restaurantId }))
      dispatch(fetchCategories({ token, restaurantId }))
    }
  }, [dispatch, token, restaurantId])

  // ✅ Add Subcategory
  const handleAddSubCategory = async () => {
    if (!subCategoryName ) {
      toast.error('Please provide all required fields.')
      return
    }

    try {
      await dispatch(
        createSubCategory({ sub_category_name: subCategoryName, token })
      ).unwrap()
      dispatch(fetchSubCategories({ token }))
      setSubCategoryName('')
      setCategoryId('')
      setModalVisible(false)
      toast.success('Subcategory created successfully!')
    } catch (error) {
      toast.error(error || 'Failed to create subcategory.')
    }
  }

  // ✅ Edit Subcategory
  const handleEditSubCategory = (sub) => {
    setEditedSubCategory({
      ...sub,
      categoryId: sub.categoryId?._id || sub.categoryId,
    })
    setEditModalVisible(true)
  }

  const handleUpdateSubCategory = async () => {
    if (!editedSubCategory.sub_category_name || !editedSubCategory.categoryId) {
      toast.error('Please provide all required fields.')
      return
    }

    try {
      await dispatch(
        updateSubCategory({
          id: editedSubCategory._id,
          sub_category_name: editedSubCategory.sub_category_name,
          categoryId: editedSubCategory.categoryId,
          token,
        })
      ).unwrap()
      dispatch(fetchSubCategories({ token, restaurantId }))
      setEditModalVisible(false)
      setEditedSubCategory({})
      toast.success('Subcategory updated successfully!')
    } catch (error) {
      toast.error(error || 'Failed to update subcategory.')
    }
  }

  // ✅ Delete Subcategory
  const handleDeleteSubCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subcategory?')) return
    try {
      await dispatch(deleteSubCategory({ id, token })).unwrap()
      dispatch(fetchSubCategories({ token, restaurantId }))
      toast.success('Subcategory deleted successfully!')
    } catch (error) {
      toast.error(error || 'Failed to delete subcategory.')
    }
  }

  // ✅ Toggle dropdown menu
  const toggleDropdown = (id) => setDropdownOpen((prev) => ({ ...prev, [id]: !prev[id] }))

  // ✅ Filtered subcategories
  const filteredSubCategories = subCategories
    ?.filter((sub) => {
      if (filter === 'All') return true
      const createdAt = new Date(sub.created_at)
      const now = new Date()
      switch (filter) {
        case 'This week':
          return createdAt >= new Date(now.setDate(now.getDate() - 7))
        case 'This month':
          return createdAt.getMonth() === new Date().getMonth()
        case 'Last 3 Months':
          return createdAt >= new Date(now.setMonth(now.getMonth() - 3))
        default:
          return true
      }
    })
    .filter((sub) => sub.sub_category_name?.toLowerCase().includes(searchTerm.toLowerCase()))

  if (categoriesLoading || subCategoriesLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <CSpinner className="m-auto" />
      </div>
    )
  }


  // ✅ Add Modal
  const AddSubCategoryModal = () => (
    <CModal visible={modalVisible} onClose={() => setModalVisible(false)}>
      <CModalHeader>
        <h5>Add New Subcategory</h5>
      </CModalHeader>
      <CModalBody>
        <CFormInput
          type="text"
          placeholder="Subcategory Name"
          value={subCategoryName}
          onChange={(e) => setSubCategoryName(e.target.value)}
          className="mb-3"
        />
        <CFormSelect
          className="mb-3"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="" disabled hidden>
            Select Category
          </option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.categoryName}
            </option>
          ))}
        </CFormSelect>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={() => setModalVisible(false)}>
          Close
        </CButton>
        <CButton color="primary" onClick={handleAddSubCategory} disabled={subCategoriesLoading}>
          {subCategoriesLoading ? 'Saving...' : 'Save'}
        </CButton>
      </CModalFooter>
    </CModal>
  )

  // ✅ Edit Modal
  const EditSubCategoryModal = () => (
    <CModal visible={editModalVisible} onClose={() => setEditModalVisible(false)}>
      <CModalHeader>
        <h5>Edit Subcategory</h5>
      </CModalHeader>
      <CModalBody>
        <CForm>
          <div className="mb-3">
            <label className="form-label">Subcategory Name</label>
            <CFormInput
              type="text"
              value={editedSubCategory.sub_category_name || ''}
              onChange={(e) =>
                setEditedSubCategory((prev) => ({ ...prev, sub_category_name: e.target.value }))
              }
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Category</label>
            <CFormSelect
              value={editedSubCategory.categoryId || ''}
              onChange={(e) =>
                setEditedSubCategory((prev) => ({ ...prev, categoryId: e.target.value }))
              }
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.categoryId} value={cat.categoryId}>
                  {cat.categoryName}
                </option>
              ))}
            </CFormSelect>
          </div>
        </CForm>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={() => setEditModalVisible(false)}>
          Cancel
        </CButton>
        <CButton color="primary" onClick={handleUpdateSubCategory}>
          {subCategoriesLoading ? <CSpinner as="span" size="sm" /> : 'Save Changes'}
        </CButton>
      </CModalFooter>
    </CModal>
  )

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fs-4 fw-semibold">My Subcategories</h1>
        <CButton color="primary" onClick={() => setModalVisible(true)}>
          Add Subcategory
        </CButton>
      </div>

      {/* Search & Filter */}
      <div className="d-flex mb-4">
        <CFormInput
          placeholder="Search subcategories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="me-3"
        />
        <CFormSelect value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="All">All</option>
          <option value="This week">This Week</option>
          <option value="This month">This Month</option>
          <option value="Last 3 Months">Last 3 Months</option>
        </CFormSelect>
      </div>

      {/* Subcategories Grid */}
      <CRow>
        {filteredSubCategories.map((sub) => (
          <CCol key={sub._id} xs="12" sm="6" md="4" lg="3" className="mb-4 d-flex">
            <CCard className="shadow-sm border rounded p-3 flex-fill">
              <CCardBody className="d-flex flex-column justify-content-between h-100">
                <div>
                  <h5 className="fw-bold mb-1">{sub.sub_category_name}</h5>
                  <small className="text-muted">
                    Category: {sub.categoryId?.categoryName || 'No category'}
                  </small>
                </div>
                <div className="position-relative mt-3 text-end">
                  <CButton
                    color="light"
                    className="p-0 border-0"
                    style={{ fontSize: '20px' }}
                    onClick={() => toggleDropdown(sub._id)}
                  >
                    &#8942;
                  </CButton>
                  {dropdownOpen[sub._id] && (
                    <div
                      className="dropdown-menu show position-absolute"
                      style={{ right: 0, zIndex: 1000 }}
                    >
                      <button className="dropdown-item" onClick={() => handleEditSubCategory(sub)}>
                        Edit
                      </button>
                      <button
                        className="dropdown-item text-danger"
                        onClick={() => handleDeleteSubCategory(sub._id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </CCardBody>
            </CCard>
          </CCol>
        ))}
      </CRow>

      {AddSubCategoryModal()}
      {EditSubCategoryModal()}
    </div>
  )
}


// import React, { useState, useEffect } from 'react'
// import {
//   CButton,
//   CModal,
//   CModalBody,
//   CModalHeader,
//   CModalFooter,
//   CFormInput,
//   CRow,
//   CCol,
//   CFormSelect,
//   CCard,
//   CCardBody,
//   CSpinner,
//   CForm,
// } from '@coreui/react'
// import { useDispatch, useSelector } from 'react-redux'
// import {
//   fetchSubCategories,
//   createSubCategory,
//   updateSubCategory,
//   deleteSubCategory,
// } from '../../redux/slices/subCategorySlice'
// import { fetchCategories, fetchCategoryById } from '../../redux/slices/categorySlice'
// import { toast } from 'react-toastify'

// export default function SubCategory() {
//   const [modalVisible, setModalVisible] = useState(false)
//   const [editModalVisible, setEditModalVisible] = useState(false)
//   const [subCategoryName, setSubCategoryName] = useState('')
//   const [categoryId, setCategoryId] = useState('')
//   const [editedSubCategory, setEditedSubCategory] = useState({})
//   const [searchTerm, setSearchTerm] = useState('')
//   const [filter, setFilter] = useState('All')
//   const [dropdownOpen, setDropdownOpen] = useState({})
//   const [categoriesById, setCategoriesById] = useState({})

//   const dispatch = useDispatch()
//   const token = useSelector((state) => state.auth.token)
//   const restaurantId = useSelector((state) => state.auth.restaurantId)
//   const { subCategories, loading: subCategoriesLoading } = useSelector((state) => state.subCategory)
//   const { categories, loading: categoriesLoading } = useSelector((state) => state.category)

//   // *** THE FIX: This useEffect now checks if `restaurantId` and `token` exist before dispatching actions. ***
//   useEffect(() => {
//     if (token && restaurantId) {
//       dispatch(fetchSubCategories({ token, restaurantId }))
//       dispatch(fetchCategories({ token, restaurantId }))
//     }
//     console.log(restaurantId, token)
//   }, [dispatch, token, restaurantId])

//   useEffect(() => {
//     if (subCategories.length > 0) {
//         const uniqueCategoryIds = [...new Set(subCategories.map((sub) => sub.categoryId))]
//         uniqueCategoryIds.forEach((catId) => {
//         if (!categoriesById[catId]) {
//             dispatch(fetchCategoryById({ id: catId, token })).then((res) => {
//             if (res.payload) {
//                 setCategoriesById((prev) => ({
//                 ...prev,
//                 [catId]: res.payload,
//                 }))
//             }
//             })
//         }
//         })
//     }
//   }, [subCategories, dispatch, token, categoriesById])

//   const handleAddSubCategory = async () => {
//   if (!subCategoryName || !categoryId) {
//     toast.error("Please provide all required fields.");
//     return;
//   }

//   const payload = {
//     sub_category_name: subCategoryName,
//     categoryId: categoryId,       // ✅ fixed key
//     restaurantId: restaurantId,   // ✅ required by backend
//     token,
//   };
//   console.log("Payload for creating subcategory:", payload)

//   try {
//     await dispatch(createSubCategory(payload)).unwrap();
//     dispatch(fetchSubCategories({ token, restaurantId }));
//     setSubCategoryName("");
//     setCategoryId("");
//     setModalVisible(false);
//     toast.success("Subcategory created successfully!");
//   } catch (error) {
//     toast.error(error || "Failed to create subcategory.");
//   }
// };


//   const handleEditSubCategory = (sub) => {
//     setEditedSubCategory(sub)
//     setEditModalVisible(true)
//   }

//   const handleUpdateSubCategory = () => {
//     if (!editedSubCategory.sub_category_name || !editedSubCategory.category_id) return

//     dispatch(
//       updateSubCategory({
//         id: editedSubCategory.id,
//         sub_category_name: editedSubCategory.sub_category_name,
//         category_id: editedSubCategory.category_id,
//         token,
//       }),
//     ).then(() => {
//       setEditModalVisible(false)
//       setEditedSubCategory({})
//       dispatch(fetchSubCategories({ token, restaurantId }))
//       toast.success('Subcategory updated successfully!')
//     })
//   }

//   const handleDeleteSubCategory = (id) => {
//     dispatch(deleteSubCategory({ id, token })).then(() => {
//       dispatch(fetchSubCategories({ token, restaurantId }))
//       toast.success('Subcategory deleted successfully!')
//     })
//   }

//   const toggleDropdown = (id) => {
//     setDropdownOpen((prev) => ({ ...prev, [id]: !prev[id] }))
//   }

//   const filteredSubCategories = subCategories
//     ?.filter((sub) => {
//       if (filter === 'All') return true
//       const createdAt = new Date(sub.created_at)
//       const now = new Date()
//       switch (filter) {
//         case 'This week':
//           return createdAt >= new Date(now.setDate(now.getDate() - 7))
//         case 'This month':
//           return createdAt.getMonth() === new Date().getMonth()
//         case 'Last 3 Months':
//           return createdAt >= new Date(now.setMonth(now.getMonth() - 3))
//         default:
//           return true
//       }
//     })
//     .filter((sub) => sub.sub_category_name?.toLowerCase().includes(searchTerm.toLowerCase()))

//   if (categoriesLoading || subCategoriesLoading) {
//     return (
//       <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
//         <CSpinner className="m-auto" />
//       </div>
//     )
//   }

//   const AddSubCategoryModal = () => (
//     <CModal visible={modalVisible} onClose={() => setModalVisible(false)}>
//       <CModalHeader>
//         <h5>Add New Subcategory</h5>
//       </CModalHeader>
//       <CModalBody>
//         <CFormInput
//           type="text"
//           placeholder="Subcategory Name"
//           value={subCategoryName}
//           onChange={(e) => setSubCategoryName(e.target.value)}
//           className="mb-3"
//         />
//         <CFormSelect
//           className="mb-3"
//           value={categoryId}
//           onChange={(e) => setCategoryId(e.target.value)}
//         >
//           <option value="" disabled hidden>
//             Select Category
//           </option>
//           {categories.map((cat) => (
//             <option key={cat.id} value={cat.id}>
//               {cat.categoryName}
//             </option>
//           ))}
//         </CFormSelect>
//       </CModalBody>
//       <CModalFooter>
//         <CButton color="secondary" onClick={() => setModalVisible(false)}>
//           Close
//         </CButton>
//         <CButton color="primary" onClick={handleAddSubCategory} disabled={subCategoriesLoading}>
//           {subCategoriesLoading ? 'Saving...' : 'Save'}
//         </CButton>
//       </CModalFooter>
//     </CModal>
//   )

//   const EditSubCategoryModal = () => (
//     <CModal visible={editModalVisible} onClose={() => setEditModalVisible(false)}>
//       <CModalHeader>
//         <h5>Edit Subcategory</h5>
//       </CModalHeader>
//       <CModalBody>
//         <CForm>
//           <div className="mb-3">
//             <label htmlFor="editSubCategoryName" className="form-label">
//               Subcategory Name
//             </label>
//             <CFormInput
//               id="editSubCategoryName"
//               type="text"
//               value={editedSubCategory.sub_category_name || ''}
//               onChange={(e) =>
//                 setEditedSubCategory((prev) => ({ ...prev, sub_category_name: e.target.value }))
//               }
//             />
//           </div>
//           <div className="mb-3">
//             <label htmlFor="editCategorySelect" className="form-label">
//               Category
//             </label>
//             <CFormSelect
//               id="editCategorySelect"
//               value={editedSubCategory.category_id || ''}
//               onChange={(e) =>
//                 setEditedSubCategory((prev) => ({ ...prev, category_id: e.target.value }))
//               }
//             >
//               {categories.map((cat) => (
//                 <option key={cat.id} value={cat.id}>
//                   {cat.categoryName}
//                 </option>
//               ))}
//             </CFormSelect>
//           </div>
//         </CForm>
//       </CModalBody>
//       <CModalFooter>
//         <CButton color="secondary" onClick={() => setEditModalVisible(false)}>
//           Cancel
//         </CButton>
//         <CButton color="primary" onClick={handleUpdateSubCategory}>
//           {subCategoriesLoading ? <CSpinner as="span" size="sm" /> : 'Save Changes'}
//         </CButton>
//       </CModalFooter>
//     </CModal>
//   )

//   return (
//     <div className="p-4">
//       <div className="d-flex justify-content-between align-items-center mb-4">
//         <h1 className="fs-4 fw-semibold">My Subcategories</h1>
//         <CButton color="primary" onClick={() => setModalVisible(true)}>
//           Add Subcategory
//         </CButton>
//       </div>

//       <div className="d-flex mb-4">
//         <CFormInput
//           placeholder="Search subcategories..."
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           className="me-3"
//         />
//         <CFormSelect value={filter} onChange={(e) => setFilter(e.target.value)}>
//           <option value="All">All</option>
//           <option value="This week">This Week</option>
//           <option value="This month">This Month</option>
//           <option value="Last 3 Months">Last 3 Months</option>
//         </CFormSelect>
//       </div>

//       <CRow>
//         {filteredSubCategories.map((sub) => (
//           <CCol key={sub.id} xs="12" sm="6" md="4" lg="3" className="mb-4 d-flex">
//             <CCard className="shadow-sm border rounded p-3 flex-fill">
//               <CCardBody className="d-flex flex-column justify-content-between h-100">
//                 <div>
//                   <h5 className="fw-bold mb-1">{sub.sub_category_name}</h5>
//                   <small className="text-muted">
//                     Category:{' '}
//                     {categoriesById[sub.category_id]
//                       ? categoriesById[sub.category_id].categoryName
//                       : 'Loading...'}
//                   </small>
//                 </div>
//                 <div className="position-relative mt-3 text-end">
//                   <CButton
//                     color="light"
//                     className="p-0 border-0"
//                     style={{ fontSize: '20px' }}
//                     onClick={() => toggleDropdown(sub.id)}
//                   >
//                     &#8942;
//                   </CButton>
//                   {dropdownOpen[sub.id] && (
//                     <div
//                       className="dropdown-menu show position-absolute"
//                       style={{ right: 0, zIndex: 1000 }}
//                     >
//                       <button className="dropdown-item" onClick={() => handleEditSubCategory(sub)}>
//                         Edit
//                       </button>
//                       <button
//                         className="dropdown-item text-danger"
//                         onClick={() => handleDeleteSubCategory(sub.id)}
//                       >
//                         Delete
//                       </button>
//                     </div>
//                   )}
//                 </div>
//               </CCardBody>
//             </CCard>
//           </CCol>
//         ))}
//       </CRow>

//       {AddSubCategoryModal()}
//       {EditSubCategoryModal()}
//     </div>
//   )
// }
