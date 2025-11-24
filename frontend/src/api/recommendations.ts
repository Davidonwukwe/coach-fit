// src/api/recommendations.ts
import { api } from "./http";

export interface RecommendationResponse {
  recommendations: string;
}

/**
 * Fetch AI-powered recommendations for the logged-in user.
 * Uses the shared `api` instance so token is automatically included.
 */
export const fetchRecommendations = async (): Promise<RecommendationResponse> => {
  return api.get<RecommendationResponse>("/recommendations");
};