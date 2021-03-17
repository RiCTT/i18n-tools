const files = require.context('.', false, /\_auto\.js$/)

let autoMap = {}
files.keys().forEach(key => {
  let obj = files(key).default
  autoMap = Object.assign(autoMap, obj)
})

export default {
  ...autoMap,
  title: {
    name: 1
  }
};
