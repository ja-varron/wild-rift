export type UserRole = 'admin' | 'instructor' | 'student'

export interface TokenPayload {
    sub: string //user_id
    email: string
    role: UserRole
    exp: number
}

export interface AuthUser {
  userId: string
  email: string
  role: UserRole
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
}