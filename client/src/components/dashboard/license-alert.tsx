import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LicenseAlertProps {
  id: number;
  company: string;
  expiresIn: number;
  licenseKey: string;
  onRenew?: (id: number) => void;
}

export function LicenseAlert({
  id,
  company,
  expiresIn,
  licenseKey,
  onRenew,
}: LicenseAlertProps) {
  const [isRenewing, setIsRenewing] = useState(false);
  const [isReminding, setIsReminding] = useState(false);
  const { toast } = useToast();

  const getBorderColor = () => {
    if (expiresIn <= 2) return "border-error-500";
    if (expiresIn <= 7) return "border-warning-500";
    return "border-warning-500";
  };

  const getBgColor = () => {
    if (expiresIn <= 2) return "bg-error-50";
    if (expiresIn <= 7) return "bg-warning-50";
    return "bg-warning-50";
  };

  const handleRenew = async () => {
    setIsRenewing(true);
    try {
      // This would be an API call to renew the license
      await apiRequest("POST", `/api/licenses/${id}/renew`, {});
      
      toast({
        title: "Success",
        description: `License for ${company} has been renewed.`,
      });
      
      // Refresh licenses data
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/expiring-licenses"] });
      
      if (onRenew) {
        onRenew(id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to renew license: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsRenewing(false);
    }
  };

  const handleRemind = async () => {
    setIsReminding(true);
    try {
      // This would be an API call to send a reminder
      await apiRequest("POST", `/api/licenses/${id}/remind`, {});
      
      toast({
        title: "Success",
        description: `Reminder sent to ${company}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to send reminder: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsReminding(false);
    }
  };

  return (
    <div className={`border-l-4 ${getBorderColor()} ${getBgColor()} p-4 mb-3 rounded-r-md flex items-center justify-between`}>
      <div>
        <p className="font-medium">{company}</p>
        <div className="flex items-center text-sm text-neutral-600 mt-1">
          <Clock size={16} className="mr-1" />
          <span>Expires in {expiresIn} days</span>
          <span className="mx-2">•</span>
          <span className="font-mono text-xs bg-neutral-200 px-2 py-1 rounded">{licenseKey}</span>
        </div>
      </div>
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          className="bg-white text-primary-500 border-primary-500 hover:bg-primary-50"
          disabled={isRenewing}
          onClick={handleRenew}
          size="sm"
        >
          {isRenewing ? "Renewing..." : "Renew"}
        </Button>
        <Button
          variant="outline"
          className="bg-white text-neutral-500 border-neutral-300 hover:bg-neutral-50"
          disabled={isReminding}
          onClick={handleRemind}
          size="sm"
        >
          {isReminding ? "Sending..." : "Remind"}
        </Button>
      </div>
    </div>
  );
}
