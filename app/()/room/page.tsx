"use client";

import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Room() {
  const [open, setOpen] = useState(false);
  const [readableId, setReadableId] = useState("");
  const [rent, setRent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readable_id: Number(readableId), rent: Number(rent) }),
      });
      if (!res.ok) throw new Error("Failed to create room");
      setOpen(false);
      setReadableId("");
      setRent("");
      // Optionally refresh data list here
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex justify-end mr-4 mt-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="secondary" size="sm">
            <IconPlus className="mr-2" />
            Add Room
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Room</DialogTitle>
            <DialogDescription>Fill the details to create a room.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-2">
            <div className="grid gap-2">
              <label htmlFor="readable_id" className="text-sm font-medium">
                Readable ID
              </label>
              <input
                id="readable_id"
                type="number"
                min={1}
                value={readableId}
                onChange={(e) => setReadableId(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                placeholder="e.g. 101"
                required
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="rent" className="text-sm font-medium">
                Rent
              </label>
              <input
                id="rent"
                type="number"
                min={0}
                value={rent}
                onChange={(e) => setRent(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                placeholder="e.g. 1200"
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
