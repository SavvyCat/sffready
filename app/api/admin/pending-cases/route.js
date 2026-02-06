import { NextResponse } from "next/server";
import supabase from "@/Backend/supabase";

export async function GET(request) {
  try {
    // Get status filter from query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";

    let query = supabase
      .from("case_requests")
      .select("*");

    // Apply filter based on status
    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ requests: data }, { status: 200 });
  } catch (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}
