import { StatusCodes } from "http-status-codes";

const errorHandlerMiddleware = (err, req, res, next) => {
  let customError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err.message || "Something went wrong, try again later",
  };

  if (err.name === "ValidationError") {
    customError.msg = Object.values(err.errors)
      .map((item) => item.message)
      .join(",");
    customError.statusCode = 400;
  }
  if (err.code && err.code === 11000) {
    customError.msg = `Duplicate value entered for ${Object.keys(
      err.keyValue
    )} field, please choose another value`;
    customError.statusCode = 400;
  }
  if (err.name === "CastError") {
    customError.msg = `No item found with id: ${err.value}`;
    customError.statusCode = 404;
  }
  if (err.name === "ForeignKeyError") {
    customError.statusCode = err.statusCode;
    customError.msg = err.message;
  }
  if (err.code === '23503') {
    const match = err.detail?.match(/referenced from table "(\w+)"/);
    const referencingTable = match ? match[1] : 'another record';
    const entityName = err.table || 'record';
    
    customError.statusCode = 409;
    customError.msg = `Cannot delete this ${entityName} because it is still referenced by ${referencingTable}. Please remove these references first.`;
  }

  return res.status(customError.statusCode).json({ 
    success: false,
    error: customError.msg 
  });
};

export default errorHandlerMiddleware;
