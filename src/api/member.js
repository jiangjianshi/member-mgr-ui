import request from './index'

export const getMemberList = (params) => request.get('/member/page', { params })

export const getMemberDetail = (id) => request.get(`/member/${id}`)

export const getMemberByPhone = (phone) => request.get(`/member/phone/${phone}`)

export const searchMemberByPhone = (phone) => request.get('/member/search', { params: { phone } })

export const registerMember = (data) => request.post('/member/register', data)

export const updateMember = (data) => request.put('/member', data)

export const updateMemberStatus = (data) => request.put('/member/status', data)

export const signIn = (id) => request.post(`/member/${id}/signIn`)