import { connectDB } from "@/config/db";
import paymentModel from "@/models/payment";
import peopleModel from "@/models/people";
import roomModel from "@/models/room";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

connectDB();

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const roomId = url.searchParams.get('room_id');
    const personId = url.searchParams.get('person_id');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const page = parseInt(url.searchParams.get('page') || '1');

    // Build query
    let query: any = {};
    if (roomId) query.room_id = roomId;
    if (personId) query.person_id = personId;

    // Get payments with pagination
    const skip = (page - 1) * limit;
    const payments = await paymentModel
      .find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await paymentModel.countDocuments(query);

    return NextResponse.json({
      message: "Payments fetched successfully",
      data: payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error fetching payments", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      room_id,
      person_id,
      payment_month,
      payment_month_name,
      payment_month_name_nepali,
      electricity_units,
      electricity_cost,
      water_cost,
      rent_cost,
      total_amount,
      amount_paid,
      remaining_balance,
      previous_balance,
      payment_date_bs,
      payment_method,
      status,
      notes
    } = body;

    // Validate required fields
    if (!room_id || !person_id || !payment_month || !payment_month_name ||
      electricity_units === undefined || electricity_cost === undefined ||
      water_cost === undefined || rent_cost === undefined ||
      total_amount === undefined || amount_paid === undefined) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify room and person exist
    const room = await roomModel.findById(room_id).select('readable_id').lean() as { readable_id: number } | null;
    const person = await peopleModel.findById(person_id).select('name').lean() as { name: string } | null;

    if (!room) {
      return NextResponse.json(
        { message: "Room not found" },
        { status: 404 }
      );
    }

    if (!person) {
      return NextResponse.json(
        { message: "Person not found" },
        { status: 404 }
      );
    }

    // Validate electricity calculation
    const expectedElectricityCost = Math.round(Number(electricity_units) * 13 * 100) / 100;
    if (Math.abs(electricity_cost - expectedElectricityCost) > 0.01) {
      return NextResponse.json(
        { message: "Electricity cost calculation is incorrect" },
        { status: 400 }
      );
    }

    // Validate total calculation (monthly charges only, not including previous balance)
    const expectedTotal = Math.round((Number(electricity_cost) + Number(water_cost) + Number(rent_cost)) * 100) / 100;
    const totalAmountNum = Math.round(Number(total_amount) * 100) / 100;

    if (Math.abs(totalAmountNum - expectedTotal) > 0.01) {
      return NextResponse.json(
        { message: "Total amount calculation is incorrect", expectedTotal, received: totalAmountNum },
        { status: 400 }
      );
    }

    // Calculate the actual total due (including previous balance)
    const totalDue = Math.round((Number(total_amount) + Number(previous_balance || 0)) * 100) / 100;
    const actualRemainingBalance = Math.round((totalDue - Number(amount_paid)) * 100) / 100;

    // Define tolerance for floating point precision
    const TOLERANCE = 0.01;

    // Determine payment status based on actual remaining balance
    let paymentStatus = status || "completed";
    const paidAmount = Math.round(Number(amount_paid) * 100) / 100;

    // Status is based on remaining balance, not just current payment
    if (actualRemainingBalance > TOLERANCE) {
      paymentStatus = "partial";
    } else if (actualRemainingBalance < -TOLERANCE) {
      paymentStatus = "overpaid";
    } else {
      paymentStatus = "completed";
    }

    // Validate enum just before save
    const validStatuses = ["pending", "completed", "partial", "overpaid", "failed", "refunded"];
    if (!validStatuses.includes(paymentStatus)) {
      console.warn(`Invalid status detected: ${paymentStatus}, defaulting to completed.`);
      paymentStatus = "completed";
    }

    console.log("Determined paymentStatus:", paymentStatus);

    // Create payment record
    const paymentData = {
      room_id,
      person_id,
      room_readable_id: room.readable_id,
      person_name: person.name,
      payment_month, // BS format: YYYY-MM
      payment_month_name, // e.g., "Kartik 2081"
      payment_month_name_nepali: payment_month_name_nepali || null, // e.g., "कार्तिक"
      electricity_units: Math.round(Number(electricity_units) * 100) / 100,
      electricity_cost: Math.round(Number(electricity_cost) * 100) / 100,
      water_cost: Math.round(Number(water_cost) * 100) / 100,
      rent_cost: Math.round(Number(rent_cost) * 100) / 100,
      total_amount: Math.round(Number(total_amount) * 100) / 100,
      amount_paid: Math.round(Number(amount_paid) * 100) / 100,
      remaining_balance: Math.round(Number(actualRemainingBalance) * 100) / 100,
      previous_balance: Math.round(Number(previous_balance || 0) * 100) / 100,
      payment_date_bs: payment_date_bs || null,
      payment_method: payment_method || "cash",
      notes: notes || null,
      status: paymentStatus
    };

    const payment = await paymentModel.create(paymentData);

    return NextResponse.json({
      message: "Payment processed successfully",
      data: payment
    }, { status: 201 });

  } catch (error: any) {
    console.error("Payment processing error:", error);
    return NextResponse.json(
      { message: "Error processing payment", error: error.message },
      { status: 500 }
    );
  }
}


export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json(
        { message: "_id is required" },
        { status: 400 }
      );
    }

    // Update payment record
    const payment = await paymentModel.findByIdAndUpdate(
      _id,
      { $set: updateData },
      { new: true }
    );

    if (!payment) {
      return NextResponse.json(
        { message: "Payment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Payment updated successfully",
      data: payment
    });

  } catch (error: any) {
    return NextResponse.json(
      { message: "Error updating payment", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { _id } = body;

    if (!_id) {
      return NextResponse.json(
        { message: "_id is required" },
        { status: 400 }
      );
    }

    const payment = await paymentModel.findByIdAndDelete(_id);

    if (!payment) {
      return NextResponse.json(
        { message: "Payment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Payment deleted successfully",
      data: payment
    });

  } catch (error: any) {
    return NextResponse.json(
      { message: "Error deleting payment", error: error.message },
      { status: 500 }
    );
  }
}
