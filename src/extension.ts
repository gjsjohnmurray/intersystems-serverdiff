import { gte } from 'semver';
import{ CancellationToken, commands, ExtensionContext, extensions, MessageItem, ProviderResult, Uri, window, workspace } from 'vscode';
const JSON5 = require('json5');

export async function activate(context: ExtensionContext): Promise<void> {

	const { displayName, enabledApiProposals }= context.extension.packageJSON;
	const myIdentity = `${displayName} (${context.extension.id})`;

	// Get the main extension exported API
	const objectScriptExtId = 'intersystems-community.vscode-objectscript';
	const objectScriptMinVer = '2.4.2-beta.7';
	const objectScriptExt = extensions.getExtension(objectScriptExtId);
	if (!objectScriptExt) {
		window.showErrorMessage(`${myIdentity} requires the '${objectScriptExtId}' extension installed and enabled.`);
		return;
	}
	if (!gte(objectScriptExt.packageJSON.version, objectScriptMinVer)) {
		window.showErrorMessage(`${myIdentity} requires version ${objectScriptMinVer} or later of the '${objectScriptExtId}' extension.`);
		return;
	}

	// Don't use our own extensionUri because it isn't correct when debugging
	let argv;
	try {
		const argvUri = Uri.joinPath(objectScriptExt.extensionUri, '../../argv.json');
		const argvBytes = await workspace.fs.readFile(argvUri);
		const argvJson = argvBytes.toString();
		argv = JSON5.default.parse(argvJson);
		if (!(argv['enable-proposed-api'] as string[]).includes(context.extension.id)) {
			window.showWarningMessage(`Extension '${context.extension.id} needs to be given permission to use proposed APIs.`, { modal: true, detail: 'Instructions are in the README which will open when you OK this message. If you do not want to use this extension, disable or uninstall it.' })
				.then((_answer) => {
					commands.executeCommand('markdown.showPreview', Uri.joinPath(context.extensionUri, 'README.md'));
				});
			return;
		}
	} catch (error) {
		console.log(`Error getting and parsing argv.json file contents: ${error}`);
	}

	const REQUIRED_PROPOSAL = 'quickDiffProvider';

	if (!(enabledApiProposals as Array<string>).includes(REQUIRED_PROPOSAL)) {
		window.showWarningMessage<MessageItem>(
				`${myIdentity} must be reinstalled from a VSIX built with the '${REQUIRED_PROPOSAL}' API proposal enabled. Do this now?`,
				{modal: true, detail: 'A window reload will be triggered to activate the new version.'},
				{title: 'Yes'},
				{title: 'No', isCloseAffordance: true}
			).then(async (answer) => {
				if (answer?.title === 'Yes') {
					const vsix = Uri.joinPath(context.extensionUri, 'dist/proposed.vsixp');
					try {
						await commands.executeCommand('workbench.extensions.installExtension', vsix);
						commands.executeCommand('workbench.action.reloadWindow');
						return;
					} catch (error) {
						window.showErrorMessage(`Failed to install proposed-API-enabled VSIX from '${vsix.toString(true)}' - ${error}`, {modal: true});
						return;
					}
				}
				else {
					window.showInformationMessage(`Disable or uninstall extension '${context.extension.id}' if you don't want to be asked the VSIX reinstallation question again.`);
				}
			});
	}

	const objectScriptApi = objectScriptExt?.isActive ? objectScriptExt.exports : objectScriptExt ? await objectScriptExt.activate() : undefined;

	context.subscriptions.push(
		window.registerQuickDiffProvider(
			[
				{ scheme: 'isfs' },
				{ language: 'objectscript', scheme: 'file' },
				{ language: 'objectscript-class', scheme: 'file' },
				{ language: 'objectscript-int', scheme: 'file' },
				{ language: 'objectscript-macros', scheme: 'file' },
			],
			{
				provideOriginalResource(uri: Uri, token: CancellationToken): ProviderResult<Uri> {

					// This API function returns Foo.Bar.Baz.cls in the final / piece
					// We must conver that to Foo/Bar/Baz.cls
					const serverDocumentUri: Uri = objectScriptApi.serverDocumentUriForUri(uri);
					const slashParts = serverDocumentUri.path.split("/");
					const lastSlashPart = slashParts.pop() || "";
					const dotPartsOfLast = lastSlashPart.split(".");
					const fileExtension = dotPartsOfLast.pop() || "";
					const correctPath = slashParts.join("/") + "/" + dotPartsOfLast.join("/") + "." + fileExtension;

					// Always load the original using the objectscript scheme so it gets an update event
					const fixedServerUri = serverDocumentUri.with({ path: correctPath, scheme: "objectscript" });

					// For tracing when running built extension during debugging of vscode-objectscript extension
					//window.showErrorMessage(`provideOriginalResource ${fixedServerUri.toString()}`);

					return fixedServerUri;
				}
			},
			"ServerDiff"
		),
	);
}

export function deactivate() {}
