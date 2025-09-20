import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Plus, 
  Building2, 
  Users, 
  Trash2, 
  Edit3,
  MapPin,
  X,
  QrCode as QrCodeIcon
} from 'lucide-react';

// Import your actual Redux actions
import { 
  fetchFloors, 
  createFloor, 
  deleteFloor, 
  addTableToFloor 
} from '../../redux/slices/FloorRedux'
import { 
  fetchTables, 
  createTable, 
  createMultipleTables, 
  deleteTable,
  updateTableStatus 
} from '../../redux/slices/tableSlice';
import { 
  createQrCode 
} from '../../redux/slices/qrSlice';

const TableFloorManager = () => {
  const [showMainModal, setShowMainModal] = useState(false);
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [showAddFloorModal, setShowAddFloorModal] = useState(false);
  const [activeTab, setActiveTab] = useState('single'); // 'single' or 'multiple'
  
  // Table form state
  const [tableForm, setTableForm] = useState({
    tableNumber: '',
    capacity: '',
    floorId: '',
    position: { x: 0, y: 0 },
    status: 'available',
    generateQR: false
  });
  
  // Floor form state
  const [floorForm, setFloorForm] = useState({
    floorName: '',
    description: '',
    floorNumber: ''
  });
  
  // Multiple tables state
  const [multipleTablesForm, setMultipleTablesForm] = useState({
    startNumber: '',
    endNumber: '',
    capacity: '',
    floorId: '',
    prefix: 'Table',
    generateQR: false
  });

  // Redux state and actions
  const dispatch = useDispatch();
  const { floors = [], loading: floorsLoading, error: floorsError } = useSelector(state => state.floor || {});
  const { tables = [], loading: tablesLoading, error: tablesError } = useSelector(state => state.tables || {});
  const { loading: qrLoading } = useSelector(state => state.qr || {});
  
  // Get data from localStorage with fallbacks
  const token = localStorage.getItem('authToken');
  const restaurantId = localStorage.getItem('restaurantId');

  const loading = floorsLoading || tablesLoading || qrLoading;

  // Fetch data on component mount
  useEffect(() => {
    console.log('TableFloorManager mounted with:', { token: !!token, restaurantId });
    
    if (token && restaurantId) {
      dispatch(fetchFloors({ restaurantId, token, includeTables: true }))
        .catch(err => console.error('Error fetching floors:', err));
      dispatch(fetchTables({ restaurantId, token }))
        .catch(err => console.error('Error fetching tables:', err));
    }
  }, [dispatch, token, restaurantId]);

  // Form validation helpers
  const validateSingleTableForm = () => {
    if (!tableForm.tableNumber.trim()) {
      alert('Please enter a table number');
      return false;
    }
    if (!tableForm.capacity || parseInt(tableForm.capacity) <= 0) {
      alert('Please enter a valid capacity');
      return false;
    }
    return true;
  };

  const validateMultipleTablesForm = () => {
    if (!multipleTablesForm.startNumber || !multipleTablesForm.endNumber) {
      alert('Please enter start and end numbers');
      return false;
    }
    if (!multipleTablesForm.capacity || parseInt(multipleTablesForm.capacity) <= 0) {
      alert('Please enter a valid capacity');
      return false;
    }
    
    const start = parseInt(multipleTablesForm.startNumber);
    const end = parseInt(multipleTablesForm.endNumber);
    
    if (start > end) {
      alert('Start number must be less than or equal to end number');
      return false;
    }
    return true;
  };

  const validateFloorForm = () => {
    if (!floorForm.floorName.trim()) {
      alert('Please enter a floor name');
      return false;
    }
    return true;
  };

  // Reset forms
  const resetTableForm = () => {
    setTableForm({
      tableNumber: '',
      capacity: '',
      floorId: '',
      position: { x: 0, y: 0 },
      status: 'available',
      generateQR: false
    });
  };

  const resetMultipleTablesForm = () => {
    setMultipleTablesForm({
      startNumber: '',
      endNumber: '',
      capacity: '',
      floorId: '',
      prefix: 'Table',
      generateQR: false
    });
  };

  const resetFloorForm = () => {
    setFloorForm({
      floorName: '',
      description: '',
      floorNumber: ''
    });
  };

  const handleAddSingleTable = async (e) => {
    e.preventDefault(); // Prevent default form submission if used in a form
    
    console.log('Adding single table with data:', tableForm);
    
    if (!validateSingleTableForm()) {
      return;
    }

    try {
      const tableData = {
        tableNumber: tableForm.tableNumber.trim(),
        capacity: parseInt(tableForm.capacity),
        floorId: tableForm.floorId || null, // Send null if no floor selected
        position: tableForm.position,
        status: tableForm.status
      };

      console.log('Dispatching createTable with:', { restaurantId, tableData, token: !!token });

      const result = await dispatch(createTable({ 
        restaurantId, 
        tableData, 
        token 
      })).unwrap(); // Use unwrap() to handle rejections properly

      console.log('Table created successfully:', result);

      // Create QR code if requested
      if (tableForm.generateQR && result) {
        try {
          await dispatch(createQrCode({
            restaurantId,
            tableNumber: result.tableNumber,
            tableId: result._id,
            token
          })).unwrap();
          console.log('QR code created successfully');
        } catch (qrError) {
          console.error('Error creating QR code:', qrError);
          alert('Table created but QR code generation failed');
        }
      }

      resetTableForm();
      setShowAddTableModal(false);
      
      // Refresh data
      dispatch(fetchTables({ restaurantId, token }));
      if (tableForm.floorId) {
        dispatch(fetchFloors({ restaurantId, token, includeTables: true }));
      }
      
      alert('Table added successfully!');

    } catch (error) {
      console.error('Error adding table:', error);
      alert(`Failed to add table: ${error.message || 'Unknown error'}`);
    }
  };

  const handleAddMultipleTables = async (e) => {
    e.preventDefault();
    
    console.log('Adding multiple tables with data:', multipleTablesForm);
    
    if (!validateMultipleTablesForm()) {
      return;
    }

    try {
      const tablesData = {
        startNumber: parseInt(multipleTablesForm.startNumber),
        endNumber: parseInt(multipleTablesForm.endNumber),
        capacity: parseInt(multipleTablesForm.capacity),
        floorId: multipleTablesForm.floorId || null,
        prefix: multipleTablesForm.prefix.trim(),
        generateQR: multipleTablesForm.generateQR
      };

      console.log('Dispatching createMultipleTables with:', { restaurantId, tablesData, token: !!token });

      const result = await dispatch(createMultipleTables({ 
        restaurantId, 
        tablesData, 
        token 
      })).unwrap();

      console.log('Multiple tables created successfully:', result);

      resetMultipleTablesForm();
      setShowAddTableModal(false);
      
      // Refresh data
      dispatch(fetchTables({ restaurantId, token }));
      dispatch(fetchFloors({ restaurantId, token, includeTables: true }));
      
      alert(`Successfully created ${result.length || 'multiple'} tables!`);

    } catch (error) {
      console.error('Error adding multiple tables:', error);
      alert(`Failed to add tables: ${error.message || 'Unknown error'}`);
    }
  };

  const handleAddFloor = async (e) => {
    e.preventDefault();
    
    console.log('Adding floor with data:', floorForm);
    
    if (!validateFloorForm()) {
      return;
    }

    try {
      const floorData = {
        floorName: floorForm.floorName.trim(),
        description: floorForm.description.trim(),
        floorNumber: floorForm.floorNumber ? parseInt(floorForm.floorNumber) : undefined
      };

      console.log('Dispatching createFloor with:', { restaurantId, floorData, token: !!token });

      const result = await dispatch(createFloor({ 
        restaurantId, 
        floorData, 
        token 
      })).unwrap();

      console.log('Floor created successfully:', result);

      resetFloorForm();
      setShowAddFloorModal(false);
      
      // Refresh floors data
      dispatch(fetchFloors({ restaurantId, token, includeTables: true }));
      
      alert('Floor added successfully!');

    } catch (error) {
      console.error('Error adding floor:', error);
      alert(`Failed to add floor: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDeleteTable = async (tableId) => {
    if (!window.confirm('Are you sure you want to delete this table?')) {
      return;
    }
    
    try {
      await dispatch(deleteTable({ restaurantId, tableId, token })).unwrap();
      // Refresh data
      dispatch(fetchTables({ restaurantId, token }));
      dispatch(fetchFloors({ restaurantId, token, includeTables: true }));
      alert('Table deleted successfully!');
    } catch (error) {
      console.error('Error deleting table:', error);
      alert(`Failed to delete table: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDeleteFloor = async (floorId) => {
    const floorTables = tables.filter(table => table.floorId === floorId);
    let forceDelete = false;
    
    if (floorTables.length > 0) {
      const confirmMessage = `This floor has ${floorTables.length} table(s). Do you want to:\n\n` +
        `OK - Delete floor and move tables to "No Floor"\n` +
        `Cancel - Keep floor`;
      
      if (!window.confirm(confirmMessage)) {
        return;
      }
      forceDelete = true;
    }

    try {
      await dispatch(deleteFloor({ restaurantId, floorId, token, forceDelete })).unwrap();
      // Refresh data
      dispatch(fetchTables({ restaurantId, token }));
      dispatch(fetchFloors({ restaurantId, token, includeTables: true }));
      alert('Floor deleted successfully!');
    } catch (error) {
      console.error('Error deleting floor:', error);
      alert(`Failed to delete floor: ${error.message || 'Unknown error'}`);
    }
  };

  const handleStatusChange = async (tableId, newStatus) => {
    try {
      await dispatch(updateTableStatus({ tableId, status: newStatus })).unwrap();
      console.log('Table status updated successfully');
    } catch (error) {
      console.error('Error updating table status:', error);
      alert(`Failed to update table status: ${error.message || 'Unknown error'}`);
    }
  };

  const getTablesByFloor = (floorId) => {
    return tables.filter(table => table.floorId === floorId);
  };

  const getTablesWithoutFloor = () => {
    return tables.filter(table => !table.floorId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'occupied': return 'bg-red-100 text-red-800';
      case 'reserved': return 'bg-yellow-100 text-yellow-800';
      case 'maintenance': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle missing authentication
  if (!token || !restaurantId) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-red-600">Missing authentication token or restaurant ID</p>
          <p className="text-sm text-gray-500">Please log in to continue</p>
          <div className="mt-4 text-xs text-gray-400">
            <p>Token: {token ? 'Present' : 'Missing'}</p>
            <p>Restaurant ID: {restaurantId ? 'Present' : 'Missing'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Table & Floor Management</h1>
        <button
          onClick={() => setShowMainModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Add Table/Floor
        </button>
      </div>

      {/* Debug Information (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-4 bg-gray-50 border rounded-lg text-xs text-gray-600">
          <p><strong>Debug Info:</strong></p>
          <p>Floors: {floors.length} | Tables: {tables.length} | Loading: {loading ? 'Yes' : 'No'}</p>
          <p>Floors Error: {floorsError || 'None'} | Tables Error: {tablesError || 'None'}</p>
        </div>
      )}

      {/* Error Messages */}
      {(floorsError || tablesError) && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">
            {floorsError || tablesError}
          </p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <Building2 className="text-blue-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">Total Floors</p>
              <p className="text-2xl font-bold text-gray-800">{floors.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <Users className="text-green-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">Total Tables</p>
              <p className="text-2xl font-bold text-gray-800">{tables.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-green-500 rounded-full"></div>
            <div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl font-bold text-gray-800">
                {tables.filter(t => t.status === 'available').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-red-500 rounded-full"></div>
            <div>
              <p className="text-sm text-gray-600">Occupied</p>
              <p className="text-2xl font-bold text-gray-800">
                {tables.filter(t => t.status === 'occupied').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center my-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading floors and tables...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Floors and Tables Display */}
          <div className="space-y-6">
            {floors.map(floor => {
              const floorTables = getTablesByFloor(floor._id);
              return (
                <div key={floor._id} className="bg-white rounded-lg shadow-sm border">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                          <Building2 size={20} />
                          {floor.floorName}
                        </h3>
                        <p className="text-gray-600 text-sm">{floor.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <p className="text-sm text-gray-500">
                            {floorTables.length} table{floorTables.length !== 1 ? 's' : ''}
                          </p>
                          {floor.stats && (
                            <>
                              <p className="text-sm text-green-600">
                                Available: {floor.stats.availableTables || 0}
                              </p>
                              <p className="text-sm text-red-600">
                                Occupied: {floor.stats.occupiedTables || 0}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteFloor(floor._id)}
                        className="text-red-600 hover:text-red-800 p-2"
                        title="Delete Floor"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    {floorTables.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No tables on this floor</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {floorTables.map(table => (
                          <div key={table._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-gray-800">{table.tableNumber}</h4>
                              <div className="flex items-center gap-1">
                                {table.qrCodeId && (
                                  <QrCodeIcon size={16} className="text-blue-600" title="Has QR Code" />
                                )}
                                <button
                                  onClick={() => handleDeleteTable(table._id)}
                                  className="text-red-600 hover:text-red-800 p-1"
                                  title="Delete Table"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm text-gray-600">
                                <Users size={14} className="inline mr-1" />
                                Capacity: {table.capacity}
                              </p>
                              <select
                                value={table.status}
                                onChange={(e) => handleStatusChange(table._id, e.target.value)}
                                className={`w-full px-2 py-1 rounded text-xs font-medium border-0 ${getStatusColor(table.status)}`}
                              >
                                <option value="available">Available</option>
                                <option value="occupied">Occupied</option>
                                <option value="reserved">Reserved</option>
                                <option value="maintenance">Maintenance</option>
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Tables without floor */}
            {getTablesWithoutFloor().length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <MapPin size={20} />
                    Tables Without Floor
                  </h3>
                  <p className="text-gray-600 text-sm">Tables not assigned to any floor</p>
                </div>
                
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {getTablesWithoutFloor().map(table => (
                      <div key={table._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-800">{table.tableNumber}</h4>
                          <div className="flex items-center gap-1">
                            {table.qrCodeId && (
                              <QrCodeIcon size={16} className="text-blue-600" title="Has QR Code" />
                            )}
                            <button
                              onClick={() => handleDeleteTable(table._id)}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            <Users size={14} className="inline mr-1" />
                            Capacity: {table.capacity}
                          </p>
                          <select
                            value={table.status}
                            onChange={(e) => handleStatusChange(table._id, e.target.value)}
                            className={`w-full px-2 py-1 rounded text-xs font-medium border-0 ${getStatusColor(table.status)}`}
                          >
                            <option value="available">Available</option>
                            <option value="occupied">Occupied</option>
                            <option value="reserved">Reserved</option>
                            <option value="maintenance">Maintenance</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Main Modal */}
      {showMainModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Add New</h2>
              <button
                onClick={() => setShowMainModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowMainModal(false);
                  setShowAddTableModal(true);
                }}
                className="w-full p-4 text-left border rounded-lg hover:bg-gray-50 flex items-center gap-3"
              >
                <Users className="text-blue-600" size={24} />
                <div>
                  <h3 className="font-semibold">Add Tables</h3>
                  <p className="text-sm text-gray-600">Add single or multiple tables</p>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setShowMainModal(false);
                  setShowAddFloorModal(true);
                }}
                className="w-full p-4 text-left border rounded-lg hover:bg-gray-50 flex items-center gap-3"
              >
                <Building2 className="text-green-600" size={24} />
                <div>
                  <h3 className="font-semibold">Add Floor</h3>
                  <p className="text-sm text-gray-600">Create a new floor</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {showAddTableModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Add Tables</h2>
              <button
                onClick={() => {
                  setShowAddTableModal(false);
                  resetTableForm();
                  resetMultipleTablesForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tab Buttons */}
            <div className="flex border-b mb-6">
              <button
                onClick={() => setActiveTab('single')}
                className={`px-4 py-2 font-medium ${activeTab === 'single' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Single Table
              </button>
              <button
                onClick={() => setActiveTab('multiple')}
                className={`px-4 py-2 font-medium ${activeTab === 'multiple' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Multiple Tables
              </button>
            </div>

            {/* Single Table Tab */}
            {activeTab === 'single' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Add Single Table</h3>
                <form onSubmit={handleAddSingleTable} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="singleTableNumber" className="block text-sm font-medium text-gray-700 mb-2">
                        Table Number *
                      </label>
                      <input
                        id="singleTableNumber"
                        name="tableNumber"
                        type="text"
                        value={tableForm.tableNumber}
                        onChange={(e) => setTableForm(prev => ({ ...prev, tableNumber: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., T001, Table 1"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="singleTableCapacity" className="block text-sm font-medium text-gray-700 mb-2">
                        Capacity *
                      </label>
                      <input
                        id="singleTableCapacity"
                        name="capacity"
                        type="number"
                        value={tableForm.capacity}
                        onChange={(e) => setTableForm(prev => ({ ...prev, capacity: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Number of seats"
                        min="1"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="singleTableFloor" className="block text-sm font-medium text-gray-700 mb-2">
                        Floor
                      </label>
                      <select
                        id="singleTableFloor"
                        name="floorId"
                        value={tableForm.floorId}
                        onChange={(e) => setTableForm(prev => ({ ...prev, floorId: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">No Floor</option>
                        {floors.map(floor => (
                          <option key={floor._id} value={floor._id}>{floor.floorName}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="singleTableStatus" className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        id="singleTableStatus"
                        name="status"
                        value={tableForm.status}
                        onChange={(e) => setTableForm(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="available">Available</option>
                        <option value="occupied">Occupied</option>
                        <option value="reserved">Reserved</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <input
                      type="checkbox"
                      id="generateQRSingle"
                      name="generateQR"
                      checked={tableForm.generateQR}
                      onChange={(e) => setTableForm(prev => ({ ...prev, generateQR: e.target.checked }))}
                      className="rounded"
                    />
                    <label htmlFor="generateQRSingle" className="text-sm text-gray-700">
                      Generate QR Code for this table
                    </label>
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddTableModal(false);
                        resetTableForm();
                      }}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2"
                    >
                      {loading ? 'Adding...' : 'Add Single Table'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Multiple Tables Tab */}
            {activeTab === 'multiple' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Add Multiple Tables</h3>
                <form onSubmit={handleAddMultipleTables} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="multipleTablePrefix" className="block text-sm font-medium text-gray-700 mb-2">
                        Prefix
                      </label>
                      <input
                        id="multipleTablePrefix"
                        name="prefix"
                        type="text"
                        value={multipleTablesForm.prefix}
                        onChange={(e) => setMultipleTablesForm(prev => ({ ...prev, prefix: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Table, T"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="multipleTableFloor" className="block text-sm font-medium text-gray-700 mb-2">
                        Floor
                      </label>
                      <select
                        id="multipleTableFloor"
                        name="floorId"
                        value={multipleTablesForm.floorId}
                        onChange={(e) => setMultipleTablesForm(prev => ({ ...prev, floorId: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">No Floor</option>
                        {floors.map(floor => (
                          <option key={floor._id} value={floor._id}>{floor.floorName}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="multipleTableStartNumber" className="block text-sm font-medium text-gray-700 mb-2">
                        Start Number *
                      </label>
                      <input
                        id="multipleTableStartNumber"
                        name="startNumber"
                        type="number"
                        value={multipleTablesForm.startNumber}
                        onChange={(e) => setMultipleTablesForm(prev => ({ ...prev, startNumber: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 1"
                        min="1"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="multipleTableEndNumber" className="block text-sm font-medium text-gray-700 mb-2">
                        End Number *
                      </label>
                      <input
                        id="multipleTableEndNumber"
                        name="endNumber"
                        type="number"
                        value={multipleTablesForm.endNumber}
                        onChange={(e) => setMultipleTablesForm(prev => ({ ...prev, endNumber: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 10"
                        min="1"
                        required
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label htmlFor="multipleTableCapacity" className="block text-sm font-medium text-gray-700 mb-2">
                        Capacity for All Tables *
                      </label>
                      <input
                        id="multipleTableCapacity"
                        name="capacity"
                        type="number"
                        value={multipleTablesForm.capacity}
                        onChange={(e) => setMultipleTablesForm(prev => ({ ...prev, capacity: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Number of seats"
                        min="1"
                        required
                      />
                    </div>
                  </div>
                  
                  {multipleTablesForm.startNumber && multipleTablesForm.endNumber && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        This will create {Math.max(0, parseInt(multipleTablesForm.endNumber || 0) - parseInt(multipleTablesForm.startNumber || 0) + 1)} tables:
                      </p>
                      <p className="text-sm text-blue-600 mt-1">
                        {multipleTablesForm.prefix} {String(multipleTablesForm.startNumber).padStart(3, '0')} to {multipleTablesForm.prefix} {String(multipleTablesForm.endNumber).padStart(3, '0')}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-4">
                    <input
                      type="checkbox"
                      id="generateQRMultiple"
                      name="generateQR"
                      checked={multipleTablesForm.generateQR}
                      onChange={(e) => setMultipleTablesForm(prev => ({ ...prev, generateQR: e.target.checked }))}
                      className="rounded"
                    />
                    <label htmlFor="generateQRMultiple" className="text-sm text-gray-700">
                      Generate QR Codes for all tables
                    </label>
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddTableModal(false);
                        resetMultipleTablesForm();
                      }}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2"
                    >
                      {loading ? 'Adding...' : 'Add Multiple Tables'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Floor Modal */}
      {showAddFloorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Add New Floor</h2>
              <button
                onClick={() => {
                  setShowAddFloorModal(false);
                  resetFloorForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddFloor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Floor Name *
                </label>
                <input
                  type="text"
                  value={floorForm.floorName}
                  onChange={(e) => setFloorForm(prev => ({ ...prev, floorName: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Ground Floor, First Floor"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Floor Number
                </label>
                <input
                  type="number"
                  value={floorForm.floorNumber}
                  onChange={(e) => setFloorForm(prev => ({ ...prev, floorNumber: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 0 (Ground), 1 (First), 2 (Second)"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={floorForm.description}
                  onChange={(e) => setFloorForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
            
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddFloorModal(false);
                    resetFloorForm();
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2 px-4 rounded-lg"
                >
                  Add Floor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableFloorManager;
// import React, { useEffect, useState } from 'react'
// import {
//   CButton,
//   CModal,
//   CModalBody,
//   CModalHeader,
//   CModalFooter,
//   CFormInput,
//   CContainer,
//   CRow,
//   CCol,
//   CSpinner,
// } from '@coreui/react'
// import CIcon from '@coreui/icons-react'
// import { cilPlus } from '@coreui/icons'
// import { useDispatch, useSelector } from 'react-redux'
// import { createQrCode, fetchQrCodes, deleteQrCode } from '../../redux/slices/qrSlice'

// export default function QRCode() {
//   const [modalVisible, setModalVisible] = useState(false)
//   const [actionModalVisible, setActionModalVisible] = useState(false)
//   const [confirmDeleteModalVisible, setConfirmDeleteModalVisible] = useState(false)
//   const [selectedQr, setSelectedQr] = useState(null)
//   const [tableNumber, setTableNumber] = useState('')
//   const [previewQr, setPreviewQr] = useState(null)
//   const [saving, setSaving] = useState(false)

//   const { qrList, loading } = useSelector((state) => state.qr)
//   const token = localStorage.getItem("authToken")
//   const theme = useSelector((state) => state.theme.theme)

//   const dispatch = useDispatch()
// console.log(token)
//   // Fetch QR codes on mount
//   useEffect(() => {
//       dispatch(fetchQrCodes(token))
//   }, [dispatch, token])

//   // Save QR code
//   const handleSave = async () => {
//     if (!tableNumber) {
//       alert('Please enter a valid table number.')
//       return
//     }

//     setSaving(true)
//     const result = await dispatch(createQrCode({ tableNumber }))

//     setSaving(false)

//     if (result.meta.requestStatus === 'fulfilled') {
//       setModalVisible(false)
//       setTableNumber('')
//       setPreviewQr(result.payload) // show preview immediately
//     } else {
//       alert(result.payload || 'Failed to create QR code')
//     }
//   }

//   // Delete QR code
//   const handleDelete = async () => {
//     if (selectedQr) {
//       await dispatch(deleteQrCode(selectedQr.id))
//       setConfirmDeleteModalVisible(false)
//       setActionModalVisible(false)
//       dispatch(fetchQrCodes(restaurantId))
//       setPreviewQr(null)
//     }
//   }

//   // Download QR code as PNG
//   const handleDownload = () => {
//     const qr = selectedQr || previewQr
//     if (qr) {
//       const link = document.createElement('a')
//       link.href = qr.qrImage
//       link.download = `Table-${qr.tableNumber}.png`
//       link.click()
//       setActionModalVisible(false)
//     }
//   }

//   // Click on a QR to open action modal
//   const handleQrClick = (qr) => {
//     setSelectedQr(qr)
//     setActionModalVisible(true)
//   }

//   return (
//    <div className="p-4">
//   {/* Heading */}
//   <h1 className="fs-3 fw-bold text-center mb-4">Generate QR for Table</h1>

//   {/* Loader */}
//   {loading ? (
//     <div className="d-flex justify-content-center my-5">
//       <CSpinner color="primary" />
//     </div>
//   ) : (
//     <CRow className="g-4 justify-content-center">
//       {/* Render QR containers */}
//       {Array.isArray(qrList) &&
//         qrList.map((qr) => (
//           <CCol
//             key={qr.id || qr._id}
//             xs={6}
//             sm={4}
//             md={3}
//             lg={2}
//             className="d-flex justify-content-center"
//           >
//             <CContainer
//               className={`d-flex flex-column align-items-center justify-content-center shadow-sm border rounded-3 transition-all ${
//                 theme === "dark" ? "bg-dark text-light" : "bg-white text-dark"
//               }`}
//               style={{
//                 width: "100%",
//                 maxWidth: "10rem",
//                 height: "10rem",
//                 cursor: "pointer",
//               }}
//               onClick={() => handleQrClick(qr)}
//             >
//               <div className="fw-semibold mb-2 text-truncate">
//                 Table {qr.tableNumber}
//               </div>
//               <img
//                 src={qr.qrImage}
//                 alt={`QR Table ${qr.tableNumber}`}
//                 width={80}
//                 className="img-fluid"
//               />
//             </CContainer>
//           </CCol>
//         ))}

//       {/* Add QR Code button */}
//       <CCol xs={6} sm={4} md={3} lg={2} className="d-flex justify-content-center">
//         <CContainer
//           className="d-flex align-items-center justify-content-center shadow-sm border rounded-3 bg-light hover-shadow"
//           style={{
//             width: "100%",
//             maxWidth: "10rem",
//             height: "10rem",
//             cursor: "pointer",
//           }}
//           onClick={() => setModalVisible(true)}
//         >
//           <CIcon icon={cilPlus} size="xxl" className="text-primary" />
//         </CContainer>
//       </CCol>
//     </CRow>
//   )}

//   {/* Preview newly created QR */}
//   {previewQr && (
//     <div className="text-center my-5">
//       <h5 className="fw-semibold mb-3">
//         Preview Table {previewQr.tableNumber}
//       </h5>
//       <img
//         src={previewQr.qrImage}
//         alt={`Preview Table ${previewQr.tableNumber}`}
//         width={150}
//         className="img-fluid rounded shadow-sm"
//       />
//     </div>
//   )}

//   {/* Modal for Adding QR */}
//   <CModal visible={modalVisible} onClose={() => setModalVisible(false)}>
//     <CModalHeader className="d-flex justify-content-between align-items-center">
//       <h2 className="fs-5 fw-bold">Generate QR</h2>
//     </CModalHeader>
//     <CModalBody>
//       <CFormInput
//         type="text"
//         placeholder="Enter Table Number"
//         value={tableNumber}
//         onChange={(e) => setTableNumber(e.target.value)}
//         className="mb-3"
//       />
//     </CModalBody>
//     <CModalFooter>
//       <CButton color="secondary" variant="outline" onClick={() => setModalVisible(false)}>
//         Close
//       </CButton>
//       <CButton color="primary" onClick={handleSave} disabled={saving}>
//         {saving ? <CSpinner size="sm" /> : "Save"}
//       </CButton>
//     </CModalFooter>
//   </CModal>

//   {/* Modal for Actions */}
//   <CModal visible={actionModalVisible} onClose={() => setActionModalVisible(false)}>
//     <CModalHeader>
//       <h2 className="fs-5 fw-bold">QR Code Actions</h2>
//     </CModalHeader>
//     <CModalBody className="text-center">
//       Select an action for <strong>Table {selectedQr?.tableNumber}</strong>
//     </CModalBody>
//     <CModalFooter className="justify-content-between">
//       <CButton
//         color="danger"
//         variant="outline"
//         onClick={() => {
//           setConfirmDeleteModalVisible(true);
//           setActionModalVisible(false);
//         }}
//       >
//         Delete
//       </CButton>
//       <CButton color="primary" onClick={handleDownload}>
//         Download
//       </CButton>
//     </CModalFooter>
//   </CModal>

//   {/* Confirmation Modal for Delete */}
//   <CModal
//     visible={confirmDeleteModalVisible}
//     onClose={() => setConfirmDeleteModalVisible(false)}
//   >
//     <CModalHeader>
//       <h2 className="fs-5 fw-bold">Confirm Delete</h2>
//     </CModalHeader>
//     <CModalBody className="text-center">
//       Are you sure you want to delete the QR Code for{" "}
//       <strong>Table {selectedQr?.tableNumber}</strong>?
//     </CModalBody>
//     <CModalFooter>
//       <CButton color="secondary" variant="outline" onClick={() => setConfirmDeleteModalVisible(false)}>
//         Cancel
//       </CButton>
//       <CButton color="danger" onClick={handleDelete}>
//         Confirm Delete
//       </CButton>
//     </CModalFooter>
//   </CModal>
// </div>

//   )
// }
