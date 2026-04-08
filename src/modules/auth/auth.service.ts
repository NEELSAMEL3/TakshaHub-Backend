import prisma from "../../config/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

export const registerAdmin = async (data: any) => {
  const {
    email,
    password,
    fullName,
    schoolName,
    schoolType,
    board,
    city,
    state,
    phoneNumber,
    verificationDocLink,
    websiteLink,
  } = data;

  const existingAdmin = await prisma.admin.findUnique({ where: { email } });
  if (existingAdmin) throw new Error("Email already exists");

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.admin.create({
    data: {
      email,
      password: hashedPassword,
      fullName,
      schoolName,
      schoolType,
      board,
      city,
      state,
      phoneNumber,
      verificationDocLink,
      websiteLink,
    },
  });

  return admin;
};

export const loginAdmin = async (email: string, password: string) => {
  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) throw new Error("Invalid credentials");

  const passwordMatch = await bcrypt.compare(password, admin.password);
  if (!passwordMatch) throw new Error("Invalid credentials");

  const token = jwt.sign({ id: admin.id, email: admin.email }, JWT_SECRET, {
    expiresIn: "1d",
  });

  return { admin, token };
};

export const getAdminProfile = async (adminId: number) => {
  return prisma.admin.findUnique({ where: { id: adminId } });
};
