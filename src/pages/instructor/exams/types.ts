export interface ExamTopic {
  id: number
  name: string
}

export interface AnswerKeyItem {
  questionNumber: number
  topicId: number
  correctAnswer: "A" | "B" | "C" | "D" | "E"
  points: number
  keyVersion: string
}

export interface ScannedPaper {
  id: number
  studentName: string
  studentId: string
  scannedAt: string
  status: "Processing" | "Graded" | "Error"
}

export interface TopicScore {
  topicId: number
  score: number
  maxScore: number
}

export interface StudentResult {
  id: number
  name: string
  studentId: string
  score: number
  totalItems: number
  passed: boolean
  topicScores: TopicScore[]
  scannedAt: string
  feedback?: string
}

export interface Exam {
  id: number
  title: string
  course: string
  date: string
  totalItems: number
  passingRate: number
  status: "Draft" | "Active" | "Completed"
  studentsEnrolled: number
  papersScanned: number
  topics: ExamTopic[]
  answerKeys: AnswerKeyItem[]
  studentResults: StudentResult[]
  scannedPapers: ScannedPaper[]
}
