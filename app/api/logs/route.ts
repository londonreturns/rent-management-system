import { connectDB } from "@/config/db";
import logModel from "@/models/log";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

connectDB();

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get("limit") || "200");
        const page = parseInt(url.searchParams.get("page") || "1");
        const skip = (page - 1) * limit;
        const logs = await logModel.find({}).sort({ created_at: -1 }).skip(skip).limit(limit).lean();
        const total = await logModel.countDocuments({});
        return NextResponse.json({
            message: "Logs fetched successfully",
            data: logs,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error: any) {
        return NextResponse.json({ message: "Error fetching logs", error: error.message }, { status: 500 });
    }
}


