import type { QuizQuestion, User, Topic } from '../../core/types';

const INITIAL_QUESTIONS: QuizQuestion[] = [
  {
    question_id: 'q1',
    topic: 'Operating System',
    sub_topic: 'Syscall',
    question: 'How can a process switch from user mode to kernel mode?',
    options: [
      'Through a standard function call',
      'Using a software interrupt or trap',
      'By modifying the program counter directly',
      'By increasing the process priority'
    ],
    correct_answer_index: 1,
    difficulty: 'medium',
    explanation: 'A trap or software interrupt is the standard mechanism to switch CPU execution from user mode to privileged kernel mode for running system calls.'
  },
  {
    question_id: 'q2',
    topic: 'Operating System',
    sub_topic: 'PCB',
    question: 'What information is NOT typically stored in a Process Control Block (PCB)?',
    options: [
      'Process State',
      'Program Counter',
      'CPU Registers',
      'Global application cache size'
    ],
    correct_answer_index: 3,
    difficulty: 'easy',
    explanation: 'The PCB contains process-specific execution state, registers, memory limits, and schedule info, but not global application-level cache parameters.'
  },
  {
    question_id: 'q3',
    topic: 'Operating System',
    sub_topic: 'Scheduling',
    question: 'Which scheduling algorithm is designed to prevent starvation by dynamically adjusting priorities?',
    options: [
      'First-Come, First-Served (FCFS)',
      'Shortest Job First (SJF) without preemption',
      'Multilevel Feedback Queue (MLFQ)',
      'Round Robin (RR) with fixed quantum'
    ],
    correct_answer_index: 2,
    difficulty: 'hard',
    explanation: 'Multilevel Feedback Queue schedules jobs dynamically and boosts aging processes to higher priority queues to prevent starvation.'
  },
  {
    question_id: 'q4',
    topic: 'Java',
    sub_topic: 'JVM',
    question: 'Where are object instances stored in the Java Virtual Machine (JVM) memory model?',
    options: [
      'Stack memory',
      'Heap memory',
      'Method area',
      'Program Counter register'
    ],
    correct_answer_index: 1,
    difficulty: 'easy',
    explanation: 'In the JVM, all object instances and arrays are allocated on the Heap memory, which is shared among all threads.'
  },
  {
    question_id: 'q5',
    topic: 'Java',
    sub_topic: 'Concurrency',
    question: 'What is the primary difference between synchronized block and ReentrantLock in Java?',
    options: [
      'Synchronized blocks are faster and support fairness settings',
      'ReentrantLock offers advanced options like tryLock() and fair ordering',
      'Synchronized blocks can be locked across multiple methods',
      'ReentrantLock does not require manual unlocking'
    ],
    correct_answer_index: 1,
    difficulty: 'hard',
    explanation: 'ReentrantLock provides features like tryLock() (attempting lock without waiting), interruptible lock acquisition, and fair locks, but requires manual unlocking in a try-finally block.'
  },
  {
    question_id: 'q6',
    topic: 'Java',
    sub_topic: 'Collection',
    question: 'Which collection should be used when you need key-value pairs sorted by their keys?',
    options: [
      'HashMap',
      'LinkedHashMap',
      'TreeMap',
      'ConcurrentHashMap'
    ],
    correct_answer_index: 2,
    difficulty: 'medium',
    explanation: 'TreeMap is implemented using a Red-Black tree structure, which maintains keys in their natural sorted order or via a custom Comparator.'
  },
  {
    question_id: 'q7',
    topic: 'Database',
    sub_topic: 'Index',
    question: 'Why do relational databases primarily use B+ Trees instead of Hash indexes for table indexing?',
    options: [
      'B+ Trees are faster for exact matches',
      'B+ Trees support efficient range queries and inequality comparisons',
      'B+ Trees consume significantly less memory',
      'Hash indexes cannot prevent duplicate entries'
    ],
    correct_answer_index: 1,
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
      'Read Uncommitted',
      'Read Committed',
      'Repeatable Read',
      'Serializable'
    ],
    correct_answer_index: 2,
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
      'Serial GC',
      'Parallel GC',
      'G1 (Garbage First) GC',
      'CMS (Concurrent Mark Sweep) GC'
    ],
    correct_answer_index: 2,
    difficulty: 'medium',
    explanation: 'G1 GC divides the heap into equal-sized regions and performs incremental reclamation, providing low and predictable pause times for large heaps.'
  },
  {
    question_id: 'q12',
    topic: 'Java',
    sub_topic: 'Concurrency',
    question: 'What is the purpose of the volatile keyword in Java?',
    options: [
      'It locks the variable for single-thread write actions',
      'It forces threads to read/write variables directly from/to main memory, ensuring visibility',
      'It converts a variable into an atomic reference type',
      'It prevents variables from being garbage collected'
    ],
    correct_answer_index: 1,
    difficulty: 'medium',
    explanation: 'The volatile keyword ensures thread visibility by guaranteeing that updates to a variable are written directly back to main memory, and read directly from main memory.'
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
  usageCount: Record<string, number>; // counts how many times questions are taken/saved
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
