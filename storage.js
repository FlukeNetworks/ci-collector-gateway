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
      project: event.project,
      repository: event.repository,
      branch: event.branch,
      build: {
        id: event.build.id,
        href: event.build.href
      },

      duration: event.duration,
      success: event.success,
      unit_tests: {
        total: event.unit_tests.total,
        pct: event.unit_tests.pct
      },

      e2e_tests: {
        total: event.e2e_tests.total
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
              unit_tests: {
                properties: {
                  total: { type: 'integer' },
                  pct: { type: 'float' }
                }
              },
              e2e_tests: {
                properties: {
                  total: { type: 'integer' }
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
