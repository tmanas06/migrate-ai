// ============================================================
// POST /api/generate-pr – PR description generator
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { generatePRDescription } from "@/lib/ai";
import type { MigrationType, ApiError } from "@/lib/types";

interface GeneratePRRequest {
  migrationType: MigrationType;
  summary: string;
  filesChanged: number;
  linesAdded: number;
  linesRemoved: number;
  breakingChanges: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GeneratePRRequest;

    const {
      migrationType,
      summary,
      filesChanged,
      linesAdded,
      linesRemoved,
      breakingChanges,
    } = body;

    if (!migrationType || !summary) {
      return NextResponse.json<ApiError>(
        { error: "Missing required fields: migrationType, summary" },
        { status: 400 }
      );
    }

    const prDescription = await generatePRDescription(
      migrationType,
      summary,
      filesChanged,
      linesAdded,
      linesRemoved,
      breakingChanges || []
    );

    return NextResponse.json({ prDescription });
  } catch (error) {
    // If no API key, return a helpful fallback
    if (
      error instanceof Error &&
      error.message.includes("GROQ_API_KEY")
    ) {
      return NextResponse.json<ApiError>(
        {
          error: "API key not configured",
          details: "Set GROQ_API_KEY in your .env file to enable AI-generated PR descriptions.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiError>(
      {
        error: "Failed to generate PR description",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
