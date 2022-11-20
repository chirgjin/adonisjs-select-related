import {
    createTodoLists,
    createUsers,
    getSelectRelatedModels,
    reset,
    setupApplication,
} from '../utils'
import { test } from '@japa/runner'
import { join } from 'path'

import { ApplicationContract } from '@ioc:Adonis/Core/Application'

test.group('Integration Test', (group) => {
    let application: ApplicationContract
    let models: ReturnType<typeof getSelectRelatedModels>

    group.setup(async () => {
        // create a separate application instance which has selectRelatedProvider loaded
        application = await setupApplication([
            join(__dirname, '../../providers/SelectRelatedProvider'),
        ])
        models = getSelectRelatedModels(application)

        return async () => {
            const db = application.container.use('Adonis/Lucid/Database')

            await db.manager.closeAll()
        }
    })

    group.each.setup(async () => {
        // clear all data before every test
        await reset(application)
    })

    test('loads both belongsTo & hasMany relations', async ({ assert }) => {
        await createUsers({
            model: models.User,
            count: 2,
            todoList: {
                count: 2,
                items: {
                    count: 1,
                },
            },
        })

        const todoLists = await models.TodoList.query()
            .selectRelated('user')
            .selectRelated('items')

        assert.isArray(todoLists)
        assert.lengthOf(todoLists, 4)

        todoLists.forEach((todoList) => {
            // every todoList should have user & exactly 1 item
            assert.instanceOf(todoList, models.TodoList)

            assert.instanceOf(todoList.user, models.User)
            assert.strictEqual(todoList.user.id, todoList.userId)

            assert.isArray(todoList.items)
            assert.lengthOf(todoList.items, 1)
            assert.instanceOf(todoList.items[0], models.TodoListItem)
            assert.strictEqual(todoList.items[0].todoListId, todoList.id)
        })
    })

    test('does not create instances when no rows are matched during outer join', async ({
        assert,
    }) => {
        const user = (
            await createUsers({
                model: models.User,
                count: 1,
            })
        )[0]
        const todoListWithItem = (
            await createTodoLists({
                user,
                count: 1,
                items: {
                    count: 1,
                },
            })
        )[0]
        const todoListWithoutItem = (
            await createTodoLists({
                user,
                count: 1,
            })
        )[0]

        const todoLists = await models.TodoList.query().selectRelated('items', {
            joinType: 'leftOuter',
        })

        assert.isArray(todoLists)
        assert.lengthOf(todoLists, 2)

        todoLists.forEach((todoList) => {
            assert.instanceOf(todoList, models.TodoList)
            assert.isArray(todoList.items)

            if (todoList.id === todoListWithItem.id) {
                assert.lengthOf(todoList.items, 1)
                assert.instanceOf(todoList.items[0], models.TodoListItem)
                assert.strictEqual(
                    todoList.items[0].id,
                    todoListWithItem.items[0].id
                )
            } else if (todoList.id === todoListWithoutItem.id) {
                assert.lengthOf(todoList.items, 0)
            } else {
                throw new Error(
                    `Incorrect TodoList returned ${JSON.stringify(todoList)}`
                )
            }
        })
    })

    test('creates instances in a recursive relation', async ({ assert }) => {
        const createduser = await models.User.query()
            .where(
                'id',
                (
                    await createUsers({
                        model: models.User,
                        count: 1,
                        todoList: {
                            count: 1,
                            items: {
                                count: 1,
                            },
                        },
                    })
                )[0].id
            )
            .preload('todoLists', (query) =>
                query.preload('items', (builder) =>
                    builder.preload('todoList', (q) => q.preload('user'))
                )
            )
            .firstOrFail()

        const user = await models.User.query()
            .selectRelated('todoLists.items.todoList.user')
            .firstOrFail()

        assert.deepEqual(user.toJSON(), createduser.toJSON())
    })

    test('applies joins even when sideloaded is false', async ({ assert }) => {
        const user = (
            await createUsers({
                model: models.User,
                count: 1,
            })
        )[0]
        const todoList = (
            await createTodoLists({
                user,
                count: 1,
                items: {
                    count: 1,
                    completed: true,
                },
            })
        )[0]

        // create an incomplete item to ensure that where condition is applied correctly
        await createTodoLists({
            user,
            count: 1,
            items: {
                count: 1,
            },
        })

        const todoLists = await models.TodoList.query()
            .selectRelated('items', {
                sideload: false,
            })
            .whereNotNull('items.completed_at')

        assert.isArray(todoLists)
        assert.lengthOf(todoLists, 1)
        assert.instanceOf(todoLists[0], models.TodoList)
        assert.strictEqual(todoLists[0].id, todoList.id)
        assert.notExists(todoLists[0].items)
    })
})
