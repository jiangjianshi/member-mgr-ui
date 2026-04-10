import request from './index'

export const getPointsBalance = (memberId) => request.get(`/points/balance/${memberId}`)

export const getPointsLogs = (memberId) => request.get(`/points/logs/${memberId}`)

export const signInPoints = (memberId) => request.post(`/points/signIn/${memberId}`)

export const getPointsGoodsList = (params) => request.get('/points/goods/page', { params })

export const getPointsGoodsDetail = (id) => request.get(`/points/goods/${id}`)

export const savePointsGoods = (data) => request.post('/points/goods', data)

export const updatePointsGoods = (data) => request.put('/points/goods', data)

export const deletePointsGoods = (id) => request.delete(`/points/goods/${id}`)

export const exchangePoints = (data) => request.post('/points/exchange', data)

export const adjustPoints = (data) => request.post('/points/adjust', data)