import { connectDB } from "@/config/db";
import roomModel from "@/models/room";
import peopleModel from "@/models/people";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

connectDB();

export async function GET(request: NextRequest) {
  try {
    const rooms = await roomModel.find().lean();
    // attach assigned person's name if any
    const roomIds = rooms.map((r: any) => r._id);
    const people = await peopleModel
      .find({ room_id: { $in: roomIds } })
      .select("_id name room_id deadlineDate createdBSInEnglish created_at_bikram_sambat")
      .lean<{ _id: any; name: string; room_id: any; deadlineDate?: number; createdBSInEnglish?: string; created_at_bikram_sambat?: string }[]>();
    const nameMap = new Map<string, string>();
    const idMap = new Map<string, string>();
    const deadlineMap = new Map<string, number>();
    const assignmentDateMap = new Map<string, string>();
    for (const p of people) {
      if (p.room_id) {
        nameMap.set(p.room_id.toString(), p.name);
        idMap.set(p.room_id.toString(), p._id.toString());
        deadlineMap.set(p.room_id.toString(), p.deadlineDate || 1);
        assignmentDateMap.set(p.room_id.toString(), p.createdBSInEnglish || p.created_at_bikram_sambat || "");
      }
    }
    const data = rooms.map((r: any) => ({
      ...r,
      person_name: nameMap.get(r._id.toString()) || null,
      person_id: idMap.get(r._id.toString()) || null,
      deadline_day: deadlineMap.get(r._id.toString()) || null,
      assignment_date_bs: assignmentDateMap.get(r._id.toString()) || null,
    }));
    return NextResponse.json({ message: "Rooms fetched successfully", data });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error fetching rooms", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();
    console.log("POST formData received:", formData); // Debug log
    const newRoom = await roomModel.create(formData);
    console.log("Created room:", newRoom); // Debug log

    return NextResponse.json({
      message: "Room created successfully",
      data: newRoom,
    });
  } catch (error: any) {
    console.error("POST error:", error);
    return NextResponse.json(
      {
        message: "Error creating room",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("PUT body received:", body); // Debug log
    const { readable_id, rent, is_occupied, water_price } = body;
    if (typeof readable_id !== "number") {
      return NextResponse.json(
        { message: "readable_id is required and must be a number" },
        { status: 400 }
      );
    }
    const update: any = {};
    if (typeof rent === "number") update.rent = rent;
    if (typeof water_price === "number") update.water_price = water_price;
    if (typeof is_occupied === "boolean") update.is_occupied = is_occupied;
    console.log("Update object:", update); // Debug log
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ message: "Nothing to update" }, { status: 400 });
    }
    const updated = await roomModel.findOneAndUpdate(
      { readable_id },
      { $set: update },
      { new: true }
    );
    console.log("Updated room:", updated); // Debug log
    if (!updated) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Room updated", data: updated });
  } catch (error: any) {
    console.error("PUT error:", error);
    return NextResponse.json(
      { message: "Error updating room", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { readable_id } = body;
    if (typeof readable_id !== "number") {
      return NextResponse.json(
        { message: "readable_id is required and must be a number" },
        { status: 400 }
      );
    }
    const deleted = await roomModel.findOneAndDelete({ readable_id });
    if (!deleted) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Room deleted", data: deleted });
  } catch (error: any) {
    console.error("DELETE error:", error);
    return NextResponse.json(
      { message: "Error deleting room", error: error.message },
      { status: 500 }
    );
  }
}