const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


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

    const cartItems = await prisma.cart.findMany({
      where: { userId },
      include: { product: true }, 
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    
    const lineItems = cartItems.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.product.name,
        },
        unit_amount: Math.round(item.product.price * 100), 
      },
      quantity: item.quantity,
    }));

    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      success_url: `${req.protocol}://${req.get('host')}/checkout/success`,
      cancel_url: `${req.protocol}://${req.get('host')}/checkout/cancel`,
      line_items: lineItems,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Error during checkout:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
exports.checkoutSuccess = async (req, res) => {
  try {
      const userId = req.session.passport?.user;

      if (!userId) {
          return res.status(401).json({ error: "User not authenticated" });
      }

      
      await prisma.cart.deleteMany({ where: { userId } });

      res.send("<h2>Payment Successful! Your order has been placed.</h2><a href='/dashboard'>Go back to Dashboard</a>");
  } catch (error) {
      console.error("Error in checkout success:", error);
      return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.checkoutCancel = async (req, res) => {
  res.send("<h2>Payment Cancelled. You can try again.</h2><a href='/cart'>Go back to Cart</a>");
};
