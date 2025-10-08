import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const TableRedirect = () => {
  const { restaurantId, floorId, tableNumber } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (restaurantId && floorId && tableNumber) {
      localStorage.setItem('tableNumber', tableNumber);
      localStorage.setItem('restaurantId', restaurantId);
      localStorage.setItem('floorId', floorId);

      // Redirect to customer menu with table number as query
      navigate(`/customer-menu?table=${tableNumber}`, { replace: true });
    }
  }, [restaurantId, floorId, tableNumber, navigate]);

  return <div>Redirecting to your menu...</div>;
};

export default TableRedirect;
