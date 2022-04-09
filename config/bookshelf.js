const knex = require("knex")({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    port: parseInt("5432"),
    database: "inventory-management-backend",
    user: "postgres",
    password: "root",
  },
});

const bookshelf = require("bookshelf")(knex);

/**
 * Registering models for bookshelf
 */
bookshelf.model("inventory", {
  tableName: "inventories",
  requireFetch: false,
});

bookshelf.model("inventory-stock-update", {
  tableName: "inventory_stock_updates",
  requireFetch: false,
});

bookshelf.model("unit", {
  tableName: "units",
  requireFetch: false,
});

module.exports = bookshelf;
