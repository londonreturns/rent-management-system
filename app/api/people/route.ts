import { connectDB } from "@/config/db";
import peopleModel from "@/models/people";
import roomModel from "@/models/room";
import { nepaliToEnglishDate, calculateDeadlineDay, calculateDeadlineDate } from "@/lib/utils";
import NepaliDate from "nepali-datetime";
import { NextResponse } from "next/server";
import logModel from "@/models/log";
import type { NextRequest } from "next/server";

connectDB();

export async function GET(request: NextRequest) {
  try {
    const people = await peopleModel.find({}).sort({ createdADInEnglish: -1 }).lean();
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

    // Prepare the processed body with date conversions
    let processedBody = { ...body };

    if (processedBody.room_id === null || processedBody.room_id === "") {
      processedBody.created_at_bikram_sambat = null;
      processedBody.createdBSInEnglish = null;
      processedBody.createdADInEnglish = null;
      processedBody.deadlineBSInEnglish = null;
      processedBody.deadlineADInEnglish = null;
    } else {
      const bsInNepali = body.created_at_bikram_sambat;
      const bsInEnglish = nepaliToEnglishDate(bsInNepali);
      const adInEnglish = new NepaliDate(bsInEnglish).formatEnglishDate('YYYY-MM-DD');

      // Calculate recurring deadline day (1 day before created date)
      const deadlineDay = calculateDeadlineDay(bsInEnglish);

      processedBody.created_at_bikram_sambat = bsInNepali;
      processedBody.createdBSInEnglish = bsInEnglish;
      processedBody.createdADInEnglish = adInEnglish;
      processedBody.deadlineDate = deadlineDay; // Store recurring day of month
    }

    console.log("---------------------------------");

    console.log('Processed body:', processedBody);
    const created = await peopleModel.create(processedBody);
    await logModel.create({
      type: "user_created",
      entity: "user",
      entity_id: created._id.toString(),
      message: `User ${created.name} created${created.room_id ? ` (room #${(await roomModel.findById(created.room_id).select('readable_id').lean() as { readable_id: number } | null)?.readable_id})` : ''}`,
      meta: processedBody
    });

    if (body?.room_id) {
      await roomModel.findByIdAndUpdate(body.room_id, { $set: { is_occupied: true } });
    }

    return NextResponse.json({ message: "Person created successfully", data: "" }, { status: 201 });
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

    // Prepare the processed body with date conversions
    let processedRest = { ...rest };

    // Handle Bikram Sambat date conversion (same as POST)
    if (body.created_at_bikram_sambat && typeof body.created_at_bikram_sambat === 'string') {
      const bsInNepali = body.created_at_bikram_sambat;
      const bsInEnglish = nepaliToEnglishDate(bsInNepali);
      const adInEnglish = new NepaliDate(bsInEnglish).formatEnglishDate('YYYY-MM-DD');

      // Calculate recurring deadline day (1 day before created date)
      const deadlineDay = calculateDeadlineDay(bsInEnglish);

      processedRest.created_at_bikram_sambat = bsInNepali;
      processedRest.createdBSInEnglish = bsInEnglish;
      processedRest.createdADInEnglish = adInEnglish;
      processedRest.deadlineDate = deadlineDay; // Store recurring day of month
    } else if (room_id) {
      // If no BS date provided but room is assigned, set all date fields to null
      processedRest.created_at_bikram_sambat = null;
      processedRest.createdBSInEnglish = null;
      processedRest.createdADInEnglish = null;
      processedRest.deadlineDate = 1; // Default to 1st of month
    }

    // find existing to check previous room
    const existing = await peopleModel
      .findById(_id)
      .select("room_id")
      .lean<{ room_id?: string }>();
    const before = await peopleModel.findById(_id).lean();
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
    await logModel.create({
      type: "user_updated",
      entity: "user",
      entity_id: updated._id.toString(),
      message: `User ${updated.name} updated`,
      meta: { before, after: updated }
    });
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
    await logModel.create({
      type: "user_deleted",
      entity: "user",
      entity_id: deleted._id.toString(),
      message: `User ${deleted.name} deleted`,
      meta: { _id }
    });
    return NextResponse.json({ message: "Person deleted successfully", data: deleted });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error deleting person", error: error.message },
      { status: 500 }
    );
  }
}