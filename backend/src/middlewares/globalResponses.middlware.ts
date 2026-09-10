import type { ErrorRequestHandler, RequestHandler } from "express";

const globalResponses: RequestHandler = (_req, res, next) => {
  res.success = (statusCode = 200, message = "OK", data = null) => {
    return res.status(statusCode).json({success:true, message, data:data });
  };

  res.error = (statusCode = 500, message = "Internal Server Error") => {
    return res.status(statusCode).json({success:false, message });
  };

  next();
};

const globalError: ErrorRequestHandler = (err, _req, res, _next) => {
    let statusCode = err.status || 500
    let errorMessage = err.message || "Internal Server Error"

    return res.status(statusCode).json({message:errorMessage})
}


export {
    globalResponses,
    globalError
};
