export async function up(knex) {
  await knex.schema.createTable('bookings', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users');
    table.integer('event_id').notNullable().references('id').inTable('events');
    table.decimal('total_price', 10, 2).notNullable();
    table.string('status', 20).notNullable().defaultTo('confirmed');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('booking_items', (table) => {
    table.increments('id').primary();
    table.integer('booking_id').notNullable().references('id').inTable('bookings').onDelete('CASCADE');
    table.integer('seat_id').notNullable().references('id').inTable('seats');
    table.decimal('price', 10, 2).notNullable();
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('booking_items');
  await knex.schema.dropTableIfExists('bookings');
}
