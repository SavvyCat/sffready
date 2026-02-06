import { createClient } from "@supabase/supabase-js";

// Load environment variables
const envPath = new URL("../.env.local", import.meta.url);
const envFile = await import("fs").then((fs) =>
  fs.promises.readFile(new URL(envPath), "utf-8")
);

const env = {};
envFile.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const [key, ...valueParts] = trimmed.split("=");
    env[key.trim()] = valueParts.join("=").trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BACKEND_URL = "https://backend-ochre-tau-58.vercel.app/case";
const DELAY_MS = 1000; // 1 second delay between API calls to avoid rate limiting

function extractCaseName(url) {
  if (!url) return null;

  // Same logic as Modal.js: url.split("abee/")[1]
  const parts = url.split("abee/");
  if (parts.length > 1) {
    return parts[1];
  }

  // Fallback: try to extract from caseend.com URL pattern
  const caseendMatch = url.match(/caseend\.com\/(?:api\/)?cases\/(.+)/);
  if (caseendMatch) {
    return caseendMatch[1].replace(/\?.*$/, ""); // Remove query params
  }

  return null;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchCaseDetails(caseName) {
  const response = await fetch(`${BACKEND_URL}?name=${encodeURIComponent(caseName)}`);

  if (!response.ok) {
    throw new Error(`API returned ${response.status}: ${response.statusText}`);
  }

  const text = await response.text();
  if (!text || text.trim() === "") {
    throw new Error("API returned empty response");
  }

  return JSON.parse(text);
}

function mapApiDataToRow(imageId, apiData) {
  const detail = apiData.detail || {};
  const result = apiData.modes?.results?.[0] || {};

  return {
    image_id: imageId,
    product_name: detail.name || null,
    url: detail.url || null,
    eol: detail.eol || false,
    width: result.width || null,
    depth: result.depth || null,
    height: result.height || null,
    volume: result.volume || null,
    skeleton_material: result.skeleton_material || null,
    shell_material: result.shell_material || null,
    open_panel: result.open_panel || false,
    solid_panel: result.solid_panel || false,
    mesh_panel: result.mesh_panel || false,
    transparent_panel: result.transparent_panel || false,
    motherboard_width: result.motherboard_width || null,
    motherboard_length: result.motherboard_length || null,
    psu_width: result.psu_width || null,
    psu_height: result.psu_height || null,
    psu_length: result.psu_length || null,
    cpu_height: result.cpu_height || null,
    l240: result.l240 || false,
    l280: result.l280 || false,
    l360: result.l360 || false,
    gpu_width: result.gpu_width || null,
    gpu_height: result.gpu_height || null,
    gpu_length: result.gpu_length || null,
    pcie_riser: result.pcie_riser || false,
    slot: result.slot || null,
    low_profile_slot: result.low_profile_slot || null,
    extra_slot: result.extra_slot || null,
    extra_low_profile_slot: result.extra_low_profile_slot || null,
    usb_c: result.usb_c || false,
  };
}

async function main() {
  console.log("=== Case Details Import Script ===\n");

  // Step 1: Fetch all cases from CASES table
  console.log("Fetching all cases from CASES table...");
  const { data: cases, error: fetchError } = await supabase
    .from("CASES")
    .select("*")
    .order("image_id", { ascending: true });

  if (fetchError) {
    console.error("Error fetching cases:", fetchError.message);
    process.exit(1);
  }

  console.log(`Found ${cases.length} cases in the database.\n`);

  let success = 0;
  let failed = 0;
  let skipped = 0;
  const failedCases = [];

  // Step 2: Process each case
  for (let i = 0; i < cases.length; i++) {
    const caseItem = cases[i];
    const caseName = extractCaseName(caseItem.url);

    console.log(
      `[${i + 1}/${cases.length}] Processing: ${caseItem.product_name} (image_id: ${caseItem.image_id})`
    );

    if (!caseName) {
      console.log(`  SKIPPED - Could not extract case name from URL: ${caseItem.url}`);
      skipped++;
      continue;
    }

    try {
      // Call backend API
      const apiData = await fetchCaseDetails(caseName);

      // Map data to table row
      const row = mapApiDataToRow(caseItem.image_id, apiData);

      // Upsert into case_details table (update if image_id already exists)
      const { error: upsertError } = await supabase
        .from("case_details")
        .upsert(row, { onConflict: "image_id" });

      if (upsertError) {
        throw new Error(`Supabase upsert error: ${upsertError.message}`);
      }

      console.log(`  SUCCESS - ${row.product_name}`);
      success++;
    } catch (err) {
      console.log(`  FAILED - ${err.message}`);
      failed++;
      failedCases.push({
        image_id: caseItem.image_id,
        product_name: caseItem.product_name,
        error: err.message,
      });
    }

    // Delay between requests to avoid rate limiting
    if (i < cases.length - 1) {
      await delay(DELAY_MS);
    }
  }

  // Step 3: Print summary
  console.log("\n=== Import Complete ===");
  console.log(`Total cases: ${cases.length}`);
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);
  console.log(`Skipped: ${skipped}`);

  if (failedCases.length > 0) {
    console.log("\nFailed cases:");
    failedCases.forEach((fc) => {
      console.log(`  - ${fc.product_name} (${fc.image_id}): ${fc.error}`);
    });
  }
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
