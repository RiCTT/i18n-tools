const fs = require("fs");
const path = require("path");
const util = require("util");
const readFile = util.promisify(fs.readFile);
const stat = util.promisify(fs.stat);
const puppeteer = require("puppeteer");
const { googleKey } = require("../config");
const got = require("got");

const basePath = path.resolve(__dirname, "../../src");
const baseLangEnPath = path.resolve(__dirname, "../../src/language/en");
const baseLangZhPath = path.resolve(__dirname, "../../src/language/zh");
const excludeDir = ["api", "assets", "mock", "plugins", "style", "utils"];
const fileType = /\.(js|vue)$/;

// test str： "abc $g('你好，-我需要翻译\-') $g('中文') $g(',,..,') $g('中文混着符号，。')"
// result： $g('...')
// 因为返回带有符号，还需要手动截取一下
// 正则翻译：匹配开始符号 + 不是单/双引号的符号 + 匹配结束符号
// key: [fileName]
// value: the array of object, which need to translate
let files = {};
// 待翻译项,去重
let textsMap = {};
// 中英文项枚举
let allMap = {};

function initRelationData() {
  files = {};
  textsMap = {};
  allMap = {};
}

function startMatch() {
  // 解析次数
  // 已解析次数
  let count = 0;
  let readCount = 0;
  // readdirSync 读取目录的内容，返回目录or文件
  function viewDirSource(p, resolve) {
    const dirOrFileList = fs
      .readdirSync(p)
      .filter(d => !excludeDir.includes(d));
    dirOrFileList.forEach(name => {
      stat(path.join(p, name)).then(stats => {
        if (stats.isDirectory()) {
          viewDirSource(path.join(p, name), resolve);
        } else if (fileType.test(name) === false) {
          return;
        } else {
          count++;
          goExtract(path.join(p, name), resolve);
        }
      });
    });
  }

  const matchRegex = /\$g\(['"]([^'"\.])+['"]\)/g;
  function goExtract(fileName, resolve) {
    readFile(fileName, "utf8")
      .then(d => {
        let result = d.match(matchRegex);
        if (result && result.length) {
          result = result.map(e => {
            let t = e.substring(4, e.length - 2);
            if (textsMap[t]) {
              return textsMap[t];
            }
            let o = { zh: t, en: "" };
            textsMap[t] = o;
            return o;
          });
          files[fileName] = result;
        }
      })
      .finally(() => {
        readCount++;
        if (readCount === count) {
          resolve();
        }
      });
  }

  return new Promise(resolve => {
    viewDirSource(basePath, resolve);
  });
}

/**
 * Q1： 一个循环写文件的操作，写了一半出错了，如何复原之前写成功的文件
 */

class IndexCtrl {
  constructor() {}
  async getMatchList(ctx) {
    await startMatch();
    ctx.body = {
      files,
      texts: textsMap
    };
  }
  async getTranslate(ctx) {
    // type  1 —— 爬虫翻译  2 —— 付费翻译
    let { queryList, lang = "en", type = 1 } = ctx.query;
    if (!queryList) ctx.body = 404;
    let originQuery = queryList;
    type = Number(type);
    let action = type === 1 ? getTranslateFromPuppeteer : getTranslateFromGoogleKey
    // (翻译)(你好)(需要结果) 用括号是为了更好的得到翻译结果
    queryList = type === 1 ? (queryList.split(";").map(k => `(${k})`).join("")) : queryList
    let result = await action(lang, queryList);
    try {
      if (result) {
        let data = type === 1 ? result.match(/\([^\)]+\)/g) : result
        if (data.length !== originQuery.split(";").length) {
          ctx.body = {
            code: 500,
            data: "翻译结果不匹配，请检查根目录下screenshot.png"
          };
          return;
        }
        // 去除头尾空白
        data = data.map(k => k.replace(/^\s+/, "").replace(/\s+$/, ""));
        ctx.body = {
          code: 200,
          data: type === 1 ? data.map(k => k.substring(1, k.length - 1)) : data
        };
      } else {
        ctx.body = {
          code: 500,
          data: "翻译接口报错~"
        };
      }
    } catch (e) {
      console.log(e)
      ctx.body = {
        code: 500,
        data: typeof e === 'object' ? e.toString() : e
      }
    }
  }
  async goTranslate(ctx) {
    let { body } = ctx.request;
    let translateMap = body.t;
    if (!translateMap) {
      ctx.body = 404;
      return;
    }
    let langFileName = body.fileName || "v2_auto";
    await goReplace(translateMap);
    function goReplace(map) {
      return new Promise(resolve => {
        // 替换各个文件的国际化
        Object.keys(files).forEach(filePath => {
          let list = files[filePath];
          if (!list) return;

          let data = fs.readFileSync(filePath, "utf-8");
          list.forEach(item => {
            let key = getCustomKey(map[item.zh].en);
            allMap[key] = {
              zh: item.zh,
              en: map[item.zh].en
            };
            data = data.replace(
              new RegExp("\\$g\\(('|\")" + item.zh + "('|\")\\)"),
              `$g('${langFileName}.${key}')`
            );
          });
          fs.writeFileSync(filePath, data, "utf-8");
        });
        writeToI18n("en", langFileName);
        writeToI18n("zh", langFileName);
        initRelationData();
        resolve();
      });
    }
    ctx.body = {
      code: 200,
      data: allMap
    };
  }
}

