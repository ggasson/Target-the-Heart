import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Users } from "lucide-react";

export default function Landing() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    // Add a small delay to show the loading state before redirect
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 200);
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center text-center px-6">
      <div className="glass-effect rounded-3xl p-8 max-w-sm w-full">
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
        
        <div className="space-y-4">
          <Button 
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-white text-primary font-semibold py-4 rounded-xl hover:bg-white/90 transition-all duration-200 text-lg h-auto flex items-center justify-center gap-2"
            data-testid="button-login"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing you in...
              </>
            ) : (
              <>
                <Users className="w-5 h-5" />
                Join the Community
              </>
            )}
          </Button>
        </div>
        
        <p className="text-white/60 text-sm mt-6">
          Sign in or create your account to get started
        </p>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-xs text-white/60">Powered By Jesus</p>
      </div>
    </div>
  );
}
