const express = require('express')

const router = express.Router()

const userControlers = require('../controlers/user-controler')

router.get('/',userControlers.home)

router.get('/users',userControlers.getAllusers)

router.get('/users/:id',userControlers.getOneuser)

router.post('/add-user',userControlers.adduser)

router.post('/delete-user',userControlers.deleteuser)


router.use('/images/profile_pic',userControlers.images)


module.exports = router