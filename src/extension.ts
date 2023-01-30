import { gte } from 'semver';
import{ CancellationToken, ExtensionContext, extensions, ProviderResult, Uri, window } from 'vscode';

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
	const objectScriptApi = objectScriptExt?.isActive ? objectScriptExt.exports : objectScriptExt ? await objectScriptExt.activate() : undefined;

	const REQUIRED_PROPOSAL = 'quickDiffProvider';
	if (!(enabledApiProposals as Array<string>).includes(REQUIRED_PROPOSAL)) {
		window.showErrorMessage(`${myIdentity} must be installed from a VSIX built with the '${REQUIRED_PROPOSAL}' API proposal enabled.`);
		return;
	}

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
