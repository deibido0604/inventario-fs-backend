exports.buildError = (code, msg) => {
    let error = new Error();
    error.code = code;
    error.message = msg;
    error.data = null
    throw error;
}