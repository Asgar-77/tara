// Razorpay configuration and utilities
declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: any) => void;
  prefill: {
    email?: string;
    contact?: string;
    method?: string;
  };
  theme: {
    color: string;
    hide_topbar?: boolean;
  };
  modal?: {
    ondismiss?: () => void;
  };
  notes?: {
    source?: string;
    environment?: string;
  };
}

// Load Razorpay script dynamically
const loadRazorpayScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.Razorpay) {
      resolve();
      return;
    }

    // Check if script tag already exists
    const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (existingScript) {
      // Wait for existing script to load with timeout
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait
      
      const checkRazorpay = () => {
        attempts++;
        if (window.Razorpay) {
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error('Razorpay script load timeout - existing script'));
        } else {
          setTimeout(checkRazorpay, 100);
        }
      };
      checkRazorpay();
      return;
    }

    // Create and load new script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    
    // Add timeout for script loading
    const timeout = setTimeout(() => {
      reject(new Error('Razorpay script load timeout - new script'));
    }, 10000); // 10 second timeout
    
    script.onload = () => {
      clearTimeout(timeout);
      console.log('✅ Razorpay script loaded successfully');
      
      // Wait a bit more for Razorpay to be fully initialized
      let attempts = 0;
      const maxAttempts = 20; // 2 seconds max wait
      
      const checkRazorpay = () => {
        attempts++;
        if (window.Razorpay) {
          console.log('✅ Razorpay initialized successfully');
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error('Razorpay failed to initialize after script load'));
        } else {
          setTimeout(checkRazorpay, 100);
        }
      };
      checkRazorpay();
    };
    
    script.onerror = () => {
      clearTimeout(timeout);
      console.error('❌ Failed to load Razorpay script');
      reject(new Error('Failed to load Razorpay script - network error'));
    };
    
    // Add error event listener as backup
    script.addEventListener('error', () => {
      clearTimeout(timeout);
      console.error('❌ Razorpay script error event triggered');
      reject(new Error('Razorpay script error event'));
    });
    
    console.log('🌐 Loading Razorpay script from:', script.src);
    document.head.appendChild(script);
  });
};

export const createRazorpayOrder = async (amount: number, currency: string = 'INR') => {
  // Validate environment variables
  const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
  if (!keyId) {
    throw new Error('Razorpay Key ID not found. Please check your environment variables.');
  }

  // Check if using live key in development
  if (import.meta.env.DEV && keyId.startsWith('rzp_live_')) {
    console.warn('⚠️ Warning: Using LIVE Razorpay key in development. Consider using TEST keys for development.');
  }

  // For client-side, we'll create a simple order ID
  // In production, this should come from your backend
  const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: orderId,
    amount: amount * 100, // Razorpay expects amount in paise
    currency: currency
  };
};

export const openRazorpayGateway = async (options: RazorpayOptions) => {
  try {
    // Ensure Razorpay script is loaded
    await loadRazorpayScript();
    
    if (window.Razorpay) {
      // Add additional configuration for better compatibility
      const enhancedOptions = {
        ...options,
        // Add these options for better compatibility
        modal: {
          ...options.modal,
          ondismiss: () => {
            if (options.modal?.ondismiss) {
              options.modal.ondismiss();
            }
          },
        },
        // Add prefill with better defaults
        prefill: {
          ...options.prefill,
          method: 'card', // Default to card payment
        },
        // Add notes for better tracking
        notes: {
          source: 'GoodMind Tara Web App',
          environment: import.meta.env.DEV ? 'development' : 'production'
        },
        // Add theme customization
        theme: {
          ...options.theme,
          hide_topbar: false,
        }
      };
      
      const razorpay = new window.Razorpay(enhancedOptions);
      
      // Add error handling for the payment gateway
      razorpay.on('payment.failed', (response: any) => {
        console.error('❌ Payment failed:', response);
      });
      
      razorpay.on('payment.success', (response: any) => {
        console.log('✅ Payment success event:', response);
      });
      
      razorpay.on('payment.cancel', () => {
        console.log('🚫 Payment cancelled by user');
      });
      
      razorpay.open();
    } else {
      throw new Error('Razorpay not available after script load');
    }
  } catch (error) {
    console.error('Failed to load or initialize Razorpay:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Unable to load payment gateway. Please refresh the page and try again.';
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = 'Payment gateway is taking too long to load. Please check your internet connection and try again.';
      } else if (error.message.includes('CSP')) {
        errorMessage = 'Security policy is blocking payment gateway. Please contact support.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error while loading payment gateway. Please check your connection and try again.';
      }
    }
    
    throw new Error(errorMessage);
  }
};

export const verifyPayment = (response: any) => {
  // Basic client-side verification
  // In production, this should be verified server-side
  return response.razorpay_payment_id && response.razorpay_order_id;
};
