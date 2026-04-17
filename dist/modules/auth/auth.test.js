import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import request from "supertest";
import app from "../../app";
import prisma from "../../config/prisma";
describe("Auth Flow (BigInt IDs)", () => {
    const testUser = {
        fullName: "Test User",
        email: "testuser@example.com",
        password: "Password123!",
        phoneNumber: "9999999999",
        school: {
            name: "Test School",
            type: "PRIVATE",
            board: "CBSE",
            city: "Ahmedabad",
            state: "Gujarat",
            website: "https://testschool.com",
            udiseNumber: "12345678901",
        },
    };
    const meta = {
        deviceId: "device-123",
        userAgent: "jest-agent",
        ip: "127.0.0.1",
    };
    let refreshToken;
    let schoolId;
    let userId;
    /* ---------------- CLEAN DB ---------------- */
    beforeAll(async () => {
        await prisma.refreshToken.deleteMany();
        await prisma.session.deleteMany();
        await prisma.device.deleteMany();
        await prisma.member.deleteMany();
        await prisma.user.deleteMany();
        await prisma.school.deleteMany();
    });
    /* ---------------- REGISTER ---------------- */
    it("should register a user", async () => {
        const res = await request(app)
            .post("/auth/register")
            .send(testUser)
            .expect(201);
        expect(res.body.message).toBe("Registration successful");
        expect(res.body.user.email).toBe(testUser.email);
        const school = await prisma.school.findFirst({
            where: { udiseNumber: testUser.school.udiseNumber },
        });
        expect(school).toBeTruthy();
        schoolId = school.id; // 👈 BigInt
        const user = await prisma.user.findUnique({
            where: { email: testUser.email },
        });
        expect(user).toBeTruthy();
        userId = user.id; // 👈 BigInt
    });
    /* ---------------- LOGIN ---------------- */
    it("should login user and return tokens", async () => {
        const res = await request(app)
            .post("/auth/login")
            .send({
            email: testUser.email,
            password: testUser.password,
            schoolId: schoolId.toString(), // 👈 IMPORTANT (HTTP cannot send BigInt)
            deviceId: meta.deviceId,
        })
            .set("User-Agent", meta.userAgent)
            .set("x-forwarded-for", meta.ip)
            .expect(200);
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.refreshToken).toBeDefined();
        refreshToken = res.body.refreshToken;
        const session = await prisma.session.findFirst({
            where: { userId },
        });
        expect(session).toBeTruthy();
    });
    /* ---------------- REFRESH ---------------- */
    it("should refresh tokens", async () => {
        const res = await request(app)
            .post("/auth/refresh")
            .send({ refreshToken })
            .set("User-Agent", meta.userAgent)
            .set("x-forwarded-for", meta.ip)
            .set("device-id", meta.deviceId)
            .expect(200);
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.refreshToken).toBeDefined();
        expect(res.body.refreshToken).not.toBe(refreshToken);
        refreshToken = res.body.refreshToken;
    });
    /* ---------------- LOGOUT ---------------- */
    it("should logout user", async () => {
        const res = await request(app)
            .post("/auth/logout")
            .send({ refreshToken })
            .expect(200);
        expect(res.body.message).toBe("Logged out successfully");
        const sessions = await prisma.session.findMany({
            where: { userId },
        });
        expect(sessions.length).toBe(0);
    });
    afterAll(async () => {
        await prisma.$disconnect();
    });
});
//# sourceMappingURL=auth.test.js.map