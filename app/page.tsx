"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle } from "lucide-react";

export default function Home() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"success" | "error" | null>(null);
  const router = useRouter();

  const handleCheck = (
    e?: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    if (e) e.preventDefault(); // Prevent form from reloading the page

    const apiKey = process.env.NEXT_PUBLIC_API_KEY;

    if (input === apiKey) {
      setStatus("success");

      setTimeout(() => {
        router.push("/home");
      }, 1000);
    } else {
      setStatus("error");

      setTimeout(() => {
        setStatus(null);
      }, 3000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
      {/* Top Center Alert */}
      {status && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm">
          {status === "success" ? (
            <Alert variant="default" className="border-green-500">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                ✅ PIN matched! Redirecting...
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>❌ Invalid PIN</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Form Input + Button */}
      <form
        onSubmit={handleCheck}
        className="flex w-full max-w-sm items-center gap-2"
      >
        <Input
          type="text"
          placeholder="Enter here"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button type="submit">Proceed</Button>
      </form>
    </div>
  );
}
