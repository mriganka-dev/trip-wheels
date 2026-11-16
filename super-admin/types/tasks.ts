export type TaskStatus = "open" | "in_progress" | "done";

export type TaskType =
  | "call_publisher_no_response"
  | "call_publisher_unconfirmed_vehicle"
  | "call_publisher_pickup_unconfirmed"
  | "review_issue"
  | "review_flag";

export interface TaskPublisher {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface TaskAssignedUser {
  _id: string;
  fullName: string;
  email: string;
}

export interface TaskBooking {
  _id: string;
  bookingCode?: string;
  status?: string;
}

export interface AdminTask {
  _id: string;
  type: TaskType | string;
  booking: string | TaskBooking | null;
  publisher: TaskPublisher | null;
  status: TaskStatus;
  note: string;
  assignedTo: TaskAssignedUser | null;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskListQuery {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
}

export interface UpdateTaskPayload {
  status?: TaskStatus;
  note?: string;
  assignedTo?: string | null;
}
