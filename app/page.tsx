import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex w-full max-w-sm items-center gap-2">
        <Input type="string" placeholder="Enter here" />
        <Button type="submit" variant="default">
          Proceed
        </Button>
      </div>
    </div>
  );
}
