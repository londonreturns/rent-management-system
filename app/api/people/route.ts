import { connectDB } from "@/config/db";
import peopleModel from "@/models/people";
import roomModel from "@/models/room";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

connectDB();

export async function GET(request: NextRequest) {
  try {
    const people = await peopleModel.find({}).sort({ created_at: -1 }).lean();
    // attach room readable_id if assigned
    const roomIds = people.map((p: any) => p.room_id).filter(Boolean);
    const rooms = await roomModel
      .find({ _id: { $in: roomIds } })
      .select("_id readable_id")
      .lean<{ _id: any; readable_id: number }[]>();
    const roomMap = new Map<string, number>();
    for (const r of rooms) {
      roomMap.set(r._id.toString(), r.readable_id);
    }
    const data = people.map((p: any) => ({
      ...p,
      room_readable_id: p.room_id ? roomMap.get(p.room_id.toString()) || null : null,
    }));
    return NextResponse.json({ message: "People fetched successfully", data });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error fetching people", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const created = await peopleModel.create(body);
    if (body?.room_id) {
      await roomModel.findByIdAndUpdate(body.room_id, { $set: { is_occupied: true } });
    }
    return NextResponse.json({ message: "Person created successfully", data: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error creating person", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { _id, room_id, ...rest } = body;
    if (!_id) return NextResponse.json({ message: "_id is required" }, { status: 400 });
    // find existing to check previous room
    const existing = await peopleModel
      .findById(_id)
      .select("room_id")
      .lean<{ room_id?: string }>();
    const updated = await peopleModel.findByIdAndUpdate(_id, { $set: { ...rest, room_id: room_id || null } }, { new: true });
    // if room changed, update occupancy flags
    const prevRoomId = existing?.room_id?.toString();
    const nextRoomId = room_id || null;
    if (prevRoomId && prevRoomId !== nextRoomId) {
      await roomModel.findByIdAndUpdate(prevRoomId, { $set: { is_occupied: false } });
    }
    if (nextRoomId && prevRoomId !== nextRoomId) {
      await roomModel.findByIdAndUpdate(nextRoomId, { $set: { is_occupied: true } });
    }
    if (!updated) return NextResponse.json({ message: "Person not found" }, { status: 404 });
    return NextResponse.json({ message: "Person updated successfully", data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error updating person", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { _id } = body;
    if (!_id) return NextResponse.json({ message: "_id is required" }, { status: 400 });
    const deleted = await peopleModel.findByIdAndDelete(_id);
    if (deleted?.room_id) {
      await roomModel.findByIdAndUpdate(deleted.room_id, { $set: { is_occupied: false } });
    }
    if (!deleted) return NextResponse.json({ message: "Person not found" }, { status: 404 });
    return NextResponse.json({ message: "Person deleted successfully", data: deleted });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error deleting person", error: error.message },
      { status: 500 }
    );
  }
}


