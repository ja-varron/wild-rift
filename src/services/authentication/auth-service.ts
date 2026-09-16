import type { AuthTokens, TokenPayload } from "./auth-types";

const BASE = '/api/v1/auth'

export function decodeJWT(token: string): TokenPayload {
  return JSON.parse(atob(token.split('.')[1]))
}


export async function apiSignin(email: string, password: string): Promise<AuthTokens> {
  const body = new URLSearchParams({ username: email, password })
  const response = await fetch(`${BASE}/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded'},
    body
  })

  if(!response.ok) throw await response.json()

  return response.json()
}

export async function apiSignout(refreshToken: string, accessToken: string): Promise<void> {
  await fetch(`${BASE}/signout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ refresh_token: refreshToken })
  })
}


export async function apiRefreshToken(refreshToken: string): Promise<AuthTokens> {
  const response = await fetch(`${BASE}/token/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken })
  })

  if(!response.ok) throw await response.json()

  return response.json()
}

// export const AuthService = {

//   /**
//    * Public signup endpoint. Only creates ADMIN accounts.
//    * @param data institutionName - name of the institution
//    * @param data email - email of the admin
//    * @param data password - password of the admin
//    * @returns
//    */
//   signupAdmin: async(data: {
//     institutionName: string,
//     email: string,
//     password: string
//   }) => {
//     // sign up admin
//     const response = await fetch(`${BACKEND_API_URL}/auth/signup`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify(data)
//     })

//     if (!response.ok) {
//       let errorMsg = 'Failed to signup admin'
//       try {
//         const errBody = await response.json()
//         errorMsg = errBody.detail || errBody.message || errorMsg
//       } catch {}
//       throw new Error(errorMsg)
//     }

//     return await response.json()
//   },

//   /**
//    * Verifies the OTP sent to the admin.
//    * @param data email - email of the admin
//    * @param data otp - otp sent to the admin
//    * @returns void
//    */
//   verifyOTP: async(data: {
//     email: string,
//     otp: string,
//   }) => {
//     const response = await fetch(`${BACKEND_API_URL}/auth/otp/verify`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify(data)
//     })

//     if (!response.ok) {
//       let errorMsg = 'Failed to verify OTP'
//       try {
//         const errBody = await response.json()
//         errorMsg = errBody.detail || errBody.message || errorMsg
//       } catch {}
//       throw new Error(errorMsg)
//     }

//     return await response.json()
//   },


//   /**
//    * Signin endpoint for admin.
//    * @param data email - email of the admin
//    * @param data password - password of the admin
//    * @returns object containing the access token, and user data
//    */
//   signin: async(data: {
//     email: string,
//     password: string
//   }) => {
//     const formData = new URLSearchParams()

//     formData.append('username', data.email) // OAuth2 password request form expects 'username'
//     formData.append('password', data.password)

//     const response = await fetch(`${BACKEND_API_URL}/auth/signin`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/x-www-form-urlencoded'
//       },
//       body: formData
//     })

//     if (!response.ok) {
//       let errorMsg = 'Failed to sign in'
//       try {
//         const errBody = await response.json()
//         errorMsg = errBody.detail || errBody.message || errorMsg
//       } catch {}
//       throw new Error(errorMsg)
//     }

//     return await response.json()
//   },


//   /**
//    * Refreshes the access token.
//    * @param refreshToken - refresh token
//    * @returns object containing the new access token and refresh token
//    */
//   refreshToken: async(refreshToken: string) => {
//     const response = await fetch(`${BACKEND_API_URL}/auth/token/refresh`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({
//         refresh_token: refreshToken
//       })
//     })

//     if (!response.ok) {
//       let errorMsg = 'Failed to refresh token'
//       try {
//         const errBody = await response.json()
//         errorMsg = errBody.detail || errBody.message || errorMsg
//       } catch {}
//       throw new Error(errorMsg)
//     }

//     return await response.json()
//   },


//   /**
//    * Signout endpoint for admin.
//    * @param refreshToken - refresh token
//    * @returns void
//    */
//   signout: async(refreshToken: string) => {
//     const response = await fetch(`${BACKEND_API_URL}/auth/signout`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({
//         refresh_token: refreshToken
//       })
//     })

//     if (!response.ok) {
//       let errorMsg = 'Failed to sign out'
//       try {
//         const errBody = await response.json()
//         errorMsg = errBody.detail || errBody.message || errorMsg
//       } catch {}
//       throw new Error(errorMsg)
//     }

//     return await response.json()
//   }


//   // Signout all execute later
// }