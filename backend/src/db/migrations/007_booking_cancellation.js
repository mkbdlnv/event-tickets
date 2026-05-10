export async function up(knex) {
  await knex.schema.alterTable('bookings', (table) => {
    table.index(['user_id'], 'idx_bookings_user_id');
  });
  await knex.schema.alterTable('seats', (table) => {
    table.index(['event_id', 'status'], 'idx_seats_event_status');
  });
  await knex.schema.alterTable('events', (table) => {
    table.index(['starts_at'], 'idx_events_starts_at');
  });
}

export async function down(knex) {
  await knex.schema.alterTable('events', (table) => {
    table.dropIndex(['starts_at'], 'idx_events_starts_at');
  });
  await knex.schema.alterTable('seats', (table) => {
    table.dropIndex(['event_id', 'status'], 'idx_seats_event_status');
  });
  await knex.schema.alterTable('bookings', (table) => {
    table.dropIndex(['user_id'], 'idx_bookings_user_id');
  });
}
