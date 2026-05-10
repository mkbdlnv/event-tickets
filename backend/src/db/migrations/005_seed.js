import bcrypt from 'bcrypt';

export async function up(knex) {
  const [{ count }] = await knex('users').count('id');
  if (Number(count) > 0) return;

  const [customer, admin] = await knex('users')
    .insert([
      {
        email: 'user@test.com',
        password: await bcrypt.hash('Test1234', 12),
        display_name: 'Тестовый пользователь',
        role: 'customer'
      },
      {
        email: 'admin@test.com',
        password: await bcrypt.hash('Admin1234', 12),
        display_name: 'Администратор',
        role: 'admin'
      }
    ])
    .returning('*');

  const now = new Date();
  const events = await knex('events')
    .insert([
      {
        title: 'Ночной показ: Интерстеллар',
        description: 'Большой экран, чистый звук и любимая научная фантастика.',
        category: 'movie',
        venue: 'Kinopark 11 IMAX Esentai',
        city: 'Almaty',
        starts_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        price: 3500,
        created_by: admin.id
      },
      {
        title: 'Летний концерт на крыше',
        description: 'Живая музыка и вид на вечерний город.',
        category: 'concert',
        venue: 'Terrace Hall',
        city: 'Almaty',
        starts_at: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        price: 9000,
        created_by: admin.id
      },
      {
        title: 'Финал университетской лиги',
        description: 'Главный матч сезона по мини-футболу.',
        category: 'sport',
        venue: 'Спорткомплекс КазНУ',
        city: 'Almaty',
        starts_at: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        price: 2500,
        created_by: admin.id
      }
    ])
    .returning('*');

  const rows = ['A', 'B', 'C', 'D', 'E'];
  const seats = events.flatMap((event) =>
    rows.flatMap((row) =>
      Array.from({ length: 10 }, (_, index) => ({
        event_id: event.id,
        row_label: row,
        seat_number: index + 1,
        status: 'available'
      }))
    )
  );

  await knex('seats').insert(seats);
  await knex('users').where({ id: customer.id }).update({ display_name: customer.display_name });
}

export async function down(knex) {
  await knex('booking_items').del();
  await knex('bookings').del();
  await knex('seats').del();
  await knex('events').del();
  await knex('users').whereIn('email', ['user@test.com', 'admin@test.com']).del();
}
