import React from 'react';
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

  return (
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
        {categories.map((cat) => (
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
        ))}
      </div>
      <h5 className="fw-semibold mb-3">Available Items</h5>
      {menuItemsLoading ? (
        <div className="text-center py-5">
          <CSpinner color="primary" className="mb-3" />
          <p>Fetching products...</p>
        </div>
      ) : filteredMenuItems.length === 0 ? (
        <div className="text-center text-muted py-5 fs-6">No products match your selection.</div>
      ) : (
        <div className="product-grid overflow-auto px-2" style={{ maxHeight: '55vh' }}>
          <CRow className="g-4">
            {filteredMenuItems.map((product) => (
              <CCol key={product.id} xs={12} sm={6} md={4} lg={3} xl={2} className="d-flex">
                <CTooltip content={`Click to add ${product.itemName}`} placement="top">
                  <div
                    onClick={() => onMenuItemClick(product)}
                    className={`p-3 d-flex flex-column align-items-center justify-content-between text-center border rounded-4 h-100 w-100 shadow-sm transition-all hover-scale bg-gradient ${
                      isDarkMode ? 'bg-secondary text-light' : 'bg-white'
                    }`}
                    style={{
                      cursor: 'pointer',
                      aspectRatio: '1 / 1',
                      minHeight: 180,
                      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                      transition: 'transform 0.15s',
                    }}
                  >
                    {product.itemImage && (
                      <div
                        style={{
                          width: '100%',
                          height: 90,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: isDarkMode ? '#23272b' : '#f8f9fa',
                          padding: 6,
                          borderRadius: 12,
                          marginBottom: 12,
                          overflow: 'hidden',
                        }}
                      >
                        <img
                          src={product.itemImage}
                          alt={product.itemName}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: 8,
                            display: 'block',
                          }}
                        />
                      </div>
                    )}
                    <h6 className="mb-1 fw-semibold" style={{ fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{product.itemName}</h6>
                    <span className="text-primary fw-bold" style={{ fontSize: '1.1rem' }}>₹{product.price}</span>
                  </div>
                </CTooltip>
              </CCol>
            ))}
          </CRow>
        </div>
      )}
    </CContainer>
  );
};

export default ProductList;