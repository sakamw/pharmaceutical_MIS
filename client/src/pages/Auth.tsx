/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login, me } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Pill, Loader2 } from "lucide-react";
import { PasswordChangeModal } from "@/components/PasswordChangeModal";

const Auth = () => {
  const navigate = useNavigate();
  const [authenticating, setAuthenticating] = useState(false);
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);

  useEffect(() => {
    // Check if user is already logged in via JWT
    me()
      .then(() => navigate("/"))
      .catch(() => {});
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Please provide username and password");
      return;
    }

    setAuthenticating(true);
    try {
      await login(username, password);
      // Check if user needs to change password
      const userData = await me();
      if (userData.needs_password_change) {
        setShowPasswordChangeModal(true);
        setAuthenticating(false);
      } else {
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      }
    } catch (err: any) {
      setTimeout(() => {
        setAuthenticating(false);
        toast.error(err.message || "Login failed");
      }, 2000);
    }
  };

  const handlePasswordChangeSuccess = () => {
    setShowPasswordChangeModal(false);
    setTimeout(() => {
      window.location.href = "/";
    }, 1000);
  };

  if (authenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
        <div className="text-center space-y-6 animate-in fade-in duration-500">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
              <div className="relative bg-primary rounded-full p-6">
                <Pill className="h-16 w-16 text-primary-foreground animate-pulse" />
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            Authenticating Identity
          </h2>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p>Verifying your credentials...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary rounded-full p-3">
              <Pill className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">PharmaCare</CardTitle>
          <CardDescription>Pharmacy Management System</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={authenticating}>
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
      <PasswordChangeModal
        isOpen={showPasswordChangeModal}
        onClose={() => setShowPasswordChangeModal(false)}
        onSuccess={handlePasswordChangeSuccess}
      />
    </div>
  );
};
export default Auth;
