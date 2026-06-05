export interface ExamTopic {
  topic_idx: number
  name: string
}

export interface AnswerKeyItem {
  key_version: string
  question_number: number
  correct_answer: "A" | "B" | "C" | "D" | "E"
  points: number
  topic?: ExamTopic | string // Added topic field to link each question to its topic
}

export interface ScannedPaper {
  id: number
  studentName: string
  studentId: string
  scannedAt: string
  status: "Processing" | "Graded" | "Error"
}

// This interface represents the result of grading a student's exam, including their overall score and topic-wise breakdown.
export interface TopicScore {
  topic: ExamTopic
  score: number
  total: number
}


export interface ScoreResult {
  score_result_id?: string
  exam_id: string
  student: {
    student_id: string
    first_name: string
    last_name: string
    examinee_id_number: string
  }
  topicScores: TopicScore[]
  scanned_at: string
  totalScore?: number
  totalItems?: number
  passed?: boolean
  scorePercent?: number
  answerKeyVersion?: string
}

export interface StudentResult {
  id: number
  name: string
  studentId: string
  score: number
  totalItems: number
  passed: boolean
  topicScores: {
    topicId: number
    score: number
    maxScore: number
  }[]
  scannedAt: string
  feedback?: string
}

export interface Feedback {
  feedback_id: string
  exam_id: string
  student: {
    student_id: string
    first_name: string
    last_name: string
  },
  comment: string
  message_at: string
}
