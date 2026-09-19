import { describe, expect, it } from "vitest";
import { extractSearchTerms } from "./auraSearch";

describe("extractSearchTerms", () => {
  it("strips filler words from a natural-language question", () => {
    expect(extractSearchTerms("how do I find a react course")).toEqual(["react", "course"]);
  });

  it("passes through a plain keyword query unchanged", () => {
    expect(extractSearchTerms("react")).toEqual(["react"]);
  });

  it("falls back to the raw words when every word is a filler word", () => {
    expect(extractSearchTerms("how do I")).toEqual(["how", "do", "i"]);
  });

  it("strips punctuation", () => {
    expect(extractSearchTerms("what is machine learning?")).toEqual(["machine", "learning"]);
  });
});
