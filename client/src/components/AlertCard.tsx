import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { LucideIcon } from "lucide-react";

interface AlertCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  variant?: "default" | "destructive";
}

export function AlertCard({
  title,
  description,
  icon: Icon,
  variant = "default",
}: AlertCardProps) {
  return (
    <Alert variant={variant} className="transition-all hover:shadow-md">
      <Icon className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}
