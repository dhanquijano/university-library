export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  type: "feedback" | "suggestion" | "complaint" | "general";
  subject: string;
  message: string;
  status: "new" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  assignedTo?: string;
  responseMessage?: string;
  respondedBy?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  type: string;
  subject: string;
  message: string;
}

export interface ContactStats {
  total: number;
  new: number;
  inProgress: number;
  resolved: number;
  closed: number;
  byType: {
    feedback: number;
    suggestion: number;
    complaint: number;
    general: number;
  };
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
}