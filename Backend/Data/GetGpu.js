import supabase from "../supabase";

export default async function getFilteredGPUs(partialMatch) {
  // Apply the 'ilike' filter for case-insensitive matching with a wildcard
  let query = supabase
    .from("GPU")
    .select("*")
    .ilike("title", `%${partialMatch}%`); // `%` is a wildcard that matches any sequence of characters after the input

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching GPUs:", error);
    return [];
  }
  console.log(data);
  return data;
}
