# Adonis Select Related

This addon adds the functionality to preload relations via joins instead of a separate query. This package is heavily inspired from python's [Django Framework](https://www.djangoproject.com/)
> Works with `@adonisjs/lucid^16.*.*`

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
import { selectRelatedMixin } from '@ioc:Adonis/Addons/SelectRelated'
import { compose } from '@ioc:Adonis/Core/Helpers'
import { BaseModel, hasOne, HasOne } from '@ioc:Adonis/Lucid/Orm'
import Profile from 'App/Models/Profile'

export default class User extends compose(BaseModel, selectRelatedMixin) {
    // sample relationship
    @hasOne(() => Profile)
    public logs: HasOne<typeof Profile>

    // columns & props
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
        const users = await User.query().selectRelated("profile")

        return users // or individually serialize them
    }
}
```

Example Output:
```json
[
   {
      "id":1,
      "email":"Nicole55@hotmail.com",
      "name":"Jonathon",
      "created_at":"2022-02-12T03:10:40.000+05:30",
      "updated_at":"2022-02-12T03:10:40.000+05:30",
      "profile":{
         "id":1,
         "user_id":1,
         "phone_number":"(671) 991-3800 x968",
         "date_of_birth":"2021-05-11",
         "created_at":"2022-02-12T03:10:40.000+05:30",
         "updated_at":"2022-02-12T03:10:40.000+05:30"
      }
   }
]
```


## More examples
Take a look at [chirgjin/adonisjs-select-related-example](https://github.com/chirgjin/adonisjs-select-related-example) for some examples of select related.
