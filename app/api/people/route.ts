import { connectDB } from "@/config/db";
import peopleModel from "@/models/people";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

connectDB();

export async function GET(request: NextRequest) {
  try {
    const people = await peopleModel.find({}).sort({ created_at: -1 }).lean();
    return NextResponse.json({ message: "People fetched successfully", data: people });
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
    const { _id, ...update } = body;
    if (!_id) return NextResponse.json({ message: "_id is required" }, { status: 400 });
    const updated = await peopleModel.findByIdAndUpdate(_id, { $set: update }, { new: true });
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
    if (!deleted) return NextResponse.json({ message: "Person not found" }, { status: 404 });
    return NextResponse.json({ message: "Person deleted successfully", data: deleted });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error deleting person", error: error.message },
      { status: 500 }
    );
  }
}


