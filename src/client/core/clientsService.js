import apiClient from 'core/apiClient'

export async function getAllClients() {
  const {data} = await apiClient.get('/clients')
  return data
}

export async function addClient(client) {
  const {data} = await apiClient.post('/clients', client)
  return data
}

export async function getClientById(id) {
  const {data} = await apiClient.get(`/clients/${id}`)
  return data
}

export async function updateClient(id, updatedProps) {
  const {data} = await apiClient.put(`/clients/${id}`, updatedProps)
  return data
}

export async function deleteClient(id) {
  const {data} = await apiClient.delete(`/clients/${id}`)
  return data
}
