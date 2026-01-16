/**
 * Workflow State Machine
 *
 * Manages session workflow state transitions and triggers actions
 * based on external events (like webhook callbacks).
 *
 * @module lib/orchestrator/state-machine
 */

import { SessionsRepository } from "@/lib/db/sessions";
import { CallsRepository } from "@/lib/db/calls";
import { OpenRouterService } from "@/lib/services/openrouter";
import type { Session } from "@/lib/types/session";
import type { Call } from "@/lib/types/call";

/**
 * Report system prompt for Claude.
 */
const REPORT_SYSTEM_PROMPT = `You are a helpful assistant that creates auto repair quote comparison reports.
Analyze the call transcripts and extracted data to produce a structured report.

Output JSON with this exact schema:
{
  "summary": "Brief overview of the quotes obtained",
  "quotes": [
    {
      "shop_id": "string",
      "shop_name": "string",
      "price_range": { "low": number | null, "high": number | null },
      "timeframe_days": number | null,
      "can_do_work": boolean,
      "requires_inspection": boolean,
      "notes": "string",
      "recommendation_score": number (1-10, based on price, time, and availability)
    }
  ],
  "best_pick": {
    "by_price": "shop_id of cheapest option or null if no quotes",
    "by_time": "shop_id of fastest option or null if no timeframes",
    "overall": "shop_id of best overall value or null"
  },
  "disclaimer": "These are rough estimates based on phone conversations. Actual prices may vary after in-person inspection. Always get a written quote before authorizing repairs."
}

Guidelines for recommendation_score:
- 9-10: Excellent price, quick turnaround, confirmed availability
- 7-8: Good price or quick turnaround
- 5-6: Average, requires inspection but seems capable
- 3-4: Limited info or higher prices
- 1-2: Cannot do work or very unfavorable`;

/**
 * Checks if all calls for a session are complete and triggers summarization.
 * This is called by the Vapi webhook handler when calls end.
 *
 * @param sessionId - Session ID to check
 */
export async function checkSessionCompletion(sessionId: string): Promise<void> {
  const calls = await CallsRepository.getBySession(sessionId);
  const allComplete = calls.every((c) =>
    ["COMPLETED", "FAILED"].includes(c.status)
  );

  if (!allComplete) {
    const remaining = calls.filter(
      (c) => !["COMPLETED", "FAILED"].includes(c.status)
    ).length;
    console.log(
      `[StateMachine] Session ${sessionId}: ${remaining} calls still in progress`
    );
    return;
  }

  console.log(
    `[StateMachine] Session ${sessionId}: All calls complete, generating report`
  );

  try {
    // Update status to SUMMARIZING
    await SessionsRepository.updateStatus(sessionId, "SUMMARIZING");

    // Generate the final report
    await generateFinalReport(sessionId, calls);

    // Update status to DONE
    await SessionsRepository.updateStatus(sessionId, "DONE");
    console.log(`[StateMachine] Session ${sessionId}: Report complete`);
  } catch (error) {
    console.error(
      `[StateMachine] Session ${sessionId}: Report generation failed:`,
      error
    );
    await SessionsRepository.updateStatus(sessionId, "FAILED");
  }
}

/**
 * Generates the final comparison report from all call results.
 *
 * @param sessionId - Session ID
 * @param calls - Array of call records
 */
