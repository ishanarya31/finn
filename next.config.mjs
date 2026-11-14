// The frozen reads in data/ are opened with fs at run time, so they are named here to be shipped with the server functions.
export default {
  outputFileTracingIncludes: { "/**": ["./data/*.json.gz"] },
};
