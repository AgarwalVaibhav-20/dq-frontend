import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Edit2, Trash2, Save, X, Eye, Settings, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  createWheel,
  fetchAllWheels,
  updateWheel,
  deleteWheel,
  clearSpinState
} from '../../redux/slices/spinAndWinSlice';

export default function SpinWheelAdmin() {
  const dispatch = useDispatch();
  
  // Redux state
  const { wheels, loading, error, successMessage } = useSelector((state) => state.spinAndWin);
  
  // Local state
  const [selectedWheel, setSelectedWheel] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    segments: []
  });
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState(null);
  const canvasRef = useRef(null);

  // Fetch wheels on mount
  useEffect(() => {
    const restaurantId = localStorage.getItem("restaurantId");
    const token = localStorage.getItem("authToken");
    if (restaurantId && token) {
      dispatch(fetchAllWheels());
    } else {
      toast.error("Restaurant ID not found. Please log in again.", {
        position: "top-right",
        autoClose: 4000,
      });
    }
  }, [dispatch]);

  // Show success/error messages
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      dispatch(clearSpinState());
    }
    if (error) {
      toast.error(typeof error === 'string' ? error : error.message || 'An error occurred', {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      dispatch(clearSpinState());
    }
  }, [successMessage, error, dispatch]);

  // Draw wheel canvas
  useEffect(() => {
    if (showPreview && selectedWheel) {
      drawWheel(selectedWheel.segments);
    }
  }, [showPreview, selectedWheel, rotation]);

  const drawWheel = (segments) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Shadow for wheel
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);
    
    const anglePerSegment = (2 * Math.PI) / segments.length;
    
    // Draw segments
    segments.forEach((segment, index) => {
      const startAngle = index * anglePerSegment;
      const endAngle = startAngle + anglePerSegment;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = segment.color;
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + anglePerSegment / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = segment.textColor;
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 3;
      ctx.fillText(segment.text, radius - 30, 7);
      ctx.restore();
    });
    
    ctx.restore();
    
    // Center circle
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Pointer
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(centerX, 10);
    ctx.lineTo(centerX - 20, -10);
    ctx.lineTo(centerX + 20, -10);
    ctx.closePath();
    ctx.fillStyle = '#EF4444';
    ctx.fill();
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const handleCreateNew = () => {
    setEditForm({
      name: 'New Wheel',
      segments: [
        { text: 'Prize 1', color: '#8B5CF6', textColor: '#FFFFFF' },
        { text: 'Prize 2', color: '#EC4899', textColor: '#FFFFFF' },
        { text: 'Prize 3', color: '#3B82F6', textColor: '#FFFFFF' },
        { text: 'Prize 4', color: '#10B981', textColor: '#FFFFFF' },
      ]
    });
    setSelectedWheel(null);
    setIsEditing(true);
  };

  const handleEdit = (wheel) => {
    setEditForm({ 
      name: wheel.name,
      segments: wheel.segments 
    });
    setSelectedWheel(wheel);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this wheel?')) {
      await dispatch(deleteWheel(id));
    }
  };

  const handleToggleQRScan = async (wheelId, showOnQRScan) => {
    try {
      await dispatch(updateWheel({ 
        id: wheelId, 
        updates: { showOnQRScan } 
      }));
      // Refresh wheels list to show updated toggle state
      await dispatch(fetchAllWheels());
      toast.success(`QR Scan toggle ${showOnQRScan ? 'enabled' : 'disabled'} successfully!`, {
        position: "top-right",
        autoClose: 2000,
      });
    } catch (error) {
      toast.error('Failed to update QR scan toggle', {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const handleSave = async () => {
    if (selectedWheel) {
      // Update existing wheel
      await dispatch(updateWheel({ 
        id: selectedWheel._id, 
        updates: editForm 
      }));
    } else {
      // Create new wheel
      await dispatch(createWheel(editForm));
    }
    setIsEditing(false);
    setSelectedWheel(null);
  };

  const handleAddSegment = () => {
    const colors = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    setEditForm({
      ...editForm,
      segments: [...editForm.segments, { text: 'New Segment', color: randomColor, textColor: '#FFFFFF' }]
    });
  };

  const handleRemoveSegment = (index) => {
    setEditForm({
      ...editForm,
      segments: editForm.segments.filter((_, i) => i !== index)
    });
  };

  const handleSegmentChange = (index, field, value) => {
    const newSegments = [...editForm.segments];
    newSegments[index][field] = value;
    setEditForm({ ...editForm, segments: newSegments });
  };

  const handlePreview = (wheel) => {
    setSelectedWheel(wheel);
    setShowPreview(true);
    setRotation(0);
    setWinner(null);
  };

  const handleSpin = () => {
    if (spinning) return;
    setSpinning(true);
    setWinner(null);
    const spins = 5 + Math.random() * 5;
    const degrees = spins * 360 + Math.random() * 360;
    setRotation(rotation + degrees);
    
    setTimeout(() => {
      setSpinning(false);
      const segmentAngle = 360 / selectedWheel.segments.length;
      const normalizedRotation = (rotation + degrees) % 360;
      const winningIndex = Math.floor((360 - normalizedRotation + segmentAngle / 2) / segmentAngle) % selectedWheel.segments.length;
      setWinner(selectedWheel.segments[winningIndex]);
    }, 4000);
  };

  // Loading overlay
  if (loading && wheels.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">Loading wheels...</p>
        </div>
      </div>
    );
  }

  if (showPreview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => setShowPreview(false)}
            className="mb-6 px-5 py-2.5 bg-white/20 backdrop-blur-lg text-white rounded-xl hover:bg-white/30 flex items-center gap-2 border border-white/30 transition-all"
          >
            <X size={20} /> Back to Dashboard
          </button>
          
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 border border-white/20">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent mb-2">
                {selectedWheel.name}
              </h2>
              <p className="text-gray-600">Spin the wheel to win amazing prizes!</p>
            </div>
            
            <div className="flex justify-center mb-8">
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={500}
                  style={{ 
                    transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                    maxWidth: '100%',
                    height: 'auto'
                  }}
                />
              </div>
            </div>
            
            {winner && (
              <div className="mb-6 p-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl text-center shadow-lg animate-pulse">
                <p className="text-white text-sm font-semibold mb-1">🎉 Congratulations! 🎉</p>
                <p className="text-white text-2xl font-bold">{winner.text}</p>
              </div>
            )}
            
            <div className="text-center">
              <button
                onClick={handleSpin}
                disabled={spinning}
                className={`px-12 py-5 text-xl font-bold rounded-2xl shadow-2xl transition-all transform hover:scale-105 ${
                  spinning 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                }`}
              >
                {spinning ? (
                  <span className="flex items-center gap-2">
                    <Sparkles className="animate-spin" size={24} />
                    Spinning...
                  </span>
                ) : (
                  'SPIN THE WHEEL'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-slate-200">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold text-slate-800">
                  {selectedWheel ? 'Edit Wheel' : 'Create New Wheel'}
                </h2>
                <p className="text-slate-500 mt-1">Configure your spin wheel settings</p>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={24} className="text-slate-600" />
              </button>
            </div>

            <div className="space-y-8">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Wheel Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-slate-800"
                  placeholder="Enter wheel name..."
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800">Wheel Segments</h3>
                    <p className="text-sm text-slate-500 mt-1">Add prizes, rewards, or options</p>
                  </div>
                  <button
                    onClick={handleAddSegment}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all"
                  >
                    <Plus size={20} /> Add Segment
                  </button>
                </div>

                <div className="space-y-4">
                  {editForm.segments.map((segment, index) => (
                    <div key={index} className="group flex gap-4 items-center p-5 border-2 border-slate-200 rounded-xl hover:border-indigo-300 transition-all bg-slate-50">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={segment.text}
                          onChange={(e) => handleSegmentChange(index, 'text', e.target.value)}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800"
                          placeholder="Enter segment text..."
                        />
                      </div>
                      <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-slate-200">
                        <div className="text-center">
                          <label className="text-xs font-medium text-slate-600 block mb-1">Background</label>
                          <input
                            type="color"
                            value={segment.color}
                            onChange={(e) => handleSegmentChange(index, 'color', e.target.value)}
                            className="w-14 h-10 rounded-lg cursor-pointer border-2 border-slate-200"
                          />
                        </div>
                        <div className="text-center">
                          <label className="text-xs font-medium text-slate-600 block mb-1">Text</label>
                          <input
                            type="color"
                            value={segment.textColor}
                            onChange={(e) => handleSegmentChange(index, 'textColor', e.target.value)}
                            className="w-14 h-10 rounded-lg cursor-pointer border-2 border-slate-200"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveSegment(index)}
                        className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-200">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 flex items-center justify-center gap-2 font-semibold shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save size={20} /> Save Changes
                    </>
                  )}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                  className="px-8 py-4 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg shadow-indigo-200">
                <Settings className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Spin Wheel Manager</h1>
                <p className="text-slate-500 text-sm mt-1">Create and manage your spin wheels</p>
              </div>
            </div>
            <button
              onClick={handleCreateNew}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 flex items-center gap-2 shadow-lg shadow-indigo-200 font-semibold transition-all"
            >
              <Plus size={20} /> Create Wheel
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {wheels.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-200 rounded-full mb-6">
              <Settings size={40} className="text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">No wheels created yet</h3>
            <p className="text-slate-500 mb-6">Get started by creating your first spin wheel</p>
            <button
              onClick={handleCreateNew}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-lg shadow-indigo-200 transition-all"
            >
              Create Your First Wheel
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wheels.map(wheel => (
              <div key={wheel._id} className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-6 border border-slate-200 hover:border-indigo-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-1">{wheel.name}</h3>
                    <p className="text-sm text-slate-500">{wheel.segments.length} segments</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    wheel.isActive 
                      ? 'bg-indigo-50 text-indigo-600' 
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {wheel.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                {/* QR Scan Toggle */}
                <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-700 mb-1">Show on QR Scan</p>
                      <p className="text-xs text-slate-500">
                        {wheel.showOnQRScan !== false 
                          ? 'Wheel will show when customer scans QR code' 
                          : 'Customer menu will show directly (no wheel)'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={wheel.showOnQRScan !== false}
                        onChange={(e) => handleToggleQRScan(wheel._id, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
                
                <div className="mb-5">
                  <div className="flex flex-wrap gap-2">
                    {wheel.segments.slice(0, 4).map((segment, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm"
                        style={{ backgroundColor: segment.color, color: segment.textColor }}
                      >
                        {segment.text}
                      </span>
                    ))}
                    {wheel.segments.length > 4 && (
                      <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">
                        +{wheel.segments.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handlePreview(wheel)}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 flex items-center justify-center gap-2 font-semibold shadow-md transition-all"
                  >
                    <Eye size={16} /> Preview
                  </button>
                  <button
                    onClick={() => handleEdit(wheel)}
                    className="px-4 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all shadow-md"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(wheel._id)}
                    disabled={loading}
                    className="px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}