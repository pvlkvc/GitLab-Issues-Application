import express from 'express'

import { controller } from '../controller/app_controller.mjs'

const router = express.Router()
export default router

// Error code

router.get('/forbidden', controller.errorForbidden)
router.get('/not-found', controller.errorNotFound)

// Authentication
router.get('/auth', controller.unauthenticatedPage)
router.get('/auth/request', controller.authenticateRequest)
router.get('/auth/callback', controller.authenticateCallback)

router.get('/auth/logout', controller.authenticateLogout)

// GitLab
router.get('/', controller.home)

router.get('/config', controller.repConfig)
router.post('/config', controller.repSave)

router.get('/issue', controller.issueBlank)
router.get('/issue/:id', controller.issue)

router.post('/webhook/:id', controller.webhookReceive)

router.get('/userinfo', controller.userInfo)
