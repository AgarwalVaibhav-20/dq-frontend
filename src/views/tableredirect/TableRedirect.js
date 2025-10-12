import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import {
  useColorModes,
} from '@coreui/react';
import { LoaderCircle } from 'lucide-react';

const TableRedirect = () => {
  // const { restaurantId, floorId, tableNumber } = useParams();
  // 1. Get the search parameters object
  const [searchParams] = useSearchParams();
  const { colorMode, setColorMode } = useColorModes('coreui-free-react-admin-template-theme');

  // 2. Access values using .get('parameterName')
  const restaurantId = searchParams.get('restaurantId');
  const floorId = searchParams.get('floorId');
  const tableNumber = searchParams.get('tableNumber');

  const navigate = useNavigate();

  useEffect(() => {
    if (restaurantId && floorId && tableNumber) {
      setColorMode("light")
      console.log("inside of if")
      localStorage.setItem('tableNumber', tableNumber);
      localStorage.setItem('restaurantId', restaurantId);
      localStorage.setItem('floorId', floorId);
      console.log("Yes it is running => ",restaurantId, floorId, tableNumber )
      // Redirect to customer menu with table number as query
      navigate(`/customer-menu?table=${tableNumber}`, { replace: true });
    }else{
      console.log("Yes it is running => ",restaurantId, floorId, tableNumber )
      console.log("inside of else ")
    }
  }, [restaurantId, floorId, tableNumber, navigate]);

  return <div className='min-h-screen w-full flex items-center justify-center'>
    <LoaderCircle className='animate-spin' color="#a522bf" />
  </div>;
};

export default TableRedirect;
