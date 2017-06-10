// libraries common to other microservices - will affect all newly built images
const express = require('express')
const chalk = require('chalk')
const rp = require('request-promise')
const authorization = require('auth-header')

const middleware = express()

module.exports = function common ({color, name, environment, authEndpoint}) {
  // do we log?
  const silent = (environment === 'Test')

  middleware.use('/health', function health (req, res) {
    return res
      .status(200)
      .send({
        ok: true
      })
  })
  // set 404 route
  middleware.use(function notFound(req, res, next) {
    return next({code: 404, err: new Error("Not Found")})
  })
  // format normal error objects with status code
  middleware.use(function error(error, req, res, next) {
    return error.code
    ? next(error)
    : next({code: 500, err: error})
  })
  
  // create error handler function - doesn't work as middleware
  // log errors as applicable
  function errorHandler({code=500, err=new Error()}, req, res, next) {
    return res.status(code).send({message: err.message})
    && code >= 500
      ? (!silent) ? console.log(`${!color ? name : chalk[color](name) } > ${err.message}`, err) : false // log error and stack trace above 500
      : (!silent) ? console.log(`${!color ? name : chalk[color](name) } > ${err.message}`) : false // log only message - cleaner
  }

  function authHandler({headers: { auth:authHeader }}, res, next) {
    // validate auth endpoint provided, otherwise 500
    authEndpoint || next({code: 500, err: new Error('No authentication endpoint defined!')})
    const parsedHeader = authorization.parse(authHeader)
    // check for correct scheme and validate with auth service
    return parsedHeader.scheme === 'Bearer' || next({code: 400, err: new Error('Only Bearer authenication is accepted.')})
      && rp({
        method: 'POST',
        uri: `${authEndpoint}/decode`,
        resolveWithFullResponse: true,
        json: {
          token: parsedHeader.token
        }
      })
      .then(res => res.statusCode === 200 ? next() : next({code: res.statusCode, err: new Error(res.status)}))
      .catch(res => next({code: res.statusCode, err: new Error(res.status)}))
  }

  
  // start server
  return {
    middleware,
    errorHandler,
    authHandler
  }
}