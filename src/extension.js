const vscode = require("vscode");
const { keywords } = require("./keywords");
const { RemoveUnusedHeaders, IsKeyWord } = require("./utility");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  let disposable = vscode.commands.registerCommand(
    "autoinclude.autoInclude",
    function () {
      const editor = vscode.window.activeTextEditor;
      vscode.commands.executeCommand("editor.action.selectAll").then(() => {
        vscode.window.showInformationMessage("Including required libraries...");
        let text = editor.document.getText(editor.selection);
        let headers = new Set(),
          s = "",
          words = [];
        for (let i = 0, n = text.length; i < n; i++) {
          if (text[i] === "\n" || text[i] === " ") {
            let value = IsKeyWord(s, keywords);
            if (value !== "*") {
              headers.add(value);
            }
            words.push(s);
            if (text[i] === "\n") {
              words.push("@");
            }
            if (text[i] === " ") {
              words.push("$%");
            }
            s = "";
            continue;
          }
          s += text[i];
        }
        for (const key in keywords) {
          words.map((item) => {
            if (item.lastIndexOf(key) !== -1) {
              headers.add(keywords[key]);
            }
          });
        }
        text = RemoveUnusedHeaders(words, keywords);
        console.log(text);
        let str = "";
        [...headers].map((item) => {
          let flag = true;
          words.map((item1) => {
            flag &= item1.lastIndexOf(`<${item}>`) === -1;
          });
          if (flag) {
            str += `#include <${item}>\n`;
          }
        });
        editor.edit((editBuilder) =>
          editBuilder.replace(editor.selection, str + text)
        );
        editor.document.save().then(() => {
          vscode.window.showInformationMessage("Done!");
        });
        vscode.commands.executeCommand("cursorMove", { to: "viewPortTop" });
        vscode.commands.executeCommand("editor.action.save");
      });
    }
  );

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
