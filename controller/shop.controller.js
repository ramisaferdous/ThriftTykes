const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getMyShop = async (req, res) => {
    try {
        const userId = req.session.userId; // Ensure user is logged in
        if (!userId) return res.redirect('/login');

        const products = await prisma.product.findMany({ where: { userId } });
        res.render("shop.html", { products });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).send("Server error");
    }
};
exports.addProduct = async (req, res) => {
    try {
        const { name, category, size, brand, condition, price } = req.body;
        const userId = req.session.userId;
        if (!userId) return res.redirect('/login');
        await prisma.product.create({
            data: {
                name, category, size, brand, condition, price, userId
            }
        });
        res.redirect('/my-shop');

    }
    catch (error) {
        console.error("Error adding product:", error);
        res.status(500).send("Server error");
    }
};
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.product.delete({ where: { id } });
        res.redirect('/shop');
    }
    catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).send("Server error");
    }
};