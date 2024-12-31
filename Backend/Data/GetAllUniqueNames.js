import supabase from "../supabase";

export default async function GetAllUniqueNames() {
  try {
    // Query the 'GPU' table and get all entries in the 'category' column
    let { data, error } = await supabase.from("GPU").select("category");

    if (error) {
      console.error("Error fetching data:", error);
      return [];
    }

    // Filter unique names using a Set
    const uniqueCategories = Array.from(
      new Set(data.map((item) => item.category))
    );

    return uniqueCategories; // Return an array of unique names
  } catch (error) {
    console.error("Unexpected error:", error);
    return [];
  }
}
