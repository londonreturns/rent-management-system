"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Log = {
  _id: string;
  type: string;
  entity: string;
  entity_id?: string;
  message: string;
  meta?: any;
  created_at: string;
};

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/logs?limit=200`);
        const json = await res.json();
        if (!cancelled) setLogs(json?.data || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="p-2 sm:p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg sm:text-xl font-semibold">Activity Logs</h1>
      </div>
      
      {/* Desktop Table View */}
      <div className="hidden sm:block rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 border-b">Time</th>
              <th className="text-left p-2 border-b">Type</th>
              <th className="text-left p-2 border-b">Message</th>
              <th className="text-left p-2 border-b">Entity</th>
              <th className="text-left p-2 border-b">Details</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="p-4 text-center text-gray-500">Loading…</td></tr>
            )}
            {!loading && logs.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-center text-gray-500">No logs yet</td></tr>
            )}
            {logs.map((l) => (
              <tr key={l._id} className={rowClass(l)}>
                <td className="p-2 border-b whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                <td className="p-2 border-b font-medium">{labelForType(l.type)}</td>
                <td className="p-2 border-b">{l.message}</td>
                <td className="p-2 border-b text-xs text-gray-500">{l.entity}{l.entity_id ? ` (${l.entity_id})` : ""}</td>
                <td className="p-2 border-b align-top">
                  <Details meta={l.meta} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3">
        {loading && (
          <div className="p-4 text-center text-gray-500 text-sm">Loading…</div>
        )}
        {!loading && logs.length === 0 && (
          <div className="p-4 text-center text-gray-500 text-sm">No logs yet</div>
        )}
        {logs.map((l) => (
          <div key={l._id} className={`rounded-md border p-3 ${rowClass(l)}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">
                  {new Date(l.created_at).toLocaleString()}
                </div>
                <div className="font-medium text-sm mb-1">
                  {labelForType(l.type)}
                </div>
                <div className="text-sm mb-2">
                  {l.message}
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {l.entity}{l.entity_id ? ` (${l.entity_id})` : ""}
                </div>
              </div>
            </div>
            <div className="border-t pt-2">
              <Details meta={l.meta} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function labelForType(t: string): string {
  switch (t) {
    case "room_created": return "Room created";
    case "room_updated": return "Room updated";
    case "room_deleted": return "Room deleted";
    case "user_created": return "User created";
    case "user_updated": return "User updated";
    case "user_deleted": return "User deleted";
    case "payment_created": return "Payment created";
    case "payment_updated": return "Payment updated";
    case "payment_deleted": return "Payment deleted";
    default: return t;
  }
}

function rowClass(l: Log): string {
  // color code background by type
  if (l.type.endsWith("created")) return "bg-green-50";
  if (l.type.endsWith("updated")) return "bg-yellow-50";
  if (l.type.endsWith("deleted")) return "bg-red-50";
  return "";
}

function Details({ meta }: { meta: any }) {
  if (!meta) return null;
  // Show payment/user/room highlights
  const keys = Object.keys(meta || {});
  const isDiff = "before" in meta && "after" in meta;
  if (isDiff) {
    const before = meta.before || {};
    const after = meta.after || {};
    const fields = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).slice(0, 10);
    return (
      <div className="text-xs space-y-1">
        {fields.map((f) => {
          const b = (before as any)[f];
          const a = (after as any)[f];
          if (JSON.stringify(b) === JSON.stringify(a)) return null;
          return (
            <div key={f} className="break-words">
              <span className="text-gray-500 mr-1">{f}:</span>
              <span className="line-through text-red-600 mr-1">{fmt(b)}</span>
              <span className="text-green-700">{fmt(a)}</span>
            </div>
          );
        })}
      </div>
    );
  }
  // creation: show selected keys
  const show = pick(meta, [
    "readable_id","rent","water_price","name","number_of_people","phone","room_readable_id","person_name","payment_month","amount_paid","total_amount","status"
  ]);
  return (
    <div className="text-xs text-gray-700">
      {Object.keys(show).length === 0 ? <span className="text-gray-400">—</span> : (
        <div className="flex flex-wrap gap-x-2 sm:gap-x-3 gap-y-1">
          {Object.entries(show).map(([k, v]) => (
            <div key={k} className="break-words"><span className="text-gray-500 mr-1">{k}:</span>{fmt(v)}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function pick(obj: any, fields: string[]) {
  const out: any = {};
  for (const f of fields) if (obj && obj[f] !== undefined) out[f] = obj[f];
  return out;
}

function fmt(v: any) {
  if (v == null) return "null";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}


