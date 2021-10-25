class Main {
  constructor(name, type) {
    this.name = name;
    this.type = type;
  }
}

const IsKeyWord = (word, keywords) => {
  /**
   *  This function checks if a word exist as a sub-string
   *  in any of the keywords.
   */
  for (const key in keywords) {
    if (word.lastIndexOf(key) !== -1) {
      return keywords[key];
    }
  }
  return "*";
};

const RemoveUnusedHeaders = (words, keywords) => {
  /**
   * This function mainly aims at removing any and all headers are not in
   * currently in the program.
   */
  words = ["@"].concat(words);
  const find = (headerArray, target) => {
    /*
         This function will check if any keyword belonging to a particular
         header is within the target string. the method to acheive the former
         is via using OR operation which will toggle the flag to true if the
         keyword matches and will remain true (since true | false = true);
    */
    let flag = false;
    try {
      (headerArray || []).map((item) => {
        flag |= target.lastIndexOf(item) !== -1;
      });
    } catch (e) {
      return false;
    }
    return flag;
  };

  let includedHeaders = new Set();
  let headerObject = {};
  for (const key in keywords) {
    try {
      headerObject[keywords[key]].push(key);
    } catch (e) {
      headerObject[keywords[key]] = [key];
    }
  }
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
      flag |= find(headerObject[item.header], words[it]);
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

const TextToWordsArray = (text, keywords) => {
  /**
   * This function will return the array of words of text,
   * it seperates word on the basis of spaces and new-line.
   * some notations used in this function:
   *          @  : \n
   *          $% : " "(space)
   */
  let word = "",
    words = [];
  for (let i = 0, n = text.length; i < n; i++) {
    if (text[i] === "\n" || text[i] === " ") {
      let value = IsKeyWord(word, keywords);
      if (value !== "*") {
        headers.add(value);
      }
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

const ClassifyClassesAndStructs = (words) => {
  /**
   *  This function collects the names of class & struct identifiers and
   *  return an array of @Main class object.
   */
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

const getFolderContents = (fs, path, filepath) => {
  /**
   *  Reads folder content & return it.
   */
  const formattedPath = filepath.split(path.posix.sep).join(path.win32.sep);
  return fs.readdirSync(formattedPath);
};

const getDirContents = (fs, path, dirname) => {
  /**
   *  This function returns the contents of a current directory.
   */
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

const SpreadArray = (arr, res) => {
  /**
   *  This is a utility function to spread sub-arrays and
   *  append there content to the main array.
   */
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

const CollectAllIdentifiers = (fs, path, dirname) => {
  /*
    This function mainly collects class & Struct names from
    headers file that currently exists within the same directory
    or within any sub-directory.
  */
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
        return null;
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
};
