import { describe, it, expect } from "vitest";
import { redact } from "../../src/output/redact.js";

describe("redact", () => {
  it("masks AWS access key IDs (AKIA prefix)", () => {
    const result = redact("key is AKIAIOSFODNN7EXAMPLE");
    expect(result).toBe("key is AKIA****MPLE");
    expect(result).not.toContain("IOSFODNN7EXA");
  });

  it("masks AKIA keys that are exactly 20 chars", () => {
    const result = redact("AKIAIOSFODNN7EXAMPL1");
    expect(result).toBe("AKIA****MPL1");
  });

  it("masks long hex strings (>20 chars) in credential context", () => {
    const result = redact("secret=abcdef0123456789abcdef0123456789");
    expect(result).toContain("****");
    expect(result).not.toContain("abcdef0123456789abcdef0123456789");
  });

  it("masks long base64 strings (>20 chars) in credential context", () => {
    const result = redact("secret=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY");
    expect(result).toContain("****");
    expect(result).not.toContain("wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY");
  });

  it("masks embedded credentials in S3 endpoint URLs", () => {
    const result = redact("https://AKIAIOSFODNN7EXAMPLE:secretkey@s3.amazonaws.com/bucket");
    expect(result).toContain("s3.amazonaws.com");
    expect(result).not.toContain("AKIAIOSFODNN7EXAMPLE");
    expect(result).not.toContain("secretkey");
  });

  it("returns non-credential strings unchanged", () => {
    const plain = "just a normal message with no secrets";
    expect(redact(plain)).toBe(plain);
  });

  it("masks long hex strings (32+ chars) in credential context", () => {
    const hexKey = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4";
    const result = redact(`access_key_id=${hexKey}`);
    expect(result).toContain("****");
    expect(result).not.toContain(hexKey);
  });

  it("handles empty string", () => {
    expect(redact("")).toBe("");
  });

  it("masks AWS STS session keys (ASIA prefix)", () => {
    const result = redact("session ASIAIOSFODNN7EXAMPLE ends");
    expect(result).not.toContain("IOSFODNN7EXA");
    expect(result).toContain("ASIA****");
  });

  it("masks AWS IAM role unique IDs (AROA prefix)", () => {
    const result = redact("role AROAIOSFODNN7EXAMPLE");
    expect(result).not.toContain("IOSFODNN7EXA");
  });

  it("masks credentials with whitespace before separator", () => {
    const result = redact("access_key_id = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY");
    expect(result).not.toContain("wJalrXUtnFEMI");
    expect(result).toContain("****");
  });

  it("masks JSON-quoted credential values", () => {
    const result = redact('{"token":"abcdef0123456789abcdef0123456789"}');
    expect(result).not.toContain("abcdef0123456789abcdef0123456789");
    expect(result).toContain("****");
  });

  it("masks Bearer authorization tokens", () => {
    const result = redact("Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.payload.signature");
    expect(result).not.toContain("eyJhbGciOiJIUzI1NiJ9.payload.signature");
    expect(result).toContain("****");
  });
});
