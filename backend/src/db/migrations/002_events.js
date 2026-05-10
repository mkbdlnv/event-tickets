export async function up(knex) {
  await knex.schema.createTable('events', (table) => {
    table.increments('id').primary();
    table.string('title', 255).notNullable();
    table.text('description');
    table.string('category', 50).notNullable();
    table.string('venue', 255).notNullable();
    table.string('city', 100).notNullable().defaultTo('Almaty');
    table.timestamp('starts_at', { useTz: true }).notNullable();
    table.decimal('price', 10, 2).notNullable();
    table.integer('created_by').references('id').inTable('users');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('events');
}
