/* eslint-disable class-methods-use-this */
class Response {
  buildResponse(success = true, message = '', code = 200, data = []) {
    return {
      success,
      message,
      code,
      data
    };
  }
}

module.exports = Response;
