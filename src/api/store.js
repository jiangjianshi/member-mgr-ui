import request from './index'

export const getStoreList = (params) => request.get('/store/page', { params })

export const getStoreDetail = (id) => request.get(`/store/${id}`)

export const saveStore = (data) => request.post('/store', data)

export const updateStore = (data) => request.put('/store', data)

export const deleteStore = (id) => request.delete(`/store/${id}`)