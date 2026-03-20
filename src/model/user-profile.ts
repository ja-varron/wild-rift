export class UserProfile {
  private user_id: string
  private first_name: string
  private middle_name: string | null
  private last_name: string
  private email: string
  private role: "Instructor" | "Student" | "Admin"
  private dateCreated: string

  constructor({
    user_id,
    first_name,
    middle_name,
    last_name,
    email,
    role,
    dateCreated
  }: {
    user_id?: string | UserProfile,
    first_name: string,
    middle_name?: string | null,
    last_name: string,
    email: string,
    role: "Instructor" | "Student" | "Admin",
    dateCreated?: string
  }) {
    if (user_id instanceof UserProfile) {
      this.user_id = user_id.user_id
      this.first_name = user_id.first_name
      this.middle_name = user_id.middle_name
      this.last_name = user_id.last_name
      this.email = user_id.email
      this.role = user_id.role
      this.dateCreated = user_id.dateCreated
    } else {
      this.user_id = user_id!
      this.first_name = first_name!
      this.middle_name = middle_name ?? null
      this.last_name = last_name!
      this.email = email!
      this.role = role!
      this.dateCreated = dateCreated || new Date().toISOString()
    }
  }

  get getUserId() {
    return this.user_id
  }

  get getFirstName() {
    return this.first_name
  }

  set setFirstName(name: string) {
    this.first_name = name
  }

  get getMiddleName() {
    return this.middle_name
  }

  set setMiddleName(name: string | null) {
    this.middle_name = name
  }

  get getLastName() {
    return this.last_name
  }

  set setLastName(name: string) {
    this.last_name = name
  }

  get getEmailAddress() {
    return this.email
  }

  set setEmailAddress(email: string) {
    this.email = email
  }

  get getUserRole() {
    return this.role
  }

  set setUserRole(role: "Instructor" | "Student" | "Admin") {
    this.role = role
  }

  get getDateCreated() {
    return this.dateCreated
  }

  set setDateCreated(date: string) {
    this.dateCreated = date
  }

  get fullName() {
    return `${this.first_name} ${this.middle_name ? this.middle_name + " " : ""}${this.last_name}`
  }
}