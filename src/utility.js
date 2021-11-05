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
 * @param {*} is_std_used
 * @returns String
 */
const RemoveUnusedHeaders = (words, keywords, is_std_used) => {
  words = ["@"].concat(words);
  const find = (headerArray, target, index) => {
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
            checkType(
              words,
              keywords[item.element],
              index,
              idx,
              item.element,
              is_std_used
            )
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
      if (headerObject[header] !== undefined) {
        includedHeaders.add({ header: header, index: index });
      }
    }
  });

  let exclude = new Set();
  [...includedHeaders].map((item) => {
    let flag = false;
    for (let it = iterator; it < words.length; it++) {
      flag |= find(headerObject[item.header], words[it], it);
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
const checkType = (words, keyword, index, foundAt, key, is_std_used) => {
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
      if (flag && stack.length === 0) {
        if (
          (words[index].lastIndexOf("std::") !== -1 && foundAt === 5) ||
          (is_std_used && foundAt === 0)
        ) {
          return true;
        }
      }
      break;
    }
    case 1: {
      if (
        (words[index].lastIndexOf("std::") !== -1 && foundAt === 5) ||
        (is_std_used && foundAt === 0)
      ) {
        return true;
      }
      break;
    }
    case 2: {
      let dataStr = "",
        keyword_ = "";
      let temp = "";
      for (let j = index - 1; j >= 0; j--) {
        if (words[j] === "$%") {
          continue;
        }
        if (words[j] === "@") {
          break;
        }
        temp = words[j];
        break;
      }
      if (temp.lastIndexOf(";") === -1 && temp !== "") {
        return false;
      }
      for (let i = index; i < words.length; i++) {
        dataStr += words[i];
        if (words[i].lastIndexOf(";") !== -1) {
          break;
        }
      }
      dataStr = removeSpaces(dataStr);
      for (let i = foundAt; i < dataStr.length; i++) {
        if (dataStr[i] === "(" || dataStr[i] === ";") {
          break;
        }
        if (dataStr[i] === "*") {
          continue;
        }
        keyword_ += dataStr[i];
      }
      if (
        !(
          (keyword_ === key &&
            (foundAt === 0 || (dataStr[0] === "*" && foundAt === 1)) &&
            is_std_used) ||
          ((foundAt === 5 || (dataStr[0] === "*" && foundAt === 6)) &&
            dataStr.lastIndexOf("std::") !== -1)
        )
      ) {
        return false;
      }
      //TODO: Extend param matching functionality.
      let func = extractParamAndName(
        removeSpaces(dataStr.slice(foundAt, dataStr.lastIndexOf(";")))
      );
      if (
        func.params.length === keyword.params.length &&
        ((words[index].lastIndexOf("std::") !== -1 && foundAt === 5) ||
          (is_std_used && foundAt === 0))
      ) {
        return true;
      }
    }
    default:
      return false;
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
    let idx = type.lastIndexOf("<");
    if (idx !== -1) {
      type = type.slice(0, idx);
    }
    for (let i = 0; i < type.length; i++) {
      let c = type[i];
      if (c.toLowerCase() === c.toUpperCase()) {
        return [type, false];
      }
    }
    return [type, true];
  };

  const removeSemiColon = (text) => {
    let s = "";
    for (let i = 0; i < text.length; i++) {
      if (text[i] !== ";") {
        s += text[i];
      }
    }
    return s;
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
    arr = arr.map((item2) => {
      item2 = item2.replace(/#/g, ",");
      let variable = item2.split("=")[0];
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
        let d_type = getDataType(type);
        if (!d_type[1]) {
          return null;
        }
        try {
          variablesObj[removeSpaces(d_type[0])].push(variable);
        } catch (e) {
          variablesObj[removeSpaces(d_type[0])] = [variable];
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
const removeSpaces = (text) => {
  let newTxt = "";
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "$" && i + 1 < text.length) {
      if (text[i + 1] === "%") {
        continue;
      }
    }
    if (text[i] === "%" && i - 1 >= 0) {
      if (text[i - 1] === "$") {
        continue;
      }
    }
    newTxt += text[i];
  }
  return newTxt;
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

/**
 * This functions extracts the name of the function & its params.
 * @param {*} func
 * @returns Object
 */
const extractParamAndName = (func) => {
  let brck = [];
  let str = "",
    functionName = "",
    paramString = "";
  for (let i = 0; i < func.length; i++) {
    if (func[i] === "{") {
      //This code can be refactored.
      brck.push(func[i]);
    }
    if (func[i] === "}" && brck[brck.length - 1] === "{") {
      brck.pop();
    }
    if (func[i] === ",") {
      if (brck.length !== 0) {
        if (brck[0] === "{") {
          str += "#";
          continue;
        }
      }
    }
    str += func[i];
  }
  for (let i = 0, k = 0; i < str.length - 1; i++) {
    if (str[i] === "(") {
      k++;
    }
    if (k === 0) {
      functionName += str[i];
    } else {
      if (k > 1) {
        paramString += str[i];
      }
      k++;
    }
  }
  return {
    name: functionName,
    params: paramString.split(",").map((item) => item.replace(/#/g, ",")),
  };
};

/**
 * This function mainly collects class & struct names from
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
};

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
  removeSpaces,
};
