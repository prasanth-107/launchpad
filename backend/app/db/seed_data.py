# Seed Data for Modern Placement Launchpad
# Includes verified external resource links, authentic educational YouTube video IDs,
# assessment question banks, and default roadmap templates.

CONTENT_DATABASE_SEED = {
    "programming": [
        {
            "id": "c_prog",
            "name": "C Programming",
            "category": "Programming",
            "description": "Master procedural programming, pointers, memory allocation, and low-level computer architecture fundamentals.",
            "topics": ["Variables & Data Types", "Control Flow", "Functions & Scope", "Pointers & Memory", "Structures & Unions"],
            "resources": [
                {
                    "title": "GeeksforGeeks C Programming Language",
                    "url": "https://www.geeksforgeeks.org/c-programming-language/",
                    "provider": "GeeksforGeeks",
                    "type": "Documentation & Tutorials",
                    "description": "Comprehensive guide from C syntax to advanced pointers and memory management."
                },
                {
                    "title": "W3Schools C Tutorial",
                    "url": "https://www.w3schools.com/c/",
                    "provider": "W3Schools",
                    "type": "Interactive Tutorial",
                    "description": "Beginner-friendly step-by-step introduction with live code examples."
                },
                {
                    "title": "Learn-C.org Interactive Tutorial",
                    "url": "https://www.learn-c.org/",
                    "provider": "Learn-C",
                    "type": "Interactive Practice",
                    "description": "In-browser C practice covering pointers, linked lists, and recursion."
                }
            ],
            "youtube": [
                {
                    "videoId": "KJgsSFOSQv0",
                    "title": "C Programming Tutorial for Beginners",
                    "channel": "freeCodeCamp.org",
                    "duration": "3h 46m",
                    "thumbnail": "https://img.youtube.com/vi/KJgsSFOSQv0/hqdefault.jpg"
                },
                {
                    "videoId": "irqbmMNs2Bo",
                    "title": "C Programming Full Course for Free",
                    "channel": "Bro Code",
                    "duration": "4h 05m",
                    "thumbnail": "https://img.youtube.com/vi/irqbmMNs2Bo/hqdefault.jpg"
                }
            ]
        },
        {
            "id": "cpp_prog",
            "name": "C++ & STL",
            "category": "Programming",
            "description": "Object-oriented programming, standard template library (vector, map, set), and competitive programming foundations.",
            "topics": ["Classes & Objects", "Inheritance & Polymorphism", "STL Containers", "Templates", "Pointers & References"],
            "resources": [
                {
                    "title": "CppReference - C++ Documentation",
                    "url": "https://en.cppreference.com/w/cpp",
                    "provider": "CppReference",
                    "type": "Official Reference",
                    "description": "The definitive modern standard C++ reference for headers, STL containers, and algorithms."
                },
                {
                    "title": "GeeksforGeeks C++ Programming Language",
                    "url": "https://www.geeksforgeeks.org/c-plus-plus/",
                    "provider": "GeeksforGeeks",
                    "type": "Complete Guide",
                    "description": "Detailed guides on OOPs principles, STL algorithms, and placement interview questions."
                },
                {
                    "title": "W3Schools C++ Tutorial",
                    "url": "https://www.w3schools.com/cpp/",
                    "provider": "W3Schools",
                    "type": "Interactive Guide",
                    "description": "Accessible walkthrough of classes, methods, inheritance, and exception handling."
                }
            ],
            "youtube": [
                {
                    "videoId": "vLnPwxZdW4Y",
                    "title": "C++ Tutorial for Beginners - Full Course",
                    "channel": "freeCodeCamp.org",
                    "duration": "4h 01m",
                    "thumbnail": "https://img.youtube.com/vi/vLnPwxZdW4Y/hqdefault.jpg"
                },
                {
                    "videoId": "-TkoO8Z07hI",
                    "title": "C++ Full Course for free",
                    "channel": "Bro Code",
                    "duration": "5h 50m",
                    "thumbnail": "https://img.youtube.com/vi/-TkoO8Z07hI/hqdefault.jpg"
                }
            ]
        },
        {
            "id": "java_prog",
            "name": "Java & OOP",
            "category": "Programming",
            "description": "Object-oriented design, Collections Framework, Multithreading, JVM architecture, and enterprise backends.",
            "topics": ["Core Java", "OOP Principles", "Java Collections Framework", "Multithreading", "Exception Handling"],
            "resources": [
                {
                    "title": "Oracle Official Java Documentation",
                    "url": "https://docs.oracle.com/en/java/",
                    "provider": "Oracle",
                    "type": "Official Documentation",
                    "description": "Standard Java SE specification, API documentation, and platform developer guides."
                },
                {
                    "title": "GeeksforGeeks Java Programming",
                    "url": "https://www.geeksforgeeks.org/java/",
                    "provider": "GeeksforGeeks",
                    "type": "Comprehensive Guide",
                    "description": "In-depth tutorials for Java OOP concepts, Collections, and interview problem sets."
                },
                {
                    "title": "W3Schools Java Tutorial",
                    "url": "https://www.w3schools.com/java/",
                    "provider": "W3Schools",
                    "type": "Tutorial & Exercises",
                    "description": "Interactive lessons with built-in exercises covering Java syntax and classes."
                }
            ],
            "youtube": [
                {
                    "videoId": "A74TOX803D0",
                    "title": "Java Tutorial for Beginners",
                    "channel": "Programming with Mosh",
                    "duration": "2h 30m",
                    "thumbnail": "https://img.youtube.com/vi/A74TOX803D0/hqdefault.jpg"
                },
                {
                    "videoId": "xk4_1vDrzzo",
                    "title": "Java Full Course for free",
                    "channel": "Bro Code",
                    "duration": "12h 00m",
                    "thumbnail": "https://img.youtube.com/vi/xk4_1vDrzzo/hqdefault.jpg"
                }
            ]
        },
        {
            "id": "python_prog",
            "name": "Python for Developers",
            "category": "Programming",
            "description": "High-level language for backend web development, scripting, data engineering, and machine learning.",
            "topics": ["Python Basics", "Data Structures (List, Dict, Set)", "Functional & OOP Python", "File I/O & Modules", "Decorators & Generators"],
            "resources": [
                {
                    "title": "Official Python 3 Documentation",
                    "url": "https://docs.python.org/3/",
                    "provider": "Python Software Foundation",
                    "type": "Official Documentation",
                    "description": "Official Python standard library documentation, language reference, and tutorials."
                },
                {
                    "title": "Real Python Tutorials",
                    "url": "https://realpython.com/",
                    "provider": "Real Python",
                    "type": "In-Depth Articles",
                    "description": "High quality tutorials on clean code, idioms, virtual environments, and libraries."
                },
                {
                    "title": "W3Schools Python Tutorial",
                    "url": "https://www.w3schools.com/python/",
                    "provider": "W3Schools",
                    "type": "Interactive Guide",
                    "description": "Simple, beginner-centric overview of syntax, collections, classes, and JSON."
                }
            ],
            "youtube": [
                {
                    "videoId": "_uQrJ0TkZlc",
                    "title": "Python Tutorial for Beginners - Full Course",
                    "channel": "Programming with Mosh",
                    "duration": "6h 14m",
                    "thumbnail": "https://img.youtube.com/vi/_uQrJ0TkZlc/hqdefault.jpg"
                },
                {
                    "videoId": "rfscVS0vtbw",
                    "title": "Python for Beginners - Full Course",
                    "channel": "freeCodeCamp.org",
                    "duration": "4h 26m",
                    "thumbnail": "https://img.youtube.com/vi/rfscVS0vtbw/hqdefault.jpg"
                }
            ]
        }
    ],
    "web_development": [
        {
            "id": "html_css_js",
            "name": "Modern Web Fundamentals",
            "category": "Web Development",
            "description": "Semantic HTML5, CSS3 responsive grid/flexbox layouts, DOM manipulation, and asynchronous JavaScript.",
            "topics": ["Semantic HTML5", "Flexbox & CSS Grid", "JavaScript ES6+", "DOM & Events", "Fetch API & Async/Await"],
            "resources": [
                {
                    "title": "MDN Web Docs - HTML, CSS & JavaScript",
                    "url": "https://developer.mozilla.org/en-US/docs/Learn",
                    "provider": "Mozilla Developer Network (MDN)",
                    "type": "Official Web Standard",
                    "description": "The golden standard for web development tutorials and API references."
                },
                {
                    "title": "freeCodeCamp Responsive Web Design",
                    "url": "https://www.freecodecamp.org/learn/2022/responsive-web-design/",
                    "provider": "freeCodeCamp",
                    "type": "Certification Course",
                    "description": "Build responsive real-world web pages with HTML5, CSS3, and accessibility standards."
                },
                {
                    "title": "javascript.info - The Modern JavaScript Tutorial",
                    "url": "https://javascript.info/",
                    "provider": "javascript.info",
                    "type": "Complete Guide",
                    "description": "From JavaScript basics to advanced topics like closures, prototypes, and Promises."
                }
            ],
            "youtube": [
                {
                    "videoId": "mU6anWqZJcc",
                    "title": "HTML and CSS Full Course - Beginner to Pro",
                    "channel": "SuperSimpleDev",
                    "duration": "6h 31m",
                    "thumbnail": "https://img.youtube.com/vi/mU6anWqZJcc/hqdefault.jpg"
                },
                {
                    "videoId": "W6NZfCO5SIk",
                    "title": "JavaScript Tutorial for Beginners: 1 Hour",
                    "channel": "Programming with Mosh",
                    "duration": "1h 08m",
                    "thumbnail": "https://img.youtube.com/vi/W6NZfCO5SIk/hqdefault.jpg"
                }
            ]
        },
        {
            "id": "react_framework",
            "name": "React Frontend Development",
            "category": "Web Development",
            "description": "Component architecture, hooks (useState, useEffect, useMemo), state management, routing, and REST API integration.",
            "topics": ["JSX & Component Tree", "Hooks & State", "Props & Event Handling", "Context API", "React Router"],
            "resources": [
                {
                    "title": "Official React Documentation",
                    "url": "https://react.dev/",
                    "provider": "React Core Team",
                    "type": "Official Documentation",
                    "description": "Modern React guides with interactive sandboxes, hooks deep-dives, and best practices."
                },
                {
                    "title": "MDN React Tutorial",
                    "url": "https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Client-side_JavaScript_frameworks/React_getting_started",
                    "provider": "MDN Web Docs",
                    "type": "Developer Guide",
                    "description": "Step-by-step introduction to setting up, structuring, and running React web applications."
                }
            ],
            "youtube": [
                {
                    "videoId": "bMknfKXIFA8",
                    "title": "React Course - Beginner's Tutorial for React JavaScript Library",
                    "channel": "freeCodeCamp.org",
                    "duration": "11h 55m",
                    "thumbnail": "https://img.youtube.com/vi/bMknfKXIFA8/hqdefault.jpg"
                },
                {
                    "videoId": "SqcY0GlETPk",
                    "title": "React Tutorial for Beginners",
                    "channel": "Programming with Mosh",
                    "duration": "1h 20m",
                    "thumbnail": "https://img.youtube.com/vi/SqcY0GlETPk/hqdefault.jpg"
                }
            ]
        }
    ],
    "database": [
        {
            "id": "sql_dbms",
            "name": "SQL & Relational Databases (DBMS)",
            "category": "Database",
            "description": "Relational schemas, normalization (1NF to BCNF), complex JOINs, GROUP BY, subqueries, indexing, and ACID transactions.",
            "topics": ["Relational Model & Keys", "DDL & DML Commands", "INNER / LEFT / RIGHT JOINs", "Subqueries & CTEs", "ACID Transactions & Indexing"],
            "resources": [
                {
                    "title": "W3Schools SQL Tutorial",
                    "url": "https://www.w3schools.com/sql/",
                    "provider": "W3Schools",
                    "type": "Interactive SQL Tutorial",
                    "description": "Comprehensive reference covering SELECT, JOIN, GROUP BY, indexes, and aggregate functions."
                },
                {
                    "title": "SQLZoo Interactive SQL Practice",
                    "url": "https://sqlzoo.net/wiki/SQL_Tutorial",
                    "provider": "SQLZoo",
                    "type": "Interactive Practice",
                    "description": "Direct browser-based interactive SQL challenge engine with real databases."
                },
                {
                    "title": "GeeksforGeeks DBMS Notes",
                    "url": "https://www.geeksforgeeks.org/dbms/",
                    "provider": "GeeksforGeeks",
                    "type": "Placement Core Notes",
                    "description": "Essential placement preparation notes on normalization, ER diagrams, transactions, and concurrency."
                }
            ],
            "youtube": [
                {
                    "videoId": "HXV3zeQKqGY",
                    "title": "SQL Tutorial - Full Database Course for Beginners",
                    "channel": "freeCodeCamp.org",
                    "duration": "4h 20m",
                    "thumbnail": "https://img.youtube.com/vi/HXV3zeQKqGY/hqdefault.jpg"
                },
                {
                    "videoId": "7S_tz1z_5bA",
                    "title": "MySQL Tutorial for Beginners - Full Course",
                    "channel": "Programming with Mosh",
                    "duration": "3h 10m",
                    "thumbnail": "https://img.youtube.com/vi/7S_tz1z_5bA/hqdefault.jpg"
                }
            ]
        }
    ],
    "data_structures": [
        {
            "id": "dsa_core",
            "name": "Data Structures & Algorithms (DSA)",
            "category": "Data Structures",
            "description": "Arrays, Linked Lists, Stacks, Queues, Binary Trees, Binary Search Trees, Graphs, Sorting, Searching, and Dynamic Programming.",
            "topics": ["Arrays & Strings", "Linked Lists (Singly & Doubly)", "Stack & Queue Applications", "Binary Trees & BST", "Graph Traversals (BFS & DFS)", "Sorting & Binary Search"],
            "resources": [
                {
                    "title": "GeeksforGeeks Data Structures & Algorithms",
                    "url": "https://www.geeksforgeeks.org/data-structures/",
                    "provider": "GeeksforGeeks",
                    "type": "DSA Hub",
                    "description": "Theory, visual diagrams, time complexity analysis, and solved coding interview problems."
                },
                {
                    "title": "NeetCode DSA Roadmap",
                    "url": "https://neetcode.io/roadmap",
                    "provider": "NeetCode",
                    "type": "Interactive Roadmap",
                    "description": "Categorized interview patterns for LeetCode questions ranging from arrays to graphs and dynamic programming."
                },
                {
                    "title": "freeCodeCamp Data Structures Guide",
                    "url": "https://www.freecodecamp.org/news/learn-data-structures-and-algorithms/",
                    "provider": "freeCodeCamp",
                    "type": "Comprehensive Article",
                    "description": "Foundational breakdown of algorithmic complexity, Big O notation, and data structure choices."
                }
            ],
            "youtube": [
                {
                    "videoId": "8hly31xKli0",
                    "title": "Algorithms and Data Structures Tutorial - Full Course",
                    "channel": "freeCodeCamp.org",
                    "duration": "5h 22m",
                    "thumbnail": "https://img.youtube.com/vi/8hly31xKli0/hqdefault.jpg"
                },
                {
                    "videoId": "rZ41y93P2Qo",
                    "title": "Complete C++ DSA Course | Kunal Kushwaha",
                    "channel": "Kunal Kushwaha",
                    "duration": "Full Playlist",
                    "thumbnail": "https://img.youtube.com/vi/rZ41y93P2Qo/hqdefault.jpg"
                }
            ]
        }
    ],
    "aptitude": [
        {
            "id": "aptitude_core",
            "name": "Campus Placement Aptitude & Reasoning",
            "category": "Aptitude",
            "description": "Quantitative Aptitude (Percentages, Profit/Loss, Time & Work), Logical Reasoning (Puzzles, Blood Relations, Syllogisms), and Verbal Ability.",
            "topics": ["Quantitative Aptitude", "Logical Reasoning", "Data Interpretation", "Verbal Ability & Reading Comprehension"],
            "resources": [
                {
                    "title": "IndiaBIX Aptitude Questions and Answers",
                    "url": "https://www.indiabix.com/aptitude/questions-and-answers/",
                    "provider": "IndiaBIX",
                    "type": "Practice Tests",
                    "description": "The most widely used campus aptitude question repository with step-by-step explanations."
                },
                {
                    "title": "GeeksforGeeks Aptitude Preparation",
                    "url": "https://www.geeksforgeeks.org/aptitude-questions-and-answers/",
                    "provider": "GeeksforGeeks",
                    "type": "Topic-wise Quizzes",
                    "description": "Formulas, shortcuts, practice quizzes, and company-specific aptitude patterns."
                }
            ],
            "youtube": [
                {
                    "videoId": "G2b1Zf6T4eE",
                    "title": "Quantitative Aptitude Tricks & Shortcuts for Placements",
                    "channel": "CareerRide",
                    "duration": "1h 45m",
                    "thumbnail": "https://img.youtube.com/vi/G2b1Zf6T4eE/hqdefault.jpg"
                }
            ]
        }
    ],
    "interview_prep": [
        {
            "id": "interview_core",
            "name": "Campus Placement Interview Preparation",
            "category": "Interview Preparation",
            "description": "HR behavioral interview techniques, STAR method, standard technical interview walkthroughs, and executive communication.",
            "topics": ["HR Behavioral Questions", "Technical Core Walkthroughs", "STAR Method Framing", "Salary & Role Negotiation"],
            "resources": [
                {
                    "title": "GeeksforGeeks Top HR Interview Questions",
                    "url": "https://www.geeksforgeeks.org/hr-interview-questions-and-answers/",
                    "provider": "GeeksforGeeks",
                    "type": "Interview Guide",
                    "description": "Top 50 standard HR questions with model answers and tips for freshers."
                },
                {
                    "title": "Harvard OCS Behavioral Interview Guide",
                    "url": "https://careerservices.fas.harvard.edu/resources/create-a-strong-resume-and-cover-letter/",
                    "provider": "Harvard Career Services",
                    "type": "Executive Guide",
                    "description": "Authoritative principles for behavioral interview preparation and professional storytelling."
                }
            ],
            "youtube": [
                {
                    "videoId": "1mHjMNZZvFo",
                    "title": "Tell Me About Yourself - A Good Answer to This Interview Question",
                    "channel": "Linda Raynier",
                    "duration": "11m 40s",
                    "thumbnail": "https://img.youtube.com/vi/1mHjMNZZvFo/hqdefault.jpg"
                }
            ]
        }
    ],
    "resume_prep": [
        {
            "id": "resume_core",
            "name": "Placement Resume Building & ATS Optimization",
            "category": "Resume Preparation",
            "description": "Applicant Tracking System (ATS) friendly formats, action-verb project descriptions, quantifying achievements, and eliminating common mistakes.",
            "topics": ["ATS Formatting Standards", "Quantifying Achievements (X-Y-Z formula)", "Project Description Templates", "Skills Categorization"],
            "resources": [
                {
                    "title": "GeeksforGeeks Resume Building Guide for Freshers",
                    "url": "https://www.geeksforgeeks.org/resume-building-for-students-freshers/",
                    "provider": "GeeksforGeeks",
                    "type": "Resume Architecture",
                    "description": "Comprehensive resume checklist specifically designed for engineering and college placements."
                },
                {
                    "title": "Harvard Resume and Cover Letter Template Guidelines",
                    "url": "https://careerservices.fas.harvard.edu/resources/create-a-strong-resume-and-cover-letter/",
                    "provider": "Harvard University",
                    "type": "Official Career Document",
                    "description": "Gold-standard single-page resume layout guidelines and action verb list."
                }
            ],
            "youtube": [
                {
                    "videoId": "aB58ZzL5k-4",
                    "title": "How to Write a Resume with No Experience",
                    "channel": "freeCodeCamp.org",
                    "duration": "15m 20s",
                    "thumbnail": "https://img.youtube.com/vi/aB58ZzL5k-4/hqdefault.jpg"
                }
            ]
        }
    ]
}

