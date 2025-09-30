"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle } from "lucide-react";

export default function Home() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"success" | "error" | null>(null);

  const handleCheck = () => {
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;

    if (input === apiKey) {
      setStatus("success");
    } else {
      setStatus("error");
    }

    // Optional: Auto-hide after 3 seconds
    setTimeout(() => {
      setStatus(null);
    }, 3000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
      {/* ALERT POSITIONED TOP CENTER */}
      {status && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm">
          {status === "success" ? (
            <Alert variant="default" className="border-green-500">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>✅ API Key matched!</AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>❌ Invalid API Key</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* FORM INPUT + BUTTON */}
      <div className="flex w-full max-w-sm items-center gap-2">
        <Input
          type="text"
          placeholder="Enter here"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button type="button" onClick={handleCheck}>
          Proceed
        </Button>
      </div>
    </div>
  );
}
