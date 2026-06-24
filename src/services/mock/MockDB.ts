import type { QuizQuestion, User, Topic } from '../../core/types';

const INITIAL_QUESTIONS: QuizQuestion[] = [
  {
    question_id: 'q1',
    topic: 'Operating System',
    sub_topic: 'Syscall',
    question: 'How can a process switch from user mode to kernel mode?',
    options: [
      'Using a software interrupt or trap',
      'Through a standard function call',
      'By modifying the program counter directly',
      'By increasing the process priority'
    ],
    correct_answer_index: 0,
    difficulty: 'medium',
    explanation: 'A trap or software interrupt is the standard mechanism to switch CPU execution from user mode to privileged kernel mode for running system calls.'
  },
  {
    question_id: 'q2',
    topic: 'Operating System',
    sub_topic: 'PCB',
    question: 'What information is NOT typically stored in a Process Control Block (PCB)?',
    options: [
      'Global application cache size',
      'Process State',
      'Program Counter',
      'CPU Registers'
    ],
    correct_answer_index: 0,
    difficulty: 'easy',
    explanation: 'The PCB contains process-specific execution state, registers, memory limits, and schedule info, but not global application-level cache parameters.'
  },
  {
    question_id: 'q3',
    topic: 'Operating System',
    sub_topic: 'Scheduling',
    question: 'Which scheduling algorithm is designed to prevent starvation by dynamically adjusting priorities?',
    options: [
      'Multilevel Feedback Queue (MLFQ)',
      'First-Come, First-Served (FCFS)',
      'Shortest Job First (SJF) without preemption',
      'Round Robin (RR) with fixed quantum'
    ],
    correct_answer_index: 0,
    difficulty: 'hard',
    explanation: 'Multilevel Feedback Queue schedules jobs dynamically and boosts aging processes to higher priority queues to prevent starvation.'
  },
  {
    question_id: 'q4',
    topic: 'Java',
    sub_topic: 'JVM',
    question: 'Where are object instances stored in the Java Virtual Machine (JVM) memory model?',
    options: [
      'Heap memory',
      'Stack memory',
      'Method area',
      'Program Counter register'
    ],
    correct_answer_index: 0,
    difficulty: 'easy',
    explanation: 'In the JVM, all object instances and arrays are allocated on the Heap memory, which is shared among all threads.'
  },
  {
    question_id: 'q5',
    topic: 'Java',
    sub_topic: 'Concurrency',
    question: 'What is the primary difference between synchronized block and ReentrantLock in Java?',
    options: [
      'ReentrantLock offers advanced options like tryLock() and fair ordering',
      'Synchronized blocks are faster and support fairness settings',
      'Synchronized blocks can be locked across multiple methods',
      'ReentrantLock does not require manual unlocking'
    ],
    correct_answer_index: 0,
    difficulty: 'hard',
    explanation: 'ReentrantLock provides features like tryLock() (attempting lock without waiting), interruptible lock acquisition, and fair locks, but requires manual unlocking in a try-finally block.'
  },
  {
    question_id: 'q6',
    topic: 'Java',
    sub_topic: 'Collection',
    question: 'Which collection should be used when you need key-value pairs sorted by their keys?',
    options: [
      'TreeMap',
      'HashMap',
      'LinkedHashMap',
      'ConcurrentHashMap'
    ],
    correct_answer_index: 0,
    difficulty: 'medium',
    explanation: 'TreeMap is implemented using a Red-Black tree structure, which maintains keys in their natural sorted order or via a custom Comparator.'
  },
  {
    question_id: 'q7',
    topic: 'Database',
    sub_topic: 'Index',
    question: 'Why do relational databases primarily use B+ Trees instead of Hash indexes for table indexing?',
    options: [
      'B+ Trees support efficient range queries and inequality comparisons',
      'B+ Trees are faster for exact matches',
      'B+ Trees consume significantly less memory',
      'Hash indexes cannot prevent duplicate entries'
    ],
    correct_answer_index: 0,
    difficulty: 'medium',
    explanation: 'B+ Trees keep data keys in sorted order, which allows efficient range queries (e.g., BETWEEN, >, <). Hash indexes only support O(1) exact equality matches.'
  },
  {
    question_id: 'q8',
    topic: 'Database',
    sub_topic: 'Transaction',
    question: 'Which ACID property ensures that database transactions are fully completed or completely rolled back?',
    options: [
      'Atomicity',
      'Consistency',
      'Isolation',
      'Durability'
    ],
    correct_answer_index: 0,
    difficulty: 'easy',
    explanation: 'Atomicity follows the "all-or-nothing" rule, ensuring that if any part of the transaction fails, the entire transaction is rolled back.'
  },
  {
    question_id: 'q9',
    topic: 'Database',
    sub_topic: 'Transaction',
    question: 'Under which transaction isolation level can "phantom reads" occur but "dirty reads" and "non-repeatable reads" are prevented?',
    options: [
      'Repeatable Read',
      'Read Uncommitted',
      'Read Committed',
      'Serializable'
    ],
    correct_answer_index: 0,
    difficulty: 'hard',
    explanation: 'Repeatable Read locks rows read by a query, preventing updates/deletes (avoiding non-repeatable reads), but does not prevent insertions of new rows matching the query (allowing phantom reads).'
  },
  {
    question_id: 'q10',
    topic: 'Operating System',
    sub_topic: 'Syscall',
    question: 'Which of the following is a system call used for process creation in Unix-like operating systems?',
    options: [
      'fork()',
      'exec()',
      'pipe()',
      'read()'
    ],
    correct_answer_index: 0,
    difficulty: 'easy',
    explanation: 'The fork() system call creates a new process by duplicating the calling process.'
  },
  {
    question_id: 'q11',
    topic: 'Java',
    sub_topic: 'JVM',
    question: 'Which garbage collector in JVM is designed for multi-gigabyte heaps with short, predictable pause times?',
    options: [
      'G1 (Garbage First) GC',
      'Serial GC',
      'Parallel GC',
      'CMS (Concurrent Mark Sweep) GC'
    ],
    correct_answer_index: 0,
    difficulty: 'medium',
    explanation: 'G1 GC divides the heap into equal-sized regions and performs incremental reclamation, providing low and predictable pause times for large heaps.'
  },
  {
    question_id: 'q12',
    topic: 'Java',
    sub_topic: 'Concurrency',
    question: 'What is the purpose of the volatile keyword in Java?',
    options: [
      'It forces threads to read/write variables directly from/to main memory, ensuring visibility',
      'It locks the variable for single-thread write actions',
      'It converts a variable into an atomic reference type',
      'It prevents variables from being garbage collected'
    ],
    correct_answer_index: 0,
    difficulty: 'medium',
    explanation: 'The volatile keyword ensures thread visibility by guaranteeing that updates to a variable are written directly back to main memory, and read directly from main memory.'
  },
  {
    question_id: 'q13',
    topic: 'Operating System',
    sub_topic: 'Deadlock',
    question: 'Which of the following is NOT one of the four necessary conditions for a deadlock to occur?',
    options: [
      'Preemption',
      'Mutual Exclusion',
      'Hold and Wait',
      'Circular Wait'
    ],
    correct_answer_index: 0,
    difficulty: 'medium',
    explanation: 'The four Coffman conditions are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. "Preemption" prevents deadlocks rather than causing them.'
  },
  {
    question_id: 'q14',
    topic: 'Operating System',
    sub_topic: 'Memory Management',
    question: 'What is the main cause of thrashing in an operating system?',
    options: [
      'The system is spending more time swapping pages in and out than executing instructions',
      'The CPU clock speed is too slow for the running processes',
      'Multiple deadlocks are occurring simultaneously in memory',
      'The page size configuration is significantly larger than physical frame sizes'
    ],
    correct_answer_index: 0,
    difficulty: 'medium',
    explanation: 'Thrashing occurs when a system spends more time servicing page faults (swapping pages between RAM and disk) than executing actual process instructions.'
  },
  {
    question_id: 'q15',
    topic: 'Java',
    sub_topic: 'OOP',
    question: 'Which keyword is used in Java to prevent a class from being subclassed or inherited?',
    options: [
      'final',
      'abstract',
      'static',
      'private'
    ],
    correct_answer_index: 0,
    difficulty: 'easy',
    explanation: 'Marking a class as final in Java prevents any other class from extending it.'
  },
  {
    question_id: 'q16',
    topic: 'Java',
    sub_topic: 'String',
    question: 'Why is StringBuilder preferred over String when performing extensive string concatenation loops?',
    options: [
      'StringBuilder modifies an internal mutable char array without creating new garbage objects',
      'StringBuilder automatically registers characters in the String Pool',
      'StringBuilder is thread-safe due to internal synchronization wrapper',
      'StringBuilder consumes significantly less heap pointer reference bytes'
    ],
    correct_answer_index: 0,
    difficulty: 'medium',
    explanation: 'Strings are immutable in Java; modifying them creates new objects. StringBuilder manages a mutable internal buffer, making concatenation operations much faster and garbage collector friendly.'
  },
  {
    question_id: 'q17',
    topic: 'Database',
    sub_topic: 'SQL',
    question: 'What is the primary difference between the WHERE and HAVING clauses in SQL?',
    options: [
      'WHERE filters rows before group aggregation, while HAVING filters aggregated group results',
      'HAVING can only be applied to primary key columns indexed by B+ Trees',
      'WHERE supports conditional subqueries while HAVING is strictly limited to exact values',
      'They are completely identical and interchangeable across all standard SQL specifications'
    ],
    correct_answer_index: 0,
    difficulty: 'easy',
    explanation: 'The WHERE clause filters individual records before any GROUP BY operations occur. The HAVING clause filters summary groups created by aggregate functions (e.g., SUM, COUNT).'
  },
  {
    question_id: 'q18',
    topic: 'Database',
    sub_topic: 'Locks',
    question: 'In database concurrency control, what risk does a Shared Lock (S-Lock) avoid?',
    options: [
      'Dirty Reads by blocking other uncommitted Exclusive Locks from modifying the row',
      'Deadlocks by completely neutralizing all concurrent transactions',
      'Lost Updates by ensuring multiple write processes occur sequentially',
      'Phantom Reads by placing a predicate predicate barrier on the entire index node'
    ],
    correct_answer_index: 0,
    difficulty: 'hard',
    explanation: 'A Shared lock allows concurrent reads but prevents other transactions from modifying the locked data item, thus preventing uncommitted updates or dirty reads.'
  },
  {
    question_id: 'q19',
    topic: 'Operating System',
    sub_topic: 'Memory Management',
    question: 'What is the purpose of the Translation Lookaside Buffer (TLB) in CPU architectures?',
    options: [
      'To cache recent virtual-to-physical address translations for faster memory access',
      'To buffer raw disk blocks before they are flushed into physical ram tracks',
      'To manage hardware register swapping context during process preemption',
      'To detect and optimize deadlocks inside the instruction pipeline cache'
    ],
    correct_answer_index: 0,
    difficulty: 'hard',
    explanation: 'The TLB is a high-speed hardware cache inside the MMU that stores recent page table translations, reducing memory lookups from two cycles to one.'
  },
  {
    question_id: 'q20',
    topic: 'Java',
    sub_topic: 'Generics',
    question: 'What is Type Erasure in Java Generics?',
    options: [
      'The process where the compiler removes all generic type parameter parameters at compile-time',
      'A runtime error that occurs when an incorrect object class is cast dynamically',
      'An optimization step that turns all generic lists into native primitive arrays',
      'The structural garbage collection mechanism that clears unused type definitions'
    ],
    correct_answer_index: 0,
    difficulty: 'hard',
    explanation: 'Java uses Type Erasure to ensure backward compatibility. The compiler replaces generic type parameters with their bounds (or Object) and drops the generic signatures during compilation into bytecode.'
  }
];

