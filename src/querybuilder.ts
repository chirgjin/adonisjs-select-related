import type {
    ExtractJoinableRelations,
    SelectRelatedOptions,
} from '@ioc:Adonis/Addons/SelectRelated'
import type {
    BaseModel,
    ModelQueryBuilderContract,
    SelectRelatedQueryMethods,
} from '@ioc:Adonis/Lucid/Orm'

import { getCol, isRelationSubType } from './helpers'

/**
 * Function to apply join on a query for given relation.
 * Loads the given columns (defaults to all) of the relation
 * and creates relatedModel's instance from them if sideload is True.
 */
export function selectRelated<Model extends typeof BaseModel>(
    query: Omit<
        ModelQueryBuilderContract<Model>,
        keyof SelectRelatedQueryMethods<Model>
    > &
        SelectRelatedQueryMethods<Model>,
    name: string,
    { sideload = true, columns = '*', joinType = 'inner' }: SelectRelatedOptions
) {
    const parts = name.split('.')
    let model: typeof BaseModel = query.model
    let lastPart: string | undefined

    if (!query.$sideloadedRelations) {
        query.$sideloadedRelations = {}
    }

    let $sideloadedRelations = query.$sideloadedRelations

    parts.forEach((part) => {
        const relation = model.$getRelation(part)
        relation.boot()
        const relatedModel = relation.relatedModel()
        const relationName = `${lastPart ? `${lastPart}__` : ''}${
            relation.relationName
        }`

        if (
            isRelationSubType(relation, 'manyToMany') ||
            isRelationSubType(relation, 'hasManyThrough')
        ) {
            throw new Error(
                'Select related is not supported for many to many & has many through'
            )
        }

        if (!$sideloadedRelations[part]) {
            $sideloadedRelations[part] = {
                relation,
                tableName: relationName,
                columns,
                sideload,
                subRelations: {},
            }
            const fn:
                | 'innerJoin'
                | 'leftOuterJoin'
                | 'rightOuterJoin' = `${joinType}Join`
            const localKey =
                relation.type === 'belongsTo'
                    ? relation.foreignKey
                    : relation.localKey
            const foreignKey =
                relation.type === 'belongsTo'
                    ? relation.localKey
                    : relation.foreignKey

            query[fn](
                `${relatedModel.table} as ${relationName}`,
                `${lastPart || model.table}.${getCol(model, localKey)}`,
                `${relationName}.${getCol(relatedModel, foreignKey)}`
            )
        }

        $sideloadedRelations =
            $sideloadedRelations[
                part as ExtractJoinableRelations<InstanceType<Model>>
            ]!.subRelations
        model = relatedModel
        lastPart = relationName
    })

    return query
}
