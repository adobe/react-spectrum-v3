# UXP Storybook

Contains a UXP compatible storybook host plugin which can display standard storybook stories.

Provides Hot Module Reloading that works in both the UXP Demo Application and in a web browser.

## Setup Notes

The package.json explicitly uses react(-dom) 16.13.1 for the following reasons:
1. That is the exact version the root react-spectrum/node_modules has installed.
2. This means the root `yarn install` does NOT install a local `react`.
3. This prevents `invalid hook` errors from occuring at runtime.
4. If we leave out the `dependencies: { react }` entry or move it to peerDependencies then parcel HMR does not work on linked react components.
