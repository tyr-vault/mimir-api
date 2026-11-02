import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('drafts', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table
            .uuid('user_id')
            .notNullable()
            .references('id')
            .inTable('users')
            .onDelete('CASCADE');
        table.enum('kind', ['transaction', 'category']).notNullable();
        table
            .enum('status', ['pending', 'confirmed', 'rejected'])
            .notNullable()
            .defaultTo('pending');
        table.jsonb('payload').notNullable();
        table.string('source').notNullable().defaultTo('bot');
        table.timestamp('confirmed_at').nullable();
        table.timestamp('rejected_at').nullable();
        table.timestamps(true, true);
        table.index(['user_id', 'status']);
        table.index(['status', 'created_at']);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('drafts');
}
