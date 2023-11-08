module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["dist", "node_modules", "__tests__/_.*"],
  modulePathIgnorePatterns: ["<rootDir>/dist"],
};
