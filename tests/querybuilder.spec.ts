import { selectRelated } from '../src/querybuilder'
import { test } from '@japa/runner'

import {
    ModelQueryBuilderContract,
    SelectRelatedMethods,
} from '@ioc:Adonis/Lucid/Orm'

import { TodoListItemModelType, UserModelType } from './utils'

test.group('queryBuilder | selectRelated', () => {
    test('applies inner join correctly on single level relations', ({
        assert,
        models,
    }) => {
        const query =
            models.User.query() as ModelQueryBuilderContract<UserModelType> &
                SelectRelatedMethods<UserModelType>

        selectRelated(query, 'todoLists', {
            sideload: true,
            columns: '*',
            joinType: 'inner',
        })

        assert.equal(
            query.toSQL().sql,
            'select * from `users` inner join `todo_lists` as `todoLists` on `users`.`id` = `todoLists`.`user_id`'
        )
        assert.deepEqual(query.$sideloadedRelations, {
            todoLists: {
                relation: models.User.$getRelation('todoLists'),
                tableName: models.User.$getRelation('todoLists').relationName,
                columns: '*',
                sideload: true,
                subRelations: {},
            },
        })
    })

    test('applies left outer join correctly on single level relations', ({
        assert,
        models,
    }) => {
        const query =
            models.User.query() as ModelQueryBuilderContract<UserModelType> &
                SelectRelatedMethods<UserModelType>

        selectRelated(query, 'todoLists', {
            sideload: true,
            columns: '*',
            joinType: 'leftOuter',
        })

        assert.equal(
            query.toSQL().sql,
            'select * from `users` left outer join `todo_lists` as `todoLists` on `users`.`id` = `todoLists`.`user_id`'
        )
        assert.deepEqual(query.$sideloadedRelations, {
            todoLists: {
                relation: models.User.$getRelation('todoLists'),
                tableName: models.User.$getRelation('todoLists').relationName,
                columns: '*',
                sideload: true,
                subRelations: {},
            },
        })
    })

    test('applies right outer join correctly on single level relations', ({
        assert,
        models,
    }) => {
        const query =
            models.User.query() as ModelQueryBuilderContract<UserModelType> &
                SelectRelatedMethods<UserModelType>

        selectRelated(query, 'todoLists', {
            sideload: true,
            columns: '*',
            joinType: 'rightOuter',
        })

        assert.equal(
            query.toSQL().sql,
            'select * from `users` right outer join `todo_lists` as `todoLists` on `users`.`id` = `todoLists`.`user_id`'
        )
        assert.deepEqual(query.$sideloadedRelations, {
            todoLists: {
                relation: models.User.$getRelation('todoLists'),
                tableName: models.User.$getRelation('todoLists').relationName,
                columns: '*',
                sideload: true,
                subRelations: {},
            },
        })
    })

    test('applies join correctly on nested relations', ({ assert, models }) => {
        // not testing for outer joins separately as they use the same inner logic

        const query =
            models.User.query() as ModelQueryBuilderContract<UserModelType> &
                SelectRelatedMethods<UserModelType>

        selectRelated(query, 'todoLists.items', {
            sideload: true,
            columns: '*',
            joinType: 'inner',
        })

        assert.equal(
            query.toSQL().sql,
            'select * from `users` inner join `todo_lists` as `todoLists` on `users`.`id` = `todoLists`.`user_id` inner join `todo_list_items` as `todoLists__items` on `todoLists`.`id` = `todoLists__items`.`todo_list_id`'
        )
        assert.deepEqual(query.$sideloadedRelations, {
            todoLists: {
                relation: models.User.$getRelation('todoLists'),
                tableName: models.User.$getRelation('todoLists').relationName,
                columns: '*',
                sideload: true,
                subRelations: {
                    items: {
                        relation: models.TodoList.$getRelation('items'),
                        tableName: `${
                            models.User.$getRelation('todoLists').relationName
                        }__${
                            models.TodoList.$getRelation('items').relationName
                        }`,
                        columns: '*',
                        sideload: true,
                        subRelations: {},
                    },
                },
            },
        })
    })

    test('applies join correctly on nested belongsTo relations', ({
        assert,
        models,
    }) => {
        const query =
            models.TodoListItem.query() as ModelQueryBuilderContract<TodoListItemModelType> &
                SelectRelatedMethods<TodoListItemModelType>

        selectRelated(query, 'todoList.user', {
            sideload: true,
            columns: '*',
            joinType: 'inner',
        })

        assert.equal(
            query.toSQL().sql,
            'select * from `todo_list_items` inner join `todo_lists` as `todoList` on `todo_list_items`.`todo_list_id` = `todoList`.`id` inner join `users` as `todoList__user` on `todoList`.`user_id` = `todoList__user`.`id`'
        )
        assert.deepEqual(query.$sideloadedRelations, {
            todoList: {
                relation: models.TodoListItem.$getRelation('todoList'),
                tableName:
                    models.TodoListItem.$getRelation('todoList').relationName,
                columns: '*',
                sideload: true,
                subRelations: {
                    user: {
                        relation: models.TodoList.$getRelation('user'),
                        tableName: `${
                            models.TodoListItem.$getRelation('todoList')
                                .relationName
                        }__${
                            models.TodoList.$getRelation('user').relationName
                        }`,
                        columns: '*',
                        sideload: true,
                        subRelations: {},
                    },
                },
            },
        })
    })
})
