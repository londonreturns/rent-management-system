"use client";

import { IconPlus } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import NepaliDatePicker from "@/components/NepaliDatePicker";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import "../../globals.css";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface Person {
  _id: string;
  name: string;
  number_of_people: number;
  phone: string;
  email: string;
  room_readable_id?: number | null;
  created_at_bikram_sambat?: string;
  createdBSInEnglish?: string;
  createdADInEnglish?: string;
  deadlineBSInEnglish?: string;
  deadlineADInEnglish?: string;
}

interface RoomLite {
  _id: string;
  readable_id: number;
}

export default function People() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [count, setCount] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertDescription, setAlertDescription] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Person | null>(null);
  const [roomList, setRoomList] = useState<RoomLite[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [roomPopoverOpen, setRoomPopoverOpen] = useState(false);
  const [createdAt, setCreatedAt] = useState<string>("");

  async function fetchPeople() {
    try {
      setLoading(true);
      const res = await fetch("/api/people");
      if (!res.ok) throw new Error("Failed to fetch people");
      const json = await res.json();
      setPeople(json.data || []);
    } catch (err) {
      console.error("Error fetching people:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAvailableRooms(currentRoomId?: string | null) {
    try {
      const res = await fetch("/api/room");
      const json = await res.json();
      const rooms: any[] = json?.data || [];
      
      // Include unoccupied rooms and the currently assigned room (if editing)
      const availableRooms = rooms
        .filter((r) => r.is_occupied === false || (currentRoomId && r._id === currentRoomId))
        .map((r) => ({ _id: r._id, readable_id: r.readable_id }));
      
      setRoomList(availableRooms);
    } catch (e) {
      console.error("Error fetching rooms:", e);
    }
  }

  useEffect(() => {
    fetchPeople();
    fetchAvailableRooms();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isEditing = editingId !== null;
      const res = await fetch("/api/people", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: editingId || undefined,
          name,
          number_of_people: Number(count),
          phone,
          email,
          room_id: selectedRoomId || null,
          created_at_bikram_sambat: createdAt || null,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        const message = errorBody?.message || `Failed (HTTP ${res.status})`;
        throw new Error(message);
      }

      const data = await res.json().catch(() => ({}));
      setAlertTitle(isEditing ? "Person updated" : "Person added");
      setAlertDescription(
        data?.message || `${name} ${isEditing ? "updated" : "added"}.`
      );
      setAlertOpen(true);
      setOpen(false);
      setEditingId(null);
      setName("");
      setCount("");
      setPhone("");
      setEmail("");
      setSelectedRoomId(null);
      setCreatedAt("");
      // refresh available rooms list
      await fetchAvailableRooms();
      fetchPeople();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setAlertTitle("Error");
      setAlertDescription(message);
      setAlertOpen(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4">
      <div className="flex justify-end mb-4">
        <Dialog
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              // Reset form state when dialog is closed
              setEditingId(null);
              setName("");
              setCount("");
              setPhone("");
              setEmail("");
              setSelectedRoomId(null);
              setCreatedAt("");
            }
          }}
        >
          <DialogTrigger asChild>
            <Button variant="secondary" size="sm">
              <IconPlus className="mr-2" />
              Add Person
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Person" : "Add Person"}
              </DialogTitle>
              <DialogDescription>Fill the details.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-2">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="count" className="text-sm font-medium">
                  Number of People
                </label>
                <input
                  id="count"
                  type="number"
                  min={1}
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  required
                />
              </div>
              <RoomCombo
                rooms={roomList}
                selectedRoomId={selectedRoomId}
                setSelectedRoomId={setSelectedRoomId}
                open={roomPopoverOpen}
                setOpen={setRoomPopoverOpen}
                setCreatedAt={setCreatedAt}
              />
              {selectedRoomId && (
                <div className="grid gap-2">
                  <label className="text-sm font-medium">
                    Room Assignment Date (Bikram Sambat)
                  </label>
                  <NepaliDatePicker
                    value={createdAt}
                    onChange={(bsDate, adDate) => {
                      setCreatedAt(bsDate);
                    }}
                    placeholder="Select assignment date"
                    className="w-full"
                  />
                </div>
              )}
              <div className="grid gap-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Phone
                </label>
                <input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  required
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : editingId ? "Update" : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">People</h2>
        {loading ? (
          <p>Loading...</p>
        ) : people.length === 0 ? (
          <p>No records.</p>
        ) : (
          <ul className="grid gap-2">
            {people.map((p) => (
              <li
                key={p._id}
                className="border rounded-md p-3 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{p.name}</p>
                  {p.room_readable_id ? (
                    <p className="text-sm">Room #{p.room_readable_id}</p>
                  ) : null}
                  <p className="text-sm text-muted-foreground">
                    {p.email} • {p.phone} • {p.number_of_people} person(s)
                  </p>
                  {p.createdADInEnglish || p.created_at_bikram_sambat ? (
                    <div className="text-xs text-muted-foreground">
                      {p.createdADInEnglish && (
                        <p>Assigned (AD): {p.createdADInEnglish}</p>
                      )}
                      {p.created_at_bikram_sambat && (
                        <p>Assigned (BS): {p.created_at_bikram_sambat}</p>
                      )}
                      {p.deadlineADInEnglish && (
                        <p>Deadline (AD): {p.deadlineADInEnglish}</p>
                      )}
                      {p.deadlineBSInEnglish && (
                        <p>Deadline (BS): {p.deadlineBSInEnglish}</p>
                      )}
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setEditingId(p._id);
                      setName(p.name);
                      setCount(String(p.number_of_people));
                      setPhone(p.phone);
                      setEmail(p.email);
                      setCreatedAt(p.created_at_bikram_sambat || "");
                      // preselect current room if any
                      // current person does not include room_id in interface, but backend returns it
                      const anyP: any = p as any;
                      const currentRoomId = anyP.room_id || null;
                      setSelectedRoomId(currentRoomId);
                      
                      // Fetch rooms including the currently assigned room
                      await fetchAvailableRooms(currentRoomId);
                      
                      setOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setPendingDelete(p);
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
            <AlertDialogTitle>Delete person?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `This will permanently delete ${pendingDelete.name}.`
                : "This will permanently delete this record."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!pendingDelete) return;
                try {
                  const res = await fetch("/api/people", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ _id: pendingDelete._id }),
                  });
                  if (!res.ok) {
                    const errorBody = await res.json().catch(() => ({}));
                    const message =
                      errorBody?.message ||
                      `Failed to delete (HTTP ${res.status})`;
                    throw new Error(message);
                  }
                  setAlertTitle("Person deleted");
                  setAlertDescription(`${pendingDelete.name} deleted.`);
                  setAlertOpen(true);
                  setConfirmOpen(false);
                  setPendingDelete(null);
                  fetchPeople();
                  // refresh available rooms list
                  await fetchAvailableRooms();
                } catch (err) {
                  const message =
                    err instanceof Error ? err.message : "Unknown error";
                  setAlertTitle("Error deleting person");
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

function RoomCombo({
  rooms,
  selectedRoomId,
  setSelectedRoomId,
  open,
  setOpen,
  setCreatedAt,
}: {
  rooms: RoomLite[];
  selectedRoomId: string | null;
  setSelectedRoomId: (v: string | null) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  setCreatedAt: (v: string) => void;
}) {
  const selected = rooms.find((r) => r._id === selectedRoomId) || null;
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium">Room</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="justify-between">
            {selected
              ? `Room #${selected.readable_id}`
              : selectedRoomId === null
              ? "None"
              : "Select room"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0">
          <Command>
            <CommandInput placeholder="Search room..." />
            <CommandList>
              <CommandEmpty>No rooms found.</CommandEmpty>
              <CommandGroup heading="Options">
                <CommandItem
                  onSelect={() => {
                    setSelectedRoomId(null);
                    setCreatedAt(""); // Clear the date when no room is selected
                    setOpen(false);
                  }}
                >
                  None
                </CommandItem>
              </CommandGroup>
              <CommandGroup heading="Unoccupied Rooms">
                {rooms.map((r) => (
                  <CommandItem
                    key={r._id}
                    onSelect={() => {
                      setSelectedRoomId(r._id);
                      setOpen(false);
                    }}
                  >
                    Room #{r.readable_id}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
