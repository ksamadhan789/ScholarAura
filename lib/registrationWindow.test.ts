import { describe, expect, it } from "vitest";
import { registrationWindowError } from "@/lib/registrationWindow";

describe("registrationWindowError", () => {
  it("allows registration with no window fields set, before the end date", () => {
    const error = registrationWindowError("event", {
      registrationStartDate: null,
      registrationDeadline: null,
      endDate: new Date(Date.now() + 1000 * 60 * 60),
    });
    expect(error).toBeNull();
  });

  it("blocks registration once the event has ended and no explicit deadline was set", () => {
    const error = registrationWindowError("event", {
      registrationStartDate: null,
      registrationDeadline: null,
      endDate: new Date(Date.now() - 1000 * 60 * 60),
    });
    expect(error).toMatch(/already ended/);
  });

  it("blocks registration before the registration window opens", () => {
    const error = registrationWindowError("competition", {
      registrationStartDate: new Date(Date.now() + 1000 * 60 * 60),
      registrationDeadline: null,
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });
    expect(error).toMatch(/hasn't opened yet/);
  });

  it("blocks registration after an explicit registration deadline has passed, even if the event hasn't ended yet", () => {
    const error = registrationWindowError("event", {
      registrationStartDate: null,
      registrationDeadline: new Date(Date.now() - 1000 * 60 * 60),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });
    expect(error).toMatch(/closed/);
  });

  it("allows registration inside an explicit window", () => {
    const error = registrationWindowError("competition", {
      registrationStartDate: new Date(Date.now() - 1000 * 60 * 60),
      registrationDeadline: new Date(Date.now() + 1000 * 60 * 60),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });
    expect(error).toBeNull();
  });
});
