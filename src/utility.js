/** Class for handling identifiers. */
class Main {
  constructor(name, type) {
    this.name = name;
    this.type = type;
  }
}

/**
 * This function returns the object including the standard library headers as its keys.
 * @param {*} keywords
 * @returns Object
 */
const getStandardHeadersObject = (keywords) => {
  let headerObject = {};
  for (const key in keywords) {
    try {
      headerObject[keywords[key].header].push({
        element: key,
        type: keywords[key].type,
      });
    } catch (e) {
      headerObject[keywords[key].header] = [
        { element: key, type: keywords[key].type },
      ];
    }
  }
  return headerObject;
};

/**
 * This function mainly aims at removing any and all headers that are not
 * currently being used in the program.
 * @param {*} words
 * @param {*} keywords
 * @returns String
 */
const RemoveUnusedHeaders = (words, keywords) => {
  words = ["@"].concat(words);
  const find = (header, headerArray, target, index) => {
    /*
        This function will check if any keyword belonging to a particular
        header is within the target string. the method to acheive the former
        is via using OR operation which will toggle the flag to true if the
        keyword matches and will remain true (since true | false = true);
    */
    let flag = false;
    try {
      (headerArray || []).map((item) => {
        let idx = target.lastIndexOf(item.element);
        if (idx !== -1) {
          if (
            checkType(words, { header: header, type: item.type }, index, idx)
          ) {
            flag = true;
          }
        }
      });
    } catch (e) {
      return false;
    }
    return flag;
  };

  let includedHeaders = new Set();
  let headerObject = getStandardHeadersObject(keywords);
  let iterator = 0;
  words.map((item, index) => {
    iterator = item === "using" ? index : iterator;
    if (item.lastIndexOf("#include") !== -1) {
      let lineStr = "";
      for (let i = index; i < words.length; i++) {
        if (words[i] === "@") {
          break;
        }
        if (words[i] === "$%") {
          continue;
        }
        lineStr += words[i];
      }
      let header = "";
      for (let k = lineStr.lastIndexOf("<") + 1; k < lineStr.length; k++) {
        if (lineStr[k] === ">") {
          break;
        }
        header += lineStr[k];
      }
      if (header !== "iostream" && headerObject[header] !== undefined) {
        includedHeaders.add({ header: header, index: index });
      }
    }
  });

  let exclude = new Set();
  [...includedHeaders].map((item) => {
    let flag = false;
    for (let it = iterator; it < words.length; it++) {
      flag |= find(item.header, headerObject[item.header], words[it], it);
    }
    if (!flag) {
      exclude.add(item.index);
    }
  });
  ([...exclude] || []).map((item) => {
    let prev = 0,
      nxt = 0;
    for (let i = item; i >= 0; i--) {
      if (words[i] === "@") {
        prev = i;
        break;
      }
    }
    for (let i = item; i < words.length; i++) {
      if (words[i] === "@") {
        nxt = i;
        break;
      }
    }
    for (let i = prev + 1; i <= nxt; i++) {
      words[i] = "~~";
    }
  });
  let finalCode = "";
  words.map((item, index) => {
    if (item === "~~" || index === 0) {
      return null;
    }
    finalCode += item === "@" ? "\n" : item === "$%" ? " " : item;
  });
  return finalCode;
};

/**
 * This function checks if the matched substring is actually a keyword or not.
 * @param {*} words
 * @param {*} keyword
 * @param {*} index
 * @returns boolean
 */
