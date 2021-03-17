import Vue from "vue";
import App from "./App.vue";
import i18n from './language'
Vue.config.productionTip = false;

import "@/language";

new Vue({
  i18n,
  render: h => h(App)
}).$mount("#app");
