const Router = require('koa-router')
const router = new Router()
const fs = require('fs')
const indexCtrl = require('../controller')
const indexHtml = fs.readFileSync('./index.html')


router.get('/', async ctx => {
  ctx.type = 'text/html'
  ctx.body = indexHtml
})

// 获取匹配列表
router.get('/match-list', indexCtrl.getMatchList)

// 获取翻译结果
router.get('/translate-list', indexCtrl.getTranslate)

// 执行翻译
router.post('/translate', indexCtrl.goTranslate)

router.get('/test', async ctx => {
  ctx.body = '测试成功'
})

module.exports = router
