import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, Mail } from "lucide-react";
import { signInWithGoogle, signUpWithEmail, signInWithEmail, resetPassword } from "@/lib/firebase";

export default function Landing() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  
  // Form state
  const [signInData, setSignInData] = useState({
    email: "",
    password: ""
  });
  
  const [signUpData, setSignUpData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  
  const [resetEmail, setResetEmail] = useState("");

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      await signInWithGoogle();
      // Auth state listener will handle the navigation automatically
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.message || "Failed to sign in with Google. Please try again.");
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const user = await signInWithEmail(signInData.email, signInData.password);
      
      if (!user.emailVerified) {
        setError("Please verify your email address before signing in. Check your inbox for a verification link.");
        setIsLoading(false);
        return;
      }
      
      // Auth state listener will handle the navigation automatically
    } catch (error: any) {
      console.error("Email sign in error:", error);
      let errorMessage = "Failed to sign in. Please check your credentials.";
      
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later.";
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    
    // Validation
    if (signUpData.password !== signUpData.confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }
    
    if (signUpData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setIsLoading(false);
      return;
    }
    
    try {
      const result = await signUpWithEmail(
        signUpData.email, 
        signUpData.password, 
        signUpData.firstName, 
        signUpData.lastName
      );
      
      if (result.emailSent) {
        setSuccess("Account created! Please check your email to verify your account before signing in.");
        setSignUpData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          confirmPassword: ""
        });
      }
    } catch (error: any) {
      console.error("Email sign up error:", error);
      let errorMessage = "Failed to create account. Please try again.";
      
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "An account already exists with this email address.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak. Please choose a stronger password.";
      }
      
      setError(errorMessage);
    }
    setIsLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    
    try {
      await resetPassword(resetEmail);
      setSuccess("Password reset email sent! Check your inbox for instructions.");
      setResetEmail("");
      setShowResetForm(false);
    } catch (error: any) {
      console.error("Password reset error:", error);
      let errorMessage = "Failed to send reset email. Please try again.";
      
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      }
      
      setError(errorMessage);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center text-center px-6">
      <div className="glass-effect rounded-3xl p-8 max-w-md w-full">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-lg overflow-hidden bg-black">
            <img 
              src="/target-the-heart-logo.png" 
              alt="Target The Heart Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Target The Heart</h1>
          <p className="text-white/80 text-lg">Unite in faith, pray in community</p>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <Alert className="mb-4 bg-red-500/20 border-red-500 text-white">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4 bg-green-500/20 border-green-500 text-white">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {showResetForm ? (
          /* Password Reset Form */
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <Label htmlFor="reset-email" className="text-white text-left block mb-2">
                Email Address
              </Label>
              <Input
                id="reset-email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                data-testid="input-reset-email"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isLoading || !resetEmail}
                className="flex-1 bg-white text-primary font-semibold py-3 rounded-xl hover:bg-white/90"
                data-testid="button-send-reset"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Reset Email
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowResetForm(false)}
                className="px-4 bg-transparent border-white/20 text-white hover:bg-white/10"
                data-testid="button-cancel-reset"
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          /* Main Authentication Tabs */
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/10 mb-6">
              <TabsTrigger value="signin" className="text-white data-[state=active]:bg-white data-[state=active]:text-primary">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="text-white data-[state=active]:bg-white data-[state=active]:text-primary">
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="signin-email" className="text-white text-left block mb-2">
                    Email Address
                  </Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={signInData.email}
                    onChange={(e) => setSignInData({...signInData, email: e.target.value})}
                    placeholder="Enter your email"
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                    data-testid="input-signin-email"
                  />
                </div>
                
                <div>
                  <Label htmlFor="signin-password" className="text-white text-left block mb-2">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      value={signInData.password}
                      onChange={(e) => setSignInData({...signInData, password: e.target.value})}
                      placeholder="Enter your password"
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60 pr-10"
                      data-testid="input-signin-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
                      onClick={() => setShowPassword(!showPassword)}
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !signInData.email || !signInData.password}
                  className="w-full bg-white text-primary font-semibold py-3 rounded-xl hover:bg-white/90"
                  data-testid="button-signin-email"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Signing In...
                    </>
                  ) : (
                    "Sign In with Email"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-white/80 hover:text-white hover:bg-white/10"
                  onClick={() => setShowResetForm(true)}
                  data-testid="button-forgot-password"
                >
                  Forgot your password?
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="signup-firstname" className="text-white text-left block mb-2">
                      First Name
                    </Label>
                    <Input
                      id="signup-firstname"
                      type="text"
                      value={signUpData.firstName}
                      onChange={(e) => setSignUpData({...signUpData, firstName: e.target.value})}
                      placeholder="First name"
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                      data-testid="input-signup-firstname"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-lastname" className="text-white text-left block mb-2">
                      Last Name
                    </Label>
                    <Input
                      id="signup-lastname"
                      type="text"
                      value={signUpData.lastName}
                      onChange={(e) => setSignUpData({...signUpData, lastName: e.target.value})}
                      placeholder="Last name"
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                      data-testid="input-signup-lastname"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="signup-email" className="text-white text-left block mb-2">
                    Email Address
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({...signUpData, email: e.target.value})}
                    placeholder="Enter your email"
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                    data-testid="input-signup-email"
                  />
                </div>
                
                <div>
                  <Label htmlFor="signup-password" className="text-white text-left block mb-2">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({...signUpData, password: e.target.value})}
                      placeholder="Create a password (min 6 characters)"
                      required
                      minLength={6}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60 pr-10"
                      data-testid="input-signup-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
                      onClick={() => setShowPassword(!showPassword)}
                      data-testid="button-toggle-signup-password"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="signup-confirm-password" className="text-white text-left block mb-2">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={signUpData.confirmPassword}
                      onChange={(e) => setSignUpData({...signUpData, confirmPassword: e.target.value})}
                      placeholder="Confirm your password"
                      required
                      minLength={6}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60 pr-10"
                      data-testid="input-signup-confirm-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      data-testid="button-toggle-confirm-password"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !signUpData.email || !signUpData.password || !signUpData.firstName || !signUpData.lastName}
                  className="w-full bg-white text-primary font-semibold py-3 rounded-xl hover:bg-white/90"
                  data-testid="button-signup-email"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* OR Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-white/60">Or continue with</span>
              </div>
            </div>

            {/* Google Sign In Button */}
            <Button 
              onClick={handleGoogleLogin}
              disabled={isLoading}
              variant="outline"
              className="w-full bg-transparent border-white/20 text-white font-semibold py-3 rounded-xl hover:bg-white/10 transition-all duration-200 flex items-center justify-center gap-2"
              data-testid="button-google-login"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing you in...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>
          </Tabs>
        )}

        <p className="text-white/60 text-sm mt-6">
          {showResetForm ? "Remember your password?" : "New to Target The Heart? Create an account above."}
        </p>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-xs text-white/60">Powered By Jesus</p>
      </div>
    </div>
  );
}
