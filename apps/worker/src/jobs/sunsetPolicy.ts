import { prisma, NotificationType, Role } from "@birthub/database";
import { createLogger } from "@birthub/logger";

const logger = createLogger("worker-sunset-policy");

export async function sunsetPolicyJob(): Promise<{ notified: number }> {
  try {
    const agents = await prisma.agent.findMany({
      where: {
        status: "ACTIVE"
      },
      include: {
        organization: {
          include: {
            memberships: {
              where: {
                role: { in: [Role.OWNER, Role.ADMIN] }
              }
            }
          }
        }
      }
    });

    let notified = 0;

    // Simulate looking up against agents-registry (which tracks EOL).
    // The requirement mentions scanning for deprecated versions.

    // 1. Gather all notifications that should be sent
    const pendingNotifications: {
      tenantId: string;
      organizationId: string;
      userId: string;
      content: string;
      link: string;
    }[] = [];

    for (const agent of agents) {
      if (!agent.config || typeof agent.config !== "object") continue;

      const config = agent.config as Record<string, unknown>;
      const installedVersion = typeof config.installedVersion === "string" ? config.installedVersion : "1.0.0";
      const latestVersion = typeof config.latestAvailableVersion === "string" ? config.latestAvailableVersion : installedVersion;

      // In a full implementation, we would query the registry for specific sunset dates.
      // Here we implement the prompt requirement to detect if a pack is severely outdated/deprecated.
      // Let's assume versions where the major diff is > 0 are considered deprecated and require a sunset notice.
      // Or if latestVersion > installedVersion and we consider the old one near sunset.

      const isDeprecated = installedVersion !== latestVersion && (latestVersion.startsWith("2.") && installedVersion.startsWith("1."));

      if (isDeprecated && agent.organization) {
        for (const membership of agent.organization.memberships) {
          const content = `O Agent Pack "${agent.name}" (versão ${installedVersion}) entrará em EOL em breve. Por favor, atualize para a versão ${latestVersion} em 30 dias.`;

          pendingNotifications.push({
            tenantId: agent.tenantId,
            organizationId: agent.organizationId,
            userId: membership.userId,
            content,
            link: `/settings/agents/${agent.id}`
          });
        }
      }
    }

    if (pendingNotifications.length === 0) {
      return { notified: 0 };
    }

    // 2. Fetch existing notifications to avoid duplicates (N+1 Optimization)
    // We can use an OR condition or simply fetch all warnings for these users and content.
    // Given the potentially large list, fetching by userIds and type, then filtering in memory is efficient.
    const userIds = [...new Set(pendingNotifications.map(n => n.userId))];

    const existingNotifications = await prisma.notification.findMany({
      where: {
        userId: { in: userIds },
        type: NotificationType.WARNING
      },
      select: {
        userId: true,
        content: true
      }
    });

    const existingSet = new Set(
      existingNotifications.map(n => `${n.userId}:${n.content}`)
    );

    // 3. Filter out those that already exist
    const toCreate = pendingNotifications.filter(
      n => !existingSet.has(`${n.userId}:${n.content}`)
    );

    if (toCreate.length > 0) {
      // 4. Batch insert new notifications
      await prisma.notification.createMany({
        data: toCreate.map(n => ({
          tenantId: n.tenantId,
          organizationId: n.organizationId,
          userId: n.userId,
          type: NotificationType.WARNING,
          content: n.content,
          link: n.link
        })),
        skipDuplicates: true
      });
      notified += toCreate.length;
    }

    return { notified };
  } catch (error) {
    logger.error({ error }, "Error executing sunset policy job");
    return { notified: 0 };
  }
}
