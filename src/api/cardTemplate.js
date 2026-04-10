import request from './index'

export const getCardTemplateList = (params) => request.get('/cardTemplate/page', { params })

export const getCardTemplateDetail = (id) => request.get(`/cardTemplate/${id}`)

export const getActiveCardTemplates = (storeId) => request.get('/cardTemplate/active', { params: { storeId } })

export const saveCardTemplate = (data) => request.post('/cardTemplate', data)

export const updateCardTemplate = (data) => request.put('/cardTemplate', data)

export const deleteCardTemplate = (id) => request.delete(`/cardTemplate/${id}`)

export const bindMemberCard = (data) => request.post('/memberCard/bind', data)