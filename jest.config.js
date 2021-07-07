module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    "testPathIgnorePatterns": ["dist"],
    collectCoverageFrom : [
        "src/**/*.ts",
        // Exclude main, this is just a boot up file
        "!src/main.ts",
        "!**/*.d.ts"
    ]
};
