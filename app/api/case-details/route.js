import { NextResponse } from "next/server";
import supabase from "@/Backend/supabase";

function formatCaseData(row) {
  return {
    detail: {
      name: row.product_name,
      url: row.url,
      eol: row.eol,
    },
    modes: {
      results: [
        {
          width: row.width,
          depth: row.depth,
          height: row.height,
          volume: row.volume,
          skeleton_material: row.skeleton_material,
          shell_material: row.shell_material,
          open_panel: row.open_panel,
          solid_panel: row.solid_panel,
          mesh_panel: row.mesh_panel,
          transparent_panel: row.transparent_panel,
          motherboard_width: row.motherboard_width,
          motherboard_length: row.motherboard_length,
          psu_width: row.psu_width,
          psu_height: row.psu_height,
          psu_length: row.psu_length,
          cpu_height: row.cpu_height,
          l240: row.l240,
          l280: row.l280,
          l360: row.l360,
          gpu_width: row.gpu_width,
          gpu_height: row.gpu_height,
          gpu_length: row.gpu_length,
          pcie_riser: row.pcie_riser,
          slot: row.slot,
          low_profile_slot: row.low_profile_slot,
          extra_slot: row.extra_slot,
          extra_low_profile_slot: row.extra_low_profile_slot,
          usb_c: row.usb_c,
          psu_compatibility: row.psu_compatibility,
        },
      ],
    },
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get("imageId");

    if (!imageId) {
      return NextResponse.json(
        { error: "imageId is required" },
        { status: 400 }
      );
    }

    console.log("Fetching case details for image_id:", imageId, "type:", typeof imageId);

    // 1. Try casesdetails table first
    const numericId = Number(imageId);
    const { data: caseDetails, error: detailError } = await supabase
      .from("casesdetails")
      .select("*")
      .eq("image_id", numericId);

    console.log("casesdetails query result:", { numericId, count: caseDetails?.length, error: detailError?.message });

    const caseDetail = caseDetails?.[0] || null;

    if (!detailError && caseDetail) {
      console.log("Found case in casesdetails:", caseDetail.product_name);
      return NextResponse.json(
        { found: true, data: formatCaseData(caseDetail) },
        { status: 200 }
      );
    }

    // 2. Fallback to case_requests table (user-submitted approved cases)
    const { data: caseRequest, error } = await supabase
      .from("case_requests")
      .select("*")
      .eq("image_id", imageId)
      .eq("status", "approved")
      .single();

    if (!error && caseRequest) {
      console.log("Found approved case in case_requests:", caseRequest.product_name);
      return NextResponse.json(
        { found: true, data: formatCaseData(caseRequest) },
        { status: 200 }
      );
    }

    console.log("No case found for image_id:", imageId);
    return NextResponse.json(
      { found: false },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching case details:", error);
    return NextResponse.json(
      { error: "Failed to fetch case details", details: error.message },
      { status: 500 }
    );
  }
}
