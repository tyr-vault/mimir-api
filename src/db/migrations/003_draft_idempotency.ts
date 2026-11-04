import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('draft_idempotency_keys', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table
            .uuid('user_id')
            .notNullable()
            .references('id')
            .inTable('users')
            .onDelete('CASCADE');
        table.string('idempotency_key', 255).notNullable();
        table
            .uuid('draft_id')
            .notNullable()
            .references('id')
            .inTable('drafts')
            .onDelete('CASCADE');
        table.timestamps(true, true);
        table.unique(['user_id', 'idempotency_key']);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('draft_idempotency_keys');
}
