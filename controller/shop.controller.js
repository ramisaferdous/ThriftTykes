const db = require('../db');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
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

        const parsedQuantity = parseInt(req.body.quantity)||1;
        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
            return res.status(400).json({ error: "Invalid quantity" });
        }



        const newProduct = await prisma.product.create({
            data: {
                name,
                category,
                size,
                brand,
                condition,
                price: parseFloat(price),
                quantity: parsedQuantity,
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

        const userId = req.session.passport?.user;
        if (!userId) {
            console.log("Unauthorized request to delete product.");
            return res.status(401).json({ error: "Unauthorized. Please log in." });
        }

        const product = await prisma.product.findUnique({ where: { id: id } }); 

        if (!product) {
            console.log("Product not found in database.");
            return res.status(404).json({ error: "Product not found" });
        }

        if (product.userId !== userId) {
            console.log("Unauthorized: Product does not belong to the user.");
            return res.status(403).json({ error: "Unauthorized: You can't delete this product." });
        }

        await prisma.product.delete({ where: { id: id } }); 

        console.log("Product deleted successfully.");
        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ error: "Server error", details: error.message });
    }
};


