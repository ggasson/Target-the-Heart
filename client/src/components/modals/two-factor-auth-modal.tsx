import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Shield, Smartphone, Key, Copy, Check, AlertTriangle } from "lucide-react";

interface TwoFactorAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TwoFactorAuthData {
  id: string;
  userId: string;
  secret: string;
  backupCodes: string[];
  isEnabled: boolean;
  lastUsed?: string;
}

export default function TwoFactorAuthModal({ open, onOpenChange }: TwoFactorAuthModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState<boolean[]>([]);

  // Load current 2FA status
  const { data: current2FA, isLoading } = useQuery<TwoFactorAuthData>({
    queryKey: ["/api/user/2fa"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user/2fa');
      return response as unknown as TwoFactorAuthData;
    },
    enabled: open,
  });

  // Setup 2FA mutation
  const setup2FAMutation = useMutation({
    mutationFn: async () => {
      // Generate QR code and secret (this would typically be done server-side)
      const mockSecret = generateSecret();
      const mockQrCode = `otpauth://totp/TargetTheHeart:${user?.email}?secret=${mockSecret}&issuer=TargetTheHeart`;
      
      return {
        secret: mockSecret,
        qrCode: mockQrCode,
        backupCodes: generateBackupCodes(),
      };
    },
    onSuccess: (data) => {
      setSecret(data.secret);
      setQrCode(data.qrCode);
      setBackupCodes(data.backupCodes);
      setStep('verify');
    },
    onError: (error: Error) => {
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to setup 2FA",
        variant: "destructive",
      });
    },
  });

  // Verify and enable 2FA mutation
  const verify2FAMutation = useMutation({
    mutationFn: async (data: { secret: string; verificationCode: string; backupCodes: string[] }) => {
      return apiRequest('POST', '/api/user/2fa/setup', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/2fa"] });
      setStep('backup');
      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been successfully enabled.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code",
        variant: "destructive",
      });
    },
  });

  // Disable 2FA mutation
  const disable2FAMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', '/api/user/2fa');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/2fa"] });
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Disable Failed",
        description: error.message || "Failed to disable 2FA",
        variant: "destructive",
      });
    },
  });

  const generateSecret = () => {
    // This is a simplified version - in production, use a proper TOTP library
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const generateBackupCodes = () => {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  };

  const handleSetup = () => {
    setup2FAMutation.mutate();
  };

  const handleVerify = () => {
    if (!verificationCode.trim()) {
      toast({
        title: "Missing Code",
        description: "Please enter the verification code from your authenticator app.",
        variant: "destructive",
      });
      return;
    }

    verify2FAMutation.mutate({
      secret,
      verificationCode: verificationCode.trim(),
      backupCodes,
    });
  };

  const handleDisable = () => {
    disable2FAMutation.mutate();
  };

  const copyToClipboard = async (text: string, index?: number) => {
    try {
      await navigator.clipboard.writeText(text);
      if (index !== undefined) {
        setCopiedCodes(prev => {
          const newCodes = [...prev];
          newCodes[index] = true;
          return newCodes;
        });
        setTimeout(() => {
          setCopiedCodes(prev => {
            const newCodes = [...prev];
            newCodes[index] = false;
            return newCodes;
          });
        }, 2000);
      }
      toast({
        title: "Copied",
        description: "Copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const resetModal = () => {
    setStep('setup');
    setQrCode('');
    setSecret('');
    setVerificationCode('');
    setBackupCodes([]);
    setCopiedCodes([]);
  };

  useEffect(() => {
    if (!open) {
      resetModal();
    }
  }, [open]);

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Loading 2FA Settings...</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Two-Factor Authentication</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {current2FA?.isEnabled ? (
            // 2FA is already enabled
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>2FA Enabled</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Two-factor authentication is currently enabled for your account.
                </p>
                
                {current2FA.lastUsed && (
                  <div>
                    <Label>Last Used</Label>
                    <p className="text-sm">{new Date(current2FA.lastUsed).toLocaleString()}</p>
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <Label>Backup Codes</Label>
                  <p className="text-sm text-muted-foreground">
                    You have backup codes available. Keep them safe in case you lose access to your authenticator app.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStep('backup')}
                  >
                    View Backup Codes
                  </Button>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button
                    variant="destructive"
                    onClick={handleDisable}
                    disabled={disable2FAMutation.isPending}
                  >
                    {disable2FAMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Disabling...
                      </>
                    ) : (
                      "Disable 2FA"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            // 2FA setup flow
            <>
              {step === 'setup' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Smartphone className="w-5 h-5" />
                      <span>Setup 2FA</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Two-factor authentication adds an extra layer of security to your account. 
                      You'll need an authenticator app like Google Authenticator or Authy.
                    </p>

                    <div className="space-y-3">
                      <h4 className="font-medium">Steps to setup:</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                        <li>Install an authenticator app on your phone</li>
                        <li>Scan the QR code or enter the secret key</li>
                        <li>Enter the verification code from your app</li>
                        <li>Save your backup codes in a safe place</li>
                      </ol>
                    </div>

                    <Button
                      onClick={handleSetup}
                      disabled={setup2FAMutation.isPending}
                      className="w-full"
                    >
                      {setup2FAMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-2" />
                          Start Setup
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {step === 'verify' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Key className="w-5 h-5" />
                      <span>Verify Setup</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="bg-white p-4 rounded-lg border inline-block">
                        <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                          <span className="text-sm text-muted-foreground">QR Code would appear here</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Scan this QR code with your authenticator app
                      </p>
                    </div>

                    <Separator />

                    <div>
                      <Label>Or enter this secret key manually:</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input
                          value={secret}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(secret)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="verification-code">Enter verification code</Label>
                      <Input
                        id="verification-code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="123456"
                        className="mt-1 font-mono text-center text-lg"
                        maxLength={6}
                      />
                    </div>

                    <Button
                      onClick={handleVerify}
                      disabled={verify2FAMutation.isPending || !verificationCode.trim()}
                      className="w-full"
                    >
                      {verify2FAMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Verifying...
                        </>
                      ) : (
                        "Verify & Enable 2FA"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {step === 'backup' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Key className="w-5 h-5" />
                      <span>Backup Codes</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-yellow-800">Important!</h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            Save these backup codes in a safe place. Each code can only be used once.
                            If you lose access to your authenticator app, these codes will help you regain access.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {backupCodes.map((code, index) => (
                        <div key={index} className="flex items-center space-x-2 p-2 bg-muted rounded">
                          <span className="font-mono text-sm flex-1">{code}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(code, index)}
                          >
                            {copiedCodes[index] ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={() => onOpenChange(false)}
                      className="w-full"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Done
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
