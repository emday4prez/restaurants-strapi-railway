"use strict";

/**
 *  order controller
 */

const { createCoreController } = require("@strapi/strapi").factories;
const stripe = require("stripe")(`${process.env.STRIPE_SECRET_TEST}`);

module.exports = createCoreController("api::order.order", ({ strapi }) => ({
  async create(ctx) {
    const { address, amount, dishes, token, city, state } = JSON.parse(
      ctx.request.body
    );
    const dishNames = dishes.map((dish) => {
      return { dish: dish.name, quantity: dish.quantity };
    });
    console.log("ctx.state", ctx.state);
    const stripeAmount = Math.floor(amount * 100);
    // charge on stripe
    const charge = await stripe.charges.create({
      // Transform cents to dollars.
      amount: stripeAmount,
      currency: "usd",
      description: `${JSON.stringify(dishNames)}`,
      //description: `Order ${new Date()} by ${ctx.state.user._id}`,
      source: token,
    });

    // Register the order in the database
    const entity = await strapi.service("api::order.order").create({
      data: {
        publishedAt: new Date(),
        //user: ctx.state.user.id,
        charge_id: charge.id,
        amount: stripeAmount,
        address,
        dishes,
        city,
        state,
      },
    });

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);

    return this.transformResponse(sanitizedEntity);
  },
}));
