# Adonis Select Related

This addon adds the functionality to preload relations via joins instead of a separate query. This package is heavily inspired from python's [Django Framework](https://www.djangoproject.com/)

> Works with `@adonisjs/lucid > 16.*.*`

## Introduction

I moved from Django to AdonisV5 for a small project and missed the convenient inner join `select_related` functionality of Django ORM.
So, I built the similar functionality in Adonisjs.
This module provides functionality to load relationships using inner/outer joins instead of the traditional preload (which makes a separate query).
It is also useful when you want to apply where conditions on the query which is something that preload doesn't provide.

## Installation

Install it using `npm` or `yarn`.

```bash
# npm
npm i --save adonisjs-select-related
node ace configure adonisjs-select-related

# yarn
yarn add adonisjs-select-related
node ace configure adonisjs-select-related
```

## Usage

First, apply the `selectRelatedMixin` to your model.

```ts
// App/Models/User.ts
import { DateTime } from 'luxon'

import { selectRelatedMixin } from '@ioc:Adonis/Addons/SelectRelated'
import { compose } from '@ioc:Adonis/Core/Helpers'
import {
    BaseModel,
    column,
    HasMany,
    hasMany,
    HasOne,
    hasOne,
    ModelAttributes,
} from '@ioc:Adonis/Lucid/Orm'

import Profile from 'App/Models/Profile'

export default class User extends compose(BaseModel, selectRelatedMixin) {
    @column({ isPrimary: true })
    public id: number

    @column()
    public email: string

    @column()
    public name: string

    @column.dateTime({ autoCreate: true })
    public createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    public updatedAt: DateTime

    @hasOne(() => Profile)
    public profile: HasOne<typeof Profile>
}
```

```ts
// App/Models/Profile.ts
import { DateTime } from 'luxon'

import { selectRelatedMixin } from '@ioc:Adonis/Addons/SelectRelated'
import { compose } from '@ioc:Adonis/Core/Helpers'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'

import User from 'App/Models/User'

export default class Profile extends compose(BaseModel, selectRelatedMixin) {
    @column({ isPrimary: true })
    public id: number

    @column()
    public userId: number

    @belongsTo(() => User)
    public user: BelongsTo<typeof User>

    @column()
    public phoneNumber: string | null

    @column.date()
    public dateOfBirth: DateTime | null

    @column.dateTime({ autoCreate: true })
    public createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    public updatedAt: DateTime
}
```

Now, you have a `selectRelated` method on query builder of User model.

```ts
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import User from 'App/Models/User'

export default class UsersController {
    /**
     * Get list of users with their profiles
     * GET /users/
     */
    public async index() {
        const users = await User.query().selectRelated('profile')
        // SQL: select `users`.*, `profile`.`id` as `_profileid`, `profile`.`user_id` as `_profileuserId`, `profile`.`phone_number` as `_profilephoneNumber`, `profile`.`date_of_birth` as `_profiledateOfBirth`, `profile`.`created_at` as `_profilecreatedAt`, `profile`.`updated_at` as `_profileupdatedAt` from `users` inner join `profiles` as `profile` on `users`.`id` = `profile`.`user_id`

        return users // or individually serialize them
    }
}
```

Example Output:

```json
[
    {
        "id": 1,
        "email": "test@example.com",
        "name": "Test User",
        "created_at": "2022-02-12T03:10:40.000+05:30",
        "updated_at": "2022-02-12T03:10:40.000+05:30",
        "profile": {
            "id": 1,
            "user_id": 1,
            "phone_number": "xxx-xxx-xxxx",
            "date_of_birth": "2021-05-11",
            "created_at": "2022-02-12T03:10:40.000+05:30",
            "updated_at": "2022-02-12T03:10:40.000+05:30"
        }
    }
]
```

### Filtering using select related

You have to filter the results using `relationName.column_name` format.
This is because Adonis doesn't have any hooks for modifying the column names of where conditions during execution

