"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function PaymentVerifier() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectStatus = searchParams.get("redirect_status");
  const [isVerifying, setIsVerifying] = React.useState(false);

  React.useEffect(() => {
    if (redirectStatus === "succeeded") {
      setIsVerifying(true);
      
      // Wait for the webhook to complete processing
      const timer = setTimeout(() => {
        // Strip the query parameters from the URL
        const currentUrl = new URL(window.location.href);
        currentUrl.search = "";
        window.history.replaceState({}, "", currentUrl.toString());
        
        // Refresh the Server Component to fetch the new balance
        router.refresh();
        setIsVerifying(false);
      }, 3000); // Poll/Wait for 3 seconds

      return () => clearTimeout(timer);
    }
  }, [redirectStatus, router]);

  if (!isVerifying) return null;

  return (
    <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
      <Loader2 className="h-4 w-4 animate-spin" />
      Verifying your payment with the bank...
    </div>
  );
}
