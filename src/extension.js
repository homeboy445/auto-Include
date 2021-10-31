const vscode = require("vscode");
const { keywords } = require("./keywords");
const {
  RemoveUnusedHeaders,
  TextToWordsArray,
  ClassifyClassesAndStructs,
  CollectAllIdentifiers,
  getVariablesObject,
  checkType,
  getIncludedHeaders,
  getStandardHeadersObject,
  CollectAllHeaders,
  removeSpaces,
} = require("./utility");
const { Queue } = require("./tools");
const fs = require("fs");
const path = require("path");

/**
 * @param {vscode.ExtensionContext} context
 *
 */
function activate(context) {
  let disposable = vscode.commands.registerCommand(
    "autoinclude.autoInclude",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (editor.document.languageId !== "cpp") {
        return vscode.window.showInformationMessage("File type not supported!");
      }
      vscode.commands
        .executeCommand("editor.action.selectAll")
        .then(async () => {
          vscode.window.showInformationMessage(
            "Including required libraries & removing unused ones..."
          );
          let text = editor.document.getText(editor.selection);
          let headers = new Set(),
            words = TextToWordsArray(text);
          for (const key in keywords) {
            words.map((item, index) => {
              let foundAt = item.lastIndexOf(key);
              if (foundAt !== -1 && item.lastIndexOf("#include") === -1) {
                let status = text.lastIndexOf("using namespace std;");
                if (checkType(words, keywords[key], index, foundAt, key, status !== -1)) {
                  headers.add(keywords[key].header);
                }
              }
            });
          }
          text = RemoveUnusedHeaders(words, keywords);
          headers = await CollectAllHeaders(fs, path, editor.document.uri.path)
            .then((filesObj) => {
              const queue = new Queue();
              const headerObj = getStandardHeadersObject(keywords);
              let redundantInclude = new Set();
              let Visited = {};
              getIncludedHeaders(words).map((item) => {
                queue.push_front(item);
              });
              /**
               * Applying Breadth First Search to check if the header that is to be included is redundant or not
               * by checking if it has already been included in one of the included headers.
               */
              while (!queue.is_empty()) {
                let element = queue.front();
                redundantInclude.add(element);
                queue.pop_front();
                if (headerObj[element] || Visited[element] === true) {
                  Visited[element] = true;
                  continue;
                } else {
                  for (const file in filesObj) {
                    if (file.lastIndexOf(element) !== -1) {
                      filesObj[file].map((item) => {
                        queue.push_front(item);
                      });
                    }
                  }
                  Visited[element] = true;
                }
              }
              let s = new Set();
              [...headers].map((item) => {
                if (Visited[item]) {
                  return null;
                }
                return s.add(item);
              });
              return s;
            })
            .catch((e) => {
              return headers;
            });
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
