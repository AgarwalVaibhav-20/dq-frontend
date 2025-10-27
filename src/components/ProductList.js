import React, { useRef, useState, useEffect } from 'react';
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
import FocusTrap from 'focus-trap-react';



const ProductList = React.forwardRef(({
  searchProduct,
  handleSearchProduct,
  tableNumber,
  menuItemsLoading,
  filteredMenuItems,
  onMenuItemClick,
  categories = [],
  selectedCategoryId,
  setSelectedCategoryId,
  systems = [],
  selectedSystem,
  handleSystemDropdownChange,
  handleProductClick,
}, ref) => {
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

  // Handle product click - only show modal, no direct add
  const handleProductClickInternal = (product) => {
    console.log('Product clicked:', product.itemName);
    console.log('Opening size selection modal');

    try {
      setSelectedProduct(product);
      setSelectedSize('');
      setShowSizeModal(true);
      if (handleProductClick) {
        handleProductClick(product); // Call the passed handleProductClick
      }
      console.log('Modal opened for:', product.itemName);
    } catch (error) {
      console.error('Error opening modal:', error);
    }
  };
  const searchInputRef = useRef(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);
  // Handle size selection and add to cart
  const handleAddToCart = () => {
    console.log('Add to cart clicked');
    console.log('Selected product:', selectedProduct?.itemName);
    console.log('Selected size:', selectedSize);

    if (selectedProduct && selectedSize) {
      const sizeData = selectedProduct.sizes.find(s => s._id === selectedSize);
      console.log('Size data found:', sizeData);

      const productWithSize = {
        ...selectedProduct,
        selectedSize: sizeData.label,
        adjustedPrice: sizeData.price,
        sizeId: sizeData._id,
      };

      console.log('Adding product with size:', productWithSize);
      onMenuItemClick(productWithSize);

      setShowSizeModal(false);
      setSelectedProduct(null);
      setSelectedSize('');
      console.log('Modal closed and product added');
    } else {
      console.log('Missing selectedProduct or selectedSize');
    }
  };


  // Close modal
  const handleCloseModal = () => {
    try {
      console.log('Closing modal');
      setShowSizeModal(false);
      setSelectedProduct(null);
      setSelectedSize('');
    } catch (error) {
      console.error('Error closing modal:', error);
    }
  };

  // Direct add to cart without modal
  const handleDirectAdd = (product) => {
    try {
      const productToAdd = {
        ...product,
        adjustedPrice: product.price,
        sizeId: null,
      };
      onMenuItemClick(productToAdd);
      console.log('Added to cart directly:', product.itemName);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };
  // useEffect(() => {
  //   const handleCategoryKeyDown = (e) => {
  //     const categoryButtons = document.querySelectorAll('.category-button');
  //     const currentFocused = document.activeElement;
  //     let index = Array.from(categoryButtons).indexOf(currentFocused);

  //     if (e.key === 'ArrowRight') {
  //       index = index < categoryButtons.length - 1 ? index + 1 : 0;
  //       categoryButtons[index].focus();
  //     }
  //     if (e.key === 'ArrowLeft') {
  //       index = index > 0 ? index - 1 : categoryButtons.length - 1;
  //       categoryButtons[index].focus();
  //     }
  //   };

  //   window.addEventListener('keydown', handleCategoryKeyDown);
  //   return () => window.removeEventListener('keydown', handleCategoryKeyDown);
  // }, []);
  return (
    <>
      <CContainer ref={ref}
        className={`product-list-container" rounded p-4 ${isDarkMode ? 'bg-dark text-light' : 'bg-white text-dark'} shadow-sm`}
      >
        {/* Search & Table Info - Mobile Responsive */}
        <div className="mb-4">
          <CInputGroup className="mb-2 mb-md-0">
            <CFormInput
              placeholder="Search menu items..."
              className={`me-2 me-md-3 py-2 px-3 rounded-pill ${isDarkMode ? 'bg-secondary text-light border-0' : 'border'}`}
              value={searchProduct}
              onChange={handleSearchProduct}
              ref={searchInputRef}
              style={{
                fontSize: '14px',
                minHeight: '40px'
              }}
            />
            <CFormSelect
              className={`rounded-pill px-2 px-md-3 py-2 ${isDarkMode ? 'bg-secondary text-light border-0' : 'border'}`}
              value={selectedSystem?._id || ''}
              onChange={handleSystemDropdownChange}
              style={{
                fontSize: '14px',
                minHeight: '40px',
                minWidth: '120px'
              }}
            >
              <option value="">Select System</option>
              {systems.map(system => (
                <option key={system._id} value={system._id}>
                  {system.systemName} - ₹{system.chargeOfSystem}
                </option>
              ))}
            </CFormSelect>
          </CInputGroup>
        </div>

        {/* Category Filter Bar - Mobile Responsive */}
        <h5 className="fw-semibold mb-3" style={{ fontSize: '16px' }}>Browse by Category</h5>
        <div
          className="d-flex overflow-auto pb-2 mb-4 gap-2 flex-nowrap custom-scrollbar"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: isDarkMode
              ? '#6c757d #343a40'
              : '#adb5bd #f8f9fa',
            minHeight: '48px',
            maxWidth: '100%',
            overflowX: 'auto',
            overflowY: 'hidden',
            paddingBottom: '8px'
          }}
        >
          <CButton
            color={!selectedCategoryId ? 'primary' : isDarkMode ? 'secondary' : 'light'}
            className={`category-button rounded-pill px-4 shadow-sm border-0 ${!selectedCategoryId ? '' : 'opacity-75'}`}
            onClick={() => setSelectedCategoryId(null)}
            style={{
              fontWeight: !selectedCategoryId ? 600 : 400,
              boxShadow: !selectedCategoryId ? '0 0 0 0.2rem rgba(0,123,255,.15)' : undefined,
              transition: 'all 0.2s',
              flexShrink: 0,
              fontSize: '0.8rem',
              minHeight: '40px',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="bi bi-grid me-1" style={{ fontSize: '12px' }} /> All
          </CButton>
          {categories.map((cat) => {
            const categoryId = cat._id || cat.id; // Handle both _id and id fields
            return (
              <CButton
                key={categoryId}
                color={selectedCategoryId === categoryId ? 'primary' : isDarkMode ? 'secondary' : 'light'}
                className={`rounded-pill px-4 shadow-sm border-0 ${selectedCategoryId === categoryId ? '' : 'opacity-75'}`}
                onClick={() => setSelectedCategoryId(categoryId)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSelectedCategoryId(category._id);
                  }
                }}
                style={{
                  fontWeight: selectedCategoryId === categoryId ? 600 : 400,
                  boxShadow: selectedCategoryId === categoryId ? '0 0 0 0.2rem rgba(0,123,255,.15)' : undefined,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  fontSize: '0.8rem',
                  minHeight: '40px'
                }}
              >
                {cat.icon && (
                  <img
                    src={cat.icon}
                    alt=""
                    style={{
                      width: '14px',
                      height: '14px',
                      objectFit: 'contain',
                      marginRight: '4px',
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

        <h5 className="fw-semibold mb-3" style={{ fontSize: '16px' }}>Available Items</h5>
        {menuItemsLoading ? (
          <div className="text-center py-5">
            <CSpinner color="primary" className="mb-3" />
            <p style={{ fontSize: '14px' }}>Fetching products...</p>
          </div>
        ) : filteredMenuItems.length === 0 ? (
          <div className="text-center text-muted py-5" style={{ fontSize: '14px' }}>
            {selectedCategoryId ? 'No products found in this category.' : 'No products match your selection.'}
          </div>
        ) : (
          <div className="product-grid overflow-auto px-2" style={{ maxHeight: '55vh' }}>
            <CRow className="g-2 g-md-4">
              {filteredMenuItems.map((product) => (
                <CCol key={product._id} xs={6} sm={4} md={3} lg={2}>
                  <CTooltip content={`Click to select size for ${product.itemName}`} placement="top">
                    <div
                      onClick={() => {
                        console.log('Product div clicked:', product.itemName);
                        handleProductClickInternal(product);
                      }}
                      className={`product-card p-2 d-flex flex-column align-items-center justify-content-between text-center border rounded-4 h-100 w-100 shadow-sm transition-all hover-scale ${isDarkMode ? 'bg-secondary text-light' : 'bg-white'}`}
                      tabIndex={0}
                      data-id={product._id} // Add data-id for Enter key handling
                      style={{
                        cursor: 'pointer',
                        aspectRatio: '1 / 1',
                        minHeight: '140px',
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
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleProductClickInternal(product);
                        }
                      }}
                    >
                      <h6
                        className="mb-1 fw-semibold"
                        style={{
                          fontSize: '12px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          width: '100%',
                          lineHeight: '1.2',
                        }}
                      >
                        {product.itemName}
                      </h6>
                      <span className="text-primary fw-bold" style={{ fontSize: '12px' }}>
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

      {/* Size Selection Modal - Simplified */}
      <FocusTrap active={showSizeModal}>
        <CModal
          visible={showSizeModal}
          onClose={handleCloseModal}
          size="lg"
        >
          <CModalHeader className={isDarkMode ? 'bg-dark text-light border-secondary' : ''}>
            <CModalTitle style={{ fontSize: '16px' }}>Select Size</CModalTitle>
          </CModalHeader>
          <CModalBody className={isDarkMode ? 'bg-dark text-light' : ''} style={{ padding: '20px' }}>
            {selectedProduct && (
              <div className="text-center mb-3">
                {selectedProduct.itemImage && (
                  <img
                    src={selectedProduct.itemImage}
                    alt={selectedProduct.itemName}
                    style={{
                      width: '80px',
                      height: '80px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      margin: '0 auto 12px'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                <h5 className="mb-2" style={{ fontSize: '16px' }}>{selectedProduct.itemName}</h5>
                <p className={`mb-3 ${isDarkMode ? 'text-light opacity-75' : 'text-muted'}`} style={{ fontSize: '14px' }}>
                  {selectedProduct.description || 'Choose your preferred size'}
                </p>
              </div>
            )}

            <div className="size-options">
              <h6 className="mb-3" style={{ fontSize: '14px' }}>Available Sizes:</h6>
              {selectedProduct?.sizes && selectedProduct.sizes.length > 0 ? (
                <CRow className="g-2">
                  {selectedProduct.sizes.map((size) => (
                    <CCol key={size._id} xs={12} sm={6} md={4}>
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
                          <h6 className="mb-2" style={{ fontSize: '14px' }}>{size.label}</h6>
                          <div className="price-info">
                            <span className="text-primary fw-bold" style={{ fontSize: '14px' }}>₹{size.price}</span>
                          </div>
                          {selectedSize === size._id && (
                            <div className="mt-2">
                              <i className="bi bi-check-circle-fill text-primary" style={{ fontSize: '16px' }}></i>
                            </div>
                          )}
                        </CCardBody>
                      </CCard>
                    </CCol>
                  ))}
                </CRow>
              ) : (
                <div className="text-center text-muted">
                  <p>No sizes available for this item.</p>
                  <CButton
                    color="primary"
                    onClick={() => {
                      // Add item without size selection
                      const productWithoutSize = {
                        ...selectedProduct,
                        adjustedPrice: selectedProduct.price,
                        sizeId: null,
                      };
                      onMenuItemClick(productWithoutSize);
                      setShowSizeModal(false);
                      setSelectedProduct(null);
                      setSelectedSize('');
                    }}
                  >
                    Add to Cart (No Size)
                  </CButton>
                </div>
              )}

            </div>

          </CModalBody>
          <CModalFooter className={isDarkMode ? 'bg-dark border-secondary' : ''} style={{ padding: '16px 20px' }}>
            <CButton
              color="secondary"
              onClick={handleCloseModal}
              style={{ fontSize: '14px', minWidth: '80px' }}
            >
              Cancel
            </CButton>
            <CButton
              color="primary"
              onClick={handleAddToCart}
              disabled={!selectedSize}
              style={{ fontSize: '14px', minWidth: '100px' }}
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
      </FocusTrap>

    </>
  );
});

export default ProductList;
