import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock } from "../test/prismaMock";

vi.mock("@/lib/email", () => ({ sendJobAlertEmail: vi.fn() }));

import { sendJobAlertEmail } from "@/lib/email";
import { AlertLimitError, createJobAlert, sendDueJobAlerts } from "@/lib/jobAlerts";

const sendMock = sendJobAlertEmail as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createJobAlert", () => {
  it("reuses an identical alert instead of duplicating it", async () => {
    prismaMock.jobAlert.findFirst.mockResolvedValue({ id: "a1", isActive: true } as never);
    const alert = await createJobAlert("u1", { employmentType: "INTERNSHIP" });
    expect(alert).toMatchObject({ id: "a1" });
    expect(prismaMock.jobAlert.create).not.toHaveBeenCalled();
  });

  it("re-activates a paused identical alert", async () => {
    prismaMock.jobAlert.findFirst.mockResolvedValue({ id: "a1", isActive: false } as never);
    await createJobAlert("u1", {});
    expect(prismaMock.jobAlert.update).toHaveBeenCalledWith({ where: { id: "a1" }, data: { isActive: true } });
  });

  it("normalizes filters and enforces the per-user limit", async () => {
    prismaMock.jobAlert.findFirst.mockResolvedValue(null);
    prismaMock.jobAlert.count.mockResolvedValue(10);
    await expect(createJobAlert("u1", { query: "  " })).rejects.toBeInstanceOf(AlertLimitError);

    prismaMock.jobAlert.count.mockResolvedValue(0);
    await createJobAlert("u1", { query: " data ", employmentType: "BOGUS", city: "" });
    expect(prismaMock.jobAlert.create).toHaveBeenCalledWith({
      data: { userId: "u1", query: "data", employmentType: null, remoteOnly: false, city: null },
    });
  });
});

describe("sendDueJobAlerts", () => {
  const now = new Date("2026-09-25T03:00:00Z");
  const alert = {
    id: "a1",
    query: null,
    employmentType: "INTERNSHIP",
    remoteOnly: false,
    city: null,
    createdAt: new Date("2026-09-20T00:00:00Z"),
    user: { email: "s@example.com", name: "Student" },
  };
  const job = {
    id: "j1",
    slug: "intern",
    title: "Data Intern",
    companyName: "Zomato",
    isRemote: false,
    location: "Gurgaon",
    city: "Gurugram",
  };

  it("emails new matches and records them so they're never re-sent", async () => {
    prismaMock.jobAlert.findMany.mockResolvedValue([alert] as never);
    prismaMock.job.findMany.mockResolvedValue([job] as never);
    prismaMock.job.count.mockResolvedValue(1);
    sendMock.mockResolvedValue(true);

    expect(await sendDueJobAlerts(now)).toEqual({ emailsSent: 1 });

    const where = prismaMock.job.findMany.mock.calls[0][0]!.where!;
    expect(where).toMatchObject({
      isPublished: true,
      approvalStatus: "APPROVED",
      employmentType: "INTERNSHIP",
      createdAt: { gt: alert.createdAt },
      alertDeliveries: { none: { alertId: "a1" } },
    });
    expect(sendMock).toHaveBeenCalledWith(
      "s@example.com",
      "Student",
      expect.objectContaining({
        alertName: "Internship jobs",
        totalMatches: 1,
        jobs: [expect.objectContaining({ title: "Data Intern", place: "Gurgaon" })],
      })
    );
    expect(prismaMock.jobAlertDelivery.createMany).toHaveBeenCalledWith({
      data: [{ alertId: "a1", jobId: "j1" }],
      skipDuplicates: true,
    });
  });

  it("sends nothing when there are no new matches", async () => {
    prismaMock.jobAlert.findMany.mockResolvedValue([alert] as never);
    prismaMock.job.findMany.mockResolvedValue([]);
    prismaMock.job.count.mockResolvedValue(0);

    expect(await sendDueJobAlerts(now)).toEqual({ emailsSent: 0 });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("records nothing when the email fails, so the jobs are retried tomorrow", async () => {
    prismaMock.jobAlert.findMany.mockResolvedValue([alert] as never);
    prismaMock.job.findMany.mockResolvedValue([job] as never);
    prismaMock.job.count.mockResolvedValue(1);
    sendMock.mockResolvedValue(false);

    expect(await sendDueJobAlerts(now)).toEqual({ emailsSent: 0 });
    expect(prismaMock.jobAlertDelivery.createMany).not.toHaveBeenCalled();
  });
});
