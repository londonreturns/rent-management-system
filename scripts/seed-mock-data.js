/*
  Seed script: creates
  - 4 rooms
  - 4 people (each assigned to a room)
  - 12 months of payments per person (1 year) with mixed statuses:
    some partial, some completed, some overpaid

  Usage:
    1) Ensure your Next.js server is running (e.g., npm run dev)
    2) Run: node scripts/seed-mock-data.js

  Notes:
  - Targets the existing API routes at http://localhost:3000/api
  - Uses BS months in the form YYYY-MM (e.g., 2081-01 ... 2081-12)
  - Calculates electricity_cost = electricity_units * 13 (as per server validation)
  - Calculates total_amount = electricity_cost + water_cost + rent_cost (as per server validation)
  - Carries previous balance across months to produce partial/overpaid situations
*/

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
// Accept PIN from CLI flag --pin=XXXX, then env vars
const args = process.argv.slice(2);
const pinArg = args.find(a => a.startsWith('--pin='));
const SEED_PIN = (pinArg ? pinArg.split('=')[1] : null)
  || process.env.SEED_PIN
  || process.env.NEXT_PUBLIC_API_KEY
  || ""; // leave empty to force helpful error if not provided
let AUTH_TOKEN = null;

// Simple helper to call JSON APIs
async function apiFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const defaultHeaders = { 'Content-Type': 'application/json' };
  const headers = { ...defaultHeaders, ...(options.headers || {}) };
  if (AUTH_TOKEN) headers['authorization'] = `Bearer ${AUTH_TOKEN}`;
  const resp = await fetch(url, {
    ...options,
    headers,
  });
  let data = null;
  let rawText = null;
  try {
    data = await resp.json();
  } catch {
    try { rawText = await resp.text(); } catch { rawText = null; }
  }
  if (!resp.ok) {
    const msg = (data && (data.message || data.error)) || rawText || resp.statusText || 'Request failed';
    throw new Error(`${resp.status} ${msg} - ${url}`);
  }
  // Prefer JSON data; if none, return text payload
  return data ?? { raw: rawText };
}

async function login() {
  if (!SEED_PIN) {
    throw new Error('Missing PIN. Provide via --pin=XXXX or set SEED_PIN / NEXT_PUBLIC_API_KEY env.');
  }
  const res = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ pin: SEED_PIN })
  });
  if (!res?.token) {
    throw new Error('Authentication failed: token missing');
  }
  AUTH_TOKEN = res.token;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Create 4 rooms
async function createRooms() {
  const roomInputs = [
    { readable_id: 101, rent: 12000, water_price: 500, is_occupied: false },
    { readable_id: 102, rent: 14000, water_price: 600, is_occupied: false },
    { readable_id: 201, rent: 16000, water_price: 650, is_occupied: false },
    { readable_id: 202, rent: 18000, water_price: 700, is_occupied: false },
  ];
  const created = [];
  for (const input of roomInputs) {
    const res = await apiFetch('/api/room', { method: 'POST', body: JSON.stringify(input) });
    if (!res || !res.data) {
      // Fallback: fetch all rooms and resolve by readable_id
      const all = await apiFetch('/api/room', { method: 'GET' });
      const matched = (all?.data || []).find(r => r.readable_id === input.readable_id);
      if (!matched) {
        console.error('Room creation response did not contain data. Response:', res);
        throw new Error(`Failed to confirm created room ${input.readable_id}`);
      }
      created.push(matched);
    } else {
      created.push(res.data);
    }
    await sleep(75);
  }
  return created; // array of room docs
}

// Create 4 people and assign to rooms
async function createPeople(rooms) {
  // Use some stable BS assignment dates
  const bsDates = ['2081-01-05','2081-02-10','2081-03-08','2081-04-12'];
  const peopleInputs = [
    { name: 'Aarav Sharma', phone: '9800000001', number_of_people: 1 },
    { name: 'Sita Karki', phone: '9800000002', number_of_people: 2 },
    { name: 'Rohit Thapa', phone: '9800000003', number_of_people: 3 },
    { name: 'Mina Adhikari', phone: '9800000004', number_of_people: 2 },
  ];

  const created = [];
  for (let i = 0; i < peopleInputs.length; i++) {
    const room = rooms[i];
    const body = {
      ...peopleInputs[i],
      room_id: room._id,
      // People API will compute fields based on this BS date
      created_at_bikram_sambat: bsDates[i],
    };
    const res = await apiFetch('/api/people', { method: 'POST', body: JSON.stringify(body) });
    // people POST returns empty string as data; need to re-fetch to resolve IDs
    created.push({ ...peopleInputs[i], room, created_at_bikram_sambat: bsDates[i] });
    await sleep(75);
  }

  // Fetch latest people to map to room and name; API returns all with IDs
  const peopleRes = await apiFetch('/api/people', { method: 'GET' });
  // Map by name to obtain _id
  const resolved = created.map(p => {
    const match = (peopleRes.data || []).find(x => x.name === p.name);
    return { ...p, _id: match?._id, room_id: p.room._id };
  });
  return resolved;
}

