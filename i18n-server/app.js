const exec = require('child_process').exec
const Koa = require('koa')
const app = new Koa()
const router = require('./router')
const bodyParser = require('koa-bodyparser')
const openBrowser = function(url) {
  switch (process.platform) {
    case "darwin":
      exec('open ' + url)
      break
    case "win32":
      exec('start ' + url)
      break
    default:
      exec('xdg-open ', [url])

  }
}

app.use(bodyParser())
app.use(router.routes())
app.use(router.allowedMethods({}))
// app.use(async ctx => {
//   ctx.body = indexHtml
//   ctx.set('Content-type', 'text/html')
// })

const port = 3366
app.listen(port)

openBrowser('http://localhost:' + port)
