declare module '@ioc:Adonis/Addons/SelectRelated' {
    import { NormalizeConstructor } from '@ioc:Adonis/Core/Helpers'
    import {
        BelongsToRelationContract,
        HasManyRelationContract,
        HasOneRelationContract,
        BaseModel,
        HasOne,
        HasMany,
        BelongsTo,
        LucidModel,
        ModelQueryBuilderContract,
        ModelRelations,
        RelationshipsContract,
    } from '@ioc:Adonis/Lucid/Orm'

    /**
     * Type definition for options passed to select related
     */
    export type SelectRelatedOptions = {
        joinType?: 'inner' | 'leftOuter' | 'rightOuter' // defaults to 'inner'
        sideload?: boolean // defaults to true
        columns?: '*' | string[] // defaults to '*'
    }

    /**
     * Union type of relations which can be used in select related
     */
    export type JoinableRelations<
        ParentModel extends typeof BaseModel = typeof BaseModel,
        RelatedModel extends typeof BaseModel = typeof BaseModel
    > =
        | HasOneRelationContract<ParentModel, RelatedModel>
        | BelongsToRelationContract<ParentModel, RelatedModel>
        | HasManyRelationContract<ParentModel, RelatedModel>

    /**
     * Type to extract joinable relations from a model.
     */
    export type ExtractJoinableRelations<
        Model extends InstanceType<typeof BaseModel>
    > = {
        [Key in keyof Model]: Model[Key] extends
            | HasOne<typeof BaseModel, typeof BaseModel>
            | HasMany<typeof BaseModel, typeof BaseModel>
            | BelongsTo<typeof BaseModel, typeof BaseModel>
            ? Key
            : never
    }[keyof Model & string]

    /**
     * Type for storing data of a single sideloaded relation in query
     */
    export type SideloadedRelation<
        Model extends typeof BaseModel,
        Key extends ExtractJoinableRelations<InstanceType<Model>>
    > = {
        relation: InstanceType<Model>[Key] extends ModelRelations
            ? InstanceType<Model>[Key]['client']['relation']
            : RelationshipsContract
        tableName: string
        columns: '*' | string[]
        sideload: boolean
        subRelations: InstanceType<Model>[Key] extends {
            model: typeof BaseModel
        }
            ? SideloadedRelations<InstanceType<Model>[Key]['model']>
            : never
    }

    /**
     * Type for storing sideloaded relations for a model in query
     */
    export type SideloadedRelations<Model extends typeof BaseModel> = {
        [Key in ExtractJoinableRelations<
            InstanceType<Model>
        >]?: SideloadedRelation<Model, Key>
    }

    /**
     * Methods to process select related's sideloaded relations
     * defined using select related mixin
     */
    export interface SelectRelatedContract<T extends LucidModel> {
        $processSideloadedRelationsBeforeQuery(
            query: ModelQueryBuilderContract<T, InstanceType<T>>
        ): void

        $processSideloadedRelationsAfterFind<Model extends T>(
            this: Model,
            instance: InstanceType<Model>
        ): Promise<void>

        $processSideloadedRelationsAfterFetch<Model extends T>(
            this: Model,
            instances: InstanceType<Model>[]
        ): Promise<void>
    }

    /**
     * Mixin to apply select related functionalities to given model
     */
    export function selectRelatedMixin<
        T extends NormalizeConstructor<LucidModel>
    >(base: T): T & SelectRelatedContract<T>
}
