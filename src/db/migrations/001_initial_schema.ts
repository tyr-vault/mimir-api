import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('users', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('email').notNullable().unique();
        table.string('password').notNullable();
        table.string('name').notNullable();
        table.timestamps(true, true);
    });

    await knex.schema.createTable('categories', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table
            .uuid('user_id')
            .notNullable()
            .references('id')
            .inTable('users')
            .onDelete('CASCADE');
        table.string('name').notNullable();
        table.timestamps(true, true);
        table.unique(['user_id', 'name']);
        table.index('user_id');
    });

    await knex.schema.createTable('transactions', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table
            .uuid('user_id')
            .notNullable()
            .references('id')
            .inTable('users')
            .onDelete('CASCADE');
        table
            .uuid('category_id')
            .notNullable()
            .references('id')
            .inTable('categories')
            .onDelete('RESTRICT');
        table.enum('type', ['expense', 'income']).notNullable();
        table.decimal('amount', 12, 2).notNullable();
        table.date('date').notNullable();
        table.text('note').nullable();
        table.timestamps(true, true);
        table.index(['user_id', 'date']);
        table.index(['user_id', 'category_id']);
        table.index(['user_id', 'type']);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('transactions');
    await knex.schema.dropTableIfExists('categories');
    await knex.schema.dropTableIfExists('users');
}
