import { test } from '@japa/runner'
import sinon from 'sinon'

import {
    ModelQueryBuilderContract,
    SelectRelatedMethods,
} from '@ioc:Adonis/Lucid/Orm'

import { getSelectRelatedModels } from './utils'

test.group('selectRelatedMixin', () => {
    test('mixin is applied correctly on a lucid model', async ({
        assert,
        application,
    }) => {
        const models = getSelectRelatedModels(application)

        assert.isFunction(models.User.$processSideloadedRelationsBeforeQuery)
        assert.isFunction(models.User.$processSideloadedRelationsAfterFind)
        assert.isFunction(models.User.$processSideloadedRelationsAfterFetch)

        assert.isTrue(
            models.User.$hooks.has(
                'before',
                'find',
                models.User.$processSideloadedRelationsBeforeQuery
            )
        )
        assert.isTrue(
            models.User.$hooks.has(
                'before',
                'fetch',
                models.User.$processSideloadedRelationsBeforeQuery
            )
        )
        assert.isTrue(
            models.User.$hooks.has(
                'after',
                'find',
                models.User.$processSideloadedRelationsAfterFind
            )
        )
        assert.isTrue(
            models.User.$hooks.has(
                'after',
                'fetch',
                models.User.$processSideloadedRelationsAfterFetch
            )
        )
    })
})

test.group(
    'selectRelatedMixin | $processSideloadedRelationsBeforeQuery',
    (group) => {
        let helpers: typeof import('../src/helpers')

        group.setup(async () => {
            helpers = await import('../src/helpers')
        })

        group.each.teardown(() => {
            sinon.restore()
        })

        test('does nothing if sideloadedRelations are not defined', ({
            assert,
            application,
        }) => {
            const models = getSelectRelatedModels(application)
            const query = models.User.query() as ModelQueryBuilderContract<
                typeof models.User
            > &
                SelectRelatedMethods<typeof models.User>
            const hasSelectSpy = sinon.stub(helpers, 'hasSelect')
            const sideloadColumnsSpy = sinon.stub(helpers, 'sideloadColumns')

            query.$sideloadedRelations = undefined

            models.User.$processSideloadedRelationsBeforeQuery(query)

            assert.isFalse(hasSelectSpy.called)
            assert.isFalse(sideloadColumnsSpy.called)
            assert.equal(query.toSQL().sql, 'select * from `users`')
        })

        test('does not add select statements if sideloaded relations is empty', ({
            assert,
            application,
        }) => {
            const models = getSelectRelatedModels(application)
            const query = models.User.query() as ModelQueryBuilderContract<
                typeof models.User
            > &
                SelectRelatedMethods<typeof models.User>
            const hasSelectSpy = sinon.stub(helpers, 'hasSelect')
            const sideloadColumnsSpy = sinon.stub(helpers, 'sideloadColumns')

            query.$sideloadedRelations = {}

            models.User.$processSideloadedRelationsBeforeQuery(query)

            assert.isFalse(hasSelectSpy.called)
            assert.isFalse(sideloadColumnsSpy.called)
            assert.equal(query.toSQL().sql, 'select * from `users`')
        })

        test('query with sideloadedRelations gets appropriate select statements', ({
            assert,
            application,
        }) => {
            const models = getSelectRelatedModels(application)
            const query = models.User.query() as ModelQueryBuilderContract<
                typeof models.User
            > &
                SelectRelatedMethods<typeof models.User>
            const hasSelectSpy = sinon.stub(helpers, 'hasSelect')
            const sideloadColumnsSpy = sinon.stub(helpers, 'sideloadColumns')
            const relation = models.User.$getRelation('todoLists')

            query.$sideloadedRelations = {
                todoLists: {
                    relation,
                    tableName: relation.relationName,
                    columns: ['id', 'title'],
                    sideload: true,
                    subRelations: {},
                },
            }
            hasSelectSpy.withArgs(query).returns(false)
            sideloadColumnsSpy
                .withArgs(query, query.$sideloadedRelations)
                .returns({
                    _todoListsid: 'todoLists.id',
                    _todoListstitle: 'todoLists.title',
                })

            models.User.$processSideloadedRelationsBeforeQuery(query)

            assert.isTrue(hasSelectSpy.calledOnceWith(query))
            assert.isTrue(
                sideloadColumnsSpy.calledOnceWith(
                    query,
                    query.$sideloadedRelations
                )
            )
            assert.equal(
                query.toSQL().sql,
                'select `users`.*, `todoLists`.`id` as `_todoListsid`, `todoLists`.`title` as `_todoListstitle` from `users`'
            )
        })
    }
)

