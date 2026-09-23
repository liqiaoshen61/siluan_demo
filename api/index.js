/**
 * API统一入口
 */
import auth from "./auth.js";
import user from "./user.js";
import inspection from "./inspection.js";
import task from "./task.js";
import notification from "./notification.js";
import upload from "./upload.js";
import smart from "./smart.js";
import stats from "./stats.js";
import location from "./location.js";

export default {
  auth,
  user,
  inspection,
  task,
  notification,
  upload,
  smart,
  stats,
  location,
};
