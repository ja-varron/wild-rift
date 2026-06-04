export const PRC_LICENSURE_EXAMS = [
  "Nursing Licensure Examination",
  "Criminology Licensure Examination",
  "Licensure Examination for Teachers",
  "Civil Engineering Licensure Examination",
  "Accountancy Licensure Examination",
  "Midwifery Licensure Examination",
] as const

export type PrcLicensureExam = (typeof PRC_LICENSURE_EXAMS)[number]
