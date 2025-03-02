const express = require('express');
const router = express.Router();
const path = require('path');
const cartController = require('../controller/cart.controller');

router.post('/cart/add', cartController.addToCart);
router.get('/cart/viewcart', cartController.viewCart);
router.delete('/cart/remove/:id', cartController.removeFromCart);
router.post('/checkout', cartController.checkout);
router.get('/checkout/success', cartController.checkoutSuccess);
router.get('/checkout/cancel', cartController.checkoutCancel);

router.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, '../resources/html_files/cart.html')); 
});

module.exports = router;
