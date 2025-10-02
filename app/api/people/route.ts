import { connectDB } from "@/config/db";
import peopleModel from "@/models/people";
import roomModel from "@/models/room";
import { convertBSToGregorian } from "@/lib/utils";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Connect to the database and log the connection attempt
connectDB();

export async function GET(request: NextRequest) {
  try {
    console.log("GET request to /api/people received");

    const people = await peopleModel.find({}).sort({ created_at: -1 }).lean();
    console.log(`Fetched ${people.length} people from the database`);

    // attach room readable_id if assigned
    const roomIds = people.map((p: any) => p.room_id).filter(Boolean);
    console.log(`Found ${roomIds.length} room IDs for the people`);

    const rooms = await roomModel
      .find({ _id: { $in: roomIds } })
      .select("_id readable_id")
      .lean<{ _id: any; readable_id: number }[]>();
    console.log(`Found ${rooms.length} rooms matching the people`);

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

    console.log("People data processed successfully");

    return NextResponse.json({ message: "People fetched successfully", data });
  } catch (error: any) {
    console.error("Error fetching people:", error);
    return NextResponse.json(
      { message: "Error fetching people", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("POST request to /api/people received");

    const body = await request.json();
    console.log("Request body received:", body);

    // Prepare the processed body with both date formats
    let processedBody = { ...body };

    // Handle Bikram Sambat date
    if (body.created_at_bikram_sambat && typeof body.created_at_bikram_sambat === 'string') {
      processedBody.created_at_bikram_sambat = body.created_at_bikram_sambat;

      // Convert BS date to Gregorian date
      const gregorianDate = convertBSToGregorian(body.created_at_bikram_sambat);
      console.log(`Converting Bikram Sambat date ${body.created_at_bikram_sambat} to Gregorian: ${gregorianDate}`);

      if (gregorianDate) {
        processedBody.created_at_gregorian = gregorianDate;
      } else {
        // If conversion fails, use current date for Gregorian
        console.warn("Failed to convert Bikram Sambat date to Gregorian. Using current date.");
        processedBody.created_at_gregorian = new Date();
      }
    } else {
      // If no BS date provided, use current date for Gregorian and null for BS
      console.log("No Bikram Sambat date provided. Using current date for Gregorian.");
      processedBody.created_at_gregorian = new Date();
      processedBody.created_at_bikram_sambat = null;
    }

    // Create the person
    const created = await peopleModel.create(processedBody);
    console.log("Person created successfully:", created);

    // Handle room update if room_id is provided
    if (body?.room_id) {
      const roomUpdate = await roomModel.findByIdAndUpdate(body.room_id, { $set: { is_occupied: true } });
      console.log(`Room ${body.room_id} updated to occupied status:`, roomUpdate);
    }

    return NextResponse.json({ message: "Person created successfully", data: created }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating person:", error);
    return NextResponse.json(
      { message: "Error creating person", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("PUT request to /api/people received");

    const body = await request.json();
    console.log("Request body received:", body);

    const { _id, room_id, ...rest } = body;

    if (!_id) {
      console.warn("No _id provided in PUT request");
      return NextResponse.json({ message: "_id is required" }, { status: 400 });
    }

    // Prepare the processed body with both date formats
    let processedRest = { ...rest };

    // Handle Bikram Sambat date update
    if (rest.created_at_bikram_sambat && typeof rest.created_at_bikram_sambat === 'string') {
      processedRest.created_at_bikram_sambat = rest.created_at_bikram_sambat;

      // Convert BS date to Gregorian date
      const gregorianDate = convertBSToGregorian(rest.created_at_bikram_sambat);
      console.log(`Converting Bikram Sambat date ${rest.created_at_bikram_sambat} to Gregorian: ${gregorianDate}`);

      if (gregorianDate) {
        processedRest.created_at_gregorian = gregorianDate;
      }
      // If conversion fails, keep the existing Gregorian date
    }

    // Find the existing person to check the previous room
    const existing = await peopleModel.findById(_id).select("room_id").lean<{ room_id?: string }>();
    console.log(`Found existing person with room_id: ${existing?.room_id}`);

    const updated = await peopleModel.findByIdAndUpdate(_id, { $set: { ...processedRest, room_id: room_id || null } }, { new: true });
    console.log("Person updated successfully:", updated);

    // If room changed, update occupancy flags
    const prevRoomId = existing?.room_id?.toString();
    const nextRoomId = room_id || null;

    if (prevRoomId && prevRoomId !== nextRoomId) {
      await roomModel.findByIdAndUpdate(prevRoomId, { $set: { is_occupied: false } });
      console.log(`Room ${prevRoomId} marked as unoccupied`);
    }

    if (nextRoomId && prevRoomId !== nextRoomId) {
      await roomModel.findByIdAndUpdate(nextRoomId, { $set: { is_occupied: true } });
      console.log(`Room ${nextRoomId} marked as occupied`);
    }

    if (!updated) {
      console.warn("Person not found for update");
      return NextResponse.json({ message: "Person not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Person updated successfully", data: updated });
  } catch (error: any) {
    console.error("Error updating person:", error);
    return NextResponse.json(
      { message: "Error updating person", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log("DELETE request to /api/people received");

    const body = await request.json();
    console.log("Request body received:", body);

    const { _id } = body;

    if (!_id) {
      console.warn("No _id provided in DELETE request");
      return NextResponse.json({ message: "_id is required" }, { status: 400 });
    }

    const deleted = await peopleModel.findByIdAndDelete(_id);
    console.log("Person deleted:", deleted);

    if (deleted?.room_id) {
      await roomModel.findByIdAndUpdate(deleted.room_id, { $set: { is_occupied: false } });
      console.log(`Room ${deleted.room_id} marked as unoccupied`);
    }

    if (!deleted) {
      console.warn("Person not found for deletion");
      return NextResponse.json({ message: "Person not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Person deleted successfully", data: deleted });
  } catch (error: any) {
    console.error("Error deleting person:", error);
    return NextResponse.json(
      { message: "Error deleting person", error: error.message },
      { status: 500 }
    );
  }
}
