# dsh-editor-panel

The document **Editor** for the DeepSeek Harness Web/Desktop client, packaged for
installations that do not ship it — including the DeepSeek Harness Desktop
application.

## Install

In the DeepSeek Harness Desktop Plugin Manager choose **Add plugin** and enter:

\`\`\`
github:EmmanuelMartinez/dsh-editor-panel#v1.0.0
\`\`\`

Then restart the application. Plugins do not auto-update: uninstall and
reinstall to move versions.

## What it contains

- \`lib/index.js\` — the Host half: read, stat, and version-checked writes
  confined to a registered Workspace.
- \`lib/client.js\` — the browser half: the Editor panel with Shiki syntax
  colours, line numbers, a git gutter from the file's comparison, find/replace
  (⌘F), and an **Edit** action in the document preview so a plain click can stay
  beside the conversation. It mounts its own generated \`workspaceEditor\` Remote
  namespace when the deployment's static Client assembly predates it.
- \`lib/typert.host.js\` — the generated Host Typert assembly discovered through
  the package's \`./typert\` export.
