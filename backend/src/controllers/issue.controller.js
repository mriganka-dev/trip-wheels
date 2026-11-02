import * as issueService from "../services/issue.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const raiseIssue = asyncHandler(async (req, res) => {
  const issue = await issueService.raiseIssue(
    req.user,
    req.params.id,
    req.body,
    req.files
  );
  res
    .status(201)
    .json(new ApiResponse(201, issue, "Issue submitted successfully"));
});

export const getMyIssues = asyncHandler(async (req, res) => {
  const result = await issueService.getMyIssues(req.user, req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "My issues fetched successfully"));
});

export const getIssueById = asyncHandler(async (req, res) => {
  const issue = await issueService.getIssueById(req.user, req.params.id);
  res
    .status(200)
    .json(new ApiResponse(200, issue, "Issue details fetched successfully"));
});

export const respondToIssue = asyncHandler(async (req, res) => {
  const issue = await issueService.respondToIssue(
    req.user,
    req.params.id,
    req.body.text
  );
  res
    .status(200)
    .json(new ApiResponse(200, issue, "Response to issue added successfully"));
});

export const getAdminIssues = asyncHandler(async (req, res) => {
  const result = await issueService.getAdminIssues(req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Admin issues fetched successfully"));
});

export const resolveAdminIssue = asyncHandler(async (req, res) => {
  const issue = await issueService.resolveAdminIssue(
    req.user,
    req.params.id,
    req.body
  );
  res
    .status(200)
    .json(new ApiResponse(200, issue, "Issue resolved successfully by admin"));
});
