"use client";

import { IconPlus } from "@tabler/icons-react";
import { useEffect, useState } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertDialogCancel } from "@/components/ui/alert-dialog";

// TypeScript interface for a Room
interface Room {
  _id: string;
  readable_id: number;
  rent: number;
  water_price: number;
}

export default function Room() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [readableId, setReadableId] = useState("");
  const [rent, setRent] = useState("");
  const [waterPrice, setWaterPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertDescription, setAlertDescription] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [roomPendingDelete, setRoomPendingDelete] = useState<Room | null>(null);

  // 🔁 Fetch all rooms
  async function fetchRooms() {
    try {
      setLoadingRooms(true);
      const res = await fetch("/api/room");
      if (!res.ok) throw new Error("Failed to fetch rooms");
      const json = await res.json();
      setRooms(json.data || []);
    } catch (err) {
      console.error("Error fetching rooms:", err);
    } finally {
      setLoadingRooms(false);
    }
  }

  // 🔁 Load rooms on mount
  useEffect(() => {
    fetchRooms();
  }, []);

  // ➕ Submit form
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isEditing = editingId !== null;
      const res = await fetch("/api/room", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          readable_id: Number(readableId),
          rent: Number(rent),
          water_price: Number(waterPrice),
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        const message =
          errorBody?.message || `Failed to create room (HTTP ${res.status})`;
        throw new Error(message);
      }

      const data = await res.json().catch(() => ({}));
      setAlertTitle(isEditing ? "Room updated" : "Room added");
      setAlertDescription(
        data?.message || `Room ${readableId} ${isEditing ? "updated" : "created"} successfully.`
      );
      setAlertOpen(true);
      setOpen(false);
      setReadableId("");
      setRent("");
      setWaterPrice("");
      setEditingId(null);

      // 🔁 Refresh room list after successful POST
      fetchRooms();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setAlertTitle("Error adding room");
      setAlertDescription(message);
      setAlertOpen(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4">
      {/* Add Room Button */}
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" size="sm">
              <IconPlus className="mr-2" />
              Add Room
            </Button>
          </DialogTrigger>
           <DialogContent>
            <DialogHeader>
               <DialogTitle>{editingId !== null ? "Edit Room" : "Add Room"}</DialogTitle>
              <DialogDescription>
                 {editingId !== null ? "Update room details." : "Fill the details to create a room."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-2">
              <div className="grid gap-2">
                <label htmlFor="readable_id" className="text-sm font-medium">
                  Room Id
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
              <div className="grid gap-2">
                <label htmlFor="water_price" className="text-sm font-medium">
                  Water Price
                </label>
                <input
                  id="water_price"
                  type="number"
                  min={0}
                  value={waterPrice}
                  onChange={(e) => setWaterPrice(e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  placeholder="e.g. 200"
                  required
                />
              </div>
              <DialogFooter>
               <Button type="submit" disabled={submitting}>
                 {submitting ? "Saving..." : editingId !== null ? "Update" : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alert Dialog */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertTitle}</AlertDialogTitle>
            <AlertDialogDescription>{alertDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertOpen(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Room List */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Current Rooms</h2>
        {loadingRooms ? (
          <p>Loading rooms...</p>
        ) : rooms.length === 0 ? (
          <p>No rooms available.</p>
        ) : (
           <ul className="grid gap-2">
            {rooms.map((room) => (
              <li
                key={room._id}
                 className="border rounded-md p-3 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">Room #{room.readable_id}</p>
                  <p className="text-sm text-muted-foreground">
                    Rent: ${room.rent} • Water: ${room.water_price}
                  </p>
                </div>
                 <div className="flex items-center gap-2">
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => {
                       setReadableId(String(room.readable_id));
                       setRent(String(room.rent));
                       setWaterPrice(String(room.water_price ?? ""));
                       setEditingId(room.readable_id);
                       setOpen(true);
                     }}
                   >
                     Edit
                   </Button>
                   <Button
                     variant="destructive"
                     size="sm"
                     onClick={() => {
                       setRoomPendingDelete(room);
                       setConfirmOpen(true);
                     }}
                   >
                     Delete
                   </Button>
                 </div>
               </li>
            ))}
          </ul>
        )}
      </div>

      {/* Confirm Delete Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete room?</AlertDialogTitle>
            <AlertDialogDescription>
              {roomPendingDelete
                ? `This will permanently delete room #${roomPendingDelete.readable_id}.`
                : "This will permanently delete this room."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!roomPendingDelete) return;
                try {
                  const res = await fetch("/api/room", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ readable_id: roomPendingDelete.readable_id }),
                  });
                  if (!res.ok) {
                    const errorBody = await res.json().catch(() => ({}));
                    const message = errorBody?.message || `Failed to delete (HTTP ${res.status})`;
                    throw new Error(message);
                  }
                  setAlertTitle("Room deleted");
                  setAlertDescription(`Room ${roomPendingDelete.readable_id} deleted.`);
                  setAlertOpen(true);
                  setConfirmOpen(false);
                  setRoomPendingDelete(null);
                  fetchRooms();
                } catch (err) {
                  const message = err instanceof Error ? err.message : "Unknown error";
                  setAlertTitle("Error deleting room");
                  setAlertDescription(message);
                  setAlertOpen(true);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
