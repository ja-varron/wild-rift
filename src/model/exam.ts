export class Exam {
  private exam_id: string
  private course_id: string
  private exam_title: string
  private exam_date: string
  private total_items: number
  private passing_rate: number
  private topics: string[]

  constructor(
    exam_id: string | Exam,
    course_id?: string,
    exam_title?: string,
    exam_date?: string,
    total_items?: number,
    passing_rate?: number,
    topics?: string[]
  ) {
    if (exam_id instanceof Exam) {
      this.exam_id = exam_id.exam_id
      this.course_id = exam_id.course_id
      this.exam_title = exam_id.exam_title
      this.exam_date = exam_id.exam_date
      this.total_items = exam_id.total_items
      this.passing_rate = exam_id.passing_rate
      this.topics = exam_id.topics
    } else {
      this.exam_id = exam_id
      this.course_id = course_id!
      this.exam_title = exam_title!
      this.exam_date = exam_date!
      this.total_items = total_items!
      this.passing_rate = passing_rate!
      this.topics = topics || []
    }
  }

  // Exam ID is read-only after creation
  get getExamId() {
    return this.exam_id
  }

  // Course ID is read-only after creation
  get getCourseId() {
    return this.course_id
  }

  // Exam title can be updated after creation
  get getExamTitle() {
    return this.exam_title
  }

  set setExamTitle(title: string) {
    this.exam_title = title
  }

  // Exam date can be updated after creation
  get getExamDate() {
    return this.exam_date
  }

  set setExamDate(date: string) {
    this.exam_date = date
  }

  // Total items can be updated after creation
  get getTotalItems() {
    return this.total_items
  }

  set setTotalItems(items: number) {
    this.total_items = items
  }

  // Passing rate can be updated after creation
  get getPassingRate() {
    return this.passing_rate
  }

  set setPassingRate(rate: number) {
    this.passing_rate = rate
  }

  // Topics can be updated after creation
  get getTopics() {
    return this.topics
  }

  set setTopics(topics: string[]) {
    this.topics = topics
  }
}