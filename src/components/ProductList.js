import React, { useState } from 'react';
import {
  CContainer,
  CInputGroup,
  CFormInput,
  CFormSelect,
  CRow,
  CCol,
  CButton,
  CSpinner,
  CTooltip,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CCard,
  CCardBody,
  CCardImage,
} from '@coreui/react';
import { useSelector } from 'react-redux';

const ProductList = ({
  searchProduct,
  handleSearchProduct,
  tableNumber,
  menuItemsLoading,
  filteredMenuItems,
  onMenuItemClick,
  categories = [],
  selectedCategoryId,
  setSelectedCategoryId,
}) => {
  const theme = useSelector((state) => state.theme.theme);
  const isDarkMode = theme === 'dark';

  // console.log("filtered itesm menu",filteredMenuItems)

  // Modal state
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');

  // Available sizes
  const sizes = [
    { id: 'small', label: 'Small', priceMultiplier: 0.8 },
    { id: 'medium', label: 'Medium', priceMultiplier: 1.0 },
    { id: 'full', label: 'Full', priceMultiplier: 1.3 }
  ];

  // Handle product click - open modal
  const handleProductClick = (product) => {
    setSelectedProduct(product);
    // setSelectedSize('medium'); // Default to medium
    setShowSizeModal(true);
  };

  // Handle size selection and add to cart
  const handleAddToCart = () => {
    if (selectedProduct && selectedSize) {
      const sizeData = selectedProduct.sizes.find(s => s._id === selectedSize);
      console.log("size data :", sizeData);
      const productWithSize = {
        ...selectedProduct,
        selectedSize: sizeData.label,
        adjustedPrice: sizeData.price,
        sizeId: sizeData._id,
      };

      onMenuItemClick(productWithSize);

      setShowSizeModal(false);
      setSelectedProduct(null);
      setSelectedSize('');
    }
  };


  // Close modal
  const handleCloseModal = () => {
    setShowSizeModal(false);
    setSelectedProduct(null);
    setSelectedSize('');
  };

  return (
    <>
      <CContainer
        className={`rounded p-4 ${isDarkMode ? 'bg-dark text-light' : 'bg-white text-dark'} shadow-sm`}
      >
        {/* Search & Table Info */}
        <CInputGroup className="mb-4">
          <CFormInput
            placeholder="Search menu items..."
            className={`me-3 py-2 px-3 rounded-pill ${isDarkMode ? 'bg-secondary text-light border-0' : 'border'}`}
            value={searchProduct}
            onChange={handleSearchProduct}
          />
          <CFormSelect
            className={`rounded-pill px-3 py-2 ${isDarkMode ? 'bg-secondary text-light border-0' : 'border'}`}
            disabled
          >
            <option>Table #{tableNumber}</option>
          </CFormSelect>
        </CInputGroup>

        {/* Category Filter Bar */}
        <h5 className="fw-semibold mb-3">Browse by Category</h5>
        <div
          className="d-flex overflow-auto pb-2 mb-4 gap-2 flex-nowrap custom-scrollbar"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: isDarkMode
              ? '#6c757d #343a40'
              : '#adb5bd #f8f9fa',
            minHeight: 56,
          }}
        >
          <CButton
            color={!selectedCategoryId ? 'primary' : isDarkMode ? 'secondary' : 'light'}
            className={`rounded-pill px-4 shadow-sm border-0 ${!selectedCategoryId ? '' : 'opacity-75'}`}
            onClick={() => setSelectedCategoryId(null)}
            style={{
              fontWeight: !selectedCategoryId ? 600 : 400,
              boxShadow: !selectedCategoryId ? '0 0 0 0.2rem rgba(0,123,255,.15)' : undefined,
              transition: 'all 0.2s',
            }}
          >
            <i className="bi bi-grid me-2" /> All
          </CButton>
          {categories.map((cat) => {
            const categoryId = cat._id || cat.id; // Handle both _id and id fields
            return (
              <CButton
                key={categoryId}
                color={selectedCategoryId === categoryId ? 'primary' : isDarkMode ? 'secondary' : 'light'}
                className={`rounded-pill px-4 shadow-sm border-0 ${selectedCategoryId === categoryId ? '' : 'opacity-75'}`}
                onClick={() => setSelectedCategoryId(categoryId)}
                style={{
                  fontWeight: selectedCategoryId === categoryId ? 600 : 400,
                  boxShadow: selectedCategoryId === categoryId ? '0 0 0 0.2rem rgba(0,123,255,.15)' : undefined,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {cat.icon && (
                  <img
                    src={cat.icon}
                    alt=""
                    style={{
                      width: 22,
                      height: 22,
                      objectFit: 'contain',
                      marginRight: 8,
                      filter: isDarkMode ? 'invert(1)' : undefined,
                    }}
                  />
                )}
                {cat.categoryName}
              </CButton>
            );
          })}
          {/* {categories.map((cat) => (
            <CButton
              key={cat.id}
              color={selectedCategoryId === cat.id ? 'primary' : isDarkMode ? 'secondary' : 'light'}
              className={`rounded-pill px-4 shadow-sm border-0 ${selectedCategoryId === cat.id ? '' : 'opacity-75'}`}
              onClick={() => setSelectedCategoryId(cat.id)}
              style={{
                fontWeight: selectedCategoryId === cat.id ? 600 : 400,
                boxShadow: selectedCategoryId === cat.id ? '0 0 0 0.2rem rgba(0,123,255,.15)' : undefined,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              {cat.icon && (
                <img
                  src={cat.icon}
                  alt=""
                  style={{
                    width: 22,
                    height: 22,
                    objectFit: 'contain',
                    marginRight: 8,
                    filter: isDarkMode ? 'invert(1)' : undefined,
                  }}
                />
              )}
              {cat.categoryName}
            </CButton>
          ))} */}
        </div>

        <h5 className="fw-semibold mb-3">Available Items</h5>
        {menuItemsLoading ? (
          <div className="text-center py-5">
            <CSpinner color="primary" className="mb-3" />
            <p>Fetching products...</p>
          </div>
        ) : filteredMenuItems.length === 0 ? (
          <div className="text-center text-muted py-5 fs-6">
            {selectedCategoryId ? 'No products found in this category.' : 'No products match your selection.'}
          </div>
        ) : (
          <div className="product-grid overflow-auto px-2" style={{ maxHeight: '55vh' }}>
            <CRow className="g-4">
              {filteredMenuItems.map((product) => (
                <CCol key={product.id} xs={12} sm={6} md={4} lg={3} xl={2} className="d-flex">
                  <CTooltip content={`Click to select size for ${product.itemName}`} placement="top">
                    <div
                      onClick={() => handleProductClick(product)}
                      className={`p-2 d-flex flex-column align-items-center justify-content-between text-center border rounded-4 h-100 w-100 shadow-sm transition-all hover-scale ${isDarkMode ? 'bg-secondary text-light' : 'bg-white'
                        }`}
                      style={{
                        cursor: 'pointer',
                        aspectRatio: '1 / 1',
                        minHeight: 180,
                        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                        transition: 'transform 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
                      }}
                    >
                    
                        {/* <div className="mb-2" style={{ width: '60px', height: '60px' }}>
                          <img
                            src={product.itemImage}
                            alt={product.itemName}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: '8px',
                            }}
                          />
                        </div> */}
                      <h6
                        className="mb-1 fw-semibold"
                        style={{
                          fontSize: '15px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          width: '100%'
                        }}
                      >
                        {product.itemName}
                      </h6>
                      <span className="text-primary fw-bold" style={{ fontSize: '15px' }}>
                        ₹{!product.sizes[0]?.price ? product.price : product.sizes[0].price}
                      </span>
                    </div>
                  </CTooltip>
                </CCol>
              ))}
            </CRow>
          </div>
        )}
      </CContainer>

      {/* Size Selection Modal */}
      <CModal
        visible={showSizeModal}
        onClose={handleCloseModal}
        size="md"
        centered
        className={isDarkMode ? 'modal-dark' : ''}
      >
        <CModalHeader className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}>
          <CModalTitle>Select Size</CModalTitle>
        </CModalHeader>
        <CModalBody className={isDarkMode ? 'bg-dark text-light' : ''}>
          {selectedProduct && (
            <div className="text-center mb-4">
              
                <img
                  src={selectedProduct.itemImage}
                  alt={selectedProduct.itemName}
                  style={{
                    width: '120px',
                    height: '120px',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    margin: '0 auto 16px'
                  }}
                />
              <h4 className="mb-2">{selectedProduct.itemName}</h4>
              <p className={`mb-3 ${isDarkMode ? 'text-light opacity-75' : 'text-muted'}`}>
                {selectedProduct.description || 'Choose your preferred size'}
              </p>
            </div>
          )}

          <div className="size-options">
            <h6 className="mb-3">Available Sizes:</h6>
            <CRow className="g-3">
              {selectedProduct?.sizes?.map((size) => (
                <CCol key={size._id} xs={12} sm={4}>
                  <CCard
                    className={`size-option h-100 ${selectedSize === size._id
                      ? 'border-primary bg-primary bg-opacity-10'
                      : isDarkMode
                        ? 'bg-secondary border-secondary'
                        : 'border'
                      }`}
                    style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                    onClick={() => setSelectedSize(size._id)}
                  >
                    <CCardBody className="text-center p-3">
                      <h6 className="mb-2">{size.label}</h6>
                      <div className="price-info">
                        <span className="text-primary fw-bold">₹{size.price}</span>
                      </div>
                      {selectedSize === size._id && (
                        <div className="mt-2">
                          <i className="bi bi-check-circle-fill text-primary"></i>
                        </div>
                      )}
                    </CCardBody>
                  </CCard>
                </CCol>
              ))}
            </CRow>
          </div>

        </CModalBody>
        <CModalFooter className={isDarkMode ? 'bg-dark border-secondary' : ''}>
          <CButton color="secondary" onClick={handleCloseModal}>
            Cancel
          </CButton>
          <CButton
            color="primary"
            onClick={handleAddToCart}
            disabled={!selectedSize}
          >
            Add to Cart
            {/* {selectedProduct && selectedSize && (
              <span className="ms-2">
                - ₹{Math.round(selectedProduct.price * sizes.find(s => s.id === selectedSize)?.priceMultiplier || 1)}
              </span>
            )} */}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default ProductList;
