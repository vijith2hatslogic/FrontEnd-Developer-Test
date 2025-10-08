import { nanoid } from 'nanoid'
import { User, Test } from './storage'

// Sample user data
export const sampleUsers: User[] = [
  {
    id: 'user1',
    name: 'Demo User',
    email: 'demo@example.com',
    createdAt: new Date().toISOString(),
  }
]

// Sample test data
export const sampleTests: Test[] = [
  {
    id: 'test1',
    title: 'Front-end Developer Assessment',
    description: 'A comprehensive assessment for front-end developers covering HTML, CSS, JavaScript, and React.',
    experienceLevel: 'Mid-level (2-5 years)',
    techStacks: ['HTML', 'CSS', 'JavaScript', 'React'],
    totalTime: 180, // 3 hours
    tasks: [
      {
        type: 'coding',
        title: 'Build a Todo List Component',
        description: 'Create a simple todo list component with the ability to add, delete, and mark tasks as complete.',
        timeAllotted: 45,
        codeSnippet: `import React, { useState } from 'react';

function TodoList() {
  // Your code here
  
  return (
    <div>
      {/* Your implementation */}
    </div>
  );
}

export default TodoList;`,
        expectedOutput: 'A functional todo list component with the ability to add, delete, and mark tasks as complete.'
      },
      {
        type: 'ui-implementation',
        title: 'Implement a Responsive Navigation Bar',
        description: 'Create a responsive navigation bar that collapses into a hamburger menu on mobile devices.',
        timeAllotted: 45,
        designImageUrl: 'https://via.placeholder.com/800x200?text=Navigation+Bar+Design'
      },
      {
        type: 'debugging',
        title: 'Fix the Broken Counter',
        description: 'The following counter component has a bug. Find and fix it.',
        timeAllotted: 30,
        codeSnippet: `import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  const increment = () => {
    setCount(count + 1);
  };
  
  const decrement = () => {
    setCount(count - 1);
  };
  
  // This reset function doesn't work correctly
  const reset = () => {
    count = 0;
  };
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
      <button onClick={decrement}>Decrement</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}

export default Counter;`
      },
      {
        type: 'thought-process',
        title: 'Architecture Decision',
        description: 'Describe how you would architect a real-time chat application. Consider scalability, performance, and user experience.',
        timeAllotted: 30
      }
    ],
    createdAt: new Date().toISOString(),
    testUrl: 'demo123',
    createdBy: 'user1',
    submissions: []
  }
]

// Function to seed the local storage with initial data
export function seedLocalStorage() {
  if (typeof window === 'undefined') return
  
  // Check if data already exists
  const users = localStorage.getItem('users')
  const tests = localStorage.getItem('tests')
  
  // Only seed if data doesn't exist
  if (!users) {
    localStorage.setItem('users', JSON.stringify(sampleUsers))
    
    // Also add a demo password
    const passwords: Record<string, string> = {
      'user1': 'password123'
    }
    localStorage.setItem('passwords', JSON.stringify(passwords))
  }
  
  if (!tests) {
    localStorage.setItem('tests', JSON.stringify(sampleTests))
  }
}
