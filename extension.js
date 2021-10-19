const vscode = require("vscode");
const { keywords } = require("./keywords");
const { RemoveUnusedHeaders } = require("./Utility");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log("ACTIVE");
  let disposable = vscode.commands.registerCommand(
    "autoinclude.autoInclude",
    function () {
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
            if (text[i] === " ") {
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
          let flag = true;
          words.map((item1) => {
            flag &= item1.lastIndexOf(item) === -1;
          });
          if (flag) {
            str += `#include <${item}>\n`;
          }
        });
        editor.edit((editBuilder) =>
          editBuilder.replace(editor.selection, str + text)
        );
        vscode.commands.executeCommand("cursorMove", { to: "viewPortTop" });
      });
      vscode.window.showInformationMessage("Done!");
    }
  );

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
