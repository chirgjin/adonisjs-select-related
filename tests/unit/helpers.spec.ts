import { getCol, hasSelect, sideloadColumns } from '../../src/helpers'
import { UserModelType } from '../utils'
import { test } from '@japa/runner'

import { SideloadedRelations } from '@ioc:Adonis/Addons/SelectRelated'

test.group('Helpers | hasSelect', async () => {
    test('returns true when there is a single select * statement', ({
        assert,
        models,
    }) => {
        const query = models.User.query().select('*')

        assert.isTrue(hasSelect(query))
    })

    test('returns true when there are multiple select statements', ({
        assert,
        models,
    }) => {
        const query = models.User.query()
            .select('id', 'username')
            .select('password')

        assert.isTrue(hasSelect(query))
    })

    test('returns false when there is no select statement', ({
        assert,
        models,
    }) => {
        const query = models.User.query().where('id', 1).limit(0).orderBy('id')

        assert.isFalse(hasSelect(query))
    })
})

test.group('Helpers | getCol', async () => {
    test('returns correct column name', ({ assert, models }) => {
        assert.equal(getCol(models.User, 'createdAt'), 'created_at')
    })

    test('throws error when invalid field name is provided', ({
        assert,
        models,
    }) => {
        assert.throws(() => getCol(models.User, 'some-random-column'))
    })
})

test.group('Helpers | sideloadColumns', async () => {
    test('generates correct column mapping for single level relation when sideloaded is true with * as columns', async ({
        assert,
        models,
    }) => {
        const query = models.User.query()
        const relation = models.User.$getRelation('todoLists')

        const sideloadedRelations: SideloadedRelations<UserModelType> = {
            todoLists: {
                relation,
                tableName: relation.relationName,
                columns: '*',
                sideload: true,
                subRelations: {},
            },
        }

        const columnMapping = sideloadColumns(query, sideloadedRelations)

        assert.deepEqual(columnMapping, {
            _todoListsid: 'todoLists.id',
            _todoListsuserId: 'todoLists.user_id',
            _todoListstitle: 'todoLists.title',
            _todoListscreatedAt: 'todoLists.created_at',
        })
    })

    test('generates column mapping for only provided columns when columns are explicitly specified', async ({
        assert,
        models,
    }) => {
        const query = models.User.query()
        const relation = models.User.$getRelation('todoLists')

        const sideloadedRelations: SideloadedRelations<UserModelType> = {
            todoLists: {
                relation,
                tableName: relation.relationName,
                columns: ['id', 'title'],
                sideload: true,
                subRelations: {},
            },
        }

        const columnMapping = sideloadColumns(query, sideloadedRelations)

        assert.deepEqual(columnMapping, {
            _todoListsid: 'todoLists.id',
            _todoListstitle: 'todoLists.title',
        })
    })

    test('Invalid columns should be skipped', async ({ assert, models }) => {
        const query = models.User.query()
        const relation = models.User.$getRelation('todoLists')

        const sideloadedRelations: SideloadedRelations<UserModelType> = {
            todoLists: {
                relation,
                tableName: relation.relationName,
                columns: ['some-random-column', 'id'],
                sideload: true,
                subRelations: {},
            },
        }

        const columnMapping = sideloadColumns(query, sideloadedRelations)

        assert.deepEqual(columnMapping, {
            _todoListsid: 'todoLists.id',
        })
    })

    test('generates correct column mapping for multi level relation when sideloaded is true for all with * as columns', async ({
        assert,
        models,
    }) => {
        const query = models.User.query()
        const relation = models.User.$getRelation('todoLists')

        const sideloadedRelations: SideloadedRelations<UserModelType> = {
            todoLists: {
                relation,
                tableName: relation.relationName,
                columns: '*',
                sideload: true,
                subRelations: {
                    items: {
                        relation: models.TodoList.$getRelation('items'),
                        tableName:
                            models.TodoList.$getRelation('items').relationName,
                        columns: '*',
                        sideload: true,
                        subRelations: {},
                    },
                },
            },
        }

        const columnMapping = sideloadColumns(query, sideloadedRelations)

        assert.deepEqual(columnMapping, {
            _todoListsid: 'todoLists.id',
            _todoListsuserId: 'todoLists.user_id',
            _todoListstitle: 'todoLists.title',
            _todoListscreatedAt: 'todoLists.created_at',
            _itemsid: 'items.id',
            _itemstodoListId: 'items.todo_list_id',
            _itemscontent: 'items.content',
            _itemscompletedAt: 'items.completed_at',
            _itemscreatedAt: 'items.created_at',
        })
    })

    test('skips mapping generation for child relation in a multi level relation when sideloaded is false for child', async ({
        assert,
        models,
    }) => {
        const query = models.User.query()
        const relation = models.User.$getRelation('todoLists')

        const sideloadedRelations: SideloadedRelations<UserModelType> = {
            todoLists: {
                relation,
                tableName: relation.relationName,
                columns: '*',
                sideload: true,
                subRelations: {
                    items: {
                        relation: models.TodoList.$getRelation('items'),
                        tableName:
                            models.TodoList.$getRelation('items').relationName,
                        columns: '*',
                        sideload: false,
                        subRelations: {},
                    },
                },
            },
        }

        const columnMapping = sideloadColumns(query, sideloadedRelations)

        assert.deepEqual(columnMapping, {
            _todoListsid: 'todoLists.id',
            _todoListsuserId: 'todoLists.user_id',
            _todoListstitle: 'todoLists.title',
            _todoListscreatedAt: 'todoLists.created_at',
        })
    })

    test('skips mapping generation entirely in a multi level relation when sideloaded is false for parent', async ({
        assert,
        models,
    }) => {
        const query = models.User.query()
        const relation = models.User.$getRelation('todoLists')

        const sideloadedRelations: SideloadedRelations<UserModelType> = {
            todoLists: {
                relation,
                tableName: relation.relationName,
                columns: '*',
                sideload: false,
                subRelations: {
                    items: {
                        relation: models.TodoList.$getRelation('items'),
                        tableName:
                            models.TodoList.$getRelation('items').relationName,
                        columns: '*',
                        sideload: true,
                        subRelations: {},
                    },
                },
            },
        }

        const columnMapping = sideloadColumns(query, sideloadedRelations)

        assert.deepEqual(columnMapping, {})
    })
})
