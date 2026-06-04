import type { Feedback } from "./feedback";

type TopicScore = {
  topic_id: number,
  score: number,
  percent: number,
  max_score: number,
  topic_name: string
}

export interface Exam {
  exam_id?: string
  course: { course_id: string; course_name: string } | null;
  profile: { first_name: string; last_name: string } | null;
  exam_title: string
  exam_date: string
  total_items: number
  passing_rate: number
  created_by: string
  created_at: string
  topics: string[]
}

export interface ExamResult {
  exam: Exam
  score_result?: {
    passed: boolean
    total_score: number
    topic_scores: TopicScore[]
    scanned_at: string
    score_percentage: number,
    answer_key_version: string
  }
  feedbacks: Feedback[]
}