export async function up(knex) {
  await knex.schema.alterTable('events', (table) => {
    table.timestamp('deleted_at', { useTz: true });
  });
}

export async function down(knex) {
  await knex.schema.alterTable('events', (table) => {
    table.dropColumn('deleted_at');
  });
}
