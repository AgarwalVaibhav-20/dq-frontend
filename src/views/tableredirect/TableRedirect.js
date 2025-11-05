import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  useColorModes,
} from '@coreui/react';
import { LoaderCircle } from 'lucide-react';
import axios from 'axios';
import { BASE_URL } from '../../utils/constants';

const TableRedirect = () => {
  // const { restaurantId, floorId, tableNumber } = useParams();
  // 1. Get the search parameters object
  const [searchParams] = useSearchParams();
  const { colorMode, setColorMode } = useColorModes('coreui-free-react-admin-template-theme');
  const [checkingWheels, setCheckingWheels] = useState(true);

  // 2. Access values using .get('parameterName')
  const restaurantId = searchParams.get('restaurantId');
  const floorId = searchParams.get('floorId');
  const tableNumber = searchParams.get('tableNumber');

  const navigate = useNavigate();

  useEffect(() => {
    const checkWheelsAndRedirect = async () => {
      if (!restaurantId || !floorId || !tableNumber) {
        console.log("Missing parameters:", { restaurantId, floorId, tableNumber });
        return;
      }

      setColorMode("light");
      console.log("Setting up redirect for:", restaurantId, floorId, tableNumber);
      localStorage.setItem('tableNumber', tableNumber);
      localStorage.setItem('restaurantId', restaurantId);
      localStorage.setItem('floorId', floorId);

      // Check if user has already played spin wheel for this session
      const spinDiscountKey = `spinDiscount_${restaurantId}_${tableNumber}`;
      const hasPlayedSpin = localStorage.getItem(spinDiscountKey);

      if (!hasPlayedSpin) {
        // Check if there's at least one wheel with showOnQRScan enabled
        try {
          const response = await axios.get(`${BASE_URL}/api/wheel/public`, {
            params: { restaurantId, isActive: true }
          });

          const wheels = response.data?.wheels || [];
          // Check if any wheel has showOnQRScan enabled (default is true)
          const hasEnabledWheel = wheels.some(wheel => wheel.showOnQRScan !== false);

          if (hasEnabledWheel && wheels.length > 0) {
            // First time and wheel is enabled - redirect to spin wheel
            console.log("Wheel enabled, redirecting to spin page");
            navigate(`/spin?redirect=true&table=${tableNumber}&restaurantId=${restaurantId}&floorId=${floorId}`, { replace: true });
          } else {
            // No enabled wheels or no wheels - go directly to customer menu
            console.log("No enabled wheels, redirecting to customer menu");
            navigate(`/customer-menu?table=${tableNumber}`, { replace: true });
          }
        } catch (error) {
          console.error("Error checking wheels:", error);
          // On error, go directly to customer menu
          navigate(`/customer-menu?table=${tableNumber}`, { replace: true });
        }
      } else {
        // Already played - go directly to customer menu
        console.log("Already played spin, redirecting to customer menu");
        navigate(`/customer-menu?table=${tableNumber}`, { replace: true });
      }
      
      setCheckingWheels(false);
    };

    checkWheelsAndRedirect();
  }, [restaurantId, floorId, tableNumber, navigate, setColorMode]);

  return <div className='min-h-screen w-full flex items-center justify-center'>
    <LoaderCircle className='animate-spin' color="#a522bf" />
  </div>;
};

export default TableRedirect;
