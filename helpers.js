function getUserByEmail(email1, database) {
  for (let key in database) {
    if (database[key].email === email1) {
      return database[key];
    }
  }
  return undefined;
}
module.exports = { getUserByEmail };