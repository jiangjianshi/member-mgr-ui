import request from './index'

export const getCaptcha = () => request.get('/auth/captcha')

export const login = (data) => request.post('/auth/login', data)

export const logout = () => request.post('/auth/logout')
