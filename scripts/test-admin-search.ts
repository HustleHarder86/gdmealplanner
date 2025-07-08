async function testAdminSearch() {
  const baseUrl = "http://localhost:3000";

  try {
    console.log("Testing admin recipe search...");

    const params = new URLSearchParams({
      query: "chicken",
      maxCarbs: "45",
      maxReadyTime: "60",
      number: "5",
    });

    const response = await fetch(
      `${baseUrl}/api/admin/recipes/search-spoonacular?${params}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log("Search Results:");
    console.log(
      `Total results: ${data.totalResults || data.results?.length || 0}`,
    );

    if (data.results && data.results.length > 0) {
      console.log("\nFirst 3 recipes:");
      data.results.slice(0, 3).forEach((recipe: any, index: number) => {
        console.log(`\n${index + 1}. ${recipe.title}`);
        console.log(`   Ready in: ${recipe.readyInMinutes} minutes`);
        console.log(`   Carbs: ${recipe.carbAmount || "N/A"}g`);
        console.log(`   GD Compliant: ${recipe.gdCompliant ? "Yes" : "No"}`);
      });
    } else {
      console.log("No recipes found");
    }
  } catch (error) {
    console.error("Error testing admin search:", error);
  }
}

// Run the test
testAdminSearch();
