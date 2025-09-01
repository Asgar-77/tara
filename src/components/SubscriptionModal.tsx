import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createRazorpayOrder, openRazorpayGateway, verifyPayment } from '@/lib/razorpay';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionPlan {
  id: string;
  calls: number;
  minutes: number;
  price: number;
  description: string;
}

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (plan: SubscriptionPlan) => void;
}

const SubscriptionModal = ({ isOpen, onClose, onSelectPlan }: SubscriptionModalProps) => {
  const [selectedPlan, setSelectedPlan] = useState<string>('plan1');
  const [isProcessing, setIsProcessing] = useState(false);
  const { updateSubscription } = useAuth();
  const { toast } = useToast();

  const plans: SubscriptionPlan[] = [
    {
      id: 'plan1',
      calls: 1,
      minutes: 40,
      price: 249,
      description: '1 call - 40 min'
    },
    {
      id: 'plan2',
      calls: 5,
      minutes: 200,
      price: 1150,
      description: '5 calls - 200 min'
    },
    {
      id: 'plan3',
      calls: 10,
      minutes: 400,
      price: 2250,
      description: '10 calls - 400 min'
    }
  ];

  const handleContinue = async () => {
    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan) return;

    // Check if Razorpay key is configured
    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!razorpayKey) {
      toast({
        title: "Configuration Error",
        description: "Payment gateway not configured. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    // Retry mechanism for script loading
    let retryCount = 0;
    const maxRetries = 2;
    
    const attemptPayment = async (): Promise<void> => {
      try {
        console.log(`🚀 Starting payment process for plan:`, plan.description);
        
        // Create Razorpay order
        const order = await createRazorpayOrder(plan.price);
        
        // Configure Razorpay options
        const options = {
          key: razorpayKey,
          amount: order.amount,
          currency: order.currency,
          name: 'GoodMind Tara',
          description: `${plan.description} Subscription`,
          order_id: order.id,
          handler: async (response: any) => {
            console.log('💰 Payment response received');
            
            // Payment successful
            if (verifyPayment(response)) {
              try {
                console.log('✅ Payment verified, updating Firebase...');
                
                // Update Firebase subscription
                const result = await updateSubscription(plan);
                
                if (result.success) {
                  toast({
                    title: "Payment Successful! 🎉",
                    description: `Your ${plan.description} subscription has been activated.`,
                  });
                  
                  // Close modal and notify parent
                  onSelectPlan(plan);
                  onClose();
                } else {
                  toast({
                    title: "Payment Successful but Update Failed",
                    description: result.error || "Please contact support.",
                    variant: "destructive",
                  });
                }
              } catch (error) {
                console.error('❌ Subscription update failed:', error);
                toast({
                  title: "Payment Successful but Update Failed",
                  description: "Please contact support to activate your subscription.",
                  variant: "destructive",
                });
              }
            } else {
              console.error('❌ Payment verification failed');
              toast({
                title: "Payment Verification Failed",
                description: "Please contact support to verify your payment.",
                variant: "destructive",
              });
            }
          },
          prefill: {
            email: '', // You can prefill with user's email if available
          },
          theme: {
            color: '#556B2F', // Match your app's theme
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
            },
          },
        };

        console.log('🌐 Opening Razorpay gateway...');

        // Open Razorpay gateway
        await openRazorpayGateway(options);
        
        console.log('✅ Razorpay gateway opened successfully');
        
      } catch (error) {
        console.error(`❌ Payment attempt ${retryCount + 1} failed:`, error);
        
        // Check for specific error types
        let errorMessage = "Unable to initiate payment. Please try again.";
        let shouldRetry = true;
        
        if (error instanceof Error) {
          if (error.message.includes('400') || error.message.includes('Bad Request')) {
            // Check if using live keys in development
            const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
            if (keyId && keyId.startsWith('rzp_live_') && import.meta.env.DEV) {
              errorMessage = "Live keys detected in development mode. Please use test keys for development or contact support for production setup.";
              shouldRetry = false; // Don't retry with live keys in dev
            } else {
              errorMessage = "Payment configuration error. Please check your payment settings or contact support.";
            }
          } else if (error.message.includes('timeout')) {
            errorMessage = "Payment gateway is taking too long to respond. Please try again.";
          } else if (error.message.includes('CSP')) {
            errorMessage = "Security policy is blocking payment gateway. Please contact support.";
            shouldRetry = false;
          } else if (error.message.includes('network')) {
            errorMessage = "Network error while connecting to payment gateway. Please check your connection.";
          } else {
            errorMessage = error.message;
          }
        }
        
        // Retry if we haven't exceeded max retries and should retry
        if (retryCount < maxRetries && shouldRetry) {
          retryCount++;
          console.log(`🔄 Retrying payment (${retryCount}/${maxRetries})...`);
          
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          return attemptPayment();
        }
        
        // All retries failed or shouldn't retry
        toast({
          title: "Payment Failed",
          description: errorMessage,
          variant: "destructive",
        });
        
        // Show additional help for live key issues
        if (errorMessage.includes('Live keys detected')) {
          console.warn('💡 Help: Switch to test keys by updating your .env file with rzp_test_ keys');
          console.warn('💡 Or contact support to set up proper server-side order creation for live keys');
        }
      }
    };
    
    try {
      await attemptPayment();
    } catch (error) {
      console.error('❌ All payment attempts failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-[#556B2F] mb-2">Subscription</h2>
              <p className="text-[#8B7355] text-sm">1st call - 20 min Free Trial</p>
              
              {/* Live Key Warning */}
              {import.meta.env.DEV && import.meta.env.VITE_RAZORPAY_KEY_ID?.startsWith('rzp_live_') && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-amber-800">
                      <p className="font-medium mb-1">Development Mode with Live Keys</p>
                      <p className="text-xs leading-relaxed">Using live payment keys in development may cause errors. Switch to test keys for testing or deploy to production for live key functionality.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isProcessing}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="p-6 space-y-4">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`cursor-pointer transition-all duration-200 ${
                selectedPlan === plan.id
                  ? 'border-2 border-[#556B2F] bg-[#556B2F] text-white shadow-md'
                  : 'border-2 border-black bg-white text-black hover:border-gray-600'
              }`}
              onClick={() => !isProcessing && setSelectedPlan(plan.id)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className={`font-medium ${
                      selectedPlan === plan.id ? 'text-white' : 'text-black'
                    }`}>{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${
                      selectedPlan === plan.id ? 'text-white' : 'text-black'
                    }`}>₹ {plan.price}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Continue Button */}
        <div className="p-6 border-t border-gray-200">
          <Button
            onClick={handleContinue}
            disabled={isProcessing}
            className="w-full bg-[#556B2F] hover:bg-[#4A5D28] text-white py-3 text-lg font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Continue to Payment'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
