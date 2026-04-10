import request from './index'

export const getRechargeList = (params) => request.get('/recharge/page', { params })

export const getRechargeDetail = (id) => request.get(`/recharge/${id}`)

export const doRecharge = (data) => request.post('/recharge', data)