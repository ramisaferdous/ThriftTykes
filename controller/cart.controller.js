const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();


exports.addToCart = async (req, res) => {
  try {
    const userId = req.session.passport?.user;
    const { productId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (product.quantity <= 0) {
      return res.status(400).json({ error: "Out of stock" });
    }

    const existingCartItem = await prisma.cart.findFirst({
      where: { userId, productId },
    });

    if (existingCartItem) {
      await prisma.cart.update({
        where: { id: existingCartItem.id },
        data: { quantity: { increment: 1 } },
      });
    } else {
      await prisma.cart.create({
        data: { userId, productId, quantity: 1 },
      });
    }


    await prisma.product.update({
      where: { id: productId },
      data: { quantity: { decrement: 1 } },
    });

    return res.status(200).json({ message: "Product added to cart successfully" });

  } catch (error) {
    console.error("Error adding to cart:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.viewCart = async (req, res) => {
  try {
    const userId = req.session.passport?.user;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const cartItems = await prisma.cart.findMany({
      where: { userId },
      include: { product: true },
    });

    return res.status(200).json(cartItems);
  } catch (error) {
    console.error("Error fetching cart:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.session.passport?.user;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const cartItem = await prisma.cart.findUnique({
      where: { id },
      include: { product: true }, 
    });

    if (!cartItem) {
      return res.status(404).json({ error: "Cart item not found" });
    }

   
    await prisma.product.update({
      where: { id: cartItem.productId },
      data: { quantity: { increment: cartItem.quantity } },
    });

   
    await prisma.cart.delete({ where: { id } });

    return res.status(200).json({ message: "Item removed from cart and stock updated" });
  } catch (error) {
    console.error("Error removing from cart:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.checkout = async (req, res) => {
  try {
    const userId = req.session.passport?.user;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const cartItems = await prisma.cart.findMany({ where: { userId } });

    if (cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }



    await prisma.cart.deleteMany({ where: { userId } });

    return res.status(200).json({ message: "Checkout successful" });
  } catch (error) {
    console.error("Error during checkout:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
