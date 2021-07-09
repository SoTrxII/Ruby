module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    "testPathIgnorePatterns": ["dist"],
    collectCoverageFrom : [
        "src/**/*.ts",
        // Exclude main, this is just a boot up file
        "!src/main.ts",
        // Exclude logger, this is an adapter, there isn't really anything to test
        "!src/services/logger.ts",
        "!**/*.d.ts"
    ]
};
