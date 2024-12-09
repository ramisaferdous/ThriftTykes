const express = require('express');
const path = require('path');
const router = express.Router();
const loginController = require('../controller/dashboard.controller'); 


router.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../resources/html_files/dashboard.html')); 
});




module.exports = router;