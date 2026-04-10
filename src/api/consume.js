import request from './index'

export const getConsumeList = (params) => request.get('/consume/page', { params })

export const getConsumeDetail = (id) => request.get(`/consume/${id}`)

export const doConsume = (data) => request.post('/consume', data)

export const undoConsume = (id) => request.post(`/consume/${id}/undo`)

export const getRevenue = (params) => request.get('/consume/revenue', { params })