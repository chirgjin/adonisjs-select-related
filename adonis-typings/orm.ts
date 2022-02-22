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
        selectRelated(
            name: string,
            options?: SelectRelatedOptions
        ): ModelQueryBuilderContract<Model, Result>
        $sideloadedRelations?: SideloadedRelations<Model>
    }

    /**
     * Type which excludes select related methods if the model
     * doesn't have selectRelatedMixin
     */
    type SelectRelatedQueryBuilder<Model extends LucidModel> = {
        [Key in keyof SelectRelatedMethods<Model> as Model extends SelectRelatedContract<Model>
            ? Key
            : never]: SelectRelatedMethods<Model>[Key]
    }

    interface ModelQueryBuilderContract<
        Model extends LucidModel,
        Result = InstanceType<Model>
    > extends SelectRelatedQueryBuilder<Model> {}
}
