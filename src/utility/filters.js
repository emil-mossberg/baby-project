import Vue from "vue";
import moment from "moment";

Vue.filter("formatDate", val => {
  if (!val) {
    return "-";
  }

  let date = val.toDate();
  return moment(date)
    .locale("sv")
    .format("DD MMMM YYYY", "d MMMM YYYY");
});
