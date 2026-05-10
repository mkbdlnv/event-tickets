export async function up(knex) {
  await knex.schema.createTable('seats', (table) => {
    table.increments('id').primary();
    table.integer('event_id').notNullable().references('id').inTable('events').onDelete('CASCADE');
    table.string('row_label', 5).notNullable();
    table.integer('seat_number').notNullable();
    table.string('status', 20).notNullable().defaultTo('available');
    table.timestamp('locked_until', { useTz: true });
    table.integer('locked_by').references('id').inTable('users');
    table.unique(['event_id', 'row_label', 'seat_number']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('seats');
}
