import { NextResponse } from "next/server";
import supabase from "@/Backend/supabase";

export async function POST(request) {
  try {
    console.log("API Route hit: /api/request-case");
    const formData = await request.formData();
    console.log("FormData received");

    // Extract all form fields
    const caseData = {
      product_name: formData.get("product_name"),
      url: formData.get("url"),
      eol: formData.get("eol") === "true",
      length: parseFloat(formData.get("length")),
      height: parseFloat(formData.get("height")),
      slots: parseFloat(formData.get("slots")),
      width: parseFloat(formData.get("width")) || null,
      depth: parseFloat(formData.get("depth")) || null,
      volume: parseFloat(formData.get("volume")) || null,
      skeleton_material: parseInt(formData.get("skeleton_material")) || 3,
      shell_material: parseInt(formData.get("shell_material")) || 3,
      open_panel: formData.get("open_panel") === "true",
      solid_panel: formData.get("solid_panel") === "true",
      mesh_panel: formData.get("mesh_panel") === "true",
      transparent_panel: formData.get("transparent_panel") === "true",
      motherboard_width: parseFloat(formData.get("motherboard_width")) || null,
      motherboard_length: parseFloat(formData.get("motherboard_length")) || null,
      psu_width: parseFloat(formData.get("psu_width")) || null,
      psu_height: parseFloat(formData.get("psu_height")) || null,
      psu_length: parseFloat(formData.get("psu_length")) || null,
      cpu_height: parseFloat(formData.get("cpu_height")) || null,
      l240: formData.get("l240") === "true",
      l280: formData.get("l280") === "true",
      l360: formData.get("l360") === "true",
      gpu_width: parseFloat(formData.get("gpu_width")) || null,
      gpu_height: parseFloat(formData.get("gpu_height")) || null,
      gpu_length: parseFloat(formData.get("gpu_length")) || null,
      slot: parseInt(formData.get("slot")) || null,
      low_profile_slot: parseInt(formData.get("low_profile_slot")) || null,
      extra_slot: parseInt(formData.get("extra_slot")) || null,
      extra_low_profile_slot:
        parseInt(formData.get("extra_low_profile_slot")) || null,
      pcie_riser: formData.get("pcie_riser") === "true",
      usb_c: formData.get("usb_c") === "true",
      status: "pending",
      // created_at will be set automatically by database DEFAULT
    };

    // Collect images and upload to storage
    const images = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("image_") && value instanceof File) {
        images.push(value);
      }
    }

    // Upload images to storage and get URLs
    const imageUrls = [];
    if (images.length > 0) {
      const timestamp = Date.now();
      console.log(`Uploading ${images.length} images to storage`);

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const bytes = await image.arrayBuffer();

        // Create unique filename
        const fileExtension = image.type.split('/')[1] || 'png';
        const fileName = `pending_${timestamp}_${i + 1}.${fileExtension}`;
        const filePath = `case-requests/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('case-images')
          .upload(filePath, bytes, {
            contentType: image.type,
            upsert: false
          });

        if (uploadError) {
          console.error(`Error uploading image ${i + 1}:`, uploadError);
          throw new Error(`Failed to upload image ${i + 1}: ${uploadError.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('case-images')
          .getPublicUrl(filePath);

        imageUrls.push(urlData.publicUrl);
        console.log(`Uploaded image ${i + 1} to:`, urlData.publicUrl);
      }
    }

    caseData.images = JSON.stringify(imageUrls);
    console.log(`Processed ${imageUrls.length} images`);
    console.log("Case data prepared:", { ...caseData, images: `${imageUrls.length} image URLs` });

    // Insert into case_requests table
    console.log("Inserting into Supabase...");
    const { data, error } = await supabase
      .from("case_requests")
      .insert([caseData])
      .select();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("Successfully inserted into database:", data);
    return NextResponse.json(
      { message: "Request submitted successfully", data },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
