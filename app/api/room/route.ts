import { connectDB } from "@/config/db";
import roomModel from "@/models/room";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

connectDB();

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: "API working" });
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