```ts
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import User from 'App/Models/User'

export default class UsersController {
    /**
     * Get list of users with their profiles
     * GET /users/
     */
    public async index() {
        const users = await User.query()
            .selectRelated('profile')
            .whereNotNull('profile.phone_number') // only users who have filled their phone numbers will be returned
        // SQL: select `users`.*, `profile`.`id` as `_profileid`, `profile`.`user_id` as `_profileuserId`, `profile`.`phone_number` as `_profilephoneNumber`, `profile`.`date_of_birth` as `_profiledateOfBirth`, `profile`.`created_at` as `_profilecreatedAt`, `profile`.`updated_at` as `_profileupdatedAt` from `users` inner join `profiles` as `profile` on `users`.`id` = `profile`.`user_id` where `profile`.`phone_number` is not null

        return users
    }
}
```

### Applying outer joins using select related

Select related accepts options which you can use to define which type of join should be applied

```ts
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import User from 'App/Models/User'

export default class UsersController {
    /**
     * Get list of users with their profiles
     * GET /users/
     */
    public async index() {
        const users = await User.query().selectRelated('profile', {
            joinType: 'leftOuter', // 👈 it can be 'inner', 'leftOuter' or 'rightOuter'
        })
        // SQL: select `users`.*, `profile`.`id` as `_profileid`, `profile`.`user_id` as `_profileuserId`, `profile`.`phone_number` as `_profilephoneNumber`, `profile`.`date_of_birth` as `_profiledateOfBirth`, `profile`.`created_at` as `_profilecreatedAt`, `profile`.`updated_at` as `_profileupdatedAt` from `users` left outer join `profiles` as `profile` on `users`.`id` = `profile`.`user_id`

        return users
    }
}
```

### Working with nested relations

```ts
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import User from 'App/Models/User'

export default class UsersController {
    /**
     * Get data of a user
     * GET /users/:id/
     */
    public async show({ params }: HttpContextContract) {
        const user = await User.query()
            .selectRelated('profile.user') // 👈 use dot notation to load nested relations
            .where(`users.id`, params.id) // 👈 you have to use `table_name.column_name` format to refer to your parent table's columns.
            // If you don't do this then you'll get ambiguity error from sql
            .firstOrFail()
        // SQL: select `users`.*, `profile`.`id` as `_profileid`, `profile`.`user_id` as `_profileuserId`, `profile`.`phone_number` as `_profilephoneNumber`, `profile`.`date_of_birth` as `_profiledateOfBirth`, `profile`.`created_at` as `_profilecreatedAt`, `profile`.`updated_at` as `_profileupdatedAt`, `profile__user`.`id` as `_profile__userid`, `profile__user`.`email` as `_profile__useremail`, `profile__user`.`name` as `_profile__username`, `profile__user`.`created_at` as `_profile__usercreatedAt`, `profile__user`.`updated_at` as `_profile__userupdatedAt` from `users` inner join `profiles` as `profile` on `users`.`id` = `profile`.`user_id` inner join `users` as `profile__user` on `profile`.`user_id` = `profile__user`.`id` where `users`.`id` = ? limit 1
        return user
    }

    /**
     * Filter using nested relations
     * GET /users/:id/
     */
    public async filterOnNestedRelations({ params }: HttpContextContract) {
        const user = await User.query()
            .selectRelated('profile.user') // 👈 use dot notation to load nested relations
            .where(`profile__user.id`, params.id) // 👈 in nested relations, the table name becomes `parentRelation__childRelation`
            .firstOrFail()
        // SQL: select `users`.*, `profile`.`id` as `_profileid`, `profile`.`user_id` as `_profileuserId`, `profile`.`phone_number` as `_profilephoneNumber`, `profile`.`date_of_birth` as `_profiledateOfBirth`, `profile`.`created_at` as `_profilecreatedAt`, `profile`.`updated_at` as `_profileupdatedAt`, `profile__user`.`id` as `_profile__userid`, `profile__user`.`email` as `_profile__useremail`, `profile__user`.`name` as `_profile__username`, `profile__user`.`created_at` as `_profile__usercreatedAt`, `profile__user`.`updated_at` as `_profile__userupdatedAt` from `users` inner join `profiles` as `profile` on `users`.`id` = `profile`.`user_id` inner join `users` as `profile__user` on `profile`.`user_id` = `profile__user`.`id` where `profile__user`.`id` = ? limit 1
    }
}
```

## More examples

Take a look at [chirgjin/adonisjs-select-related-example](https://github.com/chirgjin/adonisjs-select-related-example) for some examples of select related.
