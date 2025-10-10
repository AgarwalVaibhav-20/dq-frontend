import React, { useState, useEffect, useRef } from 'react';
import {
  CButton, CModal, CModalBody, CModalHeader, CModalFooter,
  CFormInput, CRow, CCol, CFormSelect, CCard, CCardImage, CCardBody,
  CSpinner, CForm, CNav, CNavItem, CNavLink, CTabContent, CTabPane
} from '@coreui/react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../../redux/slices/categorySlice';
import { toast } from 'react-toastify';

export default function Category() {
  const dispatch = useDispatch();
  const { categories, loading } = useSelector(state => state.category);
  const token = useSelector(state => state.auth.token);
  const restaurantId = localStorage.getItem('restaurantId')

  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [categoryName, setCategoryName] = useState('');
  const [categoryImage, setCategoryImage] = useState(null);
  const [editedCategory, setEditedCategory] = useState({});
  const [sizes, setSizes] = useState([{ sizeName: '', basePrice: '', description: '' }]);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  const [dropdownOpen, setDropdownOpen] = useState({});
  const dropdownRef = useRef();
  useEffect(() => {
    if (restaurantId && token) {
      dispatch(fetchCategories({ token, restaurantId }));
    }
  }, [dispatch, restaurantId, token]);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen({});
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddSize = () => setSizes([...sizes, { sizeName: '', basePrice: '', description: '' }]);
  const handleSizeChange = (index, field, value) => {
    const updatedSizes = [...sizes];
    updatedSizes[index][field] = value;
    setSizes(updatedSizes);
  };
  const handleRemoveSize = (index) => {
    const updatedSizes = [...sizes];
    updatedSizes.splice(index, 1);
    setSizes(updatedSizes);
  };
  const handleAddCategory = () => {
    if (!categoryName || !categoryImage) return toast.error('Provide all fields.');
    setSaving(true);

    // Pass plain data, let thunk build FormData
    dispatch(createCategory({ categoryName, categoryImage, token , restaurantId }))
      .unwrap()
      .then(() => {
        toast.success('Category added!');
        setCategoryName('');
        setCategoryImage(null);
        setModalVisible(false);
        dispatch(fetchCategories({ token }));
      })
      .finally(() => setSaving(false));
  };

  const handleEditCategory = (cat) => {
    console.log("cAT =>", cat)
    setEditedCategory(cat);
    setSizes(cat.sizes || [{ sizeName: '', basePrice: '', description: '' }]);
    setEditModalVisible(true);
    setActiveTab('basic');
  };

  const handleUpdateCategory = () => {
    if (!editedCategory.categoryName)
      return toast.error("Category name required.");

    setUpdating(true);

    const formData = new FormData();
    formData.append("categoryName", editedCategory.categoryName);

    if (editedCategory.categoryImage instanceof File) {
      formData.append("categoryImage", editedCategory.categoryImage);
    }

    if (editedCategory.restaurantId) {
      formData.append("restaurantId", editedCategory.restaurantId);
    }

    dispatch(updateCategory({ id: editedCategory._id, formData, token , restaurantId }))
      .unwrap()
      .then(() => {
        toast.success("Category updated!");
        setEditModalVisible(false);
        setEditedCategory({});
        setSizes([{ sizeName: "", basePrice: "", description: "" }]);
        dispatch(fetchCategories({ token }));
      })
      .finally(() => setUpdating(false));
  };


  const handleDeleteCategory = (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    dispatch(deleteCategory({ id, token }))
      .unwrap()
      .then(() => {
        toast.success('Category deleted!');
        dispatch(fetchCategories({ token }));
      })
      .catch((err) => {
        toast.error(err || 'Failed to delete category');
      });
  };


  const toggleDropdown = (id) => setDropdownOpen(prev => ({ ...prev, [id]: !prev[id] }));
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setEditedCategory(prev => ({ ...prev, categoryImage: file }));
  };

  const filteredCategories = categories
    ?.filter(cat => {
      if (filter === 'All') return true;
      const createdAt = new Date(cat.created_at);
      const now = new Date();
      switch (filter) {
        case 'This week':
          const lastWeek = new Date();
          lastWeek.setDate(now.getDate() - 7);
          return createdAt >= lastWeek;
        case 'This month':
          return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
        case 'Last 3 Months':
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(now.getMonth() - 3);
          return createdAt >= threeMonthsAgo;
        default:
          return true;
      }
    })
    .filter(cat => cat.categoryName?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}><CSpinner /></div>;

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fs-4 fw-semibold">My Categories</h1>
        <CButton color="primary" onClick={() => setModalVisible(true)}>Add Category</CButton>
      </div>

      <div className="d-flex mb-4">
        <CFormInput placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="me-3" />
        <CFormSelect value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="All">All</option>
          <option value="This week">This Week</option>
          <option value="This month">This Month</option>
          <option value="Last 3 Months">Last 3 Months</option>
        </CFormSelect>
      </div>

      <CRow>
        {filteredCategories?.length > 0 ? filteredCategories.map(cat => (
          <CCol key={cat._id} xs="12" sm="6" md="4" lg="2" className="mb-4">
            <CCard className="shadow-sm border rounded">
              <CCardImage
                src={cat.categoryImage.startsWith('http') ? cat.categoryImage : `http://localhost:4000/${cat.categoryImage}`}
                alt={cat.categoryName}
                style={{ height: '150px', objectFit: 'cover' }}
              />
              <CCardBody className="d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0">{cat.categoryName}</h5>
                <div className="position-relative" ref={dropdownRef}>
                  <CButton color="light" className="p-0 border-0" style={{ fontSize: '20px' }} onClick={() => toggleDropdown(cat._id)}>&#8942;</CButton>
                  {dropdownOpen[cat._id] && (
                    <div className="dropdown-menu show position-absolute" style={{ right: 0, zIndex: 1000 }}>
                      <button className="dropdown-item" onClick={() => handleEditCategory(cat)}>Edit</button>
                      <button className="dropdown-item text-danger" onClick={() => handleDeleteCategory(cat._id)}>Delete</button>
                    </div>
                  )}
                </div>
              </CCardBody>
            </CCard>
          </CCol>
        )) : (
          <CCol>
            <div className="text-center py-5 text-muted"><h5>No categories available</h5></div>
          </CCol>
        )}
      </CRow>

      {/* Add/Edit Category Modal */}
      <CModal visible={modalVisible || editModalVisible} onClose={() => { setModalVisible(false); setEditModalVisible(false); }}>
        <CModalHeader>
          <h5>{modalVisible ? 'Add New Category' : 'Edit Category'}</h5>
        </CModalHeader>
        <CModalBody>
          {/* Tabs */}
          <CNav variant="tabs">
            <CNavItem>
              <CNavLink active={activeTab === 'basic'} onClick={() => setActiveTab('basic')}>Basic Info</CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink active={activeTab === 'sizes'} onClick={() => setActiveTab('sizes')}>Sizes & Portions</CNavLink>
            </CNavItem>
          </CNav>

          <CTabContent className="mt-3">
            <CTabPane visible={activeTab === 'basic'}>
              <CFormInput type="text" placeholder="Category Name" value={modalVisible ? categoryName : editedCategory.categoryName || ''}
                onChange={e => modalVisible ? setCategoryName(e.target.value) : setEditedCategory(prev => ({ ...prev, categoryName: e.target.value }))}
                className="mb-3"
              />
              <CFormInput type="file" onChange={modalVisible ? e => setCategoryImage(e.target.files[0]) : handleImageChange} className="mb-3" />
              {(!modalVisible && editedCategory.categoryImage) && (
                <img src={typeof editedCategory.categoryImage === 'string' ? editedCategory.categoryImage : URL.createObjectURL(editedCategory.categoryImage)}
                  alt="preview" className="img-fluid rounded mt-2" style={{ maxHeight: '150px', objectFit: 'cover' }} />
              )}
            </CTabPane>

            <CTabPane visible={activeTab === 'sizes'}>
              <div className="d-flex flex-column gap-3">
                <p>Category Sizes & Portions</p>
                <p className='text-sm'>Define standard sizes/portions that will be available for all menu items in this category. Each size can have different pricing that will be applied to menu items.</p>
                {sizes.map((size, index) => (
                  <div
                    key={index}
                    className="border rounded shadow-sm p-3 d-flex justify-content-between align-items-center hover-shadow"
                  >
                    <div className="flex-grow-1">
                      <CFormInput
                        placeholder="eg: Small , Medium , Large , hHalf , Full"
                        value={size.sizeName}
                        onChange={e => handleSizeChange(index, 'sizeName', e.target.value)}
                        className="mb-2"
                      />
                      <CFormInput
                        type="number"
                        placeholder="Enter base price for the size"
                        value={size.basePrice}
                        onChange={e => handleSizeChange(index, 'basePrice', e.target.value)}
                        className="mb-2"
                      />
                      <CFormInput
                        placeholder="Description "
                        value={size.description}
                        onChange={e => handleSizeChange(index, 'description', e.target.value)}
                      />
                    </div>
                    <div className="ms-3 d-flex flex-column gap-2">
                      <CButton color="danger" onClick={() => handleRemoveSize(index)}>
                        Delete
                      </CButton>
                    </div>
                  </div>
                ))}

                <CButton color="success" onClick={handleAddSize} className="align-self-start">
                  + Add Size
                </CButton>
              </div>

              {/* Optional CSS for hover effect */}
              <style>
                {`
      .hover-shadow:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: box-shadow 0.3s ease-in-out;
      }
    `}
              </style>
            </CTabPane>

          </CTabContent>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => { setModalVisible(false); setEditModalVisible(false); }}>Close</CButton>
          <CButton color="primary" onClick={modalVisible ? handleAddCategory : handleUpdateCategory}>
            {(saving || updating) ? 'Saving...' : 'Save'}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  );
}
