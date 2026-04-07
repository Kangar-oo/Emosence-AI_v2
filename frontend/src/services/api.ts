// this is the old V1 api service — keeping it around temporarily
// in case something still imports it, but it should be dead code now
// the SSE streaming hook handles all backend communication in V2

import { AnalysisResult } from "../types";

const LOCAL_SERVER_URL = "http://localhost:8000/api/analyze";

// TODO: delete this file once we're sure nothing still references it
export const analyzeEmotionAndChat = async (
  text: string,
  imageBase64: string | null
): Promise<AnalysisResult> => {
  try {
    const response = await fetch(LOCAL_SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, image: imageBase64 }),
    });

    if (!response.ok) throw new Error("Backend Error");

    const data = await response.json();
    return {
      text: data.response,
      mood: data.mood,
      analysis: data.analysis
    };
  } catch (error) {
    console.error("Connection Error:", error);
    return {
      text: "Can't reach the local backend. Is server.py running?",
      mood: "Neutral",
      analysis: "Offline"
    };
  }
};