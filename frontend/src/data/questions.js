export const questions = [
  // --- DATA STRUCTURES & ALGORITHMS (DSA) ---
  {
    id: 1,
    question: "What is the worst-case time complexity of inserting a node into a Binary Search Tree (BST)?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correctOption: 2,
    marks: 100
  },
  {
    id: 2,
    question: "Which of the following sorting algorithms is stable and has O(n log n) worst-case time complexity?",
    options: ["Quick Sort", "Merge Sort", "Heap Sort", "Selection Sort"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 3,
    question: "What is the worst-case time complexity of lookup in a Hash Table (assuming chaining)?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n^2)"],
    correctOption: 2,
    marks: 100
  },
  {
    id: 4,
    question: "Which data structure is primarily used to implement Breadth-First Search (BFS)?",
    options: ["Stack", "Queue", "Priority Queue", "Linked List"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 5,
    question: "What is the time complexity of the Floyd-Warshall all-pairs shortest path algorithm?",
    options: ["O(V^2)", "O(V^3)", "O(V * E)", "O(E^2)"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 6,
    question: "Which pattern is best suited for solving the Longest Common Subsequence (LCS) problem?",
    options: ["Greedy Approach", "Divide and Conquer", "Dynamic Programming", "Backtracking"],
    correctOption: 2,
    marks: 100
  },
  {
    id: 7,
    question: "What is the height of a balanced Binary Search Tree (AVL/Red-Black) with 'n' elements?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 8,
    question: "Which algorithm finds the Minimum Spanning Tree of a graph by selecting edges in sorted order of weight?",
    options: ["Dijkstra's Algorithm", "Prim's Algorithm", "Kruskal's Algorithm", "Bellman-Ford Algorithm"],
    correctOption: 2,
    marks: 100
  },
  {
    id: 9,
    question: "What is the maximum number of edges in a simple undirected graph with 'V' vertices?",
    options: ["V * (V - 1) / 2", "V^2", "V * (V + 1)", "2 * V"],
    correctOption: 0,
    marks: 100
  },
  {
    id: 10,
    question: "A recursion tree for Merge Sort has how many levels?",
    options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
    correctOption: 1,
    marks: 100
  },

  // --- OBJECT-ORIENTED PROGRAMMING (OOP) ---
  {
    id: 11,
    question: "Which concept allows a single interface to represent a general class of actions?",
    options: ["Encapsulation", "Polymorphism", "Inheritance", "Abstraction"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 12,
    question: "In C++, which keyword is used to enforce virtual dispatch on functions?",
    options: ["override", "virtual", "dynamic", "friend"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 13,
    question: "Which of the following describes binding a method call at compile-time?",
    options: ["Dynamic binding", "Static binding", "Late binding", "Virtual binding"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 14,
    question: "What refers to wrapping code and data together into a single unit?",
    options: ["Abstraction", "Inheritance", "Polymorphism", "Encapsulation"],
    correctOption: 3,
    marks: 100
  },
  {
    id: 15,
    question: "Can an abstract class be instantiated directly in Java?",
    options: ["Yes, always", "No, never", "Yes, if it has a constructor", "Yes, using new class name"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 16,
    question: "Which type of constructor is called when an object is initialized with another object of the same class?",
    options: ["Default constructor", "Parameterized constructor", "Copy constructor", "Virtual constructor"],
    correctOption: 2,
    marks: 100
  },
  {
    id: 17,
    question: "Multiple inheritance is not directly supported in Java classes to prevent which issue?",
    options: ["Diamond Problem", "Memory leak", "Polymorphic redundancy", "Stack overflow"],
    correctOption: 0,
    marks: 100
  },
  {
    id: 18,
    question: "Which SOLID principle states that a class should have only one reason to change?",
    options: ["Liskov Substitution Principle", "Open/Closed Principle", "Single Responsibility Principle", "Dependency Inversion Principle"],
    correctOption: 2,
    marks: 100
  },
  {
    id: 19,
    question: "Which type of polymorphism is achieved by method overloading?",
    options: ["Runtime Polymorphism", "Compile-time Polymorphism", "Ad-hoc Polymorphism", "Dynamic Dispatch"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 20,
    question: "What is an interface in object-oriented programming?",
    options: ["A concrete class", "A contract specifying method signatures without implementations", "A private class", "A class with all member variables static"],
    correctOption: 1,
    marks: 100
  },

  // --- OPERATING SYSTEMS (OS) ---
  {
    id: 21,
    question: "What state is a process in when it has been allocated resources and is waiting for CPU time?",
    options: ["Blocked state", "Ready state", "Suspended state", "Waiting state"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 22,
    question: "What condition is NOT required for deadlock to occur?",
    options: ["Mutual exclusion", "Preemption", "Hold and wait", "Circular wait"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 23,
    question: "Which memory management scheme allows the physical address space of a process to be noncontiguous?",
    options: ["Paging", "Contiguous allocation", "Single partition allocation", "Overlay mapping"],
    correctOption: 0,
    marks: 100
  },
  {
    id: 24,
    question: "What is the primary function of the Translation Lookaside Buffer (TLB)?",
    options: ["Cache instructions", "Cache physical page frames", "Cache virtual-to-physical address mappings", "Store page fault offsets"],
    correctOption: 2,
    marks: 100
  },
  {
    id: 25,
    question: "What isthrashing in an operating system context?",
    options: ["High disk paging activity causing low CPU utilization", "Process terminating abnormally", "CPU running at 100% load continuously", "Deadlock resolution sequence"],
    correctOption: 0,
    marks: 100
  },
  {
    id: 26,
    question: "Which CPU scheduling algorithm is preemptive and uses time slices?",
    options: ["First-Come First-Served", "Shortest Job First", "Round Robin", "Priority Scheduling"],
    correctOption: 2,
    marks: 100
  },
  {
    id: 27,
    question: "A semaphore is initialized to 1. If three Wait() operations are called, what is the semaphore value?",
    options: ["-2", "-3", "1", "0"],
    correctOption: 0,
    marks: 100
  },
  {
    id: 28,
    question: "What is the purpose of the banker's algorithm in OS?",
    options: ["Deadlock prevention", "Deadlock avoidance", "Deadlock detection", "CPU scheduling"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 29,
    question: "Which system call is used to replace the current process image with a new process image in Unix?",
    options: ["fork()", "exec()", "wait()", "exit()"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 30,
    question: "In page replacement algorithms, Belady's anomaly states that adding more page frames can:",
    options: ["Decrease page faults", "Increase page faults", "Keep page faults unchanged", "Crash the system"],
    correctOption: 1,
    marks: 100
  },

  // --- DATABASE MANAGEMENT SYSTEMS (DBMS) & SQL ---
  {
    id: 31,
    question: "Which normalization form removes transitive functional dependencies?",
    options: ["1NF", "2NF", "3NF", "BCNF"],
    correctOption: 2,
    marks: 100
  },
  {
    id: 32,
    question: "What does the 'I' represent in the ACID properties of transaction management?",
    options: ["Integrity", "Isolation", "Immutability", "Independency"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 33,
    question: "Which join returns all rows from the left table and matched rows from the right table?",
    options: ["INNER JOIN", "FULL JOIN", "LEFT JOIN", "RIGHT JOIN"],
    correctOption: 2,
    marks: 100
  },
  {
    id: 34,
    question: "What SQL clause is used to filter records aggregated by a GROUP BY clause?",
    options: ["WHERE", "HAVING", "LIMIT", "FILTER"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 35,
    question: "Which index type is best suited for range-based database queries?",
    options: ["Hash Index", "B+ Tree Index", "Bitmap Index", "Inverted Index"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 36,
    question: "What represents a structural blueprint or design of a database?",
    options: ["Record", "Schema", "Instance", "Domain"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 37,
    question: "Which lock level provides the highest concurrency but also the highest overhead?",
    options: ["Table lock", "Row-level lock", "Page lock", "Database-level lock"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 38,
    question: "What is a constraint that references the primary key of another table?",
    options: ["Candidate key", "Unique key", "Foreign key", "Alternate key"],
    correctOption: 2,
    marks: 100
  },
  {
    id: 39,
    question: "In SQL, which operator is used for pattern matching using wildcards?",
    options: ["MATCH", "LIKE", "IN", "EQUALS"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 40,
    question: "The NoSQL database design model that uses keys to retrieve raw documents is called:",
    options: ["Relational Model", "Document Store", "Graph Database", "Column-family Store"],
    correctOption: 1,
    marks: 100
  },

  // --- COMPUTER NETWORKS (CN) ---
  {
    id: 41,
    question: "Which layer of the OSI model handles routing, logical addressing, and path determination?",
    options: ["Data Link Layer", "Network Layer", "Transport Layer", "Session Layer"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 42,
    question: "What protocol is connection-oriented and guarantees ordered delivery of bytes?",
    options: ["UDP", "IP", "TCP", "ICMP"],
    correctOption: 2,
    marks: 100
  },
  {
    id: 43,
    question: "What is the standard port number used for HTTPS traffic?",
    options: ["80", "8080", "443", "22"],
    correctOption: 2,
    marks: 100
  },
  {
    id: 44,
    question: "What range represents IPv4 Loopback Addresses?",
    options: ["10.0.0.0/8", "127.0.0.0/8", "192.168.0.0/16", "224.0.0.0/4"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 45,
    question: "Which network device operates at the physical layer and simply replicates signals?",
    options: ["Switch", "Router", "Hub", "Gateway"],
    correctOption: 2,
    marks: 100
  },
  {
    id: 46,
    question: "What protocol resolves an IP address to its corresponding MAC physical address?",
    options: ["DNS", "DHCP", "ARP", "NAT"],
    correctOption: 2,
    marks: 100
  },
  {
    id: 47,
    question: "What is the length of an IPv6 address in bits?",
    options: ["32 bits", "64 bits", "128 bits", "256 bits"],
    correctOption: 2,
    marks: 100
  },
  {
    id: 48,
    question: "Which DNS record type maps a domain name to an IPv4 address?",
    options: ["CNAME", "MX", "A", "AAAA"],
    correctOption: 2,
    marks: 100
  },
  {
    id: 49,
    question: "What is the purpose of Network Address Translation (NAT)?",
    options: ["Enforcing encryption", "Mapping multiple private IPs to a single public IP", "Resolving domain names", "Balancing traffic requests"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 50,
    question: "Which flow control mechanism is used by TCP?",
    options: ["Sliding Window", "Stop and Wait", "Token Ring", "CSMA/CD"],
    correctOption: 0,
    marks: 100
  },

  // --- JAVASCRIPT ---
  {
    id: 51,
    question: "Which keyword declaration scopes a variable block-wise rather than function-wise?",
    options: ["var", "let", "global", "scope"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 52,
    question: "What is the output of 'typeof null' in JavaScript?",
    options: ["'null'", "'undefined'", "'object'", "'string'"],
    correctOption: 2,
    marks: 100
  },
  {
    id: 53,
    question: "What refers to an inner function having access to outer variables even after the outer function has completed?",
    options: ["Hoisting", "Callback", "Closure", "Scope Chain"],
    correctOption: 2,
    marks: 100
  },
  {
    id: 54,
    question: "How do you check for strict equality in JavaScript?",
    options: ["==", "===", "=", "equals()"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 55,
    question: "Which method adds elements to the end of an array and returns its new length?",
    options: ["pop()", "push()", "unshift()", "shift()"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 56,
    question: "Which of the following returns a new array with all elements that pass a test condition?",
    options: ["map()", "filter()", "forEach()", "reduce()"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 57,
    question: "What is the default value of an uninitialized declared variable in JavaScript?",
    options: ["null", "0", "undefined", "NaN"],
    correctOption: 2,
    marks: 100
  },
  {
    id: 58,
    question: "What is hoisting in JavaScript?",
    options: ["A CSS transformation ruleset", "Variables and function declarations moved to top of their scope before execution", "Deleting unused variables", "Creating dynamic array instances"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 59,
    question: "Which API method converts a JavaScript object into a JSON string format?",
    options: ["JSON.parse()", "JSON.stringify()", "JSON.convert()", "JSON.serialize()"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 60,
    question: "Which statement executes asynchronous code promises sequentially?",
    options: ["then().catch()", "async / await", "try / catch", "Promise.all()"],
    correctOption: 1,
    marks: 100
  },

  // --- REACT.JS ---
  {
    id: 61,
    question: "Which hook is used to perform side-effects in a React functional component?",
    options: ["useState", "useEffect", "useContext", "useReducer"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 62,
    question: "How do you pass data down from a parent component to its children?",
    options: ["State", "Props", "Context", "Reducers"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 63,
    question: "What does the Virtual DOM do in React?",
    options: ["Renders raw 3D scenes", "Caches HTTP fetch calls", "Maintains an in-memory representation of UI to batch DOM updates efficiently", "Validates component props schemas"],
    correctOption: 2,
    marks: 100
  },
  {
    id: 64,
    question: "What is the purpose of 'key' prop when rendering lists of elements?",
    options: ["Encrypting element data", "Helping React identify which items have changed, been added, or removed", "Binding events securely", "Enforcing strict CSS styling"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 65,
    question: "Which hook returns a memoized version of a callback function?",
    options: ["useMemo", "useCallback", "useRef", "useEffect"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 66,
    question: "What happens when a component's state variable is updated?",
    options: ["The browser does a full reload", "The component re-renders", "The database gets automatically updated", "All global variables are garbage collected"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 67,
    question: "Which hook is used to refer to a persistent mutable value that does not trigger re-renders?",
    options: ["useRef", "useMemo", "useState", "useContext"],
    correctOption: 0,
    marks: 100
  },
  {
    id: 68,
    question: "Can you call React hooks inside conditional statements or loops?",
    options: ["Yes, if declared with var", "No, hooks must be called at top level", "Yes, hooks can be nested anywhere", "Only inside useEffect hook callbacks"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 69,
    question: "Which component can catch JavaScript errors anywhere in their child component tree?",
    options: ["React Router Routes", "Error Boundaries", "Context Providers", "Suspense Boundaries"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 70,
    question: "Which react feature resolves components loading asynchronously?",
    options: ["Context API", "Suspense", "React Redux", "Memoization"],
    correctOption: 1,
    marks: 100
  },

  // --- NODE.JS & EXPRESS ---
  {
    id: 71,
    question: "Which design pattern does Node.js use at its core to handle non-blocking asynchronous operations?",
    options: ["Model-View-Controller", "Event Loop", "Observer Pattern", "Strategy Pattern"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 72,
    question: "What package manager is installed by default with Node.js?",
    options: ["yarn", "pnpm", "npm", "composer"],
    correctOption: 2,
    marks: 100
  },
  {
    id: 73,
    question: "Which module is used to create an HTTP server in Node.js standard library?",
    options: ["express", "http", "fs", "path"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 74,
    question: "In Express, what does next() do in a middleware function?",
    options: ["Terminate the client request connection", "Execute the next middleware or route handler", "Restart the server app", "Log the request stats to database"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 75,
    question: "Which method is used in Node.js to import CommonJS modules?",
    options: ["import", "require", "fetch", "load"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 76,
    question: "What represents 'package.json' in a Node.js project?",
    options: ["HTML design layout structure", "Project metadata manifest listing scripts and dependency versions", "Encrypted environment keys configuration", "Database indexes manifest"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 77,
    question: "Which environment variable denotes if the Node app is in development or production?",
    options: ["NODE_ENV", "PORT", "CONFIG_MODE", "APP_ENV"],
    correctOption: 0,
    marks: 100
  },
  {
    id: 78,
    question: "What is the purpose of the 'fs' module in Node.js?",
    options: ["Security validation", "File system operations", "Express routing", "Kafka client setup"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 79,
    question: "How do you parse incoming url-encoded request body payloads in Express?",
    options: ["express.json()", "express.urlencoded()", "cookieParser()", "cors()"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 80,
    question: "In Express, which handler parameter holds URL segment variables (e.g. /user/:id)?",
    options: ["req.body", "req.query", "req.params", "req.headers"],
    correctOption: 2,
    marks: 100
  },

  // --- JAVA & GENERAL CS CONCEPTS ---
  {
    id: 81,
    question: "Which Java virtual machine subsystem loads, links, and initializes class files?",
    options: ["Execution Engine", "Class Loader", "Garbage Collector", "JIT Compiler"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 82,
    question: "Which keyword is used to prevent a variable from being modified after initialization in Java?",
    options: ["static", "final", "const", "volatile"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 83,
    question: "What GC algorithm is used to free dynamically allocated heap memory in Java?",
    options: ["LIFO memory stack cleanup", "Garbage Collection", "Manual free() pointer cleanup", "Reference array pruning"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 84,
    question: "In Java, standard primitives like 'int' are stored in: while objects are stored in:",
    options: ["Heap / Stack", "Stack / Heap", "Registers / Disk", "Disk / Memory cache"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 85,
    question: "Which collection in Java guarantees uniqueness of elements?",
    options: ["ArrayList", "LinkedList", "HashSet", "HashMap"],
    correctOption: 2,
    marks: 100
  },
  {
    id: 86,
    question: "What is the size of a float primitive in Java?",
    options: ["16 bits", "32 bits", "64 bits", "128 bits"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 87,
    question: "Which keyword allows Java child classes to invoke overridden parent methods?",
    options: ["this", "super", "parent", "base"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 88,
    question: "In compiler design, what translates source code character sequences into tokens?",
    options: ["Lexical Analyzer (Lexer)", "Syntax Analyzer (Parser)", "Code Generator", "Optimizer"],
    correctOption: 0,
    marks: 100
  },
  {
    id: 89,
    question: "Which scheduling strategy causes starvation in priority scheduling?",
    options: ["Aging", "Indefinite blocking", "Context switching", "Paging"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 90,
    question: "Which compiler phase generates abstract syntax trees (AST)?",
    options: ["Lexing", "Parsing", "Code optimization", "Linker"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 91,
    question: "Which register stores the address of the next instruction to be fetched?",
    options: ["Instruction Register", "Program Counter", "Accumulator", "Stack Pointer"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 92,
    question: "What is a minor page fault in OS?",
    options: ["Page is loaded from swap partition disk", "Page is in memory but not mapped in process MMU table", "Core dumping process", "Operating system crash"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 93,
    question: "Which hash collision resolution puts elements in sequential memory offsets?",
    options: ["Chaining", "Linear Probing", "Double Hashing", "Rehashing"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 94,
    question: "Which tree traversal visits elements in ascending sorted order in a BST?",
    options: ["Pre-order", "Post-order", "In-order", "Level-order"],
    correctOption: 2,
    marks: 100
  },
  {
    id: 95,
    question: "What represents the maximum bandwidth of a connection?",
    options: ["Latency", "Throughput", "Capacity", "Jitter"],
    correctOption: 2,
    marks: 100
  },
  {
    id: 96,
    question: "Which SQL command is used to add columns to an existing table?",
    options: ["INSERT INTO", "ALTER TABLE", "UPDATE COLUMN", "MODIFY TABLE"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 97,
    question: "In C++, which keyword restricts direct structural object member updates?",
    options: ["protected", "private", "public", "restrict"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 98,
    question: "What represents a lightweight process sharing memory space with parent resources?",
    options: ["Daemon", "Thread", "Forked process", "Job"],
    correctOption: 1,
    marks: 100
  },
  {
    id: 99,
    question: "Which layer handles character set conversions, encoding, and compression?",
    options: ["Presentation Layer", "Application Layer", "Transport Layer", "Network Layer"],
    correctOption: 0,
    marks: 100
  },
  {
    id: 100,
    question: "Which complexity class contains problems solvable in polynomial time?",
    options: ["NP-Complete", "NP-Hard", "P", "EXP"],
    correctOption: 2,
    marks: 100
  }
];
