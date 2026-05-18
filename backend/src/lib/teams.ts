// Microsoft Teams Integration (Adaptive Cards via Webhook)
import { User, GoalSheetStatus } from "@prisma/client";

const TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL || "";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

/**
 * Helper to send adaptive card to Teams Webhook
 */
async function sendAdaptiveCard(title: string, summary: string, facts: { title: string, value: string }[], actionUrl: string, actionTitle: string) {
  if (!TEAMS_WEBHOOK_URL) {
    console.warn("[Teams] TEAMS_WEBHOOK_URL not set. Skipping notification:", title);
    return;
  }

  const payload = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: [
            {
              type: "TextBlock",
              text: title,
              weight: "Bolder",
              size: "Medium"
            },
            {
              type: "TextBlock",
              text: summary,
              wrap: true
            },
            {
              type: "FactSet",
              facts: facts
            }
          ],
          actions: [
            {
              type: "Action.OpenUrl",
              title: actionTitle,
              url: actionUrl
            }
          ]
        }
      }
    ]
  };

  try {
    const res = await fetch(TEAMS_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      console.error("[Teams] Failed to send notification:", await res.text());
    }
  } catch (error) {
    console.error("[Teams] Error sending notification:", error);
  }
}

/**
 * Triggered when an employee submits their goal sheet.
 */
export async function notifyManagerOnSubmission(employee: Pick<User, "name" | "email">, manager: Pick<User, "name" | "email">, cycleName: string) {
  await sendAdaptiveCard(
    "Goal Sheet Submitted",
    `${employee.name} has submitted their ${cycleName} goal sheet and it is pending your approval.`,
    [
      { title: "Employee", value: employee.name },
      { title: "Cycle", value: cycleName },
      { title: "Status", value: GoalSheetStatus.PENDING_APPROVAL }
    ],
    `${FRONTEND_URL}/manager/approvals`,
    "Review in AlignOps"
  );
}

/**
 * Triggered when a manager approves or returns a goal sheet.
 */
export async function notifyEmployeeOnDecision(employee: Pick<User, "name" | "email">, manager: Pick<User, "name" | "email">, status: GoalSheetStatus, cycleName: string, returnReason?: string) {
  const isApproved = status === GoalSheetStatus.APPROVED;
  const actionText = isApproved ? "approved" : "returned";
  const facts = [
    { title: "Manager", value: manager.name },
    { title: "Cycle", value: cycleName },
    { title: "Status", value: status }
  ];

  if (!isApproved && returnReason) {
    facts.push({ title: "Reason", value: returnReason });
  }

  await sendAdaptiveCard(
    `Goal Sheet ${isApproved ? 'Approved' : 'Returned'}`,
    `Your manager, ${manager.name}, has ${actionText} your ${cycleName} goal sheet.`,
    facts,
    `${FRONTEND_URL}/employee/goals`,
    "View in AlignOps"
  );
}

/**
 * General automated escalation notification.
 */
export async function notifyEscalation(user: Pick<User, "name" | "email" | "department">, type: string, message: string) {
  await sendAdaptiveCard(
    "Escalation Alert",
    message,
    [
      { title: "Employee", value: user.name },
      { title: "Department", value: user.department },
      { title: "Type", value: type }
    ],
    `${FRONTEND_URL}/admin/dashboard`,
    "View Dashboard"
  );
}
