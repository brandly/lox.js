module.exports = function enumify (list) {
  return list.reduce((obj, value) => {
    obj[value] = value
    return obj
  }, {})
}
