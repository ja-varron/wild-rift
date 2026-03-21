export class Course {
  private course_id: string
  private course_name: string
  private course_description: string
  private created_at: string

  constructor({
    course_id,
    course_name,
    course_description,
    created_at
  }: {
    course_id?: string | Course,
    course_name?: string,
    course_description?: string,
    created_at?: string
  }) {
    if (course_id instanceof Course) {
      this.course_id = course_id.course_id
      this.course_name = course_id.course_name
      this.course_description = course_id.course_description
      this.created_at = course_id.created_at
    } else {
      this.course_id = course_id!
      this.course_name = course_name!
      this.course_description = course_description || ""
      this.created_at = created_at || new Date().toISOString()
    }
  }

  get getCourseId() {
    return this.course_id
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

  get getCreatedAt() {
    return this.created_at
  }

}
