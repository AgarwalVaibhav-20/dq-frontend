import React, { useRef, useState, useEffect, useCallback } from 'react';
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

  // Modal state
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const sizeOptionRefs = useRef([]);

  // Handle product click - only show modal, no direct add
  const handleProductClickInternal = (product) => {
    if (!product) return;

    try {
      setSelectedProduct(product);
      setSelectedSize('');
      setShowSizeModal(true);

      if (handleProductClick) {
        handleProductClick(product);
      }
    } catch (error) {
      console.error('Error opening modal:', error);
    }
  };

  const searchInputRef = useRef(null);
  const selectSystemRef = useRef(null);
  const modalHasFocusedRef = useRef(false);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Function to focus first size option
  const focusFirstSizeOption = useCallback(() => {
    const attemptFocus = () => {
      const firstSizeCard = sizeOptionRefs.current[0];
      const elementToFocus = firstSizeCard || document.querySelector('.size-option[tabindex="0"]');

      if (elementToFocus) {
        try {
          if (elementToFocus.setAttribute) {
            elementToFocus.setAttribute('tabindex', '0');
          }
          if (typeof elementToFocus.focus === 'function') {
            elementToFocus.focus();
            modalHasFocusedRef.current = true;
            return true;
          }
        } catch (error) {
          console.error('Error focusing:', error);
        }
      }
      return false;
    };

    if (!attemptFocus()) {
      requestAnimationFrame(() => {
        if (!attemptFocus()) {
          setTimeout(() => {
            if (!attemptFocus()) {
              setTimeout(() => {
                attemptFocus();
              }, 300);
            }
          }, 150);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (showSizeModal && selectedProduct?.sizes && selectedProduct.sizes.length > 0) {
      modalHasFocusedRef.current = false;
      setTimeout(() => {
        focusFirstSizeOption();
      }, 200);
    } else {
      modalHasFocusedRef.current = false;
      if (!showSizeModal) {
        sizeOptionRefs.current = [];
      }
    }
  }, [showSizeModal, selectedProduct, focusFirstSizeOption]);

  // Handle size selection and add to cart
  const handleAddToCart = () => {
    if (selectedProduct && selectedSize) {
      const sizeData = selectedProduct.sizes.find(s => s._id === selectedSize);

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
    // Optionally focus back to the product list search input
    searchInputRef.current?.focus();
  };

  // Direct add to cart without modal
  const handleDirectAdd = (product) => {
    const productToAdd = {
      ...product,
      adjustedPrice: product.price,
      sizeId: null,
    };
    onMenuItemClick(productToAdd);
  };

  return (
    <>
      <CContainer ref={ref}
        className={`product-list-container rounded max-sm:mb-5 p-4 card-theme-aware text-theme-aware shadow-sm`}
        style={{
          borderColor: isDarkMode ? 'var(--cui-border-color)' : 'var(--cui-gray-400)',
          borderWidth: '1px',
          borderStyle: 'solid'
        }}
      >
        {/* Search & Table Info - Mobile Responsive */}
        <div className="mb-4">
          <CInputGroup className="mb-2 mb-md-0">
            <CFormInput
              placeholder="Search menu items..."
              className="me-2 me-md-3 py-2 px-3 rounded-pill input-theme-aware"
              value={searchProduct}
              onChange={handleSearchProduct}
              ref={searchInputRef}
              style={{
                fontSize: '14px',
                minHeight: '40px'
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  e.stopPropagation();
                  selectSystemRef.current?.focus();
                }
                else if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  e.stopPropagation();
                  selectSystemRef.current?.focus();
                }
                else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  e.stopPropagation();
                  const categoryButtons = document.querySelectorAll('.category-button');
                  if (categoryButtons.length > 0) {
                    categoryButtons[0].focus();
                  } else {
                    const productCards = document.querySelectorAll('.product-card');
                    if (productCards.length > 0) {
                      productCards[0].focus();
                    }
                  }
                }
              }}
            />
            <CFormSelect
              ref={selectSystemRef}
              className="rounded-pill px-2 px-md-3 py-2 input-theme-aware"
              value={selectedSystem?._id || ''}
              onChange={handleSystemDropdownChange}
              style={{
                fontSize: '14px',
                minHeight: '40px',
                minWidth: '120px'
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  e.stopPropagation();
                  searchInputRef.current?.focus();
                }
                else if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  e.stopPropagation();
                  const cartItem = document.querySelector('.cart-item');
                  if (cartItem) {
                    cartItem.focus();
                  }
                }
                else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  e.stopPropagation();
                  const categoryButtons = document.querySelectorAll('.category-button');
                  if (categoryButtons.length > 0) {
                    categoryButtons[0].focus();
                  }
                }
              }}
            >
              <option value="">None (Remove System Charge)</option>
              {systems.map(system => (
                <option key={system._id} value={system._id}>
                  {system.systemName} - ₹{system.chargeOfSystem}
                </option>
              ))}
            </CFormSelect>
          </CInputGroup>
        </div>

        {/* Category Filter Bar - Mobile Responsive */}
        <h5 className="fw-semibold mb-3 text-theme-aware" style={{ fontSize: '16px' }}>Browse by Category</h5>
        <div
          className="d-flex overflow-auto pb-2 mb-4 gap-2 flex-nowrap custom-scrollbar"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: isDarkMode
              ? 'var(--cui-gray-600) var(--cui-gray-800)' // Dark Mode scrollbar colors
              : 'var(--cui-gray-500) var(--cui-gray-100)', // Light Mode scrollbar colors
            minHeight: '48px',
            maxWidth: '100%',
            overflowX: 'auto',
            overflowY: 'hidden',
            paddingBottom: '8px'
          }}
        >
          <CButton
            // Use secondary for inactive, relying on global CSS to theme 'secondary'
            color={!selectedCategoryId ? 'primary' : 'secondary'}
            className="category-button rounded-pill px-4 shadow-sm border-0"
            onClick={() => setSelectedCategoryId(null)}
            tabIndex={0}
            onFocus={(e) => {
              e.currentTarget.style.outline = '3px solid #0d6efd';
              e.currentTarget.style.outlineOffset = '2px';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
            }}
            style={{
              fontWeight: !selectedCategoryId ? 600 : 400,
              boxShadow: !selectedCategoryId ? '0 0 0 0.2rem rgba(0,123,255,.15)' : undefined,
              transition: 'all 0.2s',
              flexShrink: 0,
              fontSize: '0.8rem',
              minHeight: '40px',
              whiteSpace: 'nowrap'
            }}
            onKeyDown={(e) => {
              // ... (Keydown logic remains the same)
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedCategoryId(null);
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                const productCards = document.querySelectorAll('.product-card');
                if (productCards.length > 0) {
                  productCards[0].focus();
                }
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                e.stopPropagation();
                const searchInput = document.querySelector('input[placeholder*="Search menu"]');
                if (searchInput) {
                  searchInput.focus();
                  searchInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                e.stopPropagation();
                const categoryButtons = document.querySelectorAll('.category-button');
                const currentIndex = Array.from(categoryButtons).indexOf(e.currentTarget);
                let targetButton;
                if (currentIndex > 0) {
                  targetButton = categoryButtons[currentIndex - 1];
                } else {
                  targetButton = categoryButtons[categoryButtons.length - 1];
                }
                if (targetButton) {
                  targetButton.focus();
                  targetButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }
              } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                e.stopPropagation();
                const categoryButtons = document.querySelectorAll('.category-button');
                const currentIndex = Array.from(categoryButtons).indexOf(e.currentTarget);
                let targetButton;
                if (currentIndex < categoryButtons.length - 1) {
                  targetButton = categoryButtons[currentIndex + 1];
                } else {
                  targetButton = categoryButtons[0];
                }
                if (targetButton) {
                  targetButton.focus();
                  targetButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }
              }
            }}
          >
            <i className="bi bi-grid me-1" style={{ fontSize: '12px' }} /> All
          </CButton>
          {categories.map((cat) => {
            const categoryId = cat._id || cat.id;
            return (
              <CButton
                key={categoryId}
                // Use secondary for inactive, relying on global CSS to theme 'secondary'
                color={selectedCategoryId === categoryId ? 'primary' : 'secondary'}
                className={`category-button rounded-pill px-4 shadow-sm border-0 ${selectedCategoryId === categoryId ? '' : 'opacity-75'}`}
                onClick={() => setSelectedCategoryId(categoryId)}
                tabIndex={0}
                onFocus={(e) => {
                  e.currentTarget.style.outline = '3px solid #0d6efd';
                  e.currentTarget.style.outlineOffset = '2px';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.outline = 'none';
                }}
                onKeyDown={(e) => {
                  // ... (Keydown logic remains the same)
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedCategoryId(categoryId);
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    const productCards = document.querySelectorAll('.product-card');
                    if (productCards.length > 0) {
                      productCards[0].focus();
                    }
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    e.stopPropagation();
                    const searchInput = document.querySelector('input[placeholder*="Search menu"]');
                    if (searchInput) {
                      searchInput.focus();
                      searchInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                  } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    e.stopPropagation();
                    const categoryButtons = document.querySelectorAll('.category-button');
                    const currentIndex = Array.from(categoryButtons).indexOf(e.currentTarget);
                    let targetButton;
                    if (currentIndex > 0) {
                      targetButton = categoryButtons[currentIndex - 1];
                    } else {
                      targetButton = categoryButtons[categoryButtons.length - 1];
                    }
                    if (targetButton) {
                      targetButton.focus();
                      targetButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    }
                  } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    e.stopPropagation();
                    const categoryButtons = document.querySelectorAll('.category-button');
                    const currentIndex = Array.from(categoryButtons).indexOf(e.currentTarget);
                    let targetButton;
                    if (currentIndex < categoryButtons.length - 1) {
                      targetButton = categoryButtons[currentIndex + 1];
                    } else {
                      targetButton = categoryButtons[0];
                    }
                    if (targetButton) {
                      targetButton.focus();
                      targetButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    }
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
                    className="invert-dark-mode-icon" // ✅ New Class: Use a global class for inversion
                    style={{
                      width: '14px',
                      height: '14px',
                      objectFit: 'contain',
                      marginRight: '4px',
                    }}
                  />
                )}
                {cat.categoryName}
              </CButton>
            );
          })}
        </div>

        <h5 className="fw-semibold mb-3 text-theme-aware" style={{ fontSize: '16px' }}>Available Items</h5>
        {menuItemsLoading ? (
          <div className="text-center py-5">
            <CSpinner color="primary" className="mb-3" />
            <p className="text-theme-aware" style={{ fontSize: '14px' }}>Fetching products...</p>
          </div>
        ) : filteredMenuItems.length === 0 ? (
          <div className="text-center text-secondary py-5" style={{ fontSize: '14px' }}>
            {selectedCategoryId ? 'No products found in this category.' : 'No products match your selection.'}
          </div>
        ) : (
          <div className="product-grid overflow-auto px-2 custom-scrollbar" style={{ maxHeight: '55vh' }}>
            <CRow className="g-2 g-md-4">
              {filteredMenuItems.map((product) => (
                <CCol key={product._id} xs={6} sm={4} md={3} lg={2}>
                  <CTooltip content={`Click to select size for ${product.itemName}`} placement="top">
                    <div
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleProductClickInternal(product);
                      }}
                      className={`product-card p-2 d-flex flex-column align-items-center justify-content-between text-center border rounded-4 h-100 w-100 shadow-sm transition-all hover-scale card-theme-aware text-theme-aware`}
                      tabIndex={0}
                      data-id={product._id}
                      data-product-name={product.itemName}
                      role="button"
                      aria-label={`Select size for ${product.itemName}`}
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
                        // Apply hover color for non-JS themes
                        e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--cui-gray-800)' : 'var(--cui-gray-100)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
                        // Revert to base color
                        e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--cui-card-bg)' : 'var(--cui-body-bg)';
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.outline = '3px solid #0d6efd';
                        e.currentTarget.style.outlineOffset = '3px';
                        e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.outline = 'none';
                        // Revert to base color on blur
                        e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--cui-card-bg)' : 'var(--cui-body-bg)';
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
                            e.nativeEvent.stopImmediatePropagation();
                          }
                          setTimeout(() => {
                            handleProductClickInternal(product);
                          }, 0);
                        }
                        // ... (Arrow key navigation remains the same)
                        else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          e.stopPropagation();
                          const categoryButtons = document.querySelectorAll('.category-button');
                          if (categoryButtons.length > 0) {
                            categoryButtons[0].focus();
                            categoryButtons[0].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                          }
                        }
                        else if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          const productCards = document.querySelectorAll('.product-card');
                          const currentIndex = Array.from(productCards).indexOf(e.currentTarget);

                          let colsPerRow = 2;
                          if (window.innerWidth >= 1200) colsPerRow = 6;
                          else if (window.innerWidth >= 992) colsPerRow = 4;
                          else if (window.innerWidth >= 576) colsPerRow = 3;

                          const newIndex = currentIndex + colsPerRow;
                          if (newIndex < productCards.length) {
                            productCards[newIndex]?.focus();
                          }
                        }
                        else if (e.key === 'ArrowLeft') {
                          e.preventDefault();
                          e.stopPropagation();
                          const productCards = document.querySelectorAll('.product-card');
                          const currentIndex = Array.from(productCards).indexOf(e.currentTarget);

                          if (currentIndex === -1) return;

                          let colsPerRow = 2;
                          if (window.innerWidth >= 1200) colsPerRow = 6;
                          else if (window.innerWidth >= 992) colsPerRow = 4;
                          else if (window.innerWidth >= 576) colsPerRow = 3;

                          const currentRow = Math.floor(currentIndex / colsPerRow);
                          const currentCol = currentIndex % colsPerRow;

                          let targetIndex;
                          if (currentCol > 0) {
                            targetIndex = currentRow * colsPerRow + (currentCol - 1);
                          } else {
                            const lastColInRow = Math.min(colsPerRow - 1, (productCards.length - (currentRow * colsPerRow) - 1));
                            targetIndex = currentRow * colsPerRow + lastColInRow;
                          }

                          if (targetIndex >= 0 && targetIndex < productCards.length) {
                            productCards[targetIndex]?.focus();
                          }
                        }
                        else if (e.key === 'ArrowRight') {
                          e.preventDefault();
                          e.stopPropagation();
                          const productCards = document.querySelectorAll('.product-card');
                          const currentIndex = Array.from(productCards).indexOf(e.currentTarget);

                          if (currentIndex === -1) return;

                          let colsPerRow = 2;
                          if (window.innerWidth >= 1200) colsPerRow = 6;
                          else if (window.innerWidth >= 992) colsPerRow = 4;
                          else if (window.innerWidth >= 576) colsPerRow = 3;

                          const currentRow = Math.floor(currentIndex / colsPerRow);
                          const currentCol = currentIndex % colsPerRow;
                          const itemsInCurrentRow = Math.min(colsPerRow, productCards.length - (currentRow * colsPerRow));

                          let targetIndex;
                          if (currentCol < itemsInCurrentRow - 1) {
                            targetIndex = currentRow * colsPerRow + (currentCol + 1);
                          } else {
                            targetIndex = currentRow * colsPerRow;
                          }

                          if (targetIndex >= 0 && targetIndex < productCards.length) {
                            productCards[targetIndex]?.focus();
                          }
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
                          color: isDarkMode ? 'var(--cui-body-color)' : 'var(--cui-body-color)' // Explicit text color fix
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
      <CModal
        visible={showSizeModal}
        onClose={handleCloseModal}
        size="lg"
        backdrop="static"
        portal={false}
      >
        {/* Header relies on global .modal-header CSS */}
        <CModalHeader>
          <CModalTitle style={{ fontSize: '16px' }}>Select Size</CModalTitle>
        </CModalHeader>

        {/* Body relies on global .modal-body CSS */}
        <CModalBody style={{ padding: '20px' }}>
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
              <h5 className="mb-2 text-theme-aware" style={{ fontSize: '16px' }}>{selectedProduct.itemName}</h5>
              <p className="mb-3 text-secondary" style={{ fontSize: '14px' }}>
                {selectedProduct.description || 'Choose your preferred size'}
              </p>
            </div>
          )}

          <div className="size-options">
            <h6 className="mb-3 text-theme-aware" style={{ fontSize: '14px' }}>Available Sizes:</h6>
            {selectedProduct?.sizes && selectedProduct.sizes.length > 0 ? (
              <CRow className="g-2">
                {selectedProduct.sizes.map((size, index) => (
                  <CCol key={size._id} xs={12} sm={6} md={4}>
                    <CCard
                      ref={(el) => {
                        sizeOptionRefs.current[index] = el;
                      }}
                      className={`size-option h-100 ${selectedSize === size._id
                        ? 'border-primary bg-primary bg-opacity-10'
                        : 'border card-theme-aware' // Use card-theme-aware for default style
                        }`}
                      style={{
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        outline: 'none'
                      }}
                      onClick={() => setSelectedSize(size._id)}
                      tabIndex={0}
                      role="button"
                      aria-pressed={selectedSize === size._id}
                      onFocus={(e) => {
                        e.currentTarget.style.outline = '3px solid #0d6efd';
                        e.currentTarget.style.outlineOffset = '2px';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.outline = 'none';
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedSize(size._id);
                        } else if (e.key === 'ArrowRight') {
                          e.preventDefault();
                          e.stopPropagation();
                          const nextIndex = index < selectedProduct.sizes.length - 1 ? index + 1 : 0;
                          const nextSizeOption = sizeOptionRefs.current[nextIndex];
                          nextSizeOption?.focus();
                        } else if (e.key === 'ArrowLeft') {
                          e.preventDefault();
                          e.stopPropagation();
                          const prevIndex = index > 0 ? index - 1 : selectedProduct.sizes.length - 1;
                          const prevSizeOption = sizeOptionRefs.current[prevIndex];
                          prevSizeOption?.focus();
                        } else if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          e.stopPropagation();
                          const addToCartBtn = document.querySelector('.add-to-cart-size-btn');
                          addToCartBtn?.focus();
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          e.stopPropagation();
                          const cancelBtn = document.querySelector('.cancel-size-btn');
                          cancelBtn?.focus();
                        }
                      }}
                    >
                      <CCardBody className="text-center p-3 text-theme-aware">
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
              <div className="text-center text-secondary">
                <p>No sizes available for this item.</p>
                <CButton
                  color="primary"
                  onClick={() => {
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
        {/* Footer relies on global .modal-footer CSS */}
        <CModalFooter style={{ padding: '16px 20px' }}>
          <CButton
            color="secondary"
            className="cancel-size-btn"
            onClick={handleCloseModal}
            style={{ fontSize: '14px', minWidth: '80px' }}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCloseModal();
              } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                e.stopPropagation();
                const addToCartBtn = document.querySelector('.add-to-cart-size-btn');
                addToCartBtn?.focus();
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                e.stopPropagation();
                const firstSizeOption = sizeOptionRefs.current[0];
                firstSizeOption?.focus();
              }
            }}
          >
            Cancel
          </CButton>
          <CButton
            color="primary"
            className="add-to-cart-size-btn"
            onClick={handleAddToCart}
            disabled={!selectedSize}
            style={{ fontSize: '14px', minWidth: '100px' }}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (selectedSize) {
                  handleAddToCart();
                }
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                e.stopPropagation();
                const cancelBtn = document.querySelector('.cancel-size-btn');
                cancelBtn?.focus();
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                e.stopPropagation();
                if (sizeOptionRefs.current.length > 0) {
                  const lastSizeOption = sizeOptionRefs.current[sizeOptionRefs.current.length - 1];
                  lastSizeOption?.focus();
                }
              }
            }}
          >
            Add to Cart
          </CButton>
        </CModalFooter>
      </CModal>

    </>
  );
});

export default ProductList;