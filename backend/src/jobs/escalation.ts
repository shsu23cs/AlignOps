import { FastifyInstance } from "fastify";
import { EscalationType } from "@prisma/client";

/**
 * Automated Rule-Based Escalation Job
 * Runs periodically to check for missed submissions, unapproved sheets, and generate HR alerts.
 */
export function startEscalationJobs(fastify: FastifyInstance) {
  // Run every 10 seconds in development for testing, otherwise every 12 hours
  const INTERVAL = process.env.NODE_ENV === "development" ? 10 * 1000 : 12 * 60 * 60 * 1000;

  fastify.log.info(`Escalation jobs scheduled to run every ${INTERVAL}ms`);

  setInterval(async () => {
    try {
      const prisma = fastify.prisma;
      const now = new Date();

      // Look for active cycles
      const activeCycles = await prisma.cycle.findMany({
        where: { isActive: true },
      });

      for (const cycle of activeCycles) {
        // 1. Missed Submission (DRAFT sheets near or past deadline)
        const draftSheets = await prisma.goalSheet.findMany({
          where: {
            cycleId: cycle.id,
            status: "DRAFT",
          },
          include: { employee: true },
        });

        for (const sheet of draftSheets) {
          // Check if already reminded
          const existing = await prisma.escalationLog.findFirst({
            where: { type: "MISSED_SUBMISSION", userId: sheet.employeeId, cycleId: cycle.id }
          });
          
          if (!existing) {
             const daysLeft = Math.ceil((cycle.windowClose.getTime() - now.getTime()) / (1000 * 3600 * 24));
             // Trigger reminder if 3 days or less remaining, or already past
             if (daysLeft <= 3) {
               const msg = `Reminder: You have ${daysLeft > 0 ? daysLeft + ' days' : 'missed the deadline'} to submit your goals for ${cycle.phase}.`;
               await prisma.escalationLog.create({
                 data: {
                   type: "MISSED_SUBMISSION",
                   userId: sheet.employeeId,
                   cycleId: cycle.id,
                   message: msg,
                 }
               });
               fastify.log.info(`Escalation: Reminded user ${sheet.employee.name} for missed submission.`);
               
               // MS Teams Notification
               import("../lib/teams").then(async (teams) => {
                 teams.notifyEscalation(sheet.employee, "MISSED_SUBMISSION", msg);
               }).catch(console.error);
             }
          }
        }

        // 2. Unapproved Sheets (PENDING_APPROVAL > 3 days)
        const pendingSheets = await prisma.goalSheet.findMany({
          where: {
            cycleId: cycle.id,
            status: "PENDING_APPROVAL",
            submittedAt: {
              lt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
            }
          },
          include: { employee: true }
        });

        for (const sheet of pendingSheets) {
          if (!sheet.employee.managerId) continue;
          
          const existing = await prisma.escalationLog.findFirst({
            where: { type: "UNAPPROVED_SHEET", userId: sheet.employee.managerId, cycleId: cycle.id }
          });

          if (!existing) {
            const msg = `Reminder: Goal sheet for ${sheet.employee.name} has been pending approval for over 3 days.`;
            await prisma.escalationLog.create({
              data: {
                type: "UNAPPROVED_SHEET",
                userId: sheet.employee.managerId,
                cycleId: cycle.id,
                message: msg,
              }
            });
            fastify.log.info(`Escalation: Reminded manager ${sheet.employee.managerId} for unapproved sheet.`);
            
            // MS Teams Notification
            import("../lib/teams").then(async (teams) => {
              const manager = await prisma.user.findUnique({ where: { id: sheet.employee.managerId! } });
              if (manager) {
                teams.notifyEscalation(manager, "UNAPPROVED_SHEET", msg);
              }
            }).catch(console.error);
          }

          // 3. HR Alert (PENDING_APPROVAL > 7 days)
          const daysPending = Math.ceil((now.getTime() - (sheet.submittedAt?.getTime() || 0)) / (1000 * 3600 * 24));
          if (daysPending > 7) {
             const existingHr = await prisma.escalationLog.findFirst({
               where: { type: "HR_ALERT", userId: sheet.employee.managerId, cycleId: cycle.id } 
             });
             
             if (!existingHr) {
               const hrMsg = `HR Alert: Manager has ignored goal sheet approval for ${sheet.employee.name} for over 7 days.`;
               await prisma.escalationLog.create({
                 data: {
                   type: "HR_ALERT",
                   userId: sheet.employee.managerId,
                   cycleId: cycle.id,
                   message: hrMsg,
                 }
               });
               fastify.log.warn(`HR Alert generated: Manager ${sheet.employee.managerId} ignored approval for ${sheet.employee.name}`);

               // MS Teams Notification to HR/Admin
               import("../lib/teams").then(async (teams) => {
                 const manager = await prisma.user.findUnique({ where: { id: sheet.employee.managerId! } });
                 if (manager) {
                   teams.notifyEscalation(manager, "HR_ALERT", hrMsg);
                 }
               }).catch(console.error);
             }
          }
        }
      }
    } catch (err) {
      fastify.log.error(err, "Failed to run escalation jobs");
    }
  }, INTERVAL);
}
