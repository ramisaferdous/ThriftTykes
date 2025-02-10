const express = require('express');
const path = require('path');
const router = express.Router();
const shopController = require('../controller/shop.controller');
const multer = require('multer');


const upload = multer({ dest: 'uploads/' });
router.get('/my-shop/products', shopController.getMyShop);
router.post('/add-product', upload.single('image'), shopController.addProduct);
router.get('/delete-product/:id', shopController.deleteProduct);

router.get('/my-shop', (req, res) => {
    res.sendFile(path.join(__dirname, '../resources/html_files/shop.html')); 
});


module.exports = router;