module.exports = {
  preset: "ts-jest",
  testEnvironment: "node", //:( want jsdom, maybe resort to mocking in future + e2e
  testPathIgnorePatterns: ["dist", "node_modules", "__tests__/_.*"],
  modulePathIgnorePatterns: ["<rootDir>/dist"],
};
