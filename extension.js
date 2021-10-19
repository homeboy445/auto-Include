// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const { keywords } = require("./keywords");
const { RemoveUnusedHeaders } = require("./Utility");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors
  // (console.error) This line of code will only be executed once when your
  // extension is activated
  console.log('Congratulations, your extension "autoinclude" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "autoinclude.autoInclude",
    function () {
      // The code you place here will be executed every time your command is
      // executed
      const editor = vscode.window.activeTextEditor;
      vscode.commands.executeCommand("editor.action.selectAll").then(() => {
        vscode.window.showInformationMessage("Including required libraries...");
        const text = editor.document.getText(editor.selection);
        let headers = new Set(),
          s = "",
          words = [];
        for (let i = 0, n = text.length; i < n; i++) {
          if (text[i] === "\n" || text[i] === " ") {
            if (keywords[s]) {
              headers.add(keywords[s]);
            }
            words.push(s);
            if (text[i] === "\n") {
              words.push("@");
            }
            if (text[i] === " "){
              words.push("@$%");
            }
            s = "";
            continue;
          }
          s += text[i];
        }
        console.log("EHEHEH");
        console.log("===>", RemoveUnusedHeaders(words, keywords));
        for (const key in keywords) {
          words.map((item) => {
            if (item.lastIndexOf(key) !== -1) {
              headers.add(keywords[key]);
            }
          });
        }
        let str = "";
        [...headers].map((item) => {
          if (words.find((item1) => item1 === `<${item}>`)) {
            return;
          }
          str += `#include <${item}>\n`;
        });
        editor.edit((editBuilder) =>
          editBuilder.replace(editor.selection, str + text)
        );
        vscode.commands.executeCommand("cursorMove", { to: "viewPortTop" });
      });
      // Display a message box to the user
      vscode.window.showInformationMessage("Done!");
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
