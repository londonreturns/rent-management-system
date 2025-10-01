import { IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

export default function People() {
  return (
    <div className="flex justify-end mr-4 mt-4">
      <Button variant="secondary" size="sm">
        <IconPlus className="mr-2" />
        Add Person
      </Button>
    </div>
  );
}
