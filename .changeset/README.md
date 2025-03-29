## .changesets folder

The overall tool after initialization should lead to a loop that looks like:

1. Changesets added along with each change
2. The version command is run when a release is ready, and the changes are verified
3. The publish command is run afterwards.

## Example 

I am demonstrating how this will be integrated with your release flow in this example by a series of steps.

1. Say, you want to add a new feature or fix a bug. You would create a new branch from main and make your changes
2. Once you are done with your changes, you need to run the below command.

```
npx changeset
```

And this will prompt a few questions and answer them accordingly. This will be about the change you are making and whether it is patch, minor or major in semver versioning.

When you do this, this will add a file in .changesets folder and you should make sure to include this in your commit. This file is used to generate CHANGELOG.md for the releases made for your library.

> Not every change needs to be added into changeset, documentation also tells the same thing - [Not every change requires changesets](https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md#not-every-change-requires-a-changeset)
3. Commit your changes. Again, make sure to include your .changesets folder as well and push to your branch
4. Open a PR to main branch.
5. When the PR is merged, .github/workflows/npm-release.yml takes care of the below things:
- Create a new release according to semver - package version
- Create a new tag according to semver - package version
- Publish your package to the NPM.

Please read this [documentation for more information](https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md)

## Research:
I pulled the workflows/npm-release.yml related code from https://github.com/Shopify/buy-button-js, did study other workflows but this Shopify release seemed simple and straightforward.

## References:
1. https://github.com/search?q=https%3A%2F%2Funpkg.com%2F%40changesets%2Fconfig%403.1.1%2Fschema.json&type=code
2. https://github.com/Shopify/buy-button-js
3. https://github.com/Shopify/buy-button-js/pull/888
4. https://github.com/Shopify/buy-button-js/commit/ce4598504b1b22faa6bee4c5df2680d5d88656c3
5. https://github.com/Shopify/buy-button-js/blob/1a1da6ff108085c04855ed15da869acbf4f436b7/.github/workflows/npm-release.yml
6. https://github.com/Rich-Harris/dts-buddy/blob/a6e923d662e11c4bc59c921aa33699af32f21605/.github/workflows/release.yml
7. https://github.com/t3-oss/t3-env/blob/main/.github/workflows/release.yml