// Utilities for payments
const BS_MONTHS = [
  { num: '01', name: 'Baisakh' },
  { num: '02', name: 'Jestha' },
  { num: '03', name: 'Ashadh' },
  { num: '04', name: 'Shrawan' },
  { num: '05', name: 'Bhadra' },
  { num: '06', name: 'Ashwin' },
  { num: '07', name: 'Kartik' },
  { num: '08', name: 'Mangsir' },
  { num: '09', name: 'Poush' },
  { num: '10', name: 'Magh' },
  { num: '11', name: 'Falgun' },
  { num: '12', name: 'Chaitra' },
];

function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// Create 12 months of payments per person, mixing partial/completed/overpaid
async function createPayments(peopleWithRooms, bsYear = 2081) {
  for (const person of peopleWithRooms) {
    let rollingPreviousBalance = 0; // carryover per person

    for (const m of BS_MONTHS) {
      const room = person.room;
      const electricityUnits = randomInt(30, 85);
      const electricityCost = Math.round(electricityUnits * 13 * 100) / 100;
      const waterCost = Number(room.water_price);
      const rentCost = Number(room.rent);
      const totalAmount = Math.round((electricityCost + waterCost + rentCost) * 100) / 100;

      // Decide scenario for this month
      // 0: completed, 1: partial, 2: overpaid
      const scenario = randomInt(0, 2);

      // Compute amount paid relative to current due + previous balance
      const totalDue = Math.round((totalAmount + rollingPreviousBalance) * 100) / 100;
      let amountPaid;
      if (scenario === 0) {
        // completed: exactly totalDue
        amountPaid = totalDue;
      } else if (scenario === 1) {
        // partial: 50% to 90% of totalDue
        const pct = randomInt(50, 90) / 100;
        amountPaid = Math.round(totalDue * pct * 100) / 100;
      } else {
        // overpaid: 105% to 120% of totalDue
        const pct = randomInt(105, 120) / 100;
        amountPaid = Math.round(totalDue * pct * 100) / 100;
      }

      // Prepare body per API contract
      const paymentMonth = `${bsYear}-${m.num}`;
      const paymentMonthName = `${m.name} ${bsYear}`;
      // Randomize BS day (1..30) so payments don't all happen on the same day
      const bsDay = String(randomInt(1, 30)).padStart(2, '0');
      const paymentDateBs = `${bsYear}-${m.num}-${bsDay}`;
      const body = {
        room_id: room._id,
        person_id: person._id,
        payment_month: paymentMonth,
        payment_month_name: paymentMonthName,
        electricity_units: electricityUnits,
        electricity_cost: electricityCost,
        water_cost: waterCost,
        rent_cost: rentCost,
        total_amount: totalAmount,
        previous_balance: Math.round(rollingPreviousBalance * 100) / 100,
        amount_paid: amountPaid,
        payment_date_bs: paymentDateBs,
        payment_method: 'cash',
        notes: 'Seeded payment',
      };

      const res = await apiFetch('/api/payment', { method: 'POST', body: JSON.stringify(body) });

      // Update rolling previous balance from server-calculated remaining_balance
      rollingPreviousBalance = Number(res?.data?.remaining_balance || 0);
      await sleep(50);
    }
  }
}

async function main() {
  try {
    console.log(`Seeding to: ${BASE_URL}`);
    console.log(`Using PIN: ${'*'.repeat(String(SEED_PIN).length || 0)} (set via --pin or env)`);
    // Authenticate first (middleware protects APIs)
    await login();
    console.log('Authenticated.');
    const rooms = await createRooms();
    console.log(`Created rooms:`, rooms.map(r => ({ id: r._id, readable_id: r.readable_id })));

    const people = await createPeople(rooms);
    console.log(`Created people:`, people.map(p => ({ id: p._id, name: p.name, room: p.room.readable_id })));

    await createPayments(people, 2081);
    console.log('Created 12 months of payments per person (2081).');

    console.log('Seeding complete.');
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exitCode = 1;
  }
}

// Ensure global fetch exists (Node 18+). If not, exit with a helpful message.
if (typeof fetch !== 'function') {
  console.error('Global fetch is not available. Please run with Node 18+ or later.');
  process.exit(1);
}

main();


