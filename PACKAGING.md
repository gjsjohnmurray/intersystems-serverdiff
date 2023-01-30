# How to package this self-upgrading extension

1. Review the contents of `package.json`
    - `version` should have an odd number in the third part (maintenance), for example `0.0.1`
    - `enableApiProposals` should be:
    ```json
    "enabledApiProposals": [
        "quickDiffProvider"
    ],
    ```
2. Delete any residual `dist/proposed.vsixp` file.

3. Run this command in Terminal, using as the version argument the value you put in `package.json` but **incremented in the third part**, for example `0.0.2`
    ```
    vsce package -o dist/proposed.vsixp --no-update-package-json 0.0.2
    ```
    That command created a version of the VSIX capable of using the necessary proposed API, placing it where it will get packaged into the second VSIX.

4. Edit `package.json` to remove the entire `"enabledApiProposals"` setting. Save the change but don't stage or commit it.

5. Run this command in Terminal to create the VSIX you will publish:
    ```
    vsce package
    ```
    That command created a VSIX which Marketplace will accept. When first activated after installation it will install the embedded VSIX created by the previous command.

6. Revert the change you made to `package.json`, reinstating the lines that will be needed the next time you run this procedure.