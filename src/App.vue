<template>
  <div id="app">
    <!-- 切换导航栏 -->
    <header>
      <ul class="languages">
        <li class="language-item" :class="{active: lang === 'zh'}" @click="setLang('zh')">中文</li>
        <li class="language-item" :class="{active: lang === 'en'}" @click="setLang('en')">English</li>
      </ul>
    </header>
    <div>
      <h2>i18n工具使用</h2>
      <p>{{$t('title.name')}}</p>
      <p>{{$t('v2_auto.helpMeTranslate')}}</p>
      <p>{{$t('v2_auto.highTemple')}}</p>
      <p>{{$t('v2_auto.gaoMing')}}</p>
      <p>{{$t('v2_auto.canYouHelpMeTranslate')}}</p>
    </div>

    <div>
      <h2>常见注意事项</h2>
      <p>{{$g('中文')}}</p>
      <p>{{$g('英文')}}</p>
      <p>{{$g('翻译')}}</p>
    </div>
  </div>
</template>

<script>
import Store from '@/utils/store'
import Vue from 'vue'

const lang = Store.loadObject('lang') || 'zh'

export default {
  name: 'App',
  beforeCreate() {
    Object.defineProperty(Vue.prototype, '$g', {
      get() {
        return function(key) {
          return this.$t(key)
        }
      }
    })
  },
  data() {
    return {
      lang
    }
  },
  methods: {
    setLang(target) {
      Store.saveObject('lang', target)
      this.$i18n.locale = target
      this.lang = target
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.languages {
  list-style-type: none;
}
.language-item {
  display: inline-block;
  margin: 10px;
  padding-right: 20px;
  border-right: 2px solid #f2f2f2;
}

.language-item:last-child {
  border: none;
}

.language-item:hover {
  cursor: pointer;
  text-decoration: underline;
}

.language-item.active {
  color: skyblue;
}

.language-item.active:hover {
  cursor: default;
  text-decoration: none;
}
</style>
