import SelectRelatedProvider from '../../providers/SelectRelatedProvider'
import selectRelatedMixin from '../../src/mixin'
import { getSelectRelatedModels, setupApplication } from '../utils'
import { test } from '@japa/runner'
import sinon from 'sinon'

test.group('SelectRelatedProvider | register', () => {
    test('should register binding successfully', async ({ assert }) => {
        // setup application separately in each test to ensure that
        // bindings generated in one test do not affect other tests
        const application = await setupApplication()
        const provider = new SelectRelatedProvider(application)

        provider.register()

        assert.exists(
            application.container.hasBinding('Adonis/Addons/SelectRelated')
        )
        assert.deepEqual(
            application.container.use('Adonis/Addons/SelectRelated'),
            {
                selectRelatedMixin,
            }
        )
    })
})

test.group('SelectRelatedProvider | boot', (group) => {
    group.each.teardown(() => {
        sinon.restore()
    })

    test('Should register selectRelated macro successfully', async ({
        assert,
    }) => {
        const application = await setupApplication()
        const provider = new SelectRelatedProvider(application)

        const stub = sinon.stub(
            application.container.use('Adonis/Lucid/Database')
                .ModelQueryBuilder,
            'macro'
        )

        await provider.boot()

        assert.isTrue(stub.calledOnceWith('selectRelated', sinon.match.func))
    })

    test('Registered macro should call selectRelated helper', async ({
        assert,
    }) => {
        const application = await setupApplication()
        const provider = new SelectRelatedProvider(application)
        const queryBuilder = await import('../../src/querybuilder')
        const stub = sinon.stub(queryBuilder, 'selectRelated')
        const ModelQueryBuilder = application.container.use(
            'Adonis/Lucid/Database'
        ).ModelQueryBuilder

        await provider.boot()

        const models = getSelectRelatedModels(application)

        models.User.query().selectRelated('todoLists')

        assert.isTrue(
            stub.calledOnceWith(
                sinon.match.instanceOf(ModelQueryBuilder),
                'todoLists',
                sinon.match.any
            )
        )
    })
})
