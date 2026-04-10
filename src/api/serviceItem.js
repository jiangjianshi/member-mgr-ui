import request from './index'

export const getServiceItemList = (params) => request.get('/serviceItem/page', { params })

export const getServiceItemDetail = (id) => request.get(`/serviceItem/${id}`)

export const saveServiceItem = (data) => request.post('/serviceItem', data)

export const updateServiceItem = (data) => request.put('/serviceItem', data)

export const deleteServiceItem = (id) => request.delete(`/serviceItem/${id}`)