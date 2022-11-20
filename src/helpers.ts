import { SideloadedRelations } from '@ioc:Adonis/Addons/SelectRelated'
import {
    BaseRelationContract,
    LucidModel,
    ModelQueryBuilderContract,
    RelationshipsContract,
} from '@ioc:Adonis/Lucid/Orm'

/**
 * Type assertion function which asserts that
 * given value is a relation of type T
 */
export function isRelationSubType<T extends RelationshipsContract['type']>(
    relation: BaseRelationContract<LucidModel, LucidModel>,
    type: T
): relation is RelationshipsContract & {
    type: T
} {
    return relation.type === type
}

/**
 * Helper to get column name in database by providing model & field name
 */
export function getCol(model: LucidModel, field: string) {
    return model.$getColumn(field)!['columnName']
}

/**
 * Helper function to select sideloaded columns for a given query.
 *
 * Loads columns in format `${tableName}${columnName}` in the $extra attribute
 * and then they are set on relevant instances (child relations)
 * using afterFind & afterFetch hooks. Recursively calls itself to process
 * all sub-relations.
 *
 * columnMapping is taken so that a global list of all columns can be maintained
 */
export function sideloadColumns<
    Model extends LucidModel,
    RelatedModel extends LucidModel
>(
    query: ModelQueryBuilderContract<Model>,
    sideloadedRelations: SideloadedRelations<RelatedModel>,
    columnMapping: Record<string, string> = {}
) {
    for (const relationName in sideloadedRelations) {
        const sideloadedRelation = sideloadedRelations[relationName]

        if (!sideloadedRelation.sideload) {
            return columnMapping
        }

        const colPrefix = `_${sideloadedRelation.tableName}`
        const relatedModel =
            sideloadedRelation.relation.relatedModel() as LucidModel

        relatedModel.$columnsDefinitions.forEach((_column, key) => {
            const columnAlias = `${colPrefix}${key}`

            if (columnAlias in columnMapping) {
                throw new Error(
                    `${columnAlias} is duplicated in query ${query.toSQL().sql}`
                )
            } else if (
                Array.isArray(sideloadedRelation.columns) &&
                !sideloadedRelation.columns.includes(key)
            ) {
                return
            }

            columnMapping[columnAlias] = `${
                sideloadedRelation.tableName
            }.${getCol(relatedModel, key)}`
        })

        if (sideloadedRelation.subRelations) {
            sideloadColumns(
                query,
                sideloadedRelation.subRelations,
                columnMapping
            )
        }
    }

    return columnMapping
}

/**
 * Returns whether any select statement was applied to query or not
 */
export function hasSelect(query: ModelQueryBuilderContract<any, any>) {
    // Find out whether any select statement was applied
    // by looping over knex's internal _statements array
    // the _statements array is not included in their type defs
    // so we have to cast knexQuery to any
    return (
        (query.knexQuery as any)._statements.filter(
            (obj: { grouping: string; value: string[] }) =>
                obj && obj.grouping === 'columns' && obj.value.length > 0
        ).length > 0
    )
}
