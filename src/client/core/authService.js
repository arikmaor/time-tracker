import apiClient from 'core/apiClient'
import {get} from 'lodash'

const TOKEN_STORAGE_KEY = 'token'
const USER_STORAGE_KEY = 'user'
let signedInUser = null

export async function restoreAuth() {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (!token) {
    return null
  }
  signedInUser = JSON.parse(localStorage.getItem(USER_STORAGE_KEY))
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
  try {
    const {data} = await apiClient.get('/auth/user')
    signedInUser = data
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(signedInUser))
  } catch (err) {
    console.log(err)
    // signout if unauthorized
  }
  return signedInUser
}

export async function signIn(username, password) {
  signOut()
  try {
    const {data: {token, user}} = await apiClient.post('/auth/token', { username, password })
    localStorage.setItem('token', token)
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
    signedInUser = user
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(signedInUser))
    return signedInUser
  } catch (err) {
    if (get(err, 'response.status') === 401) {
      throw new Error('שם משתמש או סיסמא שגויים')
    }
    const errorFromServer = get(err, 'response.data.error')
    if (errorFromServer) {
      throw new Error(errorFromServer)
      console.log('Error', errorFromServer);
    } else {
      throw err
    }
  }
}

export function signOut() {
  delete apiClient.defaults.headers.common['Authorization']
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(USER_STORAGE_KEY)
  signedInUser = null
}

export async function changePassword(oldPassword, newPassword) {
  try {
    const {data} = await apiClient.post('/auth/changepassword', { oldPassword, newPassword })
    return data.success
  } catch (err) {
    const errorFromServer = get(err, 'response.data.error')
    if (errorFromServer) {
      throw new Error(errorFromServer)
    } else {
      throw err
    }
  }
}

export const getSignedInUser = () => signedInUser
