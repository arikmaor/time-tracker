import apiClient from 'core/apiClient'

export async function getAllActivities() {
  const {data} = await apiClient.get('/activities')
  return data
}

export async function addActivity(activity) {
  const {data} = await apiClient.post('/activities', activity)
  return data
}

export async function getActivityById(id) {
  const {data} = await apiClient.get(`/activities/${id}`)
  return data
}

export async function updateActivity(id, updatedProps) {
  const {data} = await apiClient.put(`/activities/${id}`, updatedProps)
  return data
}

export async function deleteActivity(id) {
  const {data} = await apiClient.delete(`/activities/${id}`)
  return data
}
