import apiClient from 'core/apiClient'

export async function getAllUsers() {
  const {data} = await apiClient.get('/users')
  return data
}

export async function addUser(user) {
  const {data} = await apiClient.post('/users', user)
  return data
}

export async function getUserById(id) {
  const {data} = await apiClient.get(`/users/${id}`)
  return data
}

export async function updateUser(id, updatedProps) {
  const {data} = await apiClient.put(`/users/${id}`, updatedProps)
  return data
}

export async function deleteUser(id) {
  const {data} = await apiClient.delete(`/users/${id}`)
  return data
}

export async function resetPassword(id) {
  const {data} = await apiClient.post(`/users/${id}/resetpassword`)
  return data
}
