import { createDefaultPreset } from "ts-jest";

/** @type {import("jest").Config} */
const tsJestTransformCfg = createDefaultPreset().transform;

export default {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  moduleFileExtensions: ["ts", "js", "json", "node"],
  extensionsToTreatAsEsm: [".ts"],
  roots: ["<rootDir>/src"],
  testTimeout: 30000, // allow Prisma DB queries
};
