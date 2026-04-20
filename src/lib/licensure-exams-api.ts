export interface LicensureExam {
  id: number;
  exam_name: string;
  is_active: boolean;
  created_at?: string;
  is_system_default?: boolean;
}

export interface LicensureExamsResponse {
  exams: LicensureExam[];
  fallback: boolean;
}

function getBackendUrl(): string {
  return import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
}

export async function fetchLicensureExams(): Promise<LicensureExamsResponse> {
  const response = await fetch(`${getBackendUrl()}/api/licensure-exams`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch licensure exams");
  }

  return response.json();
}

export async function addLicensureExam(examName: string): Promise<void> {
  const response = await fetch(`${getBackendUrl()}/api/licensure-exams`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ examName }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to add licensure exam");
  }
}

export async function updateLicensureExam(examId: number, examName: string): Promise<void> {
  const response = await fetch(`${getBackendUrl()}/api/licensure-exams/${examId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ examName }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to update licensure exam");
  }
}

export async function deleteLicensureExam(examId: number): Promise<void> {
  const response = await fetch(`${getBackendUrl()}/api/licensure-exams/${examId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to delete licensure exam");
  }
}

export async function fetchActiveLicensureExamNames(): Promise<string[]> {
  const data = await fetchLicensureExams();
  return data.exams.filter((exam) => exam.is_active).map((exam) => exam.exam_name);
}
