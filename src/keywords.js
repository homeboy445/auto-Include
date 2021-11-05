/**
 *  This extension utilizes this object to provide headers for keywords.
 *  Notations of 'type':
 *        @0 : STL containers
 *        @1 : Classes & Objects
 *        @2 : Functions
 *  argv : "Any type"
 */
const keywords = {
  cout: { header: "iostream", type: 1 },
  cin: { header: "iostream", type: 1 },
  sort: { header: "algorithm", type: 2, params: ["iterator", "iterator"]},
  setprecision: {
    header: "iomanip",
    type: 2,
    params: [["double", "int", "float"]],
  },
  vector: { header: "vector", type: 0 },
  set: { header: "set", type: 0 },
  map: { header: "map", type: 0 },
  unordered_map: { header: "map", type: 0 },
  ceil: { header: "cmath", type: 2, params: [["double", "int", "float"]] },
  floor: { header: "cmath", type: 2, params: [["double", "int", "float"]] },
  abs: { header: "cmath", type: 2, params: [["double", "int", "float"]] },
  round: { header: "cmath", type: 2, params: [["double", "int", "float"]] },
  upper_bound: {
    header: "algorithm",
    type: 2,
    params: ["iterator", "iterator", "argv"],
  },
  lower_bound: {
    header: "algorithm",
    type: 2,
    params: ["iterator", "iterator", "argv"],
  },
  max_element: {
    header: "algorithm",
    type: 2,
    params: ["iterator", "iterator"],
  },
  min_element: {
    header: "algorithm",
    type: 2,
    params: ["iterator", "iterator"],
  },
  count: {
    header: "algorithm",
    type: 2,
    params: ["iterator", "iterator", "argv"],
  },
  queue: { header: "queue", type: 0 },
  deque: { header: "queue", type: 0 },
  priority_queue: { header: "queue", type: 0 },
  memset: { header: "cstring", type: 2, params: [["int", "bool"], "sizeof"] },
  stringstream: { header: "string", type: 1 },
  clock: { header: "chrono", type: 2, params: [] },
  array: {header:"array", type: 0},
  deque: {header:"deque", type:0},
  list: {header:"list", type:0},
  forward_list: {header:"forward_list", type:0},
  span: {header:"span", type:0},
  dynamic_extent: {header:"span", type: 0},
  stack: {header: "stack", type: 0},
  uses_allocator: {header: "stack", type: 0},
  unordered_map : {header:"unordered_map", type: 0},
  unordered_multimap : {header:"unordered_map", type: 0},
  for_each: {header:"algorithm", type:2 , params: ["iterator", "iterator", "argv"]}
};

module.exports = {
  keywords,
};
