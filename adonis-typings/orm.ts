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
    interface SelectRelatedQueryMethods<
        Model extends LucidModel,
        Result = InstanceType<Model>
    > {
        selectRelated(
            name: string,
            options?: SelectRelatedOptions
        ): ModelQueryBuilderContract<Model, Result>
        $sideloadedRelations?: SideloadedRelations<Model>
    }

    type SelectRelatedMethods<
        Model extends LucidModel,
        Result = InstanceType<Model>
    > = {
        [Key in keyof SelectRelatedQueryMethods<
            Model,
            Result
        >]: Model extends SelectRelatedContract<LucidModel>
            ? SelectRelatedQueryMethods<Model, Result>[Key]
            : never
    }

    interface ModelQueryBuilderContract<
        Model extends LucidModel,
        Result = InstanceType<Model>
    > extends SelectRelatedMethods<Model, Result> {}
}
