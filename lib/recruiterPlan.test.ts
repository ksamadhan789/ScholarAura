import { describe, expect, it } from "vitest";
import {
  activePeriod,
  boostCreditWindow,
  countsTowardLiveLimit,
  nextPeriodWindow,
  proActiveUntil,
  type PaidPeriod,
} from "@/lib/recruiterPlan";

const DAY = 24 * 60 * 60 * 1000;
const t0 = new Date("2026-10-01T00:00:00Z");
const at = (days: number) => new Date(t0.getTime() + days * DAY);

describe("nextPeriodWindow", () => {
  it("starts now when nothing is running", () => {
    expect(nextPeriodWindow("MONTHLY", null, t0)).toEqual({ startsAt: t0, endsAt: at(30) });
    expect(nextPeriodWindow("YEARLY", at(-5), t0)).toEqual({ startsAt: t0, endsAt: at(365) });
  });

  it("starts when the running plan ends, so renewing early loses nothing", () => {
    expect(nextPeriodWindow("MONTHLY", at(10), t0)).toEqual({ startsAt: at(10), endsAt: at(40) });
  });
});

describe("activePeriod and proActiveUntil", () => {
  const monthly: PaidPeriod = { period: "MONTHLY", startsAt: t0, endsAt: at(30) };
  const renewal: PaidPeriod = { period: "MONTHLY", startsAt: at(30), endsAt: at(60) };

  it("finds the period covering now", () => {
    expect(activePeriod([monthly, renewal], at(5))).toBe(monthly);
    expect(activePeriod([monthly, renewal], at(35))).toBe(renewal);
    expect(activePeriod([monthly], at(30))).toBeNull();
  });

  it("follows back-to-back renewals", () => {
    expect(proActiveUntil([renewal, monthly], at(5))).toEqual(at(60));
    expect(proActiveUntil([monthly], at(40))).toBeNull();
  });
});

describe("boostCreditWindow", () => {
  it("gives one window for a monthly plan", () => {
    const p: PaidPeriod = { period: "MONTHLY", startsAt: t0, endsAt: at(30) };
    expect(boostCreditWindow(p, at(12))).toEqual({ from: t0, to: at(30) });
    expect(boostCreditWindow(null, at(12))).toBeNull();
  });

  it("rolls every 30 days on a yearly plan, 12 times at most", () => {
    const p: PaidPeriod = { period: "YEARLY", startsAt: t0, endsAt: at(365) };
    expect(boostCreditWindow(p, at(45))).toEqual({ from: at(30), to: at(60) });
    expect(boostCreditWindow(p, at(335))).toEqual({ from: at(330), to: at(360) });
    // Days 360–365: a 13th window would exceed "1 Boost a month".
    expect(boostCreditWindow(p, at(362))).toBeNull();
  });
});

describe("countsTowardLiveLimit", () => {
  it("counts live and pending jobs only", () => {
    expect(countsTowardLiveLimit({ approvalStatus: "APPROVED", isPublished: true })).toBe(true);
    expect(countsTowardLiveLimit({ approvalStatus: "PENDING", isPublished: false })).toBe(true);
    expect(countsTowardLiveLimit({ approvalStatus: "APPROVED", isPublished: false })).toBe(false);
    expect(countsTowardLiveLimit({ approvalStatus: "REJECTED", isPublished: false })).toBe(false);
  });
});
