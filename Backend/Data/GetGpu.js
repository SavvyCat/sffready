import supabase from "../supabase";

export default async function getFilteredGPUs(partialMatch) {
  // Apply the 'ilike' filter for case-insensitive matching with a wildcard
  let match = "";
  let toggle = false;

  for (let x = 0; x < partialMatch.length; x++) {
    if (
      (partialMatch[x] >= "a" && partialMatch[x] <= "z") ||
      (partialMatch[x] >= "A" && partialMatch[x] <= "Z")
    ) {
      match += partialMatch[x];
      toggle = false;
    } else if (!toggle) {
      if (partialMatch[x] == " ") continue;
      match += " ";
      toggle = true; // Add this to avoid multiple spaces in a row
      x--;
    } else {
      match += partialMatch[x];
    }
  }
  console.log(match);
  match = "";
  toggle = false;
  for (let x = 0; x < partialMatch.length; x++) {
    if (partialMatch[x] >= "0" && partialMatch[x] <= "9") {
      match += partialMatch[x];
      toggle = false;
    } else if (!toggle) {
      if (partialMatch[x] == " ") continue;
      match += " ";
      toggle = true; // Add this to avoid multiple spaces in a row
      x--;
    } else {
      match += partialMatch[x];
    }
  }
  console.log(match);

  let query = supabase.from("GPU").select("*").ilike("title", `%${match}%`); // `%` is a wildcard that matches any sequence of characters after the input

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching GPUs:", error);
    return [];
  }
  console.log(data);
  return data;
}
