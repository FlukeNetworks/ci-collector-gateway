const Elasticsearch = require('elasticsearch');
let _es;

const INDEX_BASE_NAME = 'lopez-builds';

module.exports = (() => {

  function es() {
    if (_es) {
      return _es;
    }

    _es = new Elasticsearch.Client({
      host: process.env.ELASTICSEARCH_URL,
      log: 'info',
      minSockets: 1,
      maxSockets: 1,
      requestTimeout: 2500,
      maxRetries: 1
    });

    return _es;
  }

  function getIndex(name) {
    return es().indices.exists({ index: name }).then((isExist) => {
      if (!isExist) {
        console.log('Creating new time-based index.');
        return _create(name).then(() => {
          return es().indices.putAlias({ name: INDEX_BASE_NAME, index: name }).then(() => {
            return name;
          })
        });
      }

      return name;
    });
  }

  function indexName(date) {
    let month = date.getMonth() + 1;
    if (month < 10) {
      month = '0' + month;
    }

    return [INDEX_BASE_NAME, date.getFullYear(), month].join('-')
  }

  function serialize(event, indexName) {
    const eventDoc = {
      '@timestamp': new Date(),
      task_type: event.task_type,
      project: event.project,
      repository: event.repository,
      branch: event.branch,
      build: {
        id: event.build.id,
        href: event.build.href
      },

      duration: event.duration,
      success: event.success,
      tests: {
        total: event.tests.total,
        lines_pct: event.tests.lines_pct,
        branches_pct: event.tests.branchs_pct,
        functions_pct: event.tests.functions_pct,
        statements_pct: event.tests.statements_pct,
        fail: event.tests.fail,
        pass: event.tests.pass,
        pending: event.tests.pending
      }
    };


    return [
      {
        index: {
          _index: indexName,
          _type: INDEX_BASE_NAME
        }
      },
      eventDoc
    ];
  }

  function _create(name) {
    return es().indices.create({
      index: name,
      body: {
        settings: {
          index: {
            number_of_shards: 1,
            number_of_replicas: 1
          }
        },
        mappings: {
          INDEX_BASE_NAME: {
            properties: {
              '@timestamp': { type: 'date' },
              task_type: { type: 'keyword' },
              project: { type: 'keyword' },
              repo: { type: 'keyword' },
              branch: { type: 'keyword' },
              build: {
                properties: {
                  id: { type: 'keyword' },
                  href: { type: 'keyword' }
                }
              },
              duration: { type: 'integer' },
              success: { type: 'boolean' },
              tests: {
                properties: {
                  total: { type: 'integer' },
                  lines_pct: { type: 'float' },
                  branches_pct: { type: 'float' },
                  functions_pct: { type: 'float' },
                  statements_pct: { type: 'float' },
                  pass: { type: 'integer' },
                  fail: { type: 'integer' },
                  pending: { type: 'integer' }
                }
              }
            }
          }
        }
      }
    });
  }

  return {
    serialize: serialize,

    store: function(event) {
      return getIndex(indexName(new Date())).then((indexName) => {
        let documents = serialize(event, indexName);
        return es().bulk({ body: documents }).then((response) => {
          if (response.errors) {
            console.log(documents);
            console.log(JSON.stringify(response.items));
          }

          return response;
        });
      });
    }
  }
})();
