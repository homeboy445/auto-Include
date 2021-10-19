const RemoveUnusedHeaders = (words, keywords) => {
  const find = (headerArray, target) => {
    /* 
         This function will check if any keyword belonging to a particular
         header is within the target string. the method to acheive the former
         is via using OR operation which will toggle the flag to true if the keyword 
         matches and will remain true (since true | false = true);
    */
    let flag = false;
    headerArray.map((item) => {
      flag |= target.lastIndexOf(item) !== -1;
    });
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
    if (item.lastIndexOf("#") !== -1) {
      let lineStr = "";
      for (let i = index; i < item.length; i++) {
        if (words[i] === "@") {
          break;
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
      if (header !== "iostream") {
        includedHeaders.add({ header: header, index: index });
      }
    }
  });

  let exclude = new Set();
  [...includedHeaders].map((item) => {
    let flag = false;
    for (iterator; iterator < words.length; iterator++) {
      flag |= find(headerObject[item.header], words[iterator]);
    }
    if (!flag) {
      exclude.add(item.index);
    }
  });
  [...exclude].map((item) => {
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
  words.map((item) => {
    if (item === "~~") {
      return null;
    }
    finalCode += item === "@" ? "\n" : item === "@$%" ? " " : item;
  });
  return finalCode;
};

module.exports = {
  RemoveUnusedHeaders,
};
