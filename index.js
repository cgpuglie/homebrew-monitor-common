// libraries common to other microservices - will affect all newly built images
const chalk = require('chalk')
const rp = require('request-promise')
const authorization = require('auth-header')

module.exports = function common ({color, name, environment, authEndpoint}) {
  // do we log?
  const silent = (environment === 'Test')

  // set 404 route
  function notFoundHandler(req, res, next) {
    return next({code: 404, err: new Error("Not Found")})
  }
  // format normal error objects with status code
  function errorForwardHandler(error, req, res, next) {
    return error.code
    ? next(error)
    : next({code: 500, err: error})
  }
  
  // create error handler function - doesn't work as middleware
  // log errors as applicable
  function errorHandler({code=500, err=new Error()}, req, res, next) {
    return res.status(code).send({message: err.message})
    && code >= 500
      ? console.log(`${!color ? name : chalk[color](name) } > ${err.message}`, err) // log error and stack trace above 500
      : (!silent) ? console.log(`${!color ? name : chalk[color](name) } > ${err.message}`) : false // log only message unless silent - cleaner
  }

  function healthHandler (req, res) {
    return res
      .status(200)
      .send({
        ok: true
      })
  }
  
  function authHandler({headers: { auth:authHeader }}, res, next) {
    return (authEndpoint || next({code: 500, err: new Error('No authentication endpoint defined!')})) // validate that an endpoint is defined
    && (authHeader || next({code: 401, err: new Error('No authentication header provided.')}))
    // check for correct scheme and validate with auth service
    && (authorization.parse(authHeader).scheme === 'Bearer' || next({code: 400, err: new Error('Only Bearer authenication is accepted.')}))
    && rp({
      method: 'POST',
      uri: `${authEndpoint}/decode`,
      resolveWithFullResponse: true,
      json: {
        token: authorization.parse(authHeader)
      }
    })
    .then(res => res.statusCode === 200 ? next() : next({code: res.statusCode, err: new Error(res.status)}))
    .catch(res => next({code: res.statusCode, err: new Error(res.status)}))
  }

  
  // start server
  return {
    notFoundHandler,
    errorForwardHandler,
    errorHandler,
    authHandler,
    healthHandler
  }
}