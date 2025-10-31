import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CFormInput,
  CFormCheck,
  CAlert,
} from '@coreui/react';
import { useDispatch, useSelector } from 'react-redux';
import { useHotkeys } from 'react-hotkeys-hook';
import axios from 'axios';
import { BASE_URL } from '../utils/constants';
// Import the thunk for deduction
import { deductRewardPoints } from '../redux/slices/customerSlice'; 

const DiscountModal = React.forwardRef(({
  showDiscountModal,
  setShowDiscountModal,
  cart = [],
  handleDiscountSubmit,
  selectedCustomer = null,
}, ref) => {
  const dispatch = useDispatch();
  const { loading: customerLoading } = useSelector((state) => state.customers);

  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [discountValue, setDiscountValue] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [useRewardPoints, setUseRewardPoints] = useState(false);
  const [manualRewardPoints, setManualRewardPoints] = useState('');

  // Use earnedPoints for display
  const customerEarnedPoints = selectedCustomer ? Number(selectedCustomer.earnedPoints) || 0 : 0;
  const customerRewardCustomerPoints = selectedCustomer ? Number(selectedCustomer.rewardCustomerPoints) || 0 : 0;
  const customerAdminPoints = selectedCustomer ? Number(selectedCustomer.rewardByAdminPoints) || 0 : 0;
  // Total Available = rewardCustomerPoints (current available points)
  const customerTotalPoints = customerRewardCustomerPoints;
  const [couponError, setCouponError] = useState(''); // Error message for coupon
  
  // Refs for focus management
  const modalRef = useRef(null);
  const firstInputRef = useRef(null);
  const modalHasFocusedRef = useRef(false);

  useEffect(() => {
    if (showDiscountModal) {
      setSelectedItemIds([]);
      setDiscountValue('');
      setDiscountType('percentage');
      setCouponCode('');
      setCouponDiscount(0);
      setUseRewardPoints(false);
      setCouponError(''); // Reset error message
      setManualRewardPoints('');
      modalHasFocusedRef.current = false; // Reset focus flag when modal opens
    }
  }, [showDiscountModal, cart]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (couponCode.trim()) {
        validateCoupon(couponCode);
      } else {
        setCouponDiscount(0);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [couponCode]);
  
  // Function to focus first focusable element in modal (excluding close button)
  const focusFirstElement = useCallback(() => {
    const attemptFocus = () => {
      // Try multiple strategies to find first focusable element (skip close button)
      const percentageBtn = modalRef.current?.querySelector('.discount-type-btn[data-type="percentage"]');
      
      // Get all focusable elements but exclude close button
      const allFocusables = modalRef.current?.querySelectorAll(
        'button:not([tabindex="-1"]):not(.btn-close), input:not([tabindex="-1"]), select:not([tabindex="-1"]), textarea:not([tabindex="-1"]), [tabindex="0"]:not(.btn-close)'
      );
      
      const firstFocusable = allFocusables && allFocusables.length > 0 ? allFocusables[0] : null;
      const elementToFocus = percentageBtn || firstFocusable;
      
      if (elementToFocus) {
        console.log('Focusing first element in discount modal:', elementToFocus);
        try {
          if (elementToFocus.setAttribute) {
            elementToFocus.setAttribute('tabindex', '0');
          }
          
          if (typeof elementToFocus.focus === 'function') {
            elementToFocus.focus();
            modalHasFocusedRef.current = true;
            console.log('✅ Successfully focused first element in discount modal!');
            return true;
          }
        } catch (error) {
          console.error('Error focusing:', error);
        }
      }
      return false;
    };
    
    // Try immediately
    if (!attemptFocus()) {
      // Try after animation frame
      requestAnimationFrame(() => {
        if (!attemptFocus()) {
          // Try after short delay
          setTimeout(() => {
            if (!attemptFocus()) {
              // Try after longer delay
              setTimeout(() => {
                attemptFocus();
              }, 300);
            }
          }, 150);
        }
      });
    }
  }, []);
  
  // Fix aria-hidden issue - ensure modal element doesn't have aria-hidden when visible
  useEffect(() => {
    if (showDiscountModal) {
      let modalElement = null;
      let observer = null;

      // CoreUI modals are rendered via portal, so we need to find the modal element in the DOM
      const findAndFixModal = () => {
        // Find the modal element by aria-labelledby attribute
        const element = document.querySelector('.modal[aria-labelledby="discount-modal-title"]');
        if (element) {
          modalElement = element;
          // Remove aria-hidden when modal is visible
          modalElement.removeAttribute('aria-hidden');
          // Also ensure aria-modal is set for better accessibility
          modalElement.setAttribute('aria-modal', 'true');
          return true;
        }
        return false;
      };

      // Try immediately
      if (!findAndFixModal()) {
        // Try after a short delay (modal might still be rendering)
        setTimeout(() => {
          if (!findAndFixModal()) {
            // Try once more after animation
            setTimeout(() => {
              if (findAndFixModal()) {
                setupObserver();
              }
            }, 300);
          } else {
            setupObserver();
          }
        }, 100);
      } else {
        setupObserver();
      }

      // Set up MutationObserver to watch for aria-hidden changes
      function setupObserver() {
        if (!modalElement || !showDiscountModal) return;

        observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
              // If aria-hidden is set to true while modal should be visible, remove it
              if (modalElement.getAttribute('aria-hidden') === 'true' && showDiscountModal) {
                modalElement.removeAttribute('aria-hidden');
                modalElement.setAttribute('aria-modal', 'true');
              }
            }
          });
        });

        observer.observe(modalElement, {
          attributes: true,
          attributeFilter: ['aria-hidden'],
        });
      }

      return () => {
        if (observer) {
          observer.disconnect();
        }
      };
    }
  }, [showDiscountModal]);

  // Auto-focus on first element when modal opens
  useEffect(() => {
    if (showDiscountModal && modalRef.current && !modalHasFocusedRef.current) {
      // Wait for modal to be in DOM before focusing
      setTimeout(() => {
        focusFirstElement();
      }, 200);
    }
  }, [showDiscountModal, focusFirstElement]);
  
  // Keyboard navigation for close button (X) - handle arrow keys
  useEffect(() => {
    if (!showDiscountModal || !modalRef.current) return;

    const handleCloseButtonNavigation = (e) => {
      // Only handle arrow keys
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;

      // Find close button
      const closeButtonSelectors = [
        '.btn-close',
        'button.btn-close',
        '.modal-header .btn-close',
        '.modal-header button[type="button"]',
        'button[aria-label*="close" i]',
        'button[aria-label*="Close" i]'
      ];

      let closeBtn = null;
      for (const selector of closeButtonSelectors) {
        closeBtn = modalRef.current?.querySelector(selector);
        if (closeBtn && closeBtn.closest('.modal-header')) break;
      }

      // Check if focus is on close button
      if (!closeBtn || document.activeElement !== closeBtn) return;

      e.preventDefault();
      e.stopPropagation();
      
      if (e.key === 'ArrowDown') {
        // Move to first focusable element (percentage button)
        const percentageBtn = modalRef.current?.querySelector('.discount-type-btn[data-type="percentage"]');
        if (percentageBtn) {
          percentageBtn.focus();
        } else {
          const firstFocusable = modalRef.current?.querySelector(
            'button:not([tabindex="-1"]):not(.btn-close), input:not([tabindex="-1"]), select:not([tabindex="-1"]), textarea:not([tabindex="-1"]), [tabindex="0"]:not(.btn-close)'
          );
          firstFocusable?.focus();
        }
      } else if (e.key === 'ArrowUp') {
        // Move to last focusable element (Apply Discount button)
        const applyBtn = modalRef.current?.querySelector('.apply-discount-btn');
        if (applyBtn) {
          applyBtn.focus();
        } else {
          const focusableElements = modalRef.current?.querySelectorAll(
            'button:not([tabindex="-1"]):not(.btn-close), input:not([tabindex="-1"]), select:not([tabindex="-1"]), textarea:not([tabindex="-1"]), [tabindex="0"]:not(.btn-close)'
          );
          if (focusableElements && focusableElements.length > 0) {
            focusableElements[focusableElements.length - 1].focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleCloseButtonNavigation, true);

    // Ensure close button is focusable but make it tabindex -1 so focus skips it initially
    const setupCloseButton = () => {
      const closeButtonSelectors = [
        '.btn-close',
        'button.btn-close',
        '.modal-header .btn-close',
        '.modal-header button[type="button"]'
      ];

      for (const selector of closeButtonSelectors) {
        const closeBtn = modalRef.current?.querySelector(selector);
        if (closeBtn && closeBtn.closest('.modal-header')) {
          // Make it focusable but not in tab order initially
          closeBtn.setAttribute('tabindex', '-1');
          closeBtn.classList.add('modal-close-btn');
          
          // Add direct handler for keyboard navigation
          const directHandler = (e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              e.stopPropagation();
              const percentageBtn = modalRef.current?.querySelector('.discount-type-btn[data-type="percentage"]');
              percentageBtn?.focus();
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              e.stopPropagation();
              const applyBtn = modalRef.current?.querySelector('.apply-discount-btn');
              applyBtn?.focus();
            }
          };
          
          closeBtn.addEventListener('keydown', directHandler, true);
          closeBtn._arrowKeyHandler = directHandler;
          break;
        }
      }
    };

    const timer = setTimeout(setupCloseButton, 100);

    return () => {
      document.removeEventListener('keydown', handleCloseButtonNavigation, true);
      clearTimeout(timer);
      
      // Cleanup direct handlers
      const closeBtnWithHandler = modalRef.current?.querySelector('.modal-close-btn');
      if (closeBtnWithHandler && closeBtnWithHandler._arrowKeyHandler) {
        closeBtnWithHandler.removeEventListener('keydown', closeBtnWithHandler._arrowKeyHandler, true);
        delete closeBtnWithHandler._arrowKeyHandler;
      }
    };
  }, [showDiscountModal]);

  // Focus trapping - prevent focus from leaving modal
  useEffect(() => {
    if (!showDiscountModal) return;
    
    const isFocusInsideModal = () => {
      if (!modalRef.current) return false;
      const activeElement = document.activeElement;
      return modalRef.current.contains(activeElement);
    };
    
    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;
      
      // Only trap if focus is inside modal
      if (!isFocusInsideModal()) {
        e.preventDefault();
        // Skip close button - focus on percentage button instead
        const percentageBtn = modalRef.current?.querySelector('.discount-type-btn[data-type="percentage"]');
        const firstFocusable = modalRef.current?.querySelector(
          'button:not([tabindex="-1"]):not(.btn-close), input:not([tabindex="-1"]), select:not([tabindex="-1"]), textarea:not([tabindex="-1"]), [tabindex="0"]:not(.btn-close)'
        );
        (percentageBtn || firstFocusable)?.focus();
        return;
      }
      
      // Get focusable elements excluding close button
      const focusableElements = modalRef.current?.querySelectorAll(
        'button:not([tabindex="-1"]):not(.btn-close), [href]:not([tabindex="-1"]), input:not([tabindex="-1"]), select:not([tabindex="-1"]), textarea:not([tabindex="-1"]), [tabindex="0"]:not(.btn-close)'
      );
      
      if (!focusableElements || focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };
    
    // Strict focus trap - ensure focus never leaves modal
    const handleFocusTrap = (e) => {
      if (!modalRef.current || !showDiscountModal) return;
      
      const activeElement = document.activeElement;
      
      // If focus is not inside modal, bring it back (skip close button)
      if (!modalRef.current.contains(activeElement)) {
        e.preventDefault();
        const percentageBtn = modalRef.current?.querySelector('.discount-type-btn[data-type="percentage"]');
        const firstFocusable = modalRef.current?.querySelector(
          'button:not([tabindex="-1"]):not(.btn-close), [href]:not([tabindex="-1"]), input:not([tabindex="-1"]), select:not([tabindex="-1"]), textarea:not([tabindex="-1"]), [tabindex="0"]:not(.btn-close)'
        );
        (percentageBtn || firstFocusable)?.focus();
      }
    };
    
    // Prevent clicks on background and maintain focus
    const handleClick = (e) => {
      if (!modalRef.current?.contains(e.target)) {
        e.preventDefault();
        e.stopPropagation();
        // Keep focus inside modal (skip close button)
        const percentageBtn = modalRef.current?.querySelector('.discount-type-btn[data-type="percentage"]');
        const firstFocusable = modalRef.current?.querySelector(
          'button:not([tabindex="-1"]):not(.btn-close), [href]:not([tabindex="-1"]), input:not([tabindex="-1"]), select:not([tabindex="-1"]), textarea:not([tabindex="-1"]), [tabindex="0"]:not(.btn-close)'
        );
        (percentageBtn || firstFocusable)?.focus();
      }
    };
    
    // Check focus on focusin event
    const handleFocusIn = (e) => {
      if (!modalRef.current || !showDiscountModal) return;
      
      const target = e.target;
      
      // Allow focus on checkboxes - don't interfere
      if (target?.classList.contains('item-discount-checkbox') || 
          target?.type === 'checkbox' ||
          target?.closest('.item-discount-checkbox')) {
        return; // Let checkbox keep focus
      }
      
      // If focus moves to close button, move it to percentage button instead
      if (target?.classList.contains('btn-close') || target?.classList.contains('modal-close-btn')) {
        e.preventDefault();
        e.stopPropagation();
        const percentageBtn = modalRef.current?.querySelector('.discount-type-btn[data-type="percentage"]');
        if (percentageBtn) {
          percentageBtn.focus();
        }
        return;
      }
      
      // If focus moves to an element outside modal, bring it back
      if (!modalRef.current.contains(target)) {
        e.preventDefault();
        e.stopPropagation();
        const percentageBtn = modalRef.current?.querySelector('.discount-type-btn[data-type="percentage"]');
        const firstFocusable = modalRef.current?.querySelector(
          'button:not([tabindex="-1"]):not(.btn-close), [href]:not([tabindex="-1"]), input:not([tabindex="-1"]), select:not([tabindex="-1"]), textarea:not([tabindex="-1"]), [tabindex="0"]:not(.btn-close)'
        );
        (percentageBtn || firstFocusable)?.focus();
      }
    };
    
    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('mousedown', handleClick, true);
    document.addEventListener('focusin', handleFocusIn, true);
    
    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('mousedown', handleClick, true);
      document.removeEventListener('focusin', handleFocusIn, true);
    };
  }, [showDiscountModal]);
  
  // Global keyboard navigation for checkboxes in modal
  useHotkeys(
    'arrowup, arrowdown',
    (e, handler) => {
      if (!showDiscountModal || !modalRef.current) return;
      
      const activeElement = document.activeElement;
      const isInModal = modalRef.current.contains(activeElement);
      if (!isInModal) return;

      // Check if focus is on a checkbox - try multiple ways to detect
      const isCheckboxInput = activeElement.type === 'checkbox';
      const isInCheckboxWrapper = activeElement.closest('.item-discount-checkbox');
      const hasCheckboxClass = activeElement.classList?.contains('item-discount-checkbox');
      
      if (!isCheckboxInput && !isInCheckboxWrapper && !hasCheckboxClass) return;

      e.preventDefault();
      e.stopPropagation();
      
      // Get all checkbox inputs directly (find within wrappers if needed)
      let allCheckboxInputs = Array.from(
        modalRef.current.querySelectorAll('input[type="checkbox"].item-discount-checkbox')
      );
      
      // If not found with class, try finding within wrapper
      if (allCheckboxInputs.length === 0) {
        const wrappers = modalRef.current.querySelectorAll('.item-discount-checkbox');
        wrappers.forEach(wrapper => {
          const input = wrapper.querySelector('input[type="checkbox"]');
          if (input && !allCheckboxInputs.includes(input)) {
            allCheckboxInputs.push(input);
          }
        });
      }

      if (allCheckboxInputs.length === 0) return;

      // Find current focused checkbox index
      let currentIndex = -1;
      if (isCheckboxInput) {
        currentIndex = allCheckboxInputs.indexOf(activeElement);
      } else if (isInCheckboxWrapper) {
        const wrapper = isInCheckboxWrapper;
        const input = wrapper.querySelector('input[type="checkbox"]');
        currentIndex = input ? allCheckboxInputs.indexOf(input) : -1;
      }

      let nextIndex;
      if (handler.keys?.includes('arrowdown')) {
        nextIndex = currentIndex >= 0 && currentIndex < allCheckboxInputs.length - 1 
          ? currentIndex + 1 
          : 0;
      } else if (handler.keys?.includes('arrowup')) {
        nextIndex = currentIndex > 0 
          ? currentIndex - 1 
          : allCheckboxInputs.length - 1;
      } else {
        return;
      }

      if (nextIndex >= 0 && nextIndex < allCheckboxInputs.length) {
        const nextCheckbox = allCheckboxInputs[nextIndex];
        setTimeout(() => {
          nextCheckbox.focus();
          nextCheckbox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 0);
      }
    },
    {
      enableOnFormTags: true,
      preventDefault: true,
      enable: () => showDiscountModal && modalRef.current?.contains(document.activeElement)
    },
    [showDiscountModal, cart.length]
  );

  // Keyboard shortcuts - Enter to Apply, Escape to Close
  useEffect(() => {
    if (!showDiscountModal) return;
    
    const handleKeyDown = (e) => {
      // Escape to close modal
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowDiscountModal(false);
      }
      // Enter to apply (if not in input field or textarea)
      if (e.key === 'Enter' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        const submitButton = modalRef.current?.querySelector('.apply-discount-btn');
        if (submitButton && !submitButton.disabled) {
          e.preventDefault();
          // Trigger click event on the submit button
          submitButton.click();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showDiscountModal]);

  const toggleSelection = (itemId) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const selectAll = () => {
    if (selectedItemIds.length === cart.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(cart.map((item) => item.id || item._id));
    }
  };

  const validateCoupon = async (code) => {
    if (!code || code.trim() === '') {
      setCouponDiscount(0);
      return;
    }

    try {
      const orderTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const token = localStorage.getItem('authToken');
      const response = await axios.post(`${BASE_URL}/api/coupon/validate`, {
        couponCode: code.trim(),
        orderTotal: orderTotal
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const coupon = response.data.coupon;
        
        // Check max usage before applying
        if (coupon.maxUsage && coupon.usageCount >= coupon.maxUsage) {
          setCouponDiscount(0);
          setCouponError(`Coupon usage limit exceeded. Used: ${coupon.usageCount}/${coupon.maxUsage}`);
          return;
        }

        setCouponDiscount({
          type: coupon.discountType,
          value: coupon.discountValue,
          amount: coupon.discountAmount,
          id: coupon.id,
          code: coupon.code,
          expiryDate: coupon.expiryDate,
          minOrderValue: coupon.minOrderValue,
          maxDiscountAmount: coupon.maxDiscountAmount,
          usageCount: coupon.usageCount,
          maxUsage: coupon.maxUsage,
          description: coupon.description
        });
        setCouponError(''); // Clear error message on success
      } else {
        setCouponDiscount(0);
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      setCouponDiscount(0);
    }
  };

  const handleApplyCoupon = () => {
    if (couponCode.trim()) {
      validateCoupon(couponCode);
    }
  };

  const calculateTotalRewardPointsFromCart = () => {
    return cart.reduce((total, item) => {
      const itemRewardPoints = Number(item.rewardPoints) || 0;
      return total + (itemRewardPoints * item.quantity);
    }, 0);
  };

  const calculatePointsToUse = () => {
    const manualPoints = Number(manualRewardPoints) || 0;
    const autoPoints = useRewardPoints ? calculateTotalRewardPointsFromCart() : 0;
    const totalDesiredPoints = manualPoints + autoPoints;
    
    // This is the fix for the "40 -> 38" issue.
    // We cap the *total desired points* by the *total available points*.
    const finalPointsToUse = Math.min(totalDesiredPoints, customerTotalPoints);
    
    return {
      totalDesired: totalDesiredPoints,
      finalPointsToUse: finalPointsToUse,
      discountAmount: finalPointsToUse // 1 point = 1 Rupee
    };
  };

  const calculateCartSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.adjustedPrice * item.quantity), 0);
  };

  const onSubmit = async () => {
    const { finalPointsToUse, discountAmount } = calculatePointsToUse();

    if (
      (selectedItemIds.length === 0 && !couponDiscount.value && finalPointsToUse === 0) ||
      (!discountValue && !couponDiscount.value && finalPointsToUse === 0)
    ) {
      console.warn('Invalid submission: No discount to apply');
      // You might want to show a toast message here
      return;
    }

    // *** NEW: Dispatch Redux thunk for reward points deduction (saves to backend immediately)
    // if (finalPointsToUse > 0 && selectedCustomer) {
    //   try {
    //     await dispatch(deductRewardPoints({
    //       customerId: selectedCustomer._id,
    //       pointsToDeduct: finalPointsToUse,
    //     })).unwrap();  // Await and handle rejection
    //     console.log('✅ Reward points deducted and saved to backend via Redux');
    //     // Optional: Update local selectedCustomer if needed (but Redux will refresh via fetch if called elsewhere)
    //   } catch (error) {
    //     console.error('❌ Failed to deduct reward points:', error);
    //     // The slice already shows toast.error; abort submission
    //     return;
    //   }
    // }

    // Note: Usage count will be incremented only after successful payment
    // This is just applying the coupon to the cart, not finalizing the order

    const discounts = {
      selectedItemDiscount: {
        ids: selectedItemIds,
        value: Number(discountValue),
        type: discountType,
      },
      coupon: couponDiscount.value ? couponDiscount : null, // Pass full coupon object or null
      
      // *** MODIFIED ***
      // Pass the reward points calculation back to POSTableContent
      rewardPoints: finalPointsToUse > 0 ? {
        enabled: true,
        pointsUsed: finalPointsToUse,
        discountAmount: discountAmount, // This is the amount (1 point = ₹1)
      } : null,
      
      // This section is removed as it's now combined into 'rewardPoints'
      // manualRewardPoints: null, 
    };

    console.log('Submitting discounts to parent:', discounts);
    handleDiscountSubmit(discounts);

    // Reset form
    setSelectedItemIds([]);
    setDiscountValue('');
    setDiscountType('percentage');
    setCouponCode('');
    setCouponDiscount(0);
    setUseRewardPoints(false);
    setCouponError(''); // Reset error message
    setManualRewardPoints('');
    setShowDiscountModal(false);
  };

  const calculatePreview = () => {
    let totalDiscount = 0;

    // Item-specific discounts
    if (discountValue && selectedItemIds.length > 0) {
      totalDiscount += selectedItemIds.reduce((total, itemId) => {
        const item = cart.find((cartItem) => (cartItem.id || cartItem._id) === itemId);
        if (!item) return total;
        const itemSubtotal = item.adjustedPrice * item.quantity;
        let itemDiscount = 0;
        if (discountType === 'percentage') {
          itemDiscount = (itemSubtotal * Number(discountValue)) / 100;
        } else if (discountType === 'fixed') {
          // Note: Fixed discount is usually per-item, not total. 
          // Adjust this if it's a total fixed amount spread across items.
          // Assuming 'discountValue' is per item selected:
          // itemDiscount = Number(discountValue) * item.quantity;
          // Assuming 'discountValue' is a total to be applied once:
          itemDiscount = Number(discountValue); 
        }
        return total + itemDiscount;
      }, 0);
    }

    // Coupon discounts
    if (couponDiscount.value) {
      if (couponDiscount.type === 'percentage') {
        const subtotal = calculateCartSubtotal();
        const calculatedDiscountAmount = (subtotal * couponDiscount.value) / 100;
        
        // Check if max discount limit exists and apply it
        if (couponDiscount.maxDiscountAmount && calculatedDiscountAmount > couponDiscount.maxDiscountAmount) {
          totalDiscount += couponDiscount.maxDiscountAmount;
        } else {
          totalDiscount += calculatedDiscountAmount;
        }
      } else if (couponDiscount.type === 'fixed') {
        // For fixed discount, check if it exceeds max discount limit
        if (couponDiscount.maxDiscountAmount && couponDiscount.value > couponDiscount.maxDiscountAmount) {
          totalDiscount += couponDiscount.maxDiscountAmount;
        } else {
          totalDiscount += couponDiscount.value;
        }
      }
    }

    // Reward points discount (both manual and auto)
    const { discountAmount } = calculatePointsToUse();
    totalDiscount += discountAmount;

    return totalDiscount;
  };

  const validCart = Array.isArray(cart) ? cart : [];
  const hasItems = validCart.length > 0;
  const totalRewardPointsFromCart = calculateTotalRewardPointsFromCart();
  
  const { totalDesired, finalPointsToUse, discountAmount: rewardDiscountAmount } = calculatePointsToUse();
  const manualPointsEntered = Number(manualRewardPoints) || 0;

  return (
    <CModal 
      visible={showDiscountModal} 
      onClose={() => setShowDiscountModal(false)} 
      size="lg"
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="discount-modal-title"
    >
      <CModalHeader>
        <CModalTitle id="discount-modal-title">Apply Discount / Coupon / Reward Points</CModalTitle>
      </CModalHeader>
      <CModalBody style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {/* Manual Reward Points Section (Admin) */}
        {selectedCustomer && (
          <div className="mb-4 p-3 border rounded" style={{ backgroundColor: '#e7f3ff' }}>
            <h6 className="fw-bold mb-3 text-dark">👤 Use Reward Points</h6>

            <div className="row mb-3">
              <div className="col-4">
                <small className="text-muted d-block mb-1">Earned Points:</small>
                <div className="fw-bold text-success fs-6">{customerEarnedPoints} pts</div>
              </div>
              {/* <div className="col-4">
                <small className="text-muted d-block mb-1">Admin Points:</small>
                <div className="fw-bold text-primary fs-6">{customerAdminPoints} pts</div>
              </div> */}
              <div className="col-4">
                <small className="text-muted d-block mb-1">Total Available:</small>
                <div className="fw-bold text-dark fs-5">
                  {customerTotalPoints - manualPointsEntered} pts
                </div>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Enter Reward Points to Use:</label>
              <CFormInput
                type="number"
                placeholder="Enter points (e.g., 50)"
                value={manualRewardPoints}
                onChange={(e) => setManualRewardPoints(e.target.value)}
                min="0"
                // max={customerTotalPoints} // We won't set max, we'll just show a warning
              />
              <small className="text-muted">1 point = ₹1 discount</small>
            </div>
            
            {/* Automatic Reward Points Section */}
            {totalRewardPointsFromCart > 0 && (
              <div className="mb-3 p-3 border rounded" style={{ backgroundColor: '#fff3cd' }}>
                <CFormCheck
                  type="checkbox"
                  id="useRewardPoints"
                  label={
                    <span className="fw-bold">
                      Also use {totalRewardPointsFromCart} points from items in cart?
                    </span>
                  }
                  checked={useRewardPoints}
                  onChange={(e) => setUseRewardPoints(e.target.checked)}
                />
              </div>
            )}

            {rewardDiscountAmount > 0 && (
              <CAlert color="success" className="mb-0">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold">✅ Reward Discount Applied:</span>
                  <span className="fw-bold fs-5">
                    ₹{rewardDiscountAmount.toFixed(2)}
                  </span>
                </div>
                <small className="d-block mt-1">
                  Using {finalPointsToUse} reward points for this order.
                </small>
              </CAlert>
            )}

            {totalDesired > customerTotalPoints && (
              <CAlert color="danger" className="mt-2 mb-0 py-2">
                <small>
                  ❌ You are trying to use {totalDesired} points, but the
                  customer only has {customerTotalPoints} points available.
                  The discount will be capped at ₹{customerTotalPoints.toFixed(2)}.
                </small>
              </CAlert>
            )}
          </div>
        )}

        {/* No customer selected warning */}
        {!selectedCustomer && (
          <CAlert color="info" className="mb-4">
            <small>
              ℹ️ Select a customer to use reward points.
            </small>
          </CAlert>
        )}

        {/* Discount Type */}
        <div className="mb-4">
          <label className="form-label fw-bold mb-2">Item-Specific Discount Type:</label>
          <div className="btn-group w-100" role="group">
            <button
              type="button"
              className={`btn ${discountType === 'percentage' ? 'btn-primary' : 'btn-outline-primary'} discount-type-btn focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              data-type="percentage"
              onClick={() => setDiscountType('percentage')}
              tabIndex={0}
            onKeyDown={(e) => {
              // Ensure focus stays in modal
              if (!modalRef.current?.contains(e.target)) return;
              
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setDiscountType('percentage');
              } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                e.stopPropagation();
                const fixedBtn = modalRef.current?.querySelector('.discount-type-btn[data-type="fixed"]');
                if (fixedBtn) fixedBtn.focus();
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                e.stopPropagation();
                const input = modalRef.current?.querySelector('.discount-value-input');
                if (input) input.focus();
              }
            }}
            >
              Percentage (%)
            </button>
            <button
              type="button"
              className={`btn ${discountType === 'fixed' ? 'btn-primary' : 'btn-outline-primary'} discount-type-btn focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              data-type="fixed"
              onClick={() => setDiscountType('fixed')}
              tabIndex={0}
            onKeyDown={(e) => {
              // Ensure focus stays in modal
              if (!modalRef.current?.contains(e.target)) return;
              
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setDiscountType('fixed');
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                e.stopPropagation();
                const percentageBtn = modalRef.current?.querySelector('.discount-type-btn[data-type="percentage"]');
                if (percentageBtn) percentageBtn.focus();
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                e.stopPropagation();
                const input = modalRef.current?.querySelector('.discount-value-input');
                if (input) input.focus();
              }
            }}
            >
              Fixed (₹)
            </button>
          </div>
        </div>

        {/* Discount Value */}
        <div className="mb-4">
          <label className="form-label fw-bold">
            {discountType === 'percentage' ? 'Item Discount %' : 'Item Discount ₹'}
          </label>
          <CFormInput
            type="number"
            placeholder={discountType === 'percentage' ? '10 (for 10%)' : '100 (for ₹100 off)'}
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            ref={firstInputRef}
            className="discount-value-input focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            tabIndex={0}
            onKeyDown={(e) => {
              if (!modalRef.current?.contains(e.target)) return;
              
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                e.stopPropagation();
                modalRef.current?.querySelector('.discount-type-btn')?.focus();
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                e.stopPropagation();
                modalRef.current?.querySelector('.coupon-code-input')?.focus();
              }
            }}
          />
        </div>

        {/* Coupon Code */}
        <div className="mb-4">
          <label className="form-label fw-bold">Coupon Code</label>
          <div className="d-flex">
            <CFormInput
              type="text"
              className="coupon-code-input"
              placeholder="Enter coupon code (e.g., BQHWM70)"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (!modalRef.current?.contains(e.target)) return;
                
                if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  e.stopPropagation();
                  modalRef.current?.querySelector('.apply-coupon-btn')?.focus();
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  e.stopPropagation();
                  modalRef.current?.querySelector('.discount-value-input')?.focus();
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  e.stopPropagation();
                  modalRef.current?.querySelector('.select-all-discount-btn')?.focus();
                }
              }}
            />
            <CButton
              color="success"
              className="ms-2 apply-coupon-btn"
              onClick={handleApplyCoupon}
              disabled={!couponCode.trim()}
              tabIndex={0}
              onKeyDown={(e) => {
                if (!modalRef.current?.contains(e.target)) return;
                
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleApplyCoupon();
                } else if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  e.stopPropagation();
                  modalRef.current?.querySelector('.coupon-code-input')?.focus();
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  e.stopPropagation();
                  modalRef.current?.querySelector('.discount-value-input')?.focus();
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  e.stopPropagation();
                  modalRef.current?.querySelector('.select-all-discount-btn')?.focus();
                }
              }}
            >
              Apply
            </CButton>
          </div>
          {couponDiscount.value ? (
            <div className="mt-3 p-3 border rounded bg-light">
              <div className="d-flex align-items-center mb-2">
                <span className="text-success me-2">✅</span>
                <span className="fw-bold text-success">Coupon Applied Successfully!</span>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-2">
                    <strong>Code:</strong> <span className="text-primary">{couponDiscount.code}</span>
                  </div>
                  <div className="mb-2">
                    <strong>Discount:</strong>
                    <span className="text-success ms-1">
                      {couponDiscount.type === 'percentage'
                        ? `${couponDiscount.value}% OFF`
                        : `₹${couponDiscount.value} OFF`}
                    </span>
                  </div>
                  <div className="mb-2">
                    <strong>Discount Amount:</strong>
                    <span className="text-success ms-1">
                      ₹{(() => {
                        const subtotal = calculateCartSubtotal();
                        let actualDiscount = 0;
                        
                        if (couponDiscount.type === 'percentage') {
                          const calculatedDiscount = (subtotal * couponDiscount.value) / 100;
                          actualDiscount = couponDiscount.maxDiscountAmount && calculatedDiscount > couponDiscount.maxDiscountAmount 
                            ? couponDiscount.maxDiscountAmount 
                            : calculatedDiscount;
                        } else if (couponDiscount.type === 'fixed') {
                          actualDiscount = couponDiscount.maxDiscountAmount && couponDiscount.value > couponDiscount.maxDiscountAmount 
                            ? couponDiscount.maxDiscountAmount 
                            : couponDiscount.value;
                        }
                        
                        return actualDiscount.toFixed(2);
                      })()}
                    </span>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="mb-2">
                    <strong>Min Order:</strong>
                    <span className="text-info ms-1">₹{couponDiscount.minOrderValue || '0'}</span>
                  </div>
                  <div className="mb-2">
                    <strong>Max Discount:</strong>
                    <span className="text-warning ms-1">₹{couponDiscount.maxDiscountAmount || 'No limit'}</span>
                  </div>
                  <div className="mb-2">
                    <strong>Expires:</strong>
                    <span className="text-secondary ms-1">
                      {couponDiscount.expiryDate ? new Date(couponDiscount.expiryDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="mb-2">
                    <strong>Usage:</strong>
                    <span className="text-info ms-1">
                      {couponDiscount.usageCount || 0}
                      {couponDiscount.maxUsage ? `/${couponDiscount.maxUsage}` : ''}
                      {couponDiscount.maxUsage && couponDiscount.usageCount >= couponDiscount.maxUsage ? 
                        ' (Limit Reached)' : ''
                      }
                    </span>
                  </div>
                </div>
              </div>

              {couponDiscount.description && (
                <div className="mt-2">
                  <strong>Description:</strong>
                  <span className="text-muted ms-1">{couponDiscount.description}</span>
                </div>
              )}

              {/* Max Discount Warning */}
              {(() => {
                const subtotal = calculateCartSubtotal();
                let showWarning = false;
                let warningMessage = '';
                
                if (couponDiscount.type === 'percentage') {
                  const calculatedDiscount = (subtotal * couponDiscount.value) / 100;
                  if (couponDiscount.maxDiscountAmount && calculatedDiscount > couponDiscount.maxDiscountAmount) {
                    showWarning = true;
                    warningMessage = `Max discount limit of ₹${couponDiscount.maxDiscountAmount} applied instead of calculated ₹${calculatedDiscount.toFixed(2)}`;
                  }
                } else if (couponDiscount.type === 'fixed') {
                  if (couponDiscount.maxDiscountAmount && couponDiscount.value > couponDiscount.maxDiscountAmount) {
                    showWarning = true;
                    warningMessage = `Max discount limit of ₹${couponDiscount.maxDiscountAmount} applied instead of ₹${couponDiscount.value}`;
                  }
                }
                
                return showWarning ? (
                  <div className="mt-2">
                    <div className="alert alert-warning py-2 mb-0">
                      <small>
                        <strong>⚠️ Max Discount Applied:</strong> {warningMessage}
                      </small>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          ) : couponCode ? (
            <small className="text-danger d-block mt-2">
              ❌ Invalid Coupon
            </small>
          ) : null}
          
          {/* Coupon Error Message */}
          {couponError && (
            <div className="mt-2">
              <div className="alert alert-danger py-2 mb-0">
                <small>
                  <strong>❌ Error:</strong> {couponError}
                </small>
              </div>
            </div>
          )}
        </div>

        {/* Select Items */}
        <div className="border rounded p-3 mb-3">
          <h6 className="fw-bold mb-2">Select Items for Item-Specific Discount:</h6>
          {hasItems ? (
            <>
              <CButton
                size="sm"
                color="secondary"
                className="mb-2 select-all-discount-btn"
                onClick={selectAll}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (!modalRef.current?.contains(e.target)) return;
                  
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectAll();
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    e.stopPropagation();
                    modalRef.current?.querySelector('.apply-coupon-btn')?.focus();
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    e.stopPropagation();
                    // Find first checkbox input
                    const wrappers = modalRef.current?.querySelectorAll('.item-discount-checkbox');
                    if (wrappers && wrappers.length > 0) {
                      const firstInput = wrappers[0].querySelector('input[type="checkbox"]');
                      if (firstInput) {
                        setTimeout(() => firstInput.focus(), 0);
                      } else {
                        wrappers[0].focus();
                      }
                    }
                  }
                }}
              >
                {selectedItemIds.length === validCart.length ? 'Deselect All' : 'Select All'}
              </CButton>
              {validCart.map((item, index) => {
                const itemRewardPoints = Number(item.rewardPoints) || 0;
                return (
                  <div key={item.id} className="d-flex align-items-center border p-2 mb-2 rounded">
                    <CFormCheck
                      type="checkbox"
                      checked={selectedItemIds.includes(item.id)}
                      onChange={() => toggleSelection(item.id)}
                      className="me-2 item-discount-checkbox"
                      tabIndex={0}
                      onFocus={(e) => {
                        // Add focus outline like input boxes
                        const checkbox = e.target.querySelector('input[type="checkbox"]') || e.target;
                        if (checkbox && checkbox.tagName === 'INPUT') {
                          checkbox.style.outline = '2px solid #0d6efd';
                          checkbox.style.outlineOffset = '2px';
                          checkbox.style.borderRadius = '3px';
                        }
                      }}
                      onBlur={(e) => {
                        // Remove focus outline
                        const checkbox = e.target.querySelector('input[type="checkbox"]') || e.target;
                        if (checkbox && checkbox.tagName === 'INPUT') {
                          checkbox.style.outline = 'none';
                          checkbox.style.outlineOffset = '0';
                        }
                      }}
                      onKeyDown={(e) => {
                        if (!modalRef.current?.contains(e.target)) return;
                        
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleSelection(item.id);
                        }
                        // Arrow navigation is handled by global useHotkeys now
                      }}
                    />
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="fw-bold">{item.itemName}</div>
                          <small className="text-muted">
                            Qty: {item.quantity}, Price: ₹{item.adjustedPrice}
                          </small>
                        </div>
                        {itemRewardPoints > 0 && (
                          <span className="badge bg-warning text-dark">
                            🎁 {itemRewardPoints * item.quantity} pts
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <p className="text-muted">No items in cart.</p>
          )}
        </div>

        {/* Discount Preview */}
        {(selectedItemIds.length > 0 || (couponDiscount && couponDiscount.amount > 0) || rewardDiscountAmount > 0) && (
          <CAlert color="info" className="mb-0">
            <div className="d-flex justify-content-between align-items-center">
              <strong>Total Discount Preview:</strong>
              <strong className="fs-5">₹{calculatePreview().toFixed(2)}</strong>
            </div>
            {rewardDiscountAmount > 0 && (
              <div className="mt-2">
                <small className="text-muted">
                  (Includes ₹{rewardDiscountAmount.toFixed(2)} from reward points)
                </small>
              </div>
            )}
          </CAlert>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton 
          color="secondary" 
          className="cancel-discount-btn"
          onClick={() => setShowDiscountModal(false)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (!modalRef.current?.contains(e.target)) return;
            
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setShowDiscountModal(false);
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              e.stopPropagation();
              modalRef.current?.querySelector('.apply-discount-btn')?.focus();
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              e.stopPropagation();
              const checkboxes = modalRef.current?.querySelectorAll('.item-discount-checkbox');
              if (checkboxes.length > 0) {
                checkboxes[checkboxes.length - 1].focus();
              }
            }
          }}
        >
          Cancel
        </CButton>
        <CButton
          color="primary"
          className="apply-discount-btn focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          onClick={onSubmit}
          tabIndex={0}
          onKeyDown={(e) => {
            if (!modalRef.current?.contains(e.target)) return;
            
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSubmit();
            } else if (e.key === 'ArrowLeft') {
              e.preventDefault();
              e.stopPropagation();
              modalRef.current?.querySelector('.cancel-discount-btn')?.focus();
            }
          }}
          disabled={
            customerLoading ||  // Existing: customer loading
            // *** NEW: Include thunk loading for deduction
            (finalPointsToUse > 0 && customerLoading) ||  // Deduction-specific loading check
            (selectedItemIds.length === 0 && !couponDiscount.value && finalPointsToUse === 0) ||
            (!discountValue && !couponDiscount.value && finalPointsToUse === 0)
          }
        >
          {customerLoading ? 'Processing...' : 'Apply Discount'}
        </CButton>
      </CModalFooter>
    </CModal>
  );
});

DiscountModal.displayName = 'DiscountModal';

export default DiscountModal;

// import React, { useState, useEffect } from 'react';
// import {
//   CModal,
//   CModalHeader,
//   CModalTitle,
//   CModalBody,
//   CModalFooter,
//   CButton,
//   CFormInput,
//   CFormCheck,
//   CAlert,
// } from '@coreui/react';
// import { useDispatch, useSelector } from 'react-redux';
// import axios from 'axios';
// import { BASE_URL } from '../utils/constants';
// // No need to import deductRewardPoints here, POSTableContent will handle it.
// // import { deductRewardPoints } from '../redux/slices/customerSlice'; 

// const DiscountModal = ({
//   showDiscountModal,
//   setShowDiscountModal,
//   cart = [],
//   handleDiscountSubmit,
//   selectedCustomer = null,
// }) => {
//   const dispatch = useDispatch();
//   const { loading: customerLoading } = useSelector((state) => state.customers);

//   const [selectedItemIds, setSelectedItemIds] = useState([]);
//   const [discountValue, setDiscountValue] = useState('');
//   const [discountType, setDiscountType] = useState('percentage');
//   const [couponCode, setCouponCode] = useState('');
//   const [couponDiscount, setCouponDiscount] = useState(0);
//   const [useRewardPoints, setUseRewardPoints] = useState(false);
//   const [manualRewardPoints, setManualRewardPoints] = useState('');

//   // Use totalReward for customer's available points
//   const customerEarnedPoints = selectedCustomer ? Number(selectedCustomer.rewardCustomerPoints) || 0 : 0;
//   const customerAdminPoints = selectedCustomer ? Number(selectedCustomer.rewardByAdminPoints) || 0 : 0;
//   const customerTotalPoints = selectedCustomer ? Number(selectedCustomer.totalReward) || 0 : 0;


//   useEffect(() => {
//     if (showDiscountModal) {
//       setSelectedItemIds([]);
//       setDiscountValue('');
//       setDiscountType('percentage');
//       setCouponCode('');
//       setCouponDiscount(0);
//       setUseRewardPoints(false);
//       setManualRewardPoints('');
//     }
//   }, [showDiscountModal, cart]);

//   useEffect(() => {
//     const timeoutId = setTimeout(() => {
//       if (couponCode.trim()) {
//         validateCoupon(couponCode);
//       } else {
//         setCouponDiscount(0);
//       }
//     }, 500);

//     return () => clearTimeout(timeoutId);
//   }, [couponCode]);

//   const toggleSelection = (itemId) => {
//     setSelectedItemIds((prev) =>
//       prev.includes(itemId)
//         ? prev.filter((id) => id !== itemId)
//         : [...prev, itemId]
//     );
//   };

//   const selectAll = () => {
//     if (selectedItemIds.length === cart.length) {
//       setSelectedItemIds([]);
//     } else {
//       setSelectedItemIds(cart.map((item) => item.id || item._id));
//     }
//   };

//   const validateCoupon = async (code) => {
//     if (!code || code.trim() === '') {
//       setCouponDiscount(0);
//       return;
//     }

//     try {
//       const orderTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

//       const token = localStorage.getItem('authToken');
//       const response = await axios.post(`${BASE_URL}/api/coupon/validate`, {
//         couponCode: code.trim(),
//         orderTotal: orderTotal
//       }, {
//         headers: {
//           Authorization: `Bearer ${token}`
//         }
//       });

//       if (response.data.success) {
//         const coupon = response.data.coupon;
//         setCouponDiscount({
//           type: coupon.discountType,
//           value: coupon.discountValue,
//           amount: coupon.discountAmount,
//           id: coupon.id,
//           code: coupon.code,
//           expiryDate: coupon.expiryDate,
//           minOrderValue: coupon.minOrderValue,
//           maxDiscountAmount: coupon.maxDiscountAmount,
//           usageCount: coupon.usageCount,
//           maxUsage: coupon.maxUsage,
//           description: coupon.description
//         });
//       } else {
//         setCouponDiscount(0);
//       }
//     } catch (error) {
//       console.error('Error validating coupon:', error);
//       setCouponDiscount(0);
//     }
//   };

//   const handleApplyCoupon = () => {
//     if (couponCode.trim()) {
//       validateCoupon(couponCode);
//     }
//   };

//   const calculateTotalRewardPointsFromCart = () => {
//     return cart.reduce((total, item) => {
//       const itemRewardPoints = Number(item.rewardPoints) || 0;
//       return total + (itemRewardPoints * item.quantity);
//     }, 0);
//   };

//   const calculatePointsToUse = () => {
//     const manualPoints = Number(manualRewardPoints) || 0;
//     const autoPoints = useRewardPoints ? calculateTotalRewardPointsFromCart() : 0;
//     const totalDesiredPoints = manualPoints + autoPoints;


//     // This is the fix for the "40 -> 38" issue.
//     // We cap the *total desired points* by the *total available points*.
//     const finalPointsToUse = Math.min(totalDesiredPoints, customerTotalPoints);

//     return {
//       totalDesired: totalDesiredPoints,
//       finalPointsToUse: finalPointsToUse,
//       discountAmount: finalPointsToUse // 1 point = 1 Rupee
//     };
//   };


//   const calculateCartSubtotal = () => {
//     return cart.reduce((sum, item) => sum + (item.adjustedPrice * item.quantity), 0);
//   };

//   const onSubmit = async () => {
//     // We no longer call dispatch(deductRewardPoints) here.
//     // We just pass the *intent* to use points back to POSTableContent.
//     // POSTableContent will be responsible for the final deduction *after* payment.

//     const { finalPointsToUse, discountAmount } = calculatePointsToUse();

//     if (
//       (selectedItemIds.length === 0 && !couponDiscount.value && finalPointsToUse === 0) ||
//       (!discountValue && !couponDiscount.value && finalPointsToUse === 0)
//     ) {
//       console.warn('Invalid submission: No discount to apply');
//       // You might want to show a toast message here
//       return;
//     }
//     const adminPointsToUse = customerAdminPoints;
//     const adminDiscountAmount = adminPointsToUse;
//     const discounts = {
//       selectedItemDiscount: {
//         ids: selectedItemIds,
//         value: Number(discountValue),
//         type: discountType,
//       },
//       coupon: couponDiscount.value ? couponDiscount : null, // Pass full coupon object or null

//       // *** MODIFIED ***
//       // Pass the reward points calculation back to POSTableContent
//       rewardPoints: finalPointsToUse > 0 ? {
//         enabled: true,
//         pointsUsed: finalPointsToUse,
//         discountAmount: discountAmount, // This is the amount (1 point = ₹1)
//       } : null,

//       adminRewardPoints: adminPointsToUse > 0 ? {
//         enabled: true,
//         pointsUsed: adminPointsToUse,
//         discountAmount: adminDiscountAmount, // ₹ value for admin points
//       } : null

//       // This section is removed as it's now combined into 'rewardPoints'
//       // manualRewardPoints: null, 
//     };

//     console.log('Submitting discounts to parent:', discounts);
//     handleDiscountSubmit(discounts);

//     // Reset form
//     setSelectedItemIds([]);
//     setDiscountValue('');
//     setDiscountType('percentage');
//     setCouponCode('');
//     setCouponDiscount(0);
//     setUseRewardPoints(false);
//     setManualRewardPoints('');
//     setShowDiscountModal(false);
//   };

//   const calculatePreview = () => {
//     let totalDiscount = 0;

//     // Item-specific discounts
//     if (discountValue && selectedItemIds.length > 0) {
//       totalDiscount += selectedItemIds.reduce((total, itemId) => {
//         const item = cart.find((cartItem) => (cartItem.id || cartItem._id) === itemId);
//         if (!item) return total;
//         const itemSubtotal = item.adjustedPrice * item.quantity;
//         let itemDiscount = 0;
//         if (discountType === 'percentage') {
//           itemDiscount = (itemSubtotal * Number(discountValue)) / 100;
//         } else if (discountType === 'fixed') {
//           // Note: Fixed discount is usually per-item, not total. 
//           // Adjust this if it's a total fixed amount spread across items.
//           // Assuming 'discountValue' is per item selected:
//           // itemDiscount = Number(discountValue) * item.quantity;
//           // Assuming 'discountValue' is a total to be applied once:
//           itemDiscount = Number(discountValue);
//         }
//         return total + itemDiscount;
//       }, 0);
//     }

//     // Coupon discounts
//     if (couponDiscount && couponDiscount.amount) {
//       totalDiscount += couponDiscount.amount;
//     }

//     // Reward points discount (both manual and auto)
//     const { discountAmount } = calculatePointsToUse();
//     totalDiscount += discountAmount;

//     return totalDiscount;
//   };

//   const validCart = Array.isArray(cart) ? cart : [];
//   const hasItems = validCart.length > 0;
//   const totalRewardPointsFromCart = calculateTotalRewardPointsFromCart();

//   const { totalDesired, finalPointsToUse, discountAmount: rewardDiscountAmount } = calculatePointsToUse();
//   const manualPointsEntered = Number(manualRewardPoints) || 0;

//   return (
//     <CModal visible={showDiscountModal} onClose={() => setShowDiscountModal(false)} size="lg">
//       <CModalHeader>
//         <CModalTitle>Apply Discount / Coupon / Reward Points</CModalTitle>
//       </CModalHeader>
//       <CModalBody style={{ maxHeight: '70vh', overflowY: 'auto' }}>
//         {/* Manual Reward Points Section (Admin) */}
//         {selectedCustomer && (
//           <div className="mb-4 p-3 border rounded" style={{ backgroundColor: '#e7f3ff' }}>
//             <h6 className="fw-bold mb-3 text-dark">👤 Use Reward Points</h6>

//             <div className="row mb-3">
//               <div className="col-4">
//                 <small className="text-muted d-block mb-1">Earned Points:</small>
//                 <div className="fw-bold text-success fs-6">{customerEarnedPoints} pts</div>
//               </div>
//               {/* <div className="col-4">
//                 <small className="text-muted d-block mb-1">Admin Points:</small>
//                 <div className="fw-bold text-primary fs-6">{customerAdminPoints} pts</div>
//               </div> */}
//               <div className="col-4">
//                 <small className="text-muted d-block mb-1">Total Available:</small>
//                 <div className="fw-bold text-dark fs-5">{customerTotalPoints} pts</div>
//               </div>
//             </div>

//             <div className="mb-3">
//               <label className="form-label fw-bold">Enter Reward Points to Use:</label>
//               <CFormInput
//                 type="number"
//                 placeholder="Enter points (e.g., 50)"
//                 value={manualRewardPoints}
//                 onChange={(e) => setManualRewardPoints(e.target.value)}
//                 min="0"
//               // max={customerTotalPoints} // We won't set max, we'll just show a warning
//               />
//               <small className="text-muted">1 point = ₹1 discount</small>
//             </div>

//             {/* Automatic Reward Points Section */}
//             {totalRewardPointsFromCart > 0 && (
//               <div className="mb-3 p-3 border rounded" style={{ backgroundColor: '#fff3cd' }}>
//                 <CFormCheck
//                   type="checkbox"
//                   id="useRewardPoints"
//                   label={
//                     <span className="fw-bold">
//                       Also use {totalRewardPointsFromCart} points from items in cart?
//                     </span>
//                   }
//                   checked={useRewardPoints}
//                   onChange={(e) => setUseRewardPoints(e.target.checked)}
//                 />
//               </div>
//             )}

//             {rewardDiscountAmount > 0 && (
//               <CAlert color="success" className="mb-0">
//                 <div className="d-flex justify-content-between align-items-center">
//                   <span className="fw-bold">✅ Reward Discount Applied:</span>
//                   <span className="fw-bold fs-5">
//                     ₹{rewardDiscountAmount.toFixed(2)}
//                   </span>
//                 </div>
//                 <small className="d-block mt-1">
//                   Using {finalPointsToUse} reward points for this order.
//                 </small>
//               </CAlert>
//             )}

//             {totalDesired > customerTotalPoints && (
//               <CAlert color="danger" className="mt-2 mb-0 py-2">
//                 <small>
//                   ❌ You are trying to use {totalDesired} points, but the
//                   customer only has {customerTotalPoints} points available.
//                   The discount will be capped at ₹{customerTotalPoints.toFixed(2)}.
//                 </small>
//               </CAlert>
//             )}
//           </div>
//         )}

//         {/* No customer selected warning */}
//         {!selectedCustomer && (
//           <CAlert color="info" className="mb-4">
//             <small>
//               ℹ️ Select a customer to use reward points.
//             </small>
//           </CAlert>
//         )}

//         {/* Discount Type */}
//         <div className="mb-4">
//           <label className="form-label fw-bold mb-2">Item-Specific Discount Type:</label>
//           <div className="btn-group w-100" role="group">
//             <button
//               type="button"
//               className={`btn ${discountType === 'percentage' ? 'btn-primary' : 'btn-outline-primary'}`}
//               onClick={() => setDiscountType('percentage')}
//             >
//               Percentage (%)
//             </button>
//             <button
//               type="button"
//               className={`btn ${discountType === 'fixed' ? 'btn-primary' : 'btn-outline-primary'}`}
//               onClick={() => setDiscountType('fixed')}
//             >
//               Fixed (₹)
//             </button>
//           </div>
//         </div>

//         {/* Discount Value */}
//         <div className="mb-4">
//           <label className="form-label fw-bold">
//             {discountType === 'percentage' ? 'Item Discount %' : 'Item Discount ₹'}
//           </label>
//           <CFormInput
//             type="number"
//             placeholder={discountType === 'percentage' ? '10 (for 10%)' : '100 (for ₹100 off)'}
//             value={discountValue}
//             onChange={(e) => setDiscountValue(e.target.value)}
//           />
//         </div>

//         {/* Coupon Code */}
//         <div className="mb-4">
//           <label className="form-label fw-bold">Coupon Code</label>
//           <div className="d-flex">
//             <CFormInput
//               type="text"
//               placeholder="Enter coupon code (e.g., BQHWM70)"
//               value={couponCode}
//               onChange={(e) => setCouponCode(e.target.value)}
//             />
//             <CButton
//               color="success"
//               className="ms-2"
//               onClick={handleApplyCoupon}
//               disabled={!couponCode.trim()}
//             >
//               Apply
//             </CButton>
//           </div>
//           {couponDiscount.value ? (
//             <div className="mt-3 p-3 border rounded bg-light">
//               <div className="d-flex align-items-center mb-2">
//                 <span className="text-success me-2">✅</span>
//                 <span className="fw-bold text-success">Coupon Applied Successfully!</span>
//               </div>

//               <div className="row">
//                 <div className="col-md-6">
//                   <div className="mb-2">
//                     <strong>Code:</strong> <span className="text-primary">{couponDiscount.code}</span>
//                   </div>
//                   <div className="mb-2">
//                     <strong>Discount:</strong>
//                     <span className="text-success ms-1">
//                       {couponDiscount.type === 'percentage'
//                         ? `${couponDiscount.value}% OFF`
//                         : `₹${couponDiscount.value} OFF`}
//                     </span>
//                   </div>
//                   <div className="mb-2">
//                     <strong>Discount Amount:</strong>
//                     <span className="text-success ms-1">₹{couponDiscount.amount?.toFixed(2) || '0.00'}</span>
//                   </div>
//                 </div>

//                 <div className="col-md-6">
//                   <div className="mb-2">
//                     <strong>Min Order:</strong>
//                     <span className="text-info ms-1">₹{couponDiscount.minOrderValue || '0'}</span>
//                   </div>
//                   <div className="mb-2">
//                     <strong>Max Discount:</strong>
//                     <span className="text-warning ms-1">₹{couponDiscount.maxDiscountAmount || 'No limit'}</span>
//                   </div>
//                   <div className="mb-2">
//                     <strong>Expires:</strong>
//                     <span className="text-secondary ms-1">
//                       {couponDiscount.expiryDate ? new Date(couponDiscount.expiryDate).toLocaleDateString() : 'N/A'}
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               {couponDiscount.description && (
//                 <div className="mt-2">
//                   <strong>Description:</strong>
//                   <span className="text-muted ms-1">{couponDiscount.description}</span>
//                 </div>
//               )}
//             </div>
//           ) : couponCode ? (
//             <small className="text-danger d-block mt-2">
//               ❌ Invalid Coupon
//             </small>
//           ) : null}
//         </div>

//         {/* Select Items */}
//         <div className="border rounded p-3 mb-3">
//           <h6 className="fw-bold mb-2">Select Items for Item-Specific Discount:</h6>
//           {hasItems ? (
//             <>
//               <CButton
//                 size="sm"
//                 color="secondary"
//                 className="mb-2"
//                 onClick={selectAll}
//               >
//                 {selectedItemIds.length === validCart.length ? 'Deselect All' : 'Select All'}
//               </CButton>
//               {validCart.map((item) => {
//                 const itemRewardPoints = Number(item.rewardPoints) || 0;
//                 return (
//                   <div key={item.id} className="d-flex align-items-center border p-2 mb-2 rounded">
//                     <CFormCheck
//                       type="checkbox"
//                       checked={selectedItemIds.includes(item.id)}
//                       onChange={() => toggleSelection(item.id)}
//                       className="me-2"
//                     />
//                     <div className="flex-grow-1">
//                       <div className="d-flex justify-content-between align-items-start">
//                         <div>
//                           <div className="fw-bold">{item.itemName}</div>
//                           <small className="text-muted">
//                             Qty: {item.quantity}, Price: ₹{item.adjustedPrice}
//                           </small>
//                         </div>
//                         {itemRewardPoints > 0 && (
//                           <span className="badge bg-warning text-dark">
//                             🎁 {itemRewardPoints * item.quantity} pts
//                           </span>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })}
//             </>
//           ) : (
//             <p className="text-muted">No items in cart.</p>
//           )}
//         </div>

//         {/* Discount Preview */}
//         {(selectedItemIds.length > 0 || (couponDiscount && couponDiscount.amount > 0) || rewardDiscountAmount > 0) && (
//           <CAlert color="info" className="mb-0">
//             <div className="d-flex justify-content-between align-items-center">
//               <strong>Total Discount Preview:</strong>
//               <strong className="fs-5">₹{calculatePreview().toFixed(2)}</strong>
//             </div>
//             {rewardDiscountAmount > 0 && (
//               <div className="mt-2">
//                 <small className="text-muted">
//                   (Includes ₹{rewardDiscountAmount.toFixed(2)} from reward points)
//                 </small>
//               </div>
//             )}
//           </CAlert>
//         )}
//       </CModalBody>
//       <CModalFooter>
//         <CButton color="secondary" onClick={() => setShowDiscountModal(false)}>
//           Cancel
//         </CButton>
//         <CButton
//           color="primary"
//           onClick={onSubmit}
//           disabled={
//             customerLoading ||
//             (selectedItemIds.length === 0 && !couponDiscount.value && finalPointsToUse === 0) ||
//             (!discountValue && !couponDiscount.value && finalPointsToUse === 0)
//           }
//         >
//           {customerLoading ? 'Processing...' : 'Apply Discount'}
//         </CButton>
//       </CModalFooter>
//     </CModal>
//   );
// };

// export default DiscountModal;