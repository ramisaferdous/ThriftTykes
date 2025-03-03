const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDashboard = async (req, res) => {
    try {
        console.log("Fetching all products for the dashboard...");
        console.log("Received filters:", req.query); 

        const userId = req.session.passport?.user;
        const { category, size, condition } = req.query;

        const filter = {
            userId: { not: userId } 
        };

        if (category) {
            console.log(`Filtering by category: ${category}`);
            filter.category = { equals: category, mode: "insensitive" };  
        }
        if (size) {
            console.log(`Filtering by size: ${size}`);
            filter.size = { equals: size.toUpperCase() };
        }
        if (condition) {
            console.log(`Filtering by condition: ${condition}`);
            filter.condition = { equals: condition, mode: "insensitive" };
        }

        const products = await prisma.product.findMany({
            where: filter,
        });

        console.log("Products fetched after filtering:", products.length);
        res.json(products);
    } catch (error) {
        console.error("Error fetching dashboard products:", error);
        res.status(500).json({ error: "Server error", details: error.message });
    }
};
