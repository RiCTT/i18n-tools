// 国际化语言配置
import Vue from 'vue'
import VueI18n from 'vue-i18n'
// iview 国际化 引入语言包
import localeZh from '@/language/zh/'
import localeEn from '@/language/en/'

import Store from '@/utils/store'

// 优先级：用户缓存 > 浏览器 > 缺省
let lang = Store.loadObject('lang') || navigator.language.split('-')[0] || 'zh'
// 缓存当前语言
Store.saveObject('lang', lang)

Vue.use(VueI18n)
const i18n = new VueI18n({
    //定义默认语言
    locale: lang,
    messages: {
        zh: Object.assign(localeZh),
        en: Object.assign(localeEn),
    },
    silentTranslationWarn: true, //禁止没匹配警告
})

export default i18n
