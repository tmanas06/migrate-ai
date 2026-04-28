// ============================================================
// GET /api/stream-logs – SSE streaming endpoint
// ============================================================
import { NextRequest } from "next/server";
import { getLogs, subscribeLogs } from "@/lib/log-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const migrationId = request.nextUrl.searchParams.get("id");

  if (!migrationId) {
    return new Response("Missing migration id", { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send existing logs first
      const existingLogs = getLogs(migrationId);
      for (const log of existingLogs) {
        const data = `data: ${JSON.stringify(log)}\n\n`;
        controller.enqueue(encoder.encode(data));
      }

      // Subscribe to new logs
      const unsubscribe = subscribeLogs(migrationId, (event) => {
        try {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));

          // If migration is complete or errored, close the stream
          if (event.status === "done" && event.step === "complete") {
            setTimeout(() => {
              try {
                controller.close();
              } catch {
                // Stream already closed
              }
            }, 500);
          }
        } catch {
          // Stream might be closed by client
          unsubscribe();
        }
      });

      // Clean up when the request is aborted
      request.signal.addEventListener("abort", () => {
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
