import { describe, expect, it } from "vitest";
import { z } from "zod";
import { parseInput } from "../../validations/parse-input";

describe("parseInput", () => {
  it("returns parsed values for valid input", () => {
    const schema = z.object({ name: z.string().min(1) });

    expect(parseInput(schema, { name: "Sample" })).toEqual({ name: "Sample" });
  });

  it("rejects invalid input", () => {
    const schema = z.object({ name: z.string().min(1) });

    expect(() => parseInput(schema, { name: "" })).toThrow();
  });
});