const checkType = (words, keyword, index, foundAt) => {
  switch (keyword.type) {
    case 0: {
      let it,
        str = "",
        ix;
      for (ix = foundAt; ix < words[index].length; ix++) {
        str += words[index][ix];
      }
      for (it = index + 1; it < words.length; it++) {
        str += words[it];
        if (words[it].lastIndexOf(";") !== -1) {
          break;
        }
      }
      let stack = [],
        flag = false;
      for (let it = 0; it < str.length; it++) {
        flag |= str[it] === "<" || str[it] === ">";
        if (str[it] === "<") {
          stack.push("<");
        }
        if (str[it] === ">") {
          if (stack[stack.length - 1] === "<") {
            stack.pop();
          } else {
            stack.push(">");
          }
        }
        if (flag && stack.length === 0) {
          break;
        }
      }
      if (flag) {
        if (stack.length === 0) {
          return true;
        }
      }
      break;
    }
    case 1: {
      let s = "";
      if (item.lastIndexOf("::") !== -1) {
        let it = index - 1;
        while (it >= 0) {
          if (words[it] === " ") {
            continue;
          }
          s = words[it];
          break;
        }
        s += "::";
      }
      if (
        key.length === item.length ||
        s === "std::" ||
        item.slice(0, item.length - key.length) === "std::"
      ) {
        return true;
      }
      break;
    }
    case 2: {
      break;
    }
  }
  return false;
};

/**
 * This function will return the array of words within the
 * input text, it seperates word on the basis of spaces and new-line.
 * some notations used in this function:
 * '@': "\n", '$%': " "(space)
 * @param {*} text
 * @returns Array
 */
const TextToWordsArray = (text) => {
  let word = "",
    words = [];
  for (let i = 0, n = text.length; i < n; i++) {
    if (text[i] === "\n" || text[i] === " ") {
      words.push(word);
      if (text[i] === "\n") {
        words.push("@");
      }
      if (text[i] === " ") {
        words.push("$%");
      }
      word = "";
      continue;
    }
    word += text[i];
  }
  return words;
};

/**
 * This function return an object of all the variables & identifiers
 * used in the program.
 * @param {*} words
 * @returns boolean
 */
const getVariablesObject = (words) => {
  const isValidVariable = (variable) => {
    if (variable === undefined || variable.trim() === "") {
      return false;
    }
    for (let i = 0; i < variable.length; i++) {
      if (
        variable[i] === "_" ||
        variable.match(/^([0-9]|[a-z])+([0-9a-z]+)$/i) ||
        variable.toLowerCase() != variable.toUpperCase()
      ) {
        continue;
      }
      return false;
    }
    return true;
  };

  const getDataType = (type) => {
    let idx = type.lastIndexOf("::");
    if (idx !== -1) {
      type = type.slice(idx + 2);
    }
    if (type.lastIndexOf("<") !== -1) {
      let ss = "";
      for (let i = 0; i < type.length; i++) {
        if (type[i] === "<") {
          break;
        }
        ss += type[i];
      }
      type = ss;
    }
    return type;
  };

  let variablesObj = {},
    varArr = [];
  let lim = -1;
  words.map((item, index) => {
    if (
      item[0] === "#" ||
      item === "@" ||
      item === "$%" ||
      index <= lim ||
      item === "" ||
      item === "return" ||
      item === "using" ||
      item === "typedef" ||
      item === "namespace"
    ) {
      return null;
    }
    let it = index + 1,
      varString = "",
      flag = false;
    for (; it < words.length; it++) {
      if (words[it].lastIndexOf(";") !== -1) {
        flag = true;
        varString += words[it];
        break;
      }
      if (words[it] === "@" || words[it] === ">>" || words[it] === "<<") {
        break;
      }
      varString += words[it];
    }
    if (!flag) {
      return null;
    }
    lim = it;
    varArr.push([item, varString]);
  });
  varArr.map((item1) => {
    //Possible variable candidates...
    const [type, item] = item1;
    let varStr = "";
    if (item.lastIndexOf("{") !== -1) {
      let open = [];
      for (let i = 0; i < item.length; i++) {
        if (item[i] === "{" || item[i] === "}") {
          varStr += item[i];
          open.push(item[i]);
          continue;
        }
        if (item[i] === ",") {
          //Just to avoid confilicting between a variable seperator & a value seperator
          if (open.length > 0) {
            if (open[0] === "{" && open.length === 1) {
              //This signifies that the bracket is open.
              varStr += "#";
            } else if (open[0] === "{" && open[1] === "}") {
              //This signifies that the bracket is closed.
              open = [];
              varStr += item[i];
            }
          } else {
            varStr += item[i];
          }
        } else {
          varStr += item[i];
        }
      }
    }
    if (varStr === "") {
      varStr = item;
    }
    let arr = varStr.split(",");
    arr = arr.map((item) => {
      item = item.replace(/#/g, ",");
      let variable = item.split("=")[0];
      variable = variable.split("$%");
      if (variable.length === 3) {
        variable = variable[1];
      } else {
        let type_ = "",
          var_ = "";
        for (let it = variable.length - 1; it >= 0; it--) {
          if (variable[it] !== "") {
            if (var_ === "") {
              var_ = variable[it];
            } else {
              type_ = variable[it];
              break;
            }
          }
        }
        let flag = true; //TODO: Devise a better algorithm maybe?
        for (let i = 0; i < type_.length; i++) {
          if (type_[i].toLowerCase() === type_[i].toUpperCase()) {
            flag = false;
            break;
          }
        }
        if (flag) {
          try {
            variablesObj[type_].push(var_);
          } catch (e) {
            variablesObj[type_] = [var_];
          }
        }
        variable = var_;
      }
      if (isValidVariable(variable)) {
        try {
          variablesObj[RemoveSpaces(getDataType(type))].push(variable);
        } catch (e) {
          variablesObj[RemoveSpaces(getDataType(type))] = [variable];
        }
      }
    });
  });
  return variablesObj;
};

/**
 * This functions does what you think it does... It removes space from a
 * given string.
 * @param {*} text
 * @returns String
 */
const RemoveSpaces = (text) => {
  let k = "";
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== "$%") {
      k += text[i];
    }
  }
  return k;
};

