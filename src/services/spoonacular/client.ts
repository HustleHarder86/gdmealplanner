import {
  SpoonacularSearchResponse,
  SpoonacularRecipeInfo,
  SpoonacularSearchParams,
  SpoonacularError,
} from "./types";

/**
 * Spoonacular API Client
 * Handles all interactions with the Spoonacular Recipe API
 */
export class SpoonacularClient {
  private readonly apiKey: string;
  private readonly baseUrl: string = "https://api.spoonacular.com";
  private readonly defaultTimeout: number = 30000; // 30 seconds

  constructor(apiKey?: string) {
    const key = apiKey || process.env.SPOONACULAR_API_KEY;
    if (!key) {
      throw new Error(
        "Spoonacular API key is required. Please set SPOONACULAR_API_KEY in your environment variables.",
      );
    }
    this.apiKey = key;
  }

  /**
   * Search for recipes with GD-specific filters
   */
  async searchRecipes(
    params: SpoonacularSearchParams,
  ): Promise<SpoonacularSearchResponse> {
    const searchParams = new URLSearchParams({
      apiKey: this.apiKey,
      // Add nutrition data to search results
      addRecipeNutrition: "true",
      // Default to 10 results
      number: (params.number || 10).toString(),
      // Apply GD-specific defaults if not provided
      minCarbs: (params.minCarbs || 10).toString(),
      maxCarbs: (params.maxCarbs || 50).toString(),
      minProtein: (params.minProtein || 5).toString(),
      minFiber: (params.minFiber || 2).toString(),
    });

    // Add optional parameters
    if (params.query) searchParams.append("query", params.query);
    if (params.cuisine) searchParams.append("cuisine", params.cuisine);
    if (params.diet) searchParams.append("diet", params.diet);
    if (params.type) searchParams.append("type", params.type);
    if (params.includeIngredients)
      searchParams.append("includeIngredients", params.includeIngredients);
    if (params.excludeIngredients)
      searchParams.append("excludeIngredients", params.excludeIngredients);
    if (params.maxReadyTime)
      searchParams.append("maxReadyTime", params.maxReadyTime.toString());
    if (params.offset) searchParams.append("offset", params.offset.toString());
    if (params.sort) searchParams.append("sort", params.sort);
    if (params.sortDirection)
      searchParams.append("sortDirection", params.sortDirection);

    const url = `${this.baseUrl}/recipes/complexSearch?${searchParams.toString()}`;

    try {
      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        const error = (await response.json()) as SpoonacularError;
        throw new Error(
          `Spoonacular API error: ${error.message || response.statusText}`,
        );
      }

      return (await response.json()) as SpoonacularSearchResponse;
    } catch (error) {
      this.handleError("searchRecipes", error);
      throw error;
    }
  }

  /**
   * Get detailed recipe information by ID
   */
  async getRecipeInfo(
    recipeId: number,
    includeNutrition: boolean = true,
  ): Promise<SpoonacularRecipeInfo> {
    const searchParams = new URLSearchParams({
      apiKey: this.apiKey,
      includeNutrition: includeNutrition.toString(),
    });

    const url = `${this.baseUrl}/recipes/${recipeId}/information?${searchParams.toString()}`;

    try {
      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        const error = (await response.json()) as SpoonacularError;
        throw new Error(
          `Spoonacular API error: ${error.message || response.statusText}`,
        );
      }

      return (await response.json()) as SpoonacularRecipeInfo;
    } catch (error) {
      this.handleError("getRecipeInfo", error);
      throw error;
    }
  }

  /**
   * Get multiple recipe details in bulk (more efficient for API quota)
   */
  async getBulkRecipeInfo(
    recipeIds: number[],
    includeNutrition: boolean = true,
  ): Promise<SpoonacularRecipeInfo[]> {
    const searchParams = new URLSearchParams({
      apiKey: this.apiKey,
      ids: recipeIds.join(","),
      includeNutrition: includeNutrition.toString(),
    });

    const url = `${this.baseUrl}/recipes/informationBulk?${searchParams.toString()}`;

    try {
      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        const error = (await response.json()) as SpoonacularError;
        throw new Error(
          `Spoonacular API error: ${error.message || response.statusText}`,
        );
      }

      return (await response.json()) as SpoonacularRecipeInfo[];
    } catch (error) {
      this.handleError("getBulkRecipeInfo", error);
      throw error;
    }
  }

  /**
   * Search recipes by nutrients (useful for precise GD requirements)
   */
  async searchByNutrients(params: {
    minCarbs?: number;
    maxCarbs?: number;
    minProtein?: number;
    minFiber?: number;
    maxCalories?: number;
    number?: number;
    offset?: number;
  }): Promise<SpoonacularRecipeInfo[]> {
    const searchParams = new URLSearchParams({
      apiKey: this.apiKey,
      number: (params.number || 10).toString(),
    });

    // Add nutrient parameters
    if (params.minCarbs)
      searchParams.append("minCarbs", params.minCarbs.toString());
    if (params.maxCarbs)
      searchParams.append("maxCarbs", params.maxCarbs.toString());
    if (params.minProtein)
      searchParams.append("minProtein", params.minProtein.toString());
    if (params.minFiber)
      searchParams.append("minFiber", params.minFiber.toString());
    if (params.maxCalories)
      searchParams.append("maxCalories", params.maxCalories.toString());
    if (params.offset) searchParams.append("offset", params.offset.toString());

    const url = `${this.baseUrl}/recipes/findByNutrients?${searchParams.toString()}`;

    try {
      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        const error = (await response.json()) as SpoonacularError;
        throw new Error(
          `Spoonacular API error: ${error.message || response.statusText}`,
        );
      }

      return (await response.json()) as SpoonacularRecipeInfo[];
    } catch (error) {
      this.handleError("searchByNutrients", error);
      throw error;
    }
  }

  /**
   * Get random recipes (useful for variety)
   */
  async getRandomRecipes(params: {
    number?: number;
    tags?: string[]; // e.g., ['breakfast', 'low-carb']
  }): Promise<{ recipes: SpoonacularRecipeInfo[] }> {
    const searchParams = new URLSearchParams({
      apiKey: this.apiKey,
      number: (params.number || 10).toString(),
      includeNutrition: "true",
    });

    if (params.tags && params.tags.length > 0) {
      searchParams.append("include-tags", params.tags.join(","));
    }

    const url = `${this.baseUrl}/recipes/random?${searchParams.toString()}`;

    try {
      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        const error = (await response.json()) as SpoonacularError;
        throw new Error(
          `Spoonacular API error: ${error.message || response.statusText}`,
        );
      }

      return (await response.json()) as { recipes: SpoonacularRecipeInfo[] };
    } catch (error) {
      this.handleError("getRandomRecipes", error);
      throw error;
    }
  }

  /**
   * Fetch with timeout to prevent hanging requests
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.defaultTimeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });
      return response;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Centralized error handling with logging
   */
  private handleError(method: string, error: unknown): void {
    const timestamp = new Date().toISOString();
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error(`[${timestamp}] SpoonacularClient.${method} error:`, {
      method,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // In production, you might want to send this to a logging service
    // Example: logToSentry({ method, error: errorMessage, timestamp });
  }

  /**
   * Check API quota status (optional - depends on your plan)
   */
  async getQuotaStatus(): Promise<{
    used: number;
    limit: number;
    remaining: number;
  }> {
    // Note: This endpoint might not be available on all plans
    const url = `${this.baseUrl}/console/usage?apiKey=${this.apiKey}`;

    try {
      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        console.warn("Unable to fetch quota status");
        return { used: 0, limit: 0, remaining: 0 };
      }

      const data = await response.json();
      return {
        used: data.used || 0,
        limit: data.limit || 0,
        remaining: (data.limit || 0) - (data.used || 0),
      };
    } catch (error) {
      console.warn("Error fetching quota status:", error);
      return { used: 0, limit: 0, remaining: 0 };
    }
  }
}
