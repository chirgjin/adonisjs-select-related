/* eslint-disable no-unused-vars */
declare module '@ioc:Adonis/Core/Application' {
    import * as selectRelated from '@ioc:Adonis/Addons/SelectRelated'

    interface ContainerBindings {
        'Adonis/Addons/SelectRelated': typeof selectRelated
    }
}
