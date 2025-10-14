"use client";

import { use, useEffect, useState } from "react";
import { adToBsDate } from "@/lib/utils";

interface PaymentRecord {
  _id: string;
  room_readable_id: number;
  person_name: string;
  payment_month_name: string;
  payment_date_ad: string;
  payment_date_bs?: string | null;
  electricity_units: number;
  electricity_cost: number;
  water_cost: number;
  rent_cost: number;
  total_amount: number;
  amount_paid: number;
  remaining_balance: number;
  payment_method: string;
  status: string;
}

export default function RoomPaymentsPage({ params }: { params: Promise<{ room: string }> }) {
  const { room } = use(params);
  const roomId = Number(room);
  const [items, setItems] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/payment?limit=1000`);
        const json = await res.json();
        if (!cancelled) {
          const all: PaymentRecord[] = json.data || [];
          const filtered = all.filter((p) => p.room_readable_id === roomId).sort((a, b) => new Date(b.payment_date_ad).getTime() - new Date(a.payment_date_ad).getTime());
          setItems(filtered);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [roomId]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Payments for Room #{roomId}</h1>
      {loading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : (
        <div className="grid gap-2">
          {items.map((p) => (
            <div key={p._id} className="border rounded p-3 bg-white">
              <div className="flex justify-between">
                <div>
                  <div className="font-medium">{p.person_name}</div>
                  <div className="text-xs text-gray-600">
                    Paid on: {new Date(p.payment_date_ad).toLocaleDateString()}
                    {(() => {
                      const bsDate = p.payment_date_bs || adToBsDate(p.payment_date_ad);
                      return bsDate ? ` (BS: ${bsDate})` : '';
                    })()}
                  </div>
                  <div className="text-xs text-gray-500">
                    For: {p.payment_month_name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">रु {p.total_amount}</div>
                  <div className={`text-xs capitalize ${p.status === "completed" ? "text-green-600" : p.status === "partial" ? "text-yellow-600" : p.status === "overpaid" ? "text-blue-600" : "text-gray-600"}`}>{p.status}</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-700 space-y-1">
                <div>Rent: रु {p.rent_cost}</div>
                <div>Water: रु {p.water_cost}</div>
                <div>Electricity: {p.electricity_units} kWh • रु {p.electricity_cost}</div>
                <div className="flex justify-between">
                  <span>Amount Paid:</span>
                  <span>रु {p.amount_paid}</span>
                </div>
                <div className="flex justify-between">
                  <span>Remaining:</span>
                  <span className={`${p.remaining_balance > 0 ? "text-red-600" : p.remaining_balance < 0 ? "text-green-600" : "text-gray-600"}`}>
                    रु {p.remaining_balance}
                  </span>
                </div>
                <div className="text-gray-500">Method: {p.payment_method}</div>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="text-sm text-gray-500">No payments found.</div>}
        </div>
      )}
    </div>
  );
}


