import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center text-center px-6">
      <div className="glass-effect rounded-3xl p-8 max-w-sm w-full">
        <div className="mb-8">
          <i className="fas fa-praying-hands text-6xl text-white mb-4 block"></i>
          <h1 className="text-3xl font-bold text-white mb-2">Pray Connect</h1>
          <p className="text-white/80 text-lg">Unite in faith, pray in community</p>
        </div>
        
        <div className="space-y-4">
          <Button 
            onClick={() => window.location.href = "/api/login"}
            className="w-full bg-white text-primary font-semibold py-4 rounded-xl hover:bg-white/90 transition-all duration-200 text-lg h-auto"
            data-testid="button-signin"
          >
            Sign In
          </Button>
          <Button 
            onClick={() => window.location.href = "/api/login"}
            variant="outline"
            className="w-full bg-transparent border-2 border-white text-white font-semibold py-4 rounded-xl hover:bg-white/10 transition-all duration-200 text-lg h-auto"
            data-testid="button-create-account"
          >
            Create Account
          </Button>
        </div>
        
        <p className="text-white/60 text-sm mt-6">Join prayer groups in your community</p>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-xs text-white/60">Powered By Jesus</p>
      </div>
    </div>
  );
}