/**
 *
 * This function collects the names of class & struct identifiers and return an array of @Main class object.
 * @param {*} words
 * @returns Array
 */
const ClassifyClassesAndStructs = (words) => {
  let arr = [];
  words.map((item, index) => {
    // TODO: Find a method to classify "METHODS".
    let type1 = item.lastIndexOf("class") !== -1,
      type2 = item.lastIndexOf("struct") !== -1;
    if (type1 || type2) {
      for (let i = index + 2; i < words.length; i++) {
        if (
          words[i] === "@" ||
          words[i] == "$%" ||
          words[i] == "{" ||
          words[i] == ":"
        ) {
          if (words[i - 1][words[i - 1].length - 1] == ":") {
            let m = new Main(
              words[i - 1].slice(0, words[i - 1].length - 1),
              type1 ? "class" : "struct"
            );
            arr.push(m);
          } else {
            let m = new Main(words[i - 1], type1 ? "class" : "struct");
            arr.push(m);
          }
          break;
        }
      }
    }
  });
  return arr;
};

/**
 * Reads folder content & return it.
 * @param {*} fs
 * @param {*} path
 * @param {*} filepath
 * @returns String
 */
const getFolderContents = (fs, path, filepath) => {
  const formattedPath = filepath.split(path.posix.sep).join(path.win32.sep);
  return fs.readdirSync(formattedPath);
};

/**
 * This function returns the contents of a current directory.
 * @param {*} fs
 * @param {*} path
 * @param {*} dirname
 * @returns Array
 */
const getDirContents = (fs, path, dirname) => {
  const filepath = dirname.slice(
    dirname[0] == "/" ? 1 : 0,
    dirname.lastIndexOf("/")
  );
  let arr = [];
  try {
    arr = getFolderContents(fs, path, filepath);
    let a = [];
    arr = arr.map((item) => {
      if (item.lastIndexOf(".") === -1) {
        a.push(getDirContents(fs, path, `${filepath}/${item}/`));
      }
      return `${filepath}/${item}`;
    });
    a.map((item) => {
      if (typeof item === String) {
        arr.concat(a);
      }
    });
    arr.push(a);
    return arr;
  } catch (e) {
    return [];
  }
};

