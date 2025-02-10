const db = require('../db');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Store images in "uploads" folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Rename file with timestamp
    }
});

const upload = multer({ storage: storage });

exports.getMyShop = async (req, res) => {
    try {
        console.log("Session Data:", req.session);
        const userId = req.session.passport?.user;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized. Please log in." });
        }

        const products = await prisma.product.findMany({ where: { userId: userId } });
        return res.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        return res.status(500).json({ error: "Server error", details: error.message });  // ✅ More debugging info
    }
};

exports.addProduct = async (req, res) => {
    try {
        const { name, category, size, brand, condition, price } = req.body;

       
        console.log("Session Data:", req.session);

        const userId = req.session.passport?.user;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized. Please log in." });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(400).json({ error: "User not found" });
        }


        const newProduct = await prisma.product.create({
            data: {
                name,
                category,
                size,
                brand,
                condition,
                price: parseFloat(price),
                imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
                userId: userId
            }
        });

        console.log("Added Product:", newProduct);
        res.redirect('/my-shop/products');

    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).json({ error: "Server error", details: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Deleting product with ID: ${id}`);


        const product = await prisma.product.findUnique({ where: { id: parseInt(id) } });
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        await prisma.product.delete({ where: { id: parseInt(id) } });

        res.redirect('/my-shop');
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ error: "Server error", details: error.message }); // ✅ Send error details
    }
};
