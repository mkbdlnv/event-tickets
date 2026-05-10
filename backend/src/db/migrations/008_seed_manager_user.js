import bcrypt from 'bcrypt';

export async function up(knex) {
  const existing = await knex('users').where({ email: 'manager@test.com' }).first();
  if (existing) return;

  await knex('users').insert({
    email: 'manager@test.com',
    password: await bcrypt.hash('Manager1234', 12),
    display_name: 'Event Manager',
    role: 'manager'
  });
}

export async function down(knex) {
  const manager = await knex('users').where({ email: 'manager@test.com' }).first();
  if (manager) {
    await knex('events').where({ created_by: manager.id }).update({ created_by: null });
  }
  await knex('users').where({ email: 'manager@test.com' }).del();
}