/**
 * This is a utility function to spread sub-arrays and append their content to the main array.
 * @param {*} arr
 * @param {*} res
 * @returns Array
 */
const SpreadArray = (arr, res) => {
  try {
    arr.map((item) => {
      let k = SpreadArray(item, res);
      if (k[1] == 1) {
        res.push(k[0]);
      }
    });
    return [res, 0];
  } catch (e) {
    return [arr, 1];
  }
};

/**
 * This function returns an array of all the currently included headers within the program.
 * @param {*} words
 * @returns Array
 */
const getIncludedHeaders = (words) => {
  let headers = new Set();
  words.map((item, index) => {
    if (item === "" || item === undefined) {
      return null;
    }
    try {
      if (item.lastIndexOf("#include") !== -1) {
        for (let it = index; it < words.length; it++) {
          let a = words[it].lastIndexOf('"'),
            b = words[it].lastIndexOf("<");
          if (a !== -1) {
            return headers.add(words[it].split('"')[1]);
          } else if (b !== -1) {
            return headers.add(words[it].split("<")[1].split(">")[0]);
          }
        }
      }
    } catch (e) {
      return null;
    }
  });
  return [...headers];
};

const getAllFunctions = (words) => {
  const functions = [];
  words.map((item, index)=>{
    return;
  })
}

/**
 * This function mainly collects class & Struct names from
 * headers file that currently exists within the same directory
 * and within any sub-directory.
 * @param {*} fs
 * @param {*} path
 * @param {*} dirname
 * @returns Promise
 */
const CollectAllIdentifiers = (fs, path, dirname) => {
  let dirContents = SpreadArray(getDirContents(fs, path, dirname), [])[0];
  let fileObj = {};
  return new Promise((resolve, reject) => {
    dirContents.map((file) => {
      let filetype = file.slice(file.lastIndexOf(".") + 1);
      try {
        if (filetype === "hpp" || filetype === "h" || filetype === "hxx") {
          fileObj[file] = ClassifyClassesAndStructs(
            TextToWordsArray(fs.readFileSync(file, "utf8"))
          );
        }
      } catch (e) {
        return reject(e);
      }
    });
    resolve(fileObj);
  });
};

/**
 * This function collects & returns all the included headers within the current directory.
 * @param {*} fs
 * @param {*} path
 * @param {*} dirname
 * @returns Promise
 */
const CollectAllHeaders = (fs, path, dirname) => {
  let dirContents = SpreadArray(getDirContents(fs, path, dirname), [])[0];
  let fileObj = {};
  return new Promise((resolve, reject) => {
    dirContents.map((file) => {
      let filetype = file.slice(file.lastIndexOf(".") + 1);
      try {
        if (filetype === "hpp" || filetype === "h" || filetype === "hxx") {
          fileObj[file] = getIncludedHeaders(
            TextToWordsArray(fs.readFileSync(file, "utf8"))
          );
        }
      } catch (e) {
        return reject(e);
      }
    });
    resolve(fileObj);
  });
};

const collectAllFunctions = (fs, path, dirname) => {
  let dirContents = SpreadArray(getDirContents(fs, path, dirname), [])[0];
  let fileObj = {};
  return new Promise((resolve, reject) => {
    dirContents.map((file) => {
      let filetype = file.slice(file.lastIndexOf(".") + 1);
      try {
        if (filetype === "hpp" || filetype === "h" || filetype === "hxx") {
          fileObj[file] = getIncludedHeaders(
            TextToWordsArray(fs.readFileSync(file, "utf8"))
          );
        }
      } catch (e) {
        return reject(e);
      }
    });
    resolve(fileObj);
  });
}

module.exports = {
  Main,
  RemoveUnusedHeaders,
  TextToWordsArray,
  ClassifyClassesAndStructs,
  CollectAllIdentifiers,
  getVariablesObject,
  checkType,
  getIncludedHeaders,
  getStandardHeadersObject,
  CollectAllHeaders,
};
