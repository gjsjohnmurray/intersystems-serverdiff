# InterSystems ServerDiff

This extension works with the [InterSystems ObjectScript](https://marketplace.visualstudio.com/items?itemName=intersystems-community.vscode-objectscript) extension to show as [gutter indicators](https://code.visualstudio.com/docs/sourcecontrol/overview#_gutter-indicators) any changes not yet imported to associated server namespace.

It uses a new proposed API function named `window.registerQuickDiffProvider` which was introduced in VS Code version 1.75.

## Setup

As an extension that uses proposed APIs, InterSystems Server QuickDiff cannot be published on Marketplace.

To use it:
1. Download the [VSIX file (link TODO)]().
2. Drag the file from your downloads folder and drop it onto the list of Extensions in VS Code's Extensions view.
3. From Command Palette choose `Preferences: Configure Runtime Arguments`.
4. In the `argv.json` file that opens, add this line within the outermost braces:
```json
"enable-proposed-api": ["georgejames.intersystems-serverdiff"],
```
If you already have an `"enable-proposed-api"` entry, add an extra value to its array value, for example:
```json
"enable-proposed-api": [
    "intersystems-community.vscode-objectscript",
    "georgejames.intersystems-serverdiff"
]
```
5. Exit VS Code and relaunch it.

## Features

TODO

## Release Notes

See the [CHANGELOG](CHANGELOG.md) for changes in each release.