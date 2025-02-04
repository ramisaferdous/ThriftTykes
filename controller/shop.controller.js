const db = require('../db');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


exports.getMyShop = async (req, res) => {
    try {
        console.log("Session Data:", req.session);  // ✅ Debug session data
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
        console.log("Session Data:", req.session); // ✅ Debugging session info
        const { name, category, size, brand, condition, price } = req.body;
        const user = await prisma.user.findUnique({ where: { email: req.session.userId } });
        if (!user) {
            return res.status(401).json({ error: "Unauthorized. Please log in." });
        }

        const newProduct = await prisma.product.create({
            data: { name, category, size, brand, condition, price: parseFloat(price), userId: user.id }
        });

        console.log("Added Product:", newProduct); // ✅ Log product
        res.redirect('/my-shop/products');

    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).json({ error: "Server error", details: error.message }); // ✅ More error details
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Deleting product with ID: ${id}`); // ✅ Debugging log

        const product = await prisma.product.findUnique({ where: { id: parseInt(id) } });
        if (!product) {
            return res.status(404).json({ error: "Product not found" }); // ✅ Return 404 if not found
        }

        await prisma.product.delete({ where: { id: parseInt(id) } });

        res.redirect('/my-shop');
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ error: "Server error", details: error.message }); // ✅ Send error details
    }
};
