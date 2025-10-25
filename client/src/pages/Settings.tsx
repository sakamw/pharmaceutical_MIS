import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Settings as SettingsIcon, User, Building } from "lucide-react";

const Settings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account and pharmacy settings
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Profile Settings</CardTitle>
            </div>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              <CardTitle>Pharmacy Settings</CardTitle>
            </div>
            <CardDescription>Configure pharmacy information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pharmacy_name">Pharmacy Name</Label>
              <Input id="pharmacy_name" placeholder="PharmaCare Pharmacy" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" placeholder="123 Main Street" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" value="USD ($)" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                <Input id="tax_rate" type="number" placeholder="0" />
              </div>
            </div>
            <Button>Save Settings</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-primary" />
              <CardTitle>System Settings</CardTitle>
            </div>
            <CardDescription>
              Additional system configurations coming soon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Advanced settings including user roles management, backup
              configuration, and system preferences will be available in future
              updates.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
