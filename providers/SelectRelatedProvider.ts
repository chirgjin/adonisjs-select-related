import { SelectRelatedOptions } from '@ioc:Adonis/Addons/SelectRelated'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'

/*
|--------------------------------------------------------------------------
| Provider
|--------------------------------------------------------------------------
|
| Your application is not ready when this file is loaded by the framework.
| Hence, the top level imports relying on the IoC container will not work.
| You must import them inside the life-cycle methods defined inside
| the provider class.
|
|
*/
export default class SelectRelatedProvider {
    constructor(protected app: ApplicationContract) {}

    public register() {
        // Register your own bindings
        this.app.container.bind('Adonis/Addons/SelectRelated', () => {
            return {
                selectRelatedMixin: require('../src/mixin').default,
            }
        })
    }

    public async boot() {
        // All bindings are ready, feel free to use them
        const Database = this.app.container.use('Adonis/Lucid/Database')
        const { selectRelated } = require('../src/querybuilder')

        Database.ModelQueryBuilder.macro(
            'selectRelated',
            function (name: string, options: SelectRelatedOptions = {}) {
                return selectRelated(this, name, options)
            }
        )
    }

    public async ready() {
        // App is ready
    }

    public async shutdown() {
        // Cleanup, since app is going down
    }
}
