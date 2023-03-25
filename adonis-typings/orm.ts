/* eslint-disable no-unused-vars */

declare module '@ioc:Adonis/Lucid/Orm' {
    import {
        SelectRelatedOptions,
        SideloadedRelations,
        SelectRelatedContract,
    } from '@ioc:Adonis/Addons/SelectRelated'

    /**
     * QueryBuilder methods for select related
     */
    interface SelectRelatedMethods<
        Model extends LucidModel,
        Result = InstanceType<Model>
    > {
        selectRelated: Model extends SelectRelatedContract<LucidModel>
            ? (
                  name: string,
                  options?: SelectRelatedOptions
              ) => ModelQueryBuilderContract<Model, Result>
            : never
        $sideloadedRelations?: Model extends SelectRelatedContract<LucidModel>
            ? SideloadedRelations<Model>
            : never
    }

    interface ModelQueryBuilderContract<
        Model extends LucidModel,
        Result = InstanceType<Model>
    > extends SelectRelatedMethods<Model, Result> {}
}
