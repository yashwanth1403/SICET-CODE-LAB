export const LANGUAGE_IDS = {
  C: 50,
  "C++": 54,
  Java: 62,
  Python: 71,
  JavaScript: 63,
  TypeScript: 74,
  Ruby: 72,
  Go: 60,
  Rust: 73,
};

export const STATUS_CODES = {
  1: "In Queue",
  2: "Processing",
  3: "Accepted",
  4: "Wrong Answer",
  5: "Time Limit Exceeded",
  6: "Compilation Error",
  7: "Runtime Error (SIGSEGV)",
  8: "Runtime Error (SIGXFSZ)",
  9: "Runtime Error (SIGFPE)",
  10: "Runtime Error (SIGABRT)",
  11: "Runtime Error (NZEC)",
  12: "Runtime Error (Other)",
  13: "Internal Error",
  14: "Exec Format Error",
};

export const getLanguageSuggestions = (language: string) => {
  switch (language) {
    case "C":
      return [
        { label: "int", type: "keyword", info: "Integer data type" },
        { label: "char", type: "keyword", info: "Character data type" },
        { label: "float", type: "keyword", info: "Floating-point data type" },
        {
          label: "double",
          type: "keyword",
          info: "Double precision floating-point data type",
        },
        { label: "struct", type: "keyword", info: "Define a structure" },
        { label: "for", type: "keyword", info: "Loop statement" },
        { label: "while", type: "keyword", info: "Loop statement" },
        { label: "if", type: "keyword", info: "Conditional statement" },
        { label: "switch", type: "keyword", info: "Selection statement" },
        { label: "return", type: "keyword", info: "Return statement" },
        { label: "printf", type: "function", info: "Print formatted output" },
        { label: "scanf", type: "function", info: "Read formatted input" },
        { label: "malloc", type: "function", info: "Allocate memory" },
        { label: "free", type: "function", info: "Deallocate memory" },
        { label: "strlen", type: "function", info: "Get string length" },
        { label: "strcpy", type: "function", info: "Copy string" },
        { label: "strcat", type: "function", info: "Concatenate strings" },
        { label: "fopen", type: "function", info: "Open file" },
        { label: "fclose", type: "function", info: "Close file" },
        { label: "NULL", type: "constant", info: "Null pointer constant" },
      ];
    case "C++":
      return [
        { label: "vector", type: "class", info: "STL dynamic array" },
        { label: "map", type: "class", info: "STL associative container" },
        { label: "unordered_map", type: "class", info: "STL hash table" },
        { label: "for", type: "keyword", info: "Loop statement" },
        { label: "cout", type: "keyword", info: "Standard output" },
        { label: "cin", type: "keyword", info: "Standard input" },
        {
          label: "push_back",
          type: "method",
          info: "Add element at the end",
        },
        { label: "size()", type: "method", info: "Return size" },
        {
          label: "begin()",
          type: "method",
          info: "Return iterator to beginning",
        },
        { label: "end()", type: "method", info: "Return iterator to end" },
      ];
    case "Java":
      return [
        {
          label: "ArrayList",
          type: "class",
          info: "Dynamic array implementation",
        },
        {
          label: "HashMap",
          type: "class",
          info: "Hash table implementation",
        },
        { label: "String", type: "class", info: "String class" },
        { label: "for", type: "keyword", info: "Loop statement" },
        {
          label: "System.out.println",
          type: "method",
          info: "Print to console",
        },
        { label: "length()", type: "method", info: "Get string length" },
        { label: "add()", type: "method", info: "Add element to collection" },
        {
          label: "get()",
          type: "method",
          info: "Get element from collection",
        },
        { label: "size()", type: "method", info: "Get collection size" },
        { label: "put()", type: "method", info: "Add key-value pair to map" },
      ];
    case "Python":
      return [
        { label: "list", type: "class", info: "Mutable sequence" },
        {
          label: "dict",
          type: "class",
          info: "Dictionary (key-value mapping)",
        },
        {
          label: "set",
          type: "class",
          info: "Unordered collection of unique elements",
        },
        { label: "for", type: "keyword", info: "Loop statement" },
        { label: "if", type: "keyword", info: "Conditional statement" },
        { label: "print()", type: "function", info: "Print to console" },
        { label: "len()", type: "function", info: "Get length of object" },
        {
          label: "range()",
          type: "function",
          info: "Generate a sequence of numbers",
        },
        { label: "append()", type: "method", info: "Add element to list" },
        { label: "sorted()", type: "function", info: "Return sorted list" },
      ];
    case "JavaScript":
      return [
        { label: "Array", type: "class", info: "Array object" },
        { label: "Map", type: "class", info: "Map object" },
        { label: "Set", type: "class", info: "Set object" },
        { label: "for", type: "keyword", info: "Loop statement" },
        { label: "const", type: "keyword", info: "Constant declaration" },
        {
          label: "let",
          type: "keyword",
          info: "Block-scoped variable declaration",
        },
        { label: "console.log()", type: "method", info: "Print to console" },
        { label: "push()", type: "method", info: "Add element to array" },
        { label: "filter()", type: "method", info: "Filter array elements" },
        { label: "map()", type: "method", info: "Transform array elements" },
      ];
    default:
      return [];
  }
};
