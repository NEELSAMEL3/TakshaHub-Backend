// src/jest.config.ts (or jest.config.js in root)
import { createDefaultPreset } from "ts-jest";

/** @type {import("jest").Config} */
const tsJestTransformCfg = createDefaultPreset().transform;

export default {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  moduleFileExtensions: ["ts", "js", "json", "node"],
  extensionsToTreatAsEsm: [".ts"],
  roots: ["<rootDir>/src"],
};