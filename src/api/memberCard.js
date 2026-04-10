import request from './index'

export const getMemberCardList = (params) => request.get('/memberCard/page', { params })

export const getMemberCardDetail = (id) => request.get(`/memberCard/${id}`)

export const getMemberCardByNo = (cardNo) => request.get(`/memberCard/no/${cardNo}`)

export const bindMemberCard = (data) => request.post('/memberCard/bind', data)

export const reportLoss = (id) => request.post(`/memberCard/${id}/reportLoss`)

export const unblock = (id) => request.post(`/memberCard/${id}/unblock`)

export const cancelCard = (id) => request.post(`/memberCard/${id}/cancel`)