test.group(
    'selectRelatedMixin | $processSideloadedRelationsAfterFind',
    (group) => {
        group.each.teardown(() => {
            sinon.restore()
        })

        test('does nothing if sideloaded relations are not defined', async ({
            assert,
            application,
        }) => {
            const models = getSelectRelatedModels(application)
            const instance = new models.User()
            instance.$sideloadedRelations = undefined

            await models.User.$processSideloadedRelationsAfterFind(instance)

            assert.deepEqual(instance.$preloaded, {})
        })

        test('creates instance of user & items both when sideloaded relation is provided', async ({
            assert,
            application,
        }) => {
            const models = getSelectRelatedModels(application)
            const instance = new models.TodoList()
            const userRelation = models.TodoList.$getRelation('user')
            const itemsRelation = models.TodoList.$getRelation('items')
            userRelation.boot()
            itemsRelation.boot()

            instance.$sideloadedRelations = {
                user: {
                    relation: userRelation,
                    tableName: userRelation.relationName,
                    columns: ['id', 'username'],
                    sideload: true,
                    subRelations: {},
                },
                items: {
                    relation: itemsRelation,
                    tableName: itemsRelation.relationName,
                    columns: ['id', 'content'],
                    sideload: true,
                    subRelations: {},
                },
            }
            instance.$extras = {
                _userid: 1,
                _userusername: 'User 1',
                _itemsid: 1,
                _itemscontent: 'Todo list item 1',
            }

            await models.TodoList.$processSideloadedRelationsAfterFind(instance)

            assert.isArray(instance.items)
            assert.lengthOf(instance.items, 1)
            assert.instanceOf(instance.items[0], models.TodoListItem)
            assert.strictEqual(instance.items[0].id, 1)
            assert.strictEqual(instance.items[0].content, 'Todo list item 1')

            assert.instanceOf(instance.user, models.User)
            assert.strictEqual(instance.user.id, 1)
            assert.strictEqual(instance.user.username, 'User 1')
        })

        test('creates instance of related objects when nested sideloaded relation is provided', async ({
            assert,
            application,
        }) => {
            const models = getSelectRelatedModels(application)

            const user = new models.User()
            const todoListRelation = models.User.$getRelation('todoLists')
            const todoItemRelation = models.TodoList.$getRelation('items')
            todoListRelation.boot()
            todoItemRelation.boot()

            user.$sideloadedRelations = {
                todoLists: {
                    relation: todoListRelation,
                    tableName: todoListRelation.relationName,
                    columns: ['id', 'title'],
                    sideload: true,
                    subRelations: {
                        items: {
                            relation: todoItemRelation,
                            tableName: `${todoListRelation.relationName}__${todoItemRelation.relationName}`,
                            columns: ['id', 'content'],
                            sideload: true,
                            subRelations: {},
                        },
                    },
                },
            }
            user.$extras = {
                _todoListsid: 1,
                _todoListstitle: 'TodoList 1',
                _todoLists__itemsid: 1,
                _todoLists__itemscontent: 'TodoList item 1',
            }

            await models.User.$processSideloadedRelationsAfterFind(user)

            assert.isArray(user.todoLists)
            assert.lengthOf(user.todoLists, 1)
            assert.instanceOf(user.todoLists[0], models.TodoList)
            assert.strictEqual(user.todoLists[0].id, 1)
            assert.strictEqual(user.todoLists[0].title, 'TodoList 1')

            assert.isArray(user.todoLists[0].items)
            assert.lengthOf(user.todoLists[0].items, 1)
            assert.instanceOf(user.todoLists[0].items[0], models.TodoListItem)
            assert.strictEqual(user.todoLists[0].items[0].id, 1)
            assert.strictEqual(
                user.todoLists[0].items[0].content,
                'TodoList item 1'
            )
        })

        test('does not create instances when sideload is false', async ({
            assert,
            application,
        }) => {
            const models = getSelectRelatedModels(application)
            const instance = new models.TodoList()
            const userRelation = models.TodoList.$getRelation('user')
            const itemsRelation = models.TodoList.$getRelation('items')
            userRelation.boot()
            itemsRelation.boot()

            instance.$sideloadedRelations = {
                user: {
                    relation: userRelation,
                    tableName: userRelation.relationName,
                    columns: ['id', 'username'],
                    sideload: false,
                    subRelations: {},
                },
                items: {
                    relation: itemsRelation,
                    tableName: itemsRelation.relationName,
                    columns: ['id', 'content'],
                    sideload: true,
                    subRelations: {},
                },
            }
            instance.$extras = {
                _userid: 1,
                _userusername: 'User 1',
                _itemsid: 1,
                _itemscontent: 'Todo list item 1',
            }

            await models.TodoList.$processSideloadedRelationsAfterFind(instance)

            // should not create user's instance but create one for todo list item
            assert.isArray(instance.items)
            assert.lengthOf(instance.items, 1)
            assert.instanceOf(instance.items[0], models.TodoListItem)
            assert.strictEqual(instance.items[0].id, 1)
            assert.strictEqual(instance.items[0].content, 'Todo list item 1')

            assert.notExists(instance.user)
        })

        test('does not create instances when outer join is applied and no rows are matched', async ({
            assert,
            application,
        }) => {
            const models = getSelectRelatedModels(application)
            const instance = new models.TodoList()
            const userRelation = models.TodoList.$getRelation('user')
            const itemsRelation = models.TodoList.$getRelation('items')
            userRelation.boot()
            itemsRelation.boot()

            instance.$sideloadedRelations = {
                user: {
                    relation: userRelation,
                    tableName: userRelation.relationName,
                    columns: ['id', 'username'],
                    sideload: true,
                    subRelations: {},
                },
                items: {
                    relation: itemsRelation,
                    tableName: itemsRelation.relationName,
                    columns: ['id', 'content'],
                    sideload: true,
                    subRelations: {},
                },
            }
            instance.$extras = {}

            await models.TodoList.$processSideloadedRelationsAfterFind(instance)

            assert.notExists(instance.items)
            assert.notExists(instance.user)
        })
    }
)

test.group(
    'selectRelatedMixin | $processSideloadedRelationsAfterFetch',
    (group) => {
        group.each.teardown(() => {
            sinon.restore()
        })

        test('calls $processSideloadedRelationsAfterFind for every instance', async ({
            assert,
            application,
        }) => {
            const models = getSelectRelatedModels(application)
            const instances = [new models.User(), new models.User()]
            const spy = sinon.stub(
                models.User,
                '$processSideloadedRelationsAfterFind'
            )

            await models.User.$processSideloadedRelationsAfterFetch(instances)

            instances.forEach((instance) => {
                assert.isTrue(spy.calledWith(instance))
            })
            assert.isTrue(spy.calledTwice)
        })

        test('never calls $processSideloadedRelationsAfterFind if empty array is provided', async ({
            assert,
            application,
        }) => {
            const models = getSelectRelatedModels(application)
            const spy = sinon.stub(
                models.User,
                '$processSideloadedRelationsAfterFind'
            )

            await models.User.$processSideloadedRelationsAfterFetch([])

            assert.isFalse(spy.called)
        })
    }
)
