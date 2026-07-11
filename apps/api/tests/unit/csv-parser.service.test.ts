import { describe, it, expect } from "vitest";
import { parseCsvBuffer } from "../../src/services/csv-parser.service.js";

describe("parseCsvBuffer", () => {
  it("parses a well-formed CSV correctly", () => {
    const csv = `Name,Email,Phone\nJohn Doe,john@example.com,9876543210\nJane Smith,jane@example.com,1234567890`;
    const { headers, rows } = parseCsvBuffer(Buffer.from(csv));

    expect(headers).toEqual(["Name", "Email", "Phone"]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      Name: "John Doe",
      Email: "john@example.com",
      Phone: "9876543210",
    });
  });

  it("trims whitespace from values", () => {
    const csv = `Name , Email \n  John  ,  john@example.com  `;
    const { rows } = parseCsvBuffer(Buffer.from(csv));
    expect(rows[0]?.["Name"]).toBe("John");
    expect(rows[0]?.["Email"]).toBe("john@example.com");
  });

  it("skips empty lines", () => {
    const csv = `Name,Email\nJohn,john@example.com\n\n\nJane,jane@example.com`;
    const { rows } = parseCsvBuffer(Buffer.from(csv));
    expect(rows).toHaveLength(2);
  });

  it("throws on empty CSV", () => {
    expect(() => parseCsvBuffer(Buffer.from("Name,Email\n"))).toThrow(
      "empty"
    );
  });

  it("handles CSVs with quoted fields containing commas", () => {
    const csv = `Name,Notes\n"Smith, John","Follow up, urgent"`;
    const { rows } = parseCsvBuffer(Buffer.from(csv));
    expect(rows[0]?.["Name"]).toBe("Smith, John");
    expect(rows[0]?.["Notes"]).toBe("Follow up, urgent");
  });

  it("handles different column orderings", () => {
    const csv = `Phone,Name,Email\n9876543210,John,john@example.com`;
    const { headers } = parseCsvBuffer(Buffer.from(csv));
    expect(headers[0]).toBe("Phone");
    expect(headers[1]).toBe("Name");
  });
});