# Assessment Questions Bank for Technical and Aptitude categories
ASSESSMENT_QUESTIONS_SEED = [
    # C Programming
    {
        "id": "c_1",
        "category": "C",
        "type": "mcq",
        "question": "What is the output of sizeof('a') in standard C?",
        "options": ["1", "sizeof(int)", "2", "Undefined"],
        "correctIndex": 1,
        "explanation": "In standard C, character literals like 'a' are of type int, so sizeof('a') is equal to sizeof(int), usually 4 bytes.",
        "difficulty": "Medium",
        "skill": "C"
    },
    {
        "id": "c_2",
        "category": "C",
        "type": "mcq",
        "question": "Which memory allocation function in C initializes allocated memory to zero?",
        "options": ["malloc()", "calloc()", "realloc()", "free()"],
        "correctIndex": 1,
        "explanation": "calloc() allocates memory and clears all bits to zero, whereas malloc() leaves the memory uninitialized.",
        "difficulty": "Easy",
        "skill": "C"
    },
    # C++
    {
        "id": "cpp_1",
        "category": "C++",
        "type": "mcq",
        "question": "Which C++ STL container is implemented as a self-balancing binary search tree (Red-Black tree)?",
        "options": ["std::vector", "std::unordered_map", "std::map", "std::deque"],
        "correctIndex": 2,
        "explanation": "std::map and std::set in C++ are typically implemented as Red-Black Trees, offering O(log N) lookup, insertion, and deletion.",
        "difficulty": "Medium",
        "skill": "C++"
    },
    # Java
    {
        "id": "java_1",
        "category": "Java",
        "type": "mcq",
        "question": "Which keyword in Java prevents a class from being subclassed?",
        "options": ["static", "abstract", "final", "immutable"],
        "correctIndex": 2,
        "explanation": "A class declared as final cannot be extended or inherited by another class in Java.",
        "difficulty": "Easy",
        "skill": "Java"
    },
    {
        "id": "java_2",
        "category": "Java",
        "type": "mcq",
        "question": "What is the difference between String and StringBuilder in Java?",
        "options": [
            "String is mutable, StringBuilder is immutable",
            "String is immutable, StringBuilder is mutable",
            "Both are mutable",
            "StringBuilder cannot be modified"
        ],
        "correctIndex": 1,
        "explanation": "Java String objects are immutable. Any modification creates a new object. StringBuilder is mutable and designed for efficient string assembly.",
        "difficulty": "Easy",
        "skill": "Java"
    },
    # Python
    {
        "id": "py_1",
        "category": "Python",
        "type": "mcq",
        "question": "What will be the output of `print([i for i in range(5) if i % 2 == 0])`?",
        "options": ["[0, 2, 4]", "[1, 3]", "[0, 1, 2, 3, 4]", "[2, 4]"],
        "correctIndex": 0,
        "explanation": "The list comprehension filters numbers from 0 to 4 where i % 2 == 0, resulting in [0, 2, 4].",
        "difficulty": "Easy",
        "skill": "Python"
    },
    {
        "id": "py_2",
        "category": "Python",
        "type": "mcq",
        "question": "In Python, which built-in data type is mutable and does NOT allow duplicate keys?",
        "options": ["Tuple", "Set", "Dictionary", "List"],
        "correctIndex": 2,
        "explanation": "Dictionaries are mutable key-value structures where all keys must be unique and hashable.",
        "difficulty": "Easy",
        "skill": "Python"
    },
    # HTML & CSS & JavaScript
    {
        "id": "web_1",
        "category": "HTML",
        "type": "mcq",
        "question": "Which HTML5 semantic element represents content indirectly related to the document's main content, like a sidebar?",
        "options": ["<nav>", "<aside>", "<section>", "<article>"],
        "correctIndex": 1,
        "explanation": "The <aside> element is intended for content tangentially related to the content around it, such as sidebars or callout boxes.",
        "difficulty": "Easy",
        "skill": "HTML"
    },
    {
        "id": "web_2",
        "category": "CSS",
        "type": "mcq",
        "question": "In CSS Flexbox, which property aligns items along the cross axis?",
        "options": ["justify-content", "align-items", "flex-direction", "align-self"],
        "correctIndex": 1,
        "explanation": "align-items aligns flex items along the cross axis, whereas justify-content aligns them along the main axis.",
        "difficulty": "Easy",
        "skill": "CSS"
    },
    {
        "id": "web_3",
        "category": "JavaScript",
        "type": "mcq",
        "question": "What is the return value of `typeof null` in JavaScript?",
        "options": ["'null'", "'undefined'", "'object'", "'boolean'"],
        "correctIndex": 2,
        "explanation": "In JavaScript, typeof null returns 'object'. This is a historical bug preserved for backward compatibility.",
        "difficulty": "Easy",
        "skill": "JavaScript"
    },
    # SQL
    {
        "id": "sql_1",
        "category": "SQL",
        "type": "mcq",
        "question": "Which clause in SQL is used to filter groups created by the GROUP BY clause?",
        "options": ["WHERE", "HAVING", "FILTER", "ORDER BY"],
        "correctIndex": 1,
        "explanation": "The HAVING clause filters aggregated groups after GROUP BY, whereas WHERE filters individual rows before grouping.",
        "difficulty": "Medium",
        "skill": "SQL"
    },
    {
        "id": "sql_2",
        "category": "SQL",
        "type": "mcq",
        "question": "Which JOIN returns all records when there is a match in either left or right table?",
        "options": ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL OUTER JOIN"],
        "correctIndex": 3,
        "explanation": "A FULL OUTER JOIN returns all rows from both tables, filling with NULL where matches do not exist.",
        "difficulty": "Easy",
        "skill": "SQL"
    },
    # Data Structures
    {
        "id": "dsa_1",
        "category": "Data Structures",
        "type": "mcq",
        "question": "What is the worst-case time complexity of QuickSort when a naive pivot is chosen?",
        "options": ["O(N log N)", "O(N)", "O(N^2)", "O(log N)"],
        "correctIndex": 2,
        "explanation": "If the array is already sorted and the last element is chosen as pivot, QuickSort degrades to O(N^2).",
        "difficulty": "Medium",
        "skill": "Data Structures"
    },
    {
        "id": "dsa_2",
        "category": "Data Structures",
        "type": "mcq",
        "question": "Which data structure follows the LIFO (Last In First Out) principle?",
        "options": ["Queue", "Stack", "Binary Tree", "Linked List"],
        "correctIndex": 1,
        "explanation": "A Stack operates on Last-In, First-Out (LIFO), where elements pushed last are popped first.",
        "difficulty": "Easy",
        "skill": "Data Structures"
    },
    # Coding Problem
    {
        "id": "coding_1",
        "category": "Data Structures",
        "type": "coding",
        "question": "Write a function `two_sum(nums, target)` that returns the indices of the two numbers such that they add up to target.",
        "initialCode": "def two_sum(nums, target):\n    # Write your solution here\n    pass",
        "testCases": [
            {"input": "nums = [2, 7, 11, 15], target = 9", "expected": "[0, 1]"},
            {"input": "nums = [3, 2, 4], target = 6", "expected": "[1, 2]"}
        ],
        "difficulty": "Medium",
        "skill": "Data Structures"
    },
    # Quantitative Aptitude
    {
        "id": "apt_q_1",
        "category": "Quantitative Aptitude",
        "type": "mcq",
        "question": "A person crosses a 600 m long street in 5 minutes. What is his speed in km per hour?",
        "options": ["3.6 km/hr", "7.2 km/hr", "8.4 km/hr", "10 km/hr"],
        "correctIndex": 1,
        "explanation": "Speed = (600 / (5 * 60)) m/s = 2 m/s. In km/hr: 2 * (18 / 5) = 7.2 km/hr.",
        "difficulty": "Easy",
        "skill": "Quantitative Aptitude"
    },
    {
        "id": "apt_q_2",
        "category": "Quantitative Aptitude",
        "type": "mcq",
        "question": "If an item is sold for $480 at a profit of 20%, what was its cost price?",
        "options": ["$380", "$400", "$420", "$440"],
        "correctIndex": 1,
        "explanation": "Selling Price = 1.20 * Cost Price => Cost Price = 480 / 1.20 = $400.",
        "difficulty": "Easy",
        "skill": "Quantitative Aptitude"
    },
    # Logical Reasoning
    {
        "id": "apt_l_1",
        "category": "Logical Reasoning",
        "type": "mcq",
        "question": "Pointing to a photograph of a boy, Suresh said, 'He is the son of the only son of my mother.' How is Suresh related to that boy?",
        "options": ["Brother", "Uncle", "Father", "Grandfather"],
        "correctIndex": 2,
        "explanation": "The only son of Suresh's mother is Suresh himself. So the boy is the son of Suresh. Thus Suresh is his Father.",
        "difficulty": "Medium",
        "skill": "Logical Reasoning"
    },
    # Verbal Ability
    {
        "id": "apt_v_1",
        "category": "Verbal Ability",
        "type": "mcq",
        "question": "Choose the word most nearly OPPOSITE in meaning to 'EPHEMERAL':",
        "options": ["Transient", "Permanent", "Fleeting", "Short-lived"],
        "correctIndex": 1,
        "explanation": "'Ephemeral' means lasting for a very short time. The opposite is 'Permanent'.",
        "difficulty": "Easy",
        "skill": "Verbal Ability"
    }
]