const LOCAL_STORAGE_KEY = 'kg_detection_mock_db';

interface StorageSchema {
  user: User | null;
  currentPlan: { text: string; topics: Topic[]; attachments: any[] } | null;
  knowledgeGraphId: string | null;
  topicMasteries: Record<string, { progress: number; priority: 'low' | 'medium' | 'high' }>;
  questions: QuizQuestion[];
  quizAttempts: any[];
  usageCount: Record<string, number>;
}

class MockDB {
  private data: StorageSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): StorageSchema {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse local storage, resetting db', e);
      }
    }
    const defaultDb: StorageSchema = {
      user: null,
      currentPlan: null,
      knowledgeGraphId: null,
      topicMasteries: {},
      questions: INITIAL_QUESTIONS,
      quizAttempts: [],
      usageCount: INITIAL_QUESTIONS.reduce((acc, q) => ({ ...acc, [q.question_id]: Math.floor(Math.random() * 50) + 10 }), {})
    };
    this.saveData(defaultDb);
    return defaultDb;
  }

  private saveData(db: StorageSchema) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db));
  }

  public get(): StorageSchema {
    return this.data;
  }

  public update(updater: (db: StorageSchema) => void) {
    updater(this.data);
    this.saveData(this.data);
  }

  public reset() {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    this.data = this.load();
  }
}

export const mockDb = new MockDB();
export const mockDelay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));