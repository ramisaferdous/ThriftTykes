const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDashboard = async (req, res) => {
    try {
        console.log("Fetching all products for the dashboard...");

        //const userId = req.session.userId; 
        const userId = req.session.passport?.user;
        
        const products = await prisma.product.findMany({
            where: {
                userId: { not: userId } 
            }
        });

        console.log("Products fetched:", products.length);
        res.json(products);
    } catch (error) {
        console.error("Error fetching dashboard products:", error);
        res.status(500).json({ error: "Server error", details: error.message });
    }
};
