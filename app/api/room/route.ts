import { connectDB } from "@/config/db";
import roomModel from "@/models/room";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

connectDB();

export async function GET(request: NextRequest) {
  try {
    const rooms = await roomModel.find(); // Mongoose
    return NextResponse.json({
      message: "Rooms fetched successfully",
      data: rooms,
    });
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
    const newRoom = await roomModel.create(formData);

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
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ message: "Nothing to update" }, { status: 400 });
    }
    const updated = await roomModel.findOneAndUpdate(
      { readable_id },
      { $set: update },
      { new: true }
    );
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