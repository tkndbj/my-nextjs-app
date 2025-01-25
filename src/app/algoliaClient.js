// src/lib/algoliaClient.js

import algoliasearch from "algoliasearch";

// Replace these with your actual Algolia credentials
const applicationId = "3QVVGQH4ME";
const searchOnlyApiKey = "dcca6685e21c2baed748ccea7a6ddef1";
const indexName = "products"; // Ensure this matches your Algolia index name

const searchClient = algoliasearch(applicationId, searchOnlyApiKey);

const index = searchClient.initIndex(indexName);

export { searchClient, index };
