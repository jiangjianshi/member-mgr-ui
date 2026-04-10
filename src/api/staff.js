import request from './index'

export const getStaffList = (params) => request.get('/staff/page', { params })

export const getStaffDetail = (id) => request.get(`/staff/${id}`)

export const saveStaff = (data) => request.post('/staff', data)

export const updateStaff = (data) => request.put('/staff', data)

export const deleteStaff = (id) => request.delete(`/staff/${id}`)

export const getStaffPerformance = (staffId) => request.get(`/staff/${staffId}/performance`)