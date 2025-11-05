import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { fetchAllWheels } from "../../redux/slices/spinAndWinSlice";

export default function SpinWheel() {
  const dispatch = useDispatch();
  
  // Redux state
  const { wheels, loading, error } = useSelector((state) => state.spinAndWin);
  
  // Get the first wheel (or you can allow user to select)
  const [selectedWheelIndex, setSelectedWheelIndex] = useState(0);
  const wheel = wheels[selectedWheelIndex] || null;
  
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState(null);
  const wheelRef = useRef(null);
  const pointerRef = useRef(null);

  // Fetch wheels on mount
  useEffect(() => {
    const restaurantId = localStorage.getItem("restaurantId");
    if (restaurantId) {
      dispatch(fetchAllWheels());
    } else {
      toast.error("Restaurant ID not found. Please log in again.");
    }
  }, [dispatch]);

  // Show error if fetch fails
  useEffect(() => {
    if (error) {
      toast.error(typeof error === 'string' ? error : error.message || 'Failed to load wheels');
    }
  }, [error]);

  // Draw wheel when data is loaded
  useEffect(() => {
    if (wheel && wheel.segments) {
      drawWheel(wheel.segments);
      drawPointer();
    }
    
    // Redraw on window resize for responsiveness
    const handleResize = () => {
      if (wheel && wheel.segments) {
        drawWheel(wheel.segments);
        drawPointer();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [wheel]);

  const drawWheel = (segments) => {
    const canvas = wheelRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const size = Math.min(window.innerWidth * 0.8, 400); // responsive size
    canvas.width = size;
    canvas.height = size;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 15;

    ctx.clearRect(0, 0, size, size);

    const anglePerSegment = (2 * Math.PI) / segments.length;

    segments.forEach((segment, index) => {
      const startAngle = index * anglePerSegment;
      const endAngle = startAngle + anglePerSegment;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = segment.color;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + anglePerSegment / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = segment.textColor;
      ctx.font = `bold ${Math.max(14, size / 25)}px Inter, sans-serif`;
      ctx.fillText(segment.text, radius - 20, 7);
      ctx.restore();
    });

    // center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 12, 0, 2 * Math.PI);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.strokeStyle = "#E5E7EB";
    ctx.stroke();
  };

  const drawPointer = () => {
    const canvas = pointerRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = Math.min(window.innerWidth * 0.8, 400);
    const height = 60;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const baseY = 10;
    const tipY = 50;
    const pointerWidth = 40;

    ctx.beginPath();
    ctx.moveTo(centerX - pointerWidth / 2, baseY);
    ctx.lineTo(centerX + pointerWidth / 2, baseY);
    ctx.lineTo(centerX, tipY);
    ctx.closePath();
    ctx.fillStyle = "#EF4444";
    ctx.fill();
    ctx.strokeStyle = "#DC2626";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const handleSpin = () => {
    if (spinning) return;
    setSpinning(true);
    setWinner(null);
    const spins = 5 + Math.random() * 5;
    const degrees = spins * 360 + Math.random() * 360;
    const newRotation = rotation + degrees;
    setRotation(newRotation);

    setTimeout(() => {
      setSpinning(false);
      const segmentAngle = 360 / wheel.segments.length;
      const normalizedRotation = newRotation % 360;
      const wheelAngleForPointer = (270 - normalizedRotation + 360) % 360;
      const winningIndex =
        Math.floor(wheelAngleForPointer / segmentAngle) %
        wheel.segments.length;
      setWinner(wheel.segments[winningIndex]);
    }, 4000);
  };

  // Loading state
  if (loading && wheels.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
        <p className="text-gray-600 font-semibold">Loading wheels...</p>
      </div>
    );
  }

  // No wheels available
  if (!loading && wheels.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-200 rounded-full mb-4">
            <Sparkles size={40} className="text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">No Wheels Available</h3>
          <p className="text-gray-500">Please contact the administrator to create a spin wheel.</p>
        </div>
      </div>
    );
  }

  // Wheel not found
  if (!wheel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Wheel Not Found</h3>
          <p className="text-gray-500">The selected wheel could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Wheel Selector - Show if multiple wheels available */}
      {wheels.length > 1 && (
        <div className="mb-6 w-full max-w-[400px]">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Wheel
          </label>
          <select
            value={selectedWheelIndex}
            onChange={(e) => {
              setSelectedWheelIndex(parseInt(e.target.value));
              setRotation(0);
              setWinner(null);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {wheels.map((w, index) => (
              <option key={w._id} value={index}>
                {w.name} ({w.segments.length} segments)
              </option>
            ))}
          </select>
        </div>
      )}

      <h2 className="text-3xl md:text-5xl font-bold text-center mb-2">
        {wheel.name}
      </h2>
      <p className="text-gray-600 text-center mb-8">
        Click spin to win amazing prizes!
      </p>

      <div className="relative flex justify-center items-center w-full max-w-[400px]">
        <canvas
          ref={wheelRef}
          style={{
            transition: spinning
              ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)"
              : "none",
            transformOrigin: "center center",
            transform: `rotate(${rotation}deg)`,
            width: "100%",
            height: "auto",
          }}
        />
        <canvas
          ref={pointerRef}
          style={{
            position: "absolute",
            top: "0",
            left: "50%",
            transform: "translateX(-50%)",
            pointerEvents: "none",
          }}
        />
      </div>

      {winner && (
        <div className="mt-6 p-4 md:p-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl text-center shadow-lg animate-pulse w-full max-w-[400px]">
          <p className="text-white text-sm md:text-base font-semibold mb-1">
            🎉 Congratulations! 🎉
          </p>
          <p className="text-white text-xl md:text-2xl font-bold">
            {winner.text}
          </p>
        </div>
      )}

      <button
        onClick={handleSpin}
        disabled={spinning}
        className={`mt-8 px-8 py-4 md:px-12 md:py-5 text-lg md:text-xl font-bold rounded-2xl shadow-2xl transition-all transform hover:scale-105 ${
          spinning
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
        }`}
      >
        {spinning ? (
          <span className="flex items-center justify-center gap-2">
            <Sparkles className="animate-spin" size={22} />
            Spinning...
          </span>
        ) : (
          "SPIN THE WHEEL"
        )}
      </button>
    </div>
  );
}