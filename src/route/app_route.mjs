import express from 'express'

import { controller } from '../controller/app_controller.mjs'

const router = express.Router()
export default router

// Error code

router.get('/forbidden', controller.errorForbidden)
router.get('/not-found', controller.errorNotFound)

// GitLab
router.get('/', controller.issues)
