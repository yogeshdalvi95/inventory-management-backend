"use strict";
const utils = require("../../../config/utils");
const bookshelf = require("../../../config/bookshelf");
const { validateNumber } = require("../../../config/utils");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async find(ctx) {
    const { page, query, pageSize } = utils.getRequestParams(ctx.request.query);
    let _limit = 10;
    let _start = 0;

    _limit = pageSize;
    _start = (page - 1) * _limit;

    /**getting count */
    const count = await strapi.query("inventory-stock-update").count(query);

    query["_limit"] = _limit;
    query["_start"] = _start;

    const data = await strapi.query("inventory-stock-update").find(query);

    return {
      data: data, // your data array
      page: page, // current page number
      pageSize: pageSize,
      totalCount: count, // total row number
    };
  },

  async getInventoryStockStatus(ctx) {
    const { query } = utils.getRequestParams(ctx.request.query);
    const { add_stock, inventory } = query;

    const data = await strapi.query("inventory-stock-update").find(query, []);

    let totalUsed = 0;
    let totalAdded = 0;
    let totalAddedCost = 0;

    const inventoryData = await strapi.query("inventory").findOne({
      id: inventory,
    });
    const baseUnit = inventoryData.unit;

    let totalQuntity = validateNumber(inventoryData.stock_available);
    let totalQuntity1 = 0;
    if (baseUnit.name === "kgs") {
      totalQuntity1 = totalQuntity * 1000;
    } else {
      totalQuntity1 = totalQuntity / 1000;
    }

    await utils.asyncForEach(data, async (element) => {
      const unitOfStock = await strapi.query("unit").findOne({
        id: element.unit,
      });
      let stock = validateNumber(element.stock_to_update);
      if (baseUnit.name === "kgs") {
        if (unitOfStock.name === "grams") {
          stock = stock / 1000;
        }
      } else {
        /** Grams */
        if (unitOfStock.name === "kgs") {
          stock = stock * 1000;
        }
      }

      if (element.add_stock) {
        totalAdded = totalAdded + stock;
        totalAddedCost = totalAddedCost + validateNumber(element.cost);
      } else {
        totalUsed = totalUsed + stock;
      }
    });
    let dataToSend = {
      baseUnit: baseUnit.name,
      totalQuntity: totalQuntity,
      totalQuntity1: totalQuntity1,
    };

    if (add_stock === true) {
      let newVal = 0;
      let newUnit = "";
      if (baseUnit.name === "kgs") {
        newVal = totalAdded * 1000;
        newUnit = "grams";
      } else {
        newVal = totalAdded / 1000;
        newUnit = "kgs";
      }

      dataToSend = {
        ...dataToSend,
        newUnit: newUnit,
        totalAdded: totalAdded,
        totalAdded1: newVal,
        totalAddedCost: totalAddedCost,
      };
    } else if (add_stock === false) {
      let newVal = 0;
      let newUnit = "";
      if (baseUnit.name === "kgs") {
        newVal = totalUsed * 1000;
        newUnit = "grams";
      } else {
        newVal = totalUsed / 1000;
        newUnit = "kgs";
      }
      dataToSend = {
        ...dataToSend,
        newUnit: newUnit,
        totalUsed: totalUsed,
        totalUsed: newVal,
      };
    } else {
      let newVal = 0;
      let newVal1 = 0;
      let newUnit = "";
      if (baseUnit.name === "kgs") {
        newVal = totalAdded * 1000;
        newVal1 = totalUsed * 1000;
        newUnit = "grams";
      } else {
        newVal = totalAdded / 1000;
        newVal1 = totalUsed / 1000;
        newUnit = "kgs";
      }
      dataToSend = {
        ...dataToSend,
        newUnit: newUnit,
        totalAdded: totalAdded,
        totalUsed: totalUsed,
        totalAdded1: newVal,
        totalUsed1: newVal1,
        totalAddedCost: totalAddedCost,
      };
    }

    if (baseUnit.name === "kgs") {
    } else {
    }

    ctx.send(dataToSend);
  },

  async create(ctx) {
    let { add_stock, stock_to_update, inventory, unit } = ctx.request.body;
    await bookshelf.transaction(async (t) => {
      await strapi
        .query("inventory-stock-update")
        .create(ctx.request.body, { transacting: t })
        .then((model) => model)
        .catch((err) => {
          console.log(err);
          throw 500;
        });

      const inventoryData = await strapi.query("inventory").findOne({
        id: inventory,
      });
      const baseUnit = inventoryData.unit;

      let inventoryStock = validateNumber(inventoryData.stock_available);
      let stockToUpdate = validateNumber(stock_to_update);

      const unitOfStockToUpdate = await strapi.query("unit").findOne({
        id: unit,
      });

      if (baseUnit.name === "kgs") {
        if (unitOfStockToUpdate.name === "grams") {
          stockToUpdate = stockToUpdate / 1000;
        }
      } else {
        /** Grams */
        if (unitOfStockToUpdate.name === "kgs") {
          stockToUpdate = stockToUpdate * 1000;
        }
      }

      if (add_stock) {
        inventoryStock = inventoryStock + stockToUpdate;
      } else {
        inventoryStock = inventoryStock - stockToUpdate;
      }

      await strapi.query("inventory").update(
        { id: inventory },
        {
          stock_available: inventoryStock,
        },
        {
          patch: true,
          transacting: t,
        }
      );
    });
    ctx.send(200);
  },
};
