import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const targetDirs = ["app", "components", "lib", "hooks", "types", "tests", "scripts"];
const targetFiles = [
  "README.md",
  "next.config.ts",
  "eslint.config.mjs",
  "tsconfig.json",
  "package.json",
];
const allowedExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".css",
  ".md",
  ".json",
]);

const violations = [];

// 1. Check for any env file other than .env in rootDir
const rootEntries = fs.readdirSync(rootDir);
for (const entry of rootEntries) {
  if (entry.startsWith(".env") && entry !== ".env") {
    violations.push({
      file: entry,
      line: 1,
      rule: "Forbidden env file",
      text: `Found forbidden env file: ${entry}. Only .env is allowed.`,
    });
  }
}

// 2. Check that .gitignore ignores .env and .env.*
const gitignorePath = path.join(rootDir, ".gitignore");
if (!fs.existsSync(gitignorePath)) {
  violations.push({
    file: ".gitignore",
    line: 1,
    rule: "Missing .gitignore",
    text: ".gitignore file is missing",
  });
} else {
  const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
  const gitignoreLines = gitignoreContent.split(/\r?\n/).map((l) => l.trim());
  const hasDotEnv = gitignoreLines.some((l) => l === ".env" || l === ".env*");
  const hasDotEnvWildcard = gitignoreLines.some((l) => l === ".env.*" || l === ".env*");

  if (!hasDotEnv) {
    violations.push({
      file: ".gitignore",
      line: 1,
      rule: "Missing .env in .gitignore",
      text: ".gitignore must explicitly ignore .env",
    });
  }
  if (!hasDotEnvWildcard) {
    violations.push({
      file: ".gitignore",
      line: 1,
      rule: "Missing .env.* in .gitignore",
      text: ".gitignore must explicitly ignore .env.*",
    });
  }
}

// 3. Scan code files for forbidden strings
const SECRET_PREFIXES = ["sk_", "AKIA", "AIza", "-----BEGIN"];
const IP_REGEX = /\b(?:127\.0\.0\.1|(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))\b/;

function checkSourceFile(filePath) {
  if (filePath === __filename) return;

  const relPath = path.relative(rootDir, filePath).replace(/\\/g, "/");
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  const isAllowedProcessEnv =
    relPath === "lib/env.ts" || relPath === "next.config.ts" || relPath.startsWith("scripts/");

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // NEXT_PUBLIC_ check
    if (line.includes("NEXT_PUBLIC_")) {
      violations.push({
        file: relPath,
        line: lineNum,
        rule: "NEXT_PUBLIC_ variable found",
        text: trimmed,
      });
    }

    // process.env check outside lib/env.ts and next.config.ts
    if (line.includes("process.env") && !isAllowedProcessEnv) {
      violations.push({
        file: relPath,
        line: lineNum,
        rule: "process.env used outside lib/env.ts or next.config.ts",
        text: trimmed,
      });
    }

    // localhost or 127.0.0.1 or IP check
    if (
      line.toLowerCase().includes("localhost") ||
      line.includes("127.0.0.1") ||
      IP_REGEX.test(line)
    ) {
      // Ignore if it's check-env.mjs itself or pure comment in documentation describing the rule
      violations.push({
        file: relPath,
        line: lineNum,
        rule: "Hardcoded localhost or IP address",
        text: trimmed,
      });
    }

    // Secret prefixes
    for (const prefix of SECRET_PREFIXES) {
      if (line.includes(prefix)) {
        violations.push({
          file: relPath,
          line: lineNum,
          rule: `Potential secret prefix detected: ${prefix}`,
          text: trimmed,
        });
      }
    }

    // Logging of process.env
    if (/console\.(log|info|warn|error)\(.*process\.env/i.test(line)) {
      violations.push({
        file: relPath,
        line: lineNum,
        rule: "Logging of process.env",
        text: trimmed,
      });
    }
  });
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walkDir(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (allowedExtensions.has(ext)) {
        checkSourceFile(fullPath);
      }
    }
  }
}

for (const dir of targetDirs) {
  walkDir(path.join(rootDir, dir));
}

for (const file of targetFiles) {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    checkSourceFile(filePath);
  }
}

if (violations.length > 0) {
  console.error(`Env check failed with ${violations.length} violation(s):\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line} - [${v.rule}]`);
    console.error(`    ${v.text}\n`);
  }
  process.exit(1);
} else {
  console.log("Env check passed with 0 violations.");
}
