// cleanup.ts
import prisma from "../../config/prisma";
export const cleanup = async () => {
    await prisma.refreshToken.deleteMany({
        where: {
            expiresAt: { lt: new Date() },
        },
    });
    await prisma.session.deleteMany({
        where: {
            lastUsedAt: {
                lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
            },
        },
    });
};
//# sourceMappingURL=cleanup.js.map