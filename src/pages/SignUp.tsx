import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, User, Phone, Calendar as CalendarIcon2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const SignUp = () => {
  const [formData, setFormData] = useState({
    display_name: "",
    email: "",
    phone_number: "",
    gender: "",
    age: "",
    password: "",
    confirm_password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhoneChange = (value: string) => {
    // Only allow 10 digits
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length <= 10) {
      setFormData(prev => ({
        ...prev,
        phone_number: numericValue
      }));
    }
  };

  const handleGenderSelect = (gender: string) => {
    setFormData(prev => ({
      ...prev,
      gender
    }));
  };

  const validateForm = () => {
    if (!formData.display_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your name",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.phone_number || formData.phone_number.length !== 10) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.gender) {
      toast({
        title: "Validation Error",
        description: "Please select your gender",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.age || !/^\d{2}\/\d{2}\/\d{4}$/.test(formData.age)) {
      toast({
        title: "Validation Error",
        description: "Please enter your date of birth in DD/MM/YYYY format (e.g., 15/09/1990)",
        variant: "destructive"
      });
      return false;
    }

    // Validate date format and reasonable range
    const [day, month, year] = formData.age.split('/').map(Number);
    const inputDate = new Date(year, month - 1, day);
    const currentDate = new Date();
    const minDate = new Date(1900, 0, 1);
    
    if (inputDate > currentDate || inputDate < minDate || month < 1 || month > 12 || day < 1 || day > 31) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid date of birth between 1900 and today",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.password || formData.password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return false;
    }

    if (formData.password !== formData.confirm_password) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const result = await signup(formData);
      
      if (result.success) {
        toast({
          title: "Account Created Successfully",
          description: "Welcome to GoodMind Tara!",
          variant: "default"
        });
        navigate("/");
      } else {
        toast({
          title: "Signup Failed",
          description: result.error || "Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Signup Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white text-gray-900 border border-gray-200 shadow">
        <CardHeader className="space-y-1 text-center">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">GoodMind Tara</h1>
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f7f4f2' }}>
              <img
                src="/logo-removebg-preview.png"
                alt="Brain Logo"
                className="w-14 h-14 object-contain"
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Create Account
          </CardTitle>
          <CardDescription className="text-gray-600">
            Sign up to start your voice journey with Tara
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="display_name" className="text-gray-700">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="display_name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.display_name}
                  onChange={(e) => handleInputChange('display_name', e.target.value)}
                  className="pl-10 bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="pl-10 bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="phone_number" className="text-gray-700">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone_number"
                  type="tel"
                  placeholder="Enter 10-digit phone number"
                  value={formData.phone_number}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="pl-10 bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                  maxLength={10}
                  required
                />
              </div>
            </div>

            {/* Gender Field */}
            <div className="space-y-2">
              <Label className="text-gray-700">Gender</Label>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => handleGenderSelect('Male')}
                  className={cn(
                    "flex-1 py-3 px-4 rounded-lg border-2 transition-all duration-200 font-medium",
                    formData.gender === 'Male'
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                  )}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => handleGenderSelect('Female')}
                  className={cn(
                    "flex-1 py-3 px-4 rounded-lg border-2 transition-all duration-200 font-medium",
                    formData.gender === 'Female'
                      ? "border-pink-500 bg-pink-50 text-pink-700"
                      : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                  )}
                >
                  Female
                </button>
              </div>
            </div>

            {/* Age/Date of Birth Field */}
            <div className="space-y-2">
              <Label className="text-gray-700">Date of Birth</Label>
              <div className="relative">
                <CalendarIcon2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="DD/MM/YYYY (e.g., 15/09/1990)"
                  value={formData.age}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Remove all non-digits
                    const digitsOnly = value.replace(/\D/g, '');
                    
                    // Format as DD/MM/YYYY
                    let formattedValue = '';
                    if (digitsOnly.length >= 1) {
                      formattedValue = digitsOnly.substring(0, 1);
                    }
                    if (digitsOnly.length >= 2) {
                      formattedValue = digitsOnly.substring(0, 2) + '/';
                    }
                    if (digitsOnly.length >= 3) {
                      formattedValue = digitsOnly.substring(0, 2) + '/' + digitsOnly.substring(2, 3);
                    }
                    if (digitsOnly.length >= 4) {
                      formattedValue = digitsOnly.substring(0, 2) + '/' + digitsOnly.substring(2, 4) + '/';
                    }
                    if (digitsOnly.length >= 5) {
                      formattedValue = digitsOnly.substring(0, 2) + '/' + digitsOnly.substring(2, 4) + '/' + digitsOnly.substring(4, 8);
                    }
                    
                    // Limit to 8 digits (DDMMYYYY)
                    if (digitsOnly.length <= 8) {
                      setFormData(prev => ({
                        ...prev,
                        age: formattedValue
                      }));
                    }
                  }}
                  className="pl-10 bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                  maxLength={10}
                  required
                />
              </div>
              <p className="text-xs text-gray-500">Enter your date of birth in DD/MM/YYYY format</p>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="pl-10 pr-10 bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirm_password" className="text-gray-700">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirm_password}
                  onChange={(e) => handleInputChange('confirm_password', e.target.value)}
                  className="pl-10 pr-10 bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>

            {/* Sign In Link */}
            <div className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Sign In
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUp;
