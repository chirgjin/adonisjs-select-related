import type {
    SideloadedRelation,
    SideloadedRelations,
} from '@ioc:Adonis/Addons/SelectRelated'
import type { NormalizeConstructor } from '@ioc:Adonis/Core/Helpers'
import type {
    LucidModel,
    ModelQueryBuilderContract,
    SelectRelatedMethods,
} from '@ioc:Adonis/Lucid/Orm'

import { hasSelect, sideloadColumns } from './helpers'

/**
 * Function to apply select related functionality to given base model.
 */
export default function selectRelatedMixin<
    T extends NormalizeConstructor<LucidModel>
>(base: T) {
    class SelectRelatedMixin extends base {
        public $sideloadedRelations?: SideloadedRelations<any>
        public $sideloadedRelationParent?: InstanceType<LucidModel>

        /**
         * Function to pass the sideloaded relations to every row using
         * {@link ModelQueryBuilderContract.rowTransformer}. Also, selects columns
         * for preloading using {@link sideloadColumns}
         */
        public static $processSideloadedRelationsBeforeQuery(
            query: ModelQueryBuilderContract<T, InstanceType<T>> &
                SelectRelatedMethods<T>
        ) {
            if (
                !query.$sideloadedRelations ||
                Object.keys(query.$sideloadedRelations).length < 1
            ) {
                return
            }

            const $sideloadedRelations = query.$sideloadedRelations

            if (!hasSelect(query)) {
                query.select(`${query.model.table}.*`)
            }

            const columnMapping = sideloadColumns(query, $sideloadedRelations)

            query.rowTransformer((row: SelectRelatedMixin) => {
                row.$sideloadedRelations = $sideloadedRelations
            })

            if (Object.keys(columnMapping).length) {
                query.select(columnMapping)
            }
        }

        /**
         * Function to process the sideloaded columns and make instances from them.
         */
        public static async $processSideloadedRelationsAfterFind<
            Model extends typeof SelectRelatedMixin
        >(this: Model, instance: InstanceType<Model>) {
            if (!instance.$sideloadedRelations) {
                return
            }

            const parentInstance =
                instance.$sideloadedRelationParent || instance

            const sideloadedRelations: SideloadedRelations<Model> =
                instance.$sideloadedRelations

            for (const relationName in sideloadedRelations) {
                const {
                    relation,
                    sideload,
                    subRelations,
                    tableName,
                }: SideloadedRelation<Model, any> =
                    sideloadedRelations[relationName]

                if (!sideload) {
                    return
                }

                const colPrefix = `_${tableName}`

                const relatedModel =
                    relation.relatedModel() as typeof SelectRelatedMixin

                const data: Record<string, any> = {}

                relatedModel.$columnsDefinitions.forEach((column, key) => {
                    data[column.columnName] =
                        parentInstance.$extras[`${colPrefix}${key}`]
                    delete parentInstance.$extras[`${colPrefix}${key}`]
                })

                const childInstance = relatedModel.$createFromAdapterResult(
                    data,
                    parentInstance.$sideloaded, // pass sideloaded values to child instance for consistency with lucid's sideloaded functionality
                    parentInstance.$options
                )

                if (!childInstance) {
                    continue
                }

                childInstance.$sideloadedRelationParent = parentInstance
                childInstance.$sideloadedRelations = subRelations

                await relatedModel.$hooks.exec('after', 'find', childInstance)

                if (relation.type === 'hasMany') {
                    relation.pushRelated(instance, childInstance)
                } else {
                    relation.setRelated(instance, childInstance)
                }
            }
        }

        /**
         * Function to process the sideloaded columns and make instances from them.
         *
         * TODO: optimize code for `afterFetch` hook
         */
        public static async $processSideloadedRelationsAfterFetch(
            instances: InstanceType<T>[]
        ) {
            for (const instance of instances) {
                await this.$processSideloadedRelationsAfterFind(instance)
            }
        }
    }

    SelectRelatedMixin.boot()
    SelectRelatedMixin.before(
        'find',
        SelectRelatedMixin.$processSideloadedRelationsBeforeQuery
    )
    SelectRelatedMixin.before(
        'fetch',
        SelectRelatedMixin.$processSideloadedRelationsBeforeQuery
    )
    SelectRelatedMixin.after(
        'find',
        SelectRelatedMixin.$processSideloadedRelationsAfterFind
    )
    SelectRelatedMixin.after(
        'fetch',
        SelectRelatedMixin.$processSideloadedRelationsAfterFetch
    )

    return SelectRelatedMixin
}
