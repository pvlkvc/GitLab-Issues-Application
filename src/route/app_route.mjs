import express from 'express'

import { controller } from '../controller/app_controller.mjs'

const router = express.Router()
export default router

// Error code

router.get('/forbidden', controller.errorForbidden)
router.get('/not-found', controller.errorNotFound)

// GitLab
router.get('/', controller.home)

router.get('/config', controller.configForm)
router.post('/config', controller.configSubmit)

router.get('/issue/:id', controller.issue)
