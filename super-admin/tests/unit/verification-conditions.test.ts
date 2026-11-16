import { describe, expect, it } from "vitest";
import { computeVerificationApprovalConditions } from "@/lib/verification-conditions";

describe("verification approval conditions logic", () => {
  it("returns all false when profile is missing", () => {
    const result = computeVerificationApprovalConditions(null);
    expect(result.allMet).toBe(false);
    expect(result.phoneConfirmed).toBe(false);
    expect(result.callDone).toBe(false);
    expect(result.requiredDocsApproved).toBe(false);
    expect(result.allDocsReviewed).toBe(false);
  });

  it("fails approval when verification call is not completed", () => {
    const result = computeVerificationApprovalConditions({
      publisherType: "individual",
      user: { phoneConfirmedByAdmin: true },
      verificationCall: { done: false, status: "scheduled" },
      documents: [{ type: "aadhar", status: "approved" }],
    });

    expect(result.phoneConfirmed).toBe(true);
    expect(result.callDone).toBe(false);
    expect(result.allMet).toBe(false);
  });

  it("fails approval when phone number is not confirmed", () => {
    const result = computeVerificationApprovalConditions({
      publisherType: "individual",
      user: { phoneConfirmedByAdmin: false, isPhoneConfirmed: false },
      verificationCall: { done: true },
      documents: [{ type: "aadhar", status: "approved" }],
    });

    expect(result.phoneConfirmed).toBe(false);
    expect(result.allMet).toBe(false);
  });

  it("requires personal ID for individual publisher", () => {
    const withAadhar = computeVerificationApprovalConditions({
      publisherType: "individual",
      user: { phoneConfirmedByAdmin: true },
      verificationCall: { done: true },
      documents: [{ type: "aadhar", status: "approved" }],
    });
    expect(withAadhar.requiredDocsApproved).toBe(true);
    expect(withAadhar.allMet).toBe(true);

    const withoutPersonalId = computeVerificationApprovalConditions({
      publisherType: "individual",
      user: { phoneConfirmedByAdmin: true },
      verificationCall: { done: true },
      documents: [{ type: "random_doc", status: "approved" }],
    });
    expect(withoutPersonalId.requiredDocsApproved).toBe(false);
    expect(withoutPersonalId.allMet).toBe(false);
  });

  it("requires owner ID and business registration for agent publisher", () => {
    const agentComplete = computeVerificationApprovalConditions({
      publisherType: "agent",
      user: { phoneConfirmedByAdmin: true },
      verificationCall: { done: true },
      businessName: "Royal Wheels",
      businessAddress: "Manali Mall Road",
      documents: [
        { type: "pan", status: "approved" },
        { type: "gst_certificate", status: "approved" },
      ],
    });
    expect(agentComplete.requiredDocsApproved).toBe(true);
    expect(agentComplete.allMet).toBe(true);

    const agentMissingBizDoc = computeVerificationApprovalConditions({
      publisherType: "agent",
      user: { phoneConfirmedByAdmin: true },
      verificationCall: { done: true },
      documents: [{ type: "pan", status: "approved" }],
    });
    expect(agentMissingBizDoc.requiredDocsApproved).toBe(false);
    expect(agentMissingBizDoc.allMet).toBe(false);
  });

  it("fails approval if any uploaded document is still pending review", () => {
    const withPendingDoc = computeVerificationApprovalConditions({
      publisherType: "individual",
      user: { phoneConfirmedByAdmin: true },
      verificationCall: { done: true },
      documents: [
        { type: "aadhar", status: "approved" },
        { type: "driving_license", status: "pending" },
      ],
    });
    expect(withPendingDoc.allDocsReviewed).toBe(false);
    expect(withPendingDoc.allMet).toBe(false);
  });
});
