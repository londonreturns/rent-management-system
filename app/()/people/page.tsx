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

interface Person {
  _id: string;
  name: string;
  number_of_people: number;
  phone: string;
  email: string;
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

  useEffect(() => {
    fetchPeople();
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
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        const message = errorBody?.message || `Failed (HTTP ${res.status})`;
        throw new Error(message);
      }

      const data = await res.json().catch(() => ({}));
      setAlertTitle(isEditing ? "Person updated" : "Person added");
      setAlertDescription(data?.message || `${name} ${isEditing ? "updated" : "added"}.`);
      setAlertOpen(true);
      setOpen(false);
      setEditingId(null);
      setName("");
      setCount("");
      setPhone("");
      setEmail("");
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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" size="sm">
              <IconPlus className="mr-2" />
              Add Person
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Person" : "Add Person"}</DialogTitle>
              <DialogDescription>Fill the details.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-2">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">Name</label>
                <input id="name" value={name} onChange={(e) => setName(e.target.value)} className="border rounded-md px-3 py-2 text-sm outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]" required />
              </div>
              <div className="grid gap-2">
                <label htmlFor="count" className="text-sm font-medium">Number of People</label>
                <input id="count" type="number" min={1} value={count} onChange={(e) => setCount(e.target.value)} className="border rounded-md px-3 py-2 text-sm outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]" required />
              </div>
              <div className="grid gap-2">
                <label htmlFor="phone" className="text-sm font-medium">Phone</label>
                <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="border rounded-md px-3 py-2 text-sm outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]" required />
              </div>
              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="border rounded-md px-3 py-2 text-sm outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]" required />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : editingId ? "Update" : "Save"}</Button>
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
            <AlertDialogAction onClick={() => setAlertOpen(false)}>OK</AlertDialogAction>
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
              <li key={p._id} className="border rounded-md p-3 flex justify-between items-center">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-muted-foreground">{p.email} • {p.phone} • {p.number_of_people} person(s)</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingId(p._id);
                      setName(p.name);
                      setCount(String(p.number_of_people));
                      setPhone(p.phone);
                      setEmail(p.email);
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
              {pendingDelete ? `This will permanently delete ${pendingDelete.name}.` : "This will permanently delete this record."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmOpen(false)}>Cancel</AlertDialogCancel>
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
                    const message = errorBody?.message || `Failed to delete (HTTP ${res.status})`;
                    throw new Error(message);
                  }
                  setAlertTitle("Person deleted");
                  setAlertDescription(`${pendingDelete.name} deleted.`);
                  setAlertOpen(true);
                  setConfirmOpen(false);
                  setPendingDelete(null);
                  fetchPeople();
                } catch (err) {
                  const message = err instanceof Error ? err.message : "Unknown error";
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
