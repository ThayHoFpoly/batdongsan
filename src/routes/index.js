const express = require('express');
const router = express.Router();

const publicRoutes = require('./public.routes');
const adminRoutes = require('./admin.routes');

// Admin panel routes
router.use('/admin', adminRoutes);

// Public facing routes
router.use('/', publicRoutes);

module.exports = router;

