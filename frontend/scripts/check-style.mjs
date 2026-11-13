import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const targetDirs = ["app", "components", "lib", "hooks", "types", "tests", "scripts"];
const targetFiles = ["README.md", "proxy.ts"];
const allowedExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".css", ".md", ".html"]);

// Use dynamic string construction to prevent check-style from triggering its own checks
const EM_DASH = String.fromCharCode(0x2014);
const EN_DASH = String.fromCharCode(0x2013);

const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/u;

const rules = [
  {
    name: "Em dash or en dash",
    test: (line) => line.includes(EM_DASH) || line.includes(EN_DASH),
  },
  {
    name: "Emoji character",
    test: (line) => EMOJI_REGEX.test(line),
  },
  {
    name: "Placeholder name or text",
    test: (line) => {
      const lower = line.toLowerCase();
      const p1 = ["lorem", "ipsum"].join(" ");
      const p2 = ["john", "doe"].join(" ");
      return lower.includes(p1) || lower.includes(p2);
    },
  },
  {
    name: "Gradient styling",
    test: (line) => {
      const lower = line.toLowerCase();
      return lower.includes("gradient");
    },
  },
  {
    name: "Glass or blur effect",
    test: (line) => {
      const lower = line.toLowerCase();
      return lower.includes("backdrop-") || /\bblur\b/.test(lower) || lower.includes("blur-");
    },
  },
  {
    name: "Sparkle or wand reference",
    test: (line) => {
      const lower = line.toLowerCase();
      return lower.includes("sparkle") || lower.includes("wand");
    },
  },
  {
    name: "Forbidden font Inter",
    test: (line) => {
      return (
        line.includes("/font/google") && line.includes("Inter") ||
        line.includes("font-family") && line.includes("Inter") ||
        /\bInter\b/.test(line) && line.includes("font")
      );
    },
  },
  {
    name: "Create Next App template text",
    test: (line) => {
      const p = ["Create", "Next", "App"].join(" ");
      return line.includes(p);
    },
  },
  {
    name: "Hype or rhetorical copy pattern",
    test: (line) => {
      const lower = line.toLowerCase();
      return (
        /it'?s not\b.+?\bit'?s\b/i.test(lower) ||
        /not just\b.+?\bbut\b/i.test(lower) ||
        lower.includes("more than just")
      );
    },
  },
];

const violations = [];

function checkFile(filePath) {
  // Do not inspect check-style.mjs itself
  if (filePath === __filename) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    for (const rule of rules) {
      if (rule.test(line)) {
        violations.push({
          file: path.relative(rootDir, filePath),
          line: lineNum,
          rule: rule.name,
          text: line.trim(),
        });
      }
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
        checkFile(fullPath);
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
    checkFile(filePath);
  }
}

if (violations.length > 0) {
  console.error(`Style check failed with ${violations.length} violation(s):\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line} - [${v.rule}]`);
    console.error(`    ${v.text}\n`);
  }
  process.exit(1);
} else {
  console.log("Style check passed with 0 violations.");
}