async function generateFinalReport(
  sessionId: string,
  calls: Call[]
): Promise<void> {
  const session = await SessionsRepository.get(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  const completedCalls = calls.filter((c) => c.status === "COMPLETED");

  if (completedCalls.length === 0) {
    // No successful calls, create a minimal report
    const report = {
      summary: "Unfortunately, none of the calls were successful. Please try again or contact the shops directly.",
      quotes: [],
      best_pick: {
        by_price: null,
        by_time: null,
        overall: null,
      },
      disclaimer: "No quotes were obtained. Please contact shops directly for estimates.",
    };
    await SessionsRepository.update(sessionId, { report });
    return;
  }

  // Build prompt with call data
  const reportPrompt = buildReportPrompt(session, completedCalls);

  // Generate report with Claude
  const reportJson = await OpenRouterService.chat(
    [
      { role: "system", content: REPORT_SYSTEM_PROMPT },
      { role: "user", content: reportPrompt },
    ],
    { thinking: { enabled: true }, jsonMode: true, maxTokens: 8192 }
  );

  const report = JSON.parse(reportJson);

  // Save report to session
  await SessionsRepository.update(sessionId, { report });
}

/**
 * Builds the prompt for report generation.
 *
 * @param session - Session data
 * @param calls - Completed call records
 * @returns Formatted prompt string
 */
function buildReportPrompt(session: Session, calls: Call[]): string {
  const callSummaries = calls.map((call) => {
    const shop = session.shops.find((s) => s.id === call.shop_id);
    return `
=== Shop: ${shop?.name ?? call.shop_id} ===
Phone: ${shop?.phone ?? "Unknown"}

Transcript:
${call.transcript ?? "No transcript available"}

Extracted Data:
${JSON.stringify(call.structured_data ?? {}, null, 2)}

Call Summary:
${call.summary ?? "No summary available"}

Call Duration: ${call.duration_seconds ? `${call.duration_seconds} seconds` : "Unknown"}
`;
  });

  const vehicleInfo = session.vehicle
    ? `${session.vehicle.year ?? "Unknown year"} ${session.vehicle.make ?? "Unknown make"} ${session.vehicle.model ?? "Unknown model"}`
    : "Not specified";

  return `
## Damage Information

${session.damage_summary?.description ?? session.description_raw}

Severity: ${session.damage_summary?.severity ?? "Unknown"}
Affected Areas: ${session.damage_summary?.affected_areas?.join(", ") ?? "Not specified"}
Estimated Repair Type: ${session.damage_summary?.estimated_repair_type ?? "Not specified"}

## Vehicle Information

${vehicleInfo}

## Location

${session.location}

## Call Results (${calls.length} calls completed)

${callSummaries.join("\n---\n")}

## Instructions

Based on the above call results, generate a comprehensive comparison report:
1. Summarize the overall results
2. List each shop's quote with extracted information
3. Assign a recommendation score (1-10) based on price, timeframe, and capability
4. Identify the best picks for price, time, and overall value
5. Include an appropriate disclaimer
`;
}

/**
 * Resumes a workflow after receiving an image prompt from Freepik.
 * Called by the Freepik webhook handler.
 *
 * @param sessionId - Session ID to resume
 * @param imagePrompt - Generated image description
 */
export async function resumeAfterImagePrompt(
  sessionId: string,
  imagePrompt: string
): Promise<void> {
  console.log(
    `[StateMachine] Session ${sessionId}: Received image prompt, resuming workflow`
  );

  const session = await SessionsRepository.get(sessionId);
  if (!session) {
    console.error(`[StateMachine] Session not found: ${sessionId}`);
    return;
  }

  // Only resume if still in ANALYZING state
  if (session.status !== "ANALYZING") {
    console.log(
      `[StateMachine] Session ${sessionId}: Not in ANALYZING state, skipping resume`
    );
    return;
  }

  try {
    // Save image prompt
    await SessionsRepository.update(sessionId, { image_prompt: imagePrompt });

    // Generate damage summary now that we have the image prompt
    const summary = await OpenRouterService.generateDamageSummary(
      session.description_raw,
      imagePrompt,
      session.vehicle
    );

    await SessionsRepository.update(sessionId, { damage_summary: summary });
    console.log(
      `[StateMachine] Session ${sessionId}: Damage summary generated after image prompt`
    );

    // Note: The workflow will need to be manually continued to the CALLING phase
    // This could be done automatically here or by a separate process
  } catch (error) {
    console.error(
      `[StateMachine] Session ${sessionId}: Failed to resume after image prompt:`,
      error
    );
    await SessionsRepository.updateStatus(sessionId, "FAILED");
  }
}
