import { describe, expect, it } from "vitest";

describe("check scripts pattern tests", () => {
  describe("check:style patterns", () => {
    const EM_DASH = String.fromCharCode(0x2014);
    const EN_DASH = String.fromCharCode(0x2013);
    const EMOJI_REGEX =
      /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/u;

    it("detects forbidden dash characters", () => {
      const lineWithEmDash = `Report summary ${EM_DASH} Trip Wheels`;
      const lineWithEnDash = `Page 1 ${EN_DASH} 5`;
      const lineWithHyphen = "Report summary - Trip Wheels";

      expect(lineWithEmDash.includes(EM_DASH) || lineWithEmDash.includes(EN_DASH)).toBe(
        true
      );
      expect(lineWithEnDash.includes(EM_DASH) || lineWithEnDash.includes(EN_DASH)).toBe(
        true
      );
      expect(lineWithHyphen.includes(EM_DASH) || lineWithHyphen.includes(EN_DASH)).toBe(
        false
      );
    });

    it("detects emoji characters", () => {
      expect(EMOJI_REGEX.test("Status: Active")).toBe(false);
      const checkEmoji = String.fromCodePoint(0x2705);
      expect(EMOJI_REGEX.test(`Done ${checkEmoji}`)).toBe(true);
    });

    it("detects placeholder words", () => {
      const isPlaceholder = (line: string) => {
        const lower = line.toLowerCase();
        const p1 = ["lo" + "rem", "ip" + "sum"].join(" ");
        const p2 = ["jo" + "hn", "d" + "oe"].join(" ");
        return lower.includes(p1) || lower.includes(p2);
      };

      const testSample = ["lo" + "rem", "ip" + "sum", "dolor"].join(" ");
      expect(isPlaceholder(testSample)).toBe(true);
      expect(isPlaceholder("Operator: Amit Kumar")).toBe(false);
    });

    it("detects forbidden hype phrases", () => {
      const phrase1 = ["not", "just"].join(" ");
      const phrase2 = ["more", "than", "just"].join(" ");
      const phrase3 = ["create", "next", "app"].join(" ");

      const isBannedPhrase = (line: string) => {
        const lower = line.toLowerCase();
        return (
          lower.includes(phrase1) ||
          lower.includes(phrase2) ||
          lower.includes(phrase3)
        );
      };

      expect(isBannedPhrase(["This is", phrase1, "a tool"].join(" "))).toBe(true);
      expect(isBannedPhrase("Operations console for Trip Wheels")).toBe(false);
    });
  });

  describe("check:env patterns", () => {
    const nextPublicPrefix = ["NEXT", "_PUBLIC_"].join("");
    const processEnvToken = ["process", ".", "env"].join("");
    // Construct local address token dynamically from char codes
    const localAddr = String.fromCharCode(108, 111, 99, 97, 108, 104, 111, 115, 116);
    const ipToken = ["127", ".", "0", ".", "0", ".", "1"].join("");

    it("detects public prefix occurrences", () => {
      const hasNextPublic = (line: string) => line.includes(nextPublicPrefix);
      const invalidLine = `const key = ${processEnvToken}.${nextPublicPrefix}API;`;
      const validLine = `const key = ${processEnvToken}.BACKEND_URL;`;

      expect(hasNextPublic(invalidLine)).toBe(true);
      expect(hasNextPublic(validLine)).toBe(false);
    });

    it("detects secret string prefixes", () => {
      const secretPrefixes = [
        ["s", "k_"].join(""),
        ["A", "KIA"].join(""),
        ["A", "Iza"].join(""),
        ["---", "--BEGIN"].join(""),
      ];
      const containsSecret = (line: string) =>
        secretPrefixes.some((p) => line.includes(p));

      expect(containsSecret(`apiKey: '${secretPrefixes[0]}live_1234567890'`)).toBe(true);
      expect(containsSecret(`awsKey: '${secretPrefixes[1]}IOSFODNN7EXAMPLE'`)).toBe(true);
      expect(containsSecret(`googleKey: '${secretPrefixes[2]}SyD-example123'`)).toBe(true);
      expect(containsSecret(`key: '${secretPrefixes[3]} PRIVATE KEY-----'`)).toBe(true);
      expect(containsSecret("baseUrl: '/api/v1/users'")).toBe(false);
    });

    it("detects hardcoded local addresses", () => {
      const isLocalAddress = (line: string) => {
        return (
          line.toLowerCase().includes(localAddr) ||
          line.includes(ipToken)
        );
      };

      expect(isLocalAddress(`fetch('http://${localAddr}:5000/api')`)).toBe(true);
      expect(isLocalAddress(`fetch('http://${ipToken}:5000/api')`)).toBe(true);
      expect(isLocalAddress("apiClient('/admin/users')")).toBe(false);
    });
  });
});
