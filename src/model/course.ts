export class Course {
  private course_id: string
  private course_code: string
  private course_name: string
  private course_description: string

  constructor(
    course_id: string | Course,
    course_code?: string,
    course_name?: string,
    course_description?: string
  ) {
    if (course_id instanceof Course) {
      this.course_id = course_id.course_id
      this.course_code = course_id.course_code
      this.course_name = course_id.course_name
      this.course_description = course_id.course_description
    } else {
      this.course_id = course_id
      this.course_code = course_code!
      this.course_name = course_name!
      this.course_description = course_description || ""
    }
  }

  get getCourseId() {
    return this.course_id
  }

  get getCourseCode() {
    return this.course_code
  }

  set setCourseCode(code: string) {
    this.course_code = code
  }

  get getCourseName() {
    return this.course_name
  }

  set setCourseName(name: string) {
    this.course_name = name
  }

  get getCourseDescription() {
    return this.course_description
  }

  set setCourseDescription(description: string) {
    this.course_description = description
  }
}