# Interview Question Bank
INTERVIEW_QUESTIONS_SEED = {
    "hr": [
        {
            "id": "hr_1",
            "question": "Tell me about yourself, your educational background, and why you are excited about starting your career.",
            "category": "HR Interview",
            "sampleFocus": "Structured introduction, personal passion, technical foundation, career goals."
        },
        {
            "id": "hr_2",
            "question": "What are your greatest strengths, and what is one area you have actively worked to improve?",
            "category": "HR Interview",
            "sampleFocus": "Self-awareness, proactive learning, concrete examples."
        },
        {
            "id": "hr_3",
            "question": "Where do you see yourself in 3 to 5 years in your software engineering journey?",
            "category": "HR Interview",
            "sampleFocus": "Ambition, commitment to engineering excellence, leadership trajectory."
        }
    ],
    "technical": [
        {
            "id": "tech_1",
            "question": "Can you explain the difference between a Process and a Thread, and how inter-process communication (IPC) works?",
            "category": "Technical Interview",
            "sampleFocus": "Memory address space, context switching, overhead, shared memory/pipes."
        },
        {
            "id": "tech_2",
            "question": "How would you design a database schema for an e-commerce order management system? What tables and keys would you use?",
            "category": "Technical Interview",
            "sampleFocus": "Primary keys, Foreign keys, Normalization, Orders vs OrderItems relationship."
        },
        {
            "id": "tech_3",
            "question": "Explain the concept of REST APIs. What are idempotent HTTP methods, and why does idempotency matter?",
            "category": "Technical Interview",
            "sampleFocus": "GET, PUT, DELETE idempotency vs POST non-idempotency, client retries."
        }
    ],
    "behavioral": [
        {
            "id": "beh_1",
            "question": "Describe a challenging group project in college where team members had conflicting opinions. How did you resolve it?",
            "category": "Behavioral Interview",
            "sampleFocus": "STAR method: Situation, Task, Action, Result. Empathy, objective data."
        },
        {
            "id": "beh_2",
            "question": "Tell me about a time you faced a tight project deadline and things weren't going according to plan. How did you handle the pressure?",
            "category": "Behavioral Interview",
            "sampleFocus": "Prioritization, transparent communication, MVP focus."
        }
    ],
    "role_based": [
        {
            "id": "role_1",
            "question": "As a Junior Full Stack Developer, how would you troubleshoot an issue where users report a web page is loading very slowly?",
            "category": "Role-based Interview",
            "sampleFocus": "Network tab inspection, database slow query logs, bundle size, caching headers."
        },
        {
            "id": "role_2",
            "question": "How do you ensure code quality before pushing your branch to production in a collaborative Git workflow?",
            "category": "Role-based Interview",
            "sampleFocus": "Unit tests, linting, pull request reviews, clean commit messages."
        }
    ]
}
