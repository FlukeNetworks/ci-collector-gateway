const ApiBuilder = require('claudia-api-builder'),
  api = new ApiBuilder(),
  Promise = require('bluebird'),
  storage = require('./storage');

module.exports = api;

api.post('/build', request => {
  const build = JSON.parse(request.body).build;
  console.log(`Received build info: ${request.body}`);

  return storage.store(build).then(response => {
    console.log('good', response);
    return 'good';
  }).catch(err => {
    console.error(err);
    return 'bad';
  });
});