function writeToI18n(lang, fileName) {
  let langBasePath = lang === "en" ? baseLangEnPath : baseLangZhPath;
  let keyObj = {};
  let target = path.join(langBasePath, fileName + ".js");
  if (fs.existsSync(target)) {
    let data = fs.readFileSync(target, "utf-8");
    data = data.replace("export default ", "");
    keyObj = JSON.parse(data);
  }
  let enObj = {};
  Object.keys(allMap).forEach(key => {
    enObj[key] = allMap[key][lang];
  });
  if (keyObj[fileName]) {
    keyObj[fileName] = { ...keyObj[fileName], ...enObj };
  } else {
    keyObj[fileName] = enObj;
  }
  fs.writeFileSync(
    target,
    `export default ${JSON.stringify(keyObj, undefined, 2)}`
  );
}

let baseKey = 'I18n'
let keyCount
let keyCountNext
function getCustomKey(en) {
  if (!en) return "";
  en = en.replace(/[^a-zA-Z\s0-9]/g, "").split(" ");
  let key = "";
  en.forEach((k, index) => {
    if (!k) return "";
    if (index === 0) {
      key += k;
    } else {
      key += k.substring(0, 1).toUpperCase() + k.substring(1).toLowerCase();
    }
  });
  if (key) {
    return key.substring(0, 1).toLowerCase() + key.substring(1);
  }
  if (!key) {
    keyCount = keyCount ? ++keyCount : Number(Math.random().toString().slice(-8))
    keyCountNext = keyCountNext ? ++keyCountNext : Number(Math.random().toString().slice(-8))
    return `${baseKey}-${keyCount}-${keyCountNext}`
  }
}

async function getTranslateFromPuppeteer(lang, texts) {
  //  texts = (翻译)(你好)(需要结果) 用括号是为了更好的得到翻译结果
  const url = `https://translate.google.cn/?sl=zh-CN&tl=${lang}&text=${decodeURIComponent(
    texts
  )}&op=translate`;
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);
  // await page.screenshot({ path: "screenshot.png" });
  await page.screenshot({ path: path.join(__dirname, "./screenshot.png") });
  let result = await page.evaluate(() => {
    return document.querySelector(".VIiyi").innerText;
  });
  return result;
}
async function getTranslateFromGoogleKey(lang, texts) {
  texts = texts.split(";");
  let result = [];
  const url = `https://translation.googleapis.com/language/translate/v2?key=${googleKey}`;
  for (let i = 0; i < texts.length; i++) {
    let res = await got.post(url, { json: { q: texts[i], target: lang } });
    let body = JSON.parse(res.body);
    if (body.data.translations) {
      let d = body.data.translations[0].translatedText;
      result.push(d);
    }
  }
  console.log(result);
  return result;
}

module.exports = new IndexCtrl();
