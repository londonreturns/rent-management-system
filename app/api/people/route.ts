import { connectDB } from "@/config/db";
import peopleModel from "@/models/people";
import roomModel from "@/models/room";
import { convertBSToGregorian } from "@/lib/utils";
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
      created_at_gregorian: p.created_at_gregorian ? p.created_at_gregorian.toISOString() : null,
      created_at_bikram_sambat: p.created_at_bikram_sambat || null,
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
    
    // Prepare the processed body with both date formats
    let processedBody = { ...body };
    
    // Handle Bikram Sambat date
    if (body.created_at_bikram_sambat && typeof body.created_at_bikram_sambat === 'string') {
      processedBody.created_at_bikram_sambat = body.created_at_bikram_sambat;
      
      // Convert BS date to Gregorian date
      const gregorianDate = convertBSToGregorian(body.created_at_bikram_sambat);
      if (gregorianDate) {
        processedBody.created_at_gregorian = gregorianDate;
      } else {
        // If conversion fails, use current date for Gregorian
        processedBody.created_at_gregorian = new Date();
      }
    } else {
      // If no BS date provided, use current date for Gregorian and null for BS
      processedBody.created_at_gregorian = new Date();
      processedBody.created_at_bikram_sambat = null;
    }
    
    const created = await peopleModel.create(processedBody);
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
    
    // Prepare the processed body with both date formats
    let processedRest = { ...rest };
    
    // Handle Bikram Sambat date update
    if (rest.created_at_bikram_sambat && typeof rest.created_at_bikram_sambat === 'string') {
      processedRest.created_at_bikram_sambat = rest.created_at_bikram_sambat;
      
      // Convert BS date to Gregorian date
      const gregorianDate = convertBSToGregorian(rest.created_at_bikram_sambat);
      if (gregorianDate) {
        processedRest.created_at_gregorian = gregorianDate;
      }
      // If conversion fails, keep the existing Gregorian date
    }
    
    // find existing to check previous room
    const existing = await peopleModel
      .findById(_id)
      .select("room_id")
      .lean<{ room_id?: string }>();
    const updated = await peopleModel.findByIdAndUpdate(_id, { $set: { ...processedRest, room_id: room_id || null } }, { new: true });
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


