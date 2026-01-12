import $ from "jquery"
import { ElMessage } from 'element-plus'


var message = null;

let showMessge = function (option) {
  try {
    message.close()
  } catch { }
  message = ElMessage(option)
}

let showError = function (msg, timeout) {
  showMessge({
    message: msg,
    type: 'error',
    duration: timeout || 3000
  })
}


let showSuccess = function (msg, timeout) {
  showMessge({
    message: msg,
    type: 'success',
    duration: timeout || 3000
  })
}




export {
  showSuccess,
  showError
}