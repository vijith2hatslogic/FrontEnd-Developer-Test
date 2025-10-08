import { Task } from './storage';

// Task templates by tech stack
interface TaskTemplate {
  [key: string]: Task[];
}

export const taskTemplates: TaskTemplate = {
  'HTML': [
    {
      type: 'ui-implementation',
      title: 'Create a Modern Blog Layout',
      description: 'Create a semantic HTML structure for a modern blog post page that includes a sticky header with navigation, featured image, author info with avatar, main content with article, interactive sidebar with related posts, newsletter signup form, and a responsive footer. Use appropriate HTML5 semantic elements and ensure the structure is accessible.',
      timeAllotted: 35,
      designImageUrl: '/task-images/blog-layout.png',
    },
    {
      type: 'coding',
      title: 'Build an Advanced Registration Form',
      description: 'Create a multi-step registration form with fields for personal info, account details, and preferences. Implement HTML5 form validation attributes, password strength indicator, and custom error messages. The form should have progress indicators and allow users to navigate between steps.',
      timeAllotted: 30,
      codeSnippet: `<!-- Create your multi-step form structure here -->
<!-- Step 1: Personal Information -->
<!-- Step 2: Account Details -->
<!-- Step 3: Preferences -->
<!-- Navigation controls and progress indicator -->`,
      expectedOutput: 'A multi-step form with validation, progress tracking, and smooth navigation between steps.',
    },
  ],
  'CSS': [
    {
      type: 'ui-implementation',
      title: 'Interactive Product Card Gallery',
      description: 'Create a responsive grid of product cards with hover effects, animations, and interactive elements. Cards should display 3 per row on desktop, 2 on tablet, and 1 on mobile. Each card should feature an image with overlay effects, pricing with discount badge, star ratings, and animated "Add to Cart" button. Implement a quick-view modal that appears when clicking on a product.',
      timeAllotted: 45,
      designImageUrl: '/task-images/product-cards.png',
    },
    {
      type: 'debugging',
      title: 'Fix Advanced CSS Layout Issues',
      description: 'The provided CSS has layout issues with CSS Grid, Flexbox, and responsive design. Identify and fix the problems to match the expected design. Pay special attention to the nested grid areas, overflow issues, and responsive breakpoints.',
      timeAllotted: 35,
      codeSnippet: `.dashboard-layout {
  display: grid;
  grid-template-columns: 250px 1fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas: 
    "header header"
    "sidebar main"
    "footer footer";
  height: 100vh;
}

.header {
  grid-area: header;
  position: sticky;
  top: 0;
  z-index: 10;
}

.sidebar {
  grid-area: sidebar;
  width: 300px; /* This is causing an issue */
  overflow-y: scroll;
}

.main-content {
  grid-area: main;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  padding: 20px;
}

.card {
  flex: 1 0 300px; /* This is causing an issue */
  max-width: calc(33% - 20px); /* This needs adjustment */
}

.footer {
  grid-area: footer;
}

@media (max-width: 768px) {
  .dashboard-layout {
    grid-template-columns: 1fr; /* This needs adjustment */
    grid-template-areas: 
      "header"
      "main"
      "footer"; /* Sidebar is missing */
  }
  
  .card {
    max-width: 100%; /* This needs adjustment for tablet view */
  }
}`,
    },
    {
      type: 'ui-implementation',
      title: 'Accessible Dark Mode Toggle',
      description: 'Create a theme switcher that toggles between light and dark mode with smooth transitions. The toggle should be fully accessible, work with keyboard navigation, and respect user system preferences. Implement proper ARIA attributes and focus states. The toggle should persist user preference using localStorage.',
      timeAllotted: 30,
      designImageUrl: '/task-images/theme-toggle.png',
    },
  ],
  'JavaScript': [
    {
      type: 'coding',
      title: 'Build a Kanban Board with Drag-and-Drop',
      description: 'Create an interactive Kanban board with three columns (Todo, In Progress, Done). Implement drag-and-drop functionality to move tasks between columns, ability to add new tasks, edit task details, and delete tasks. Include task prioritization with color coding and persistence using localStorage.',
      timeAllotted: 50,
      codeSnippet: `// HTML structure is provided
// <div id="kanban-board">
//   <div class="column" id="todo">
//     <h2>Todo</h2>
//     <div class="task-container" data-column="todo"></div>
//     <button class="add-task-btn" data-column="todo">+ Add Task</button>
//   </div>
//   <div class="column" id="in-progress">
//     <h2>In Progress</h2>
//     <div class="task-container" data-column="in-progress"></div>
//     <button class="add-task-btn" data-column="in-progress">+ Add Task</button>
//   </div>
//   <div class="column" id="done">
//     <h2>Done</h2>
//     <div class="task-container" data-column="done"></div>
//     <button class="add-task-btn" data-column="done">+ Add Task</button>
//   </div>
// </div>

// Write a function called processInput that takes a command string and returns the result
// Example: processInput("addTask:todo:Buy groceries") should add a task and return "Task added"
// Commands:
// - addTask:[column]:[title] - Add a task to a column
// - moveTask:[taskId]:[targetColumn] - Move a task to another column
// - deleteTask:[taskId] - Delete a task
// - getTasks - Return all tasks as a JSON string

function processInput(input) {
  // Your implementation here
}
`,
      expectedOutput: 'A functional Kanban board with drag-and-drop functionality, task management, and data persistence.',
      requiresJavaScript: true,
      testCases: [
        {
          input: 'addTask:todo:Buy groceries',
          expectedOutput: 'Task added',
          description: 'Adding a task to the todo column'
        },
        {
          input: 'addTask:in-progress:Implement drag-and-drop',
          expectedOutput: 'Task added',
          description: 'Adding a task to the in-progress column'
        },
        {
          input: 'getTasks',
          expectedOutput: 'success',
          description: 'Getting all tasks'
        },
        {
          input: 'moveTask:1:done',
          expectedOutput: 'Task moved',
          description: 'Moving a task to the done column'
        }
      ],
    },
    {
      type: 'debugging',
      title: 'Fix the Async Data Fetching',
      description: 'The provided code attempts to fetch data from multiple APIs and combine the results, but has issues with async/await, error handling, and race conditions. Identify and fix the problems.',
      timeAllotted: 35,
      codeSnippet: `// This function fetches user data and their posts
async function getUserWithPosts(userId) {
  const userData = fetch(\`https://jsonplaceholder.typicode.com/users/\${userId}\`)
    .then(response => response.json());
  
  const userPosts = fetch(\`https://jsonplaceholder.typicode.com/posts?userId=\${userId}\`)
    .then(response => response.json());
  
  // Combine user data with their posts
  const result = {
    user: userData,
    posts: userPosts
  };
  
  // Add analytics data
  try {
    const analytics = await fetch(\`https://jsonplaceholder.typicode.com/todos?userId=\${userId}\`)
      .then(response => response.json());
    result.analytics = analytics;
  } catch(error) {
    console.log('Error fetching analytics');
  }
  
  return result;
}

// Usage:
getUserWithPosts(1).then(data => {
  console.log('User:', data.user.name);
  console.log('Number of posts:', data.posts.length);
  console.log('Analytics items:', data.analytics.length);
}).catch(error => {
  console.error('Failed to fetch data:', error);
});`,
    },
    {
      type: 'thought-process',
      title: 'Optimize a JavaScript Application',
      description: 'Analyze the provided code snippet of a JavaScript application that has performance issues. Identify bottlenecks, potential memory leaks, and optimization opportunities. Explain your thought process for diagnosing the issues and propose specific solutions with code examples.',
      timeAllotted: 40,
      codeSnippet: `// Product catalog application with performance issues
const products = [];
const cart = [];
const eventListeners = [];

// Load products from API
function loadProducts() {
  fetch('https://api.example.com/products')
    .then(response => response.json())
    .then(data => {
      products.push(...data);
      renderProducts();
    });
}

// Render all products to the DOM
function renderProducts() {
  const container = document.getElementById('product-container');
  container.innerHTML = '';
  
  // Example code for creating product cards (not actually executed)
  // This is just for demonstration purposes
  /*
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const element = document.createElement('div');
    element.className = 'product-card';
    element.innerHTML = 
      '<img src="' + product.image + '" alt="' + product.name + '">' +
      '<h3>' + product.name + '</h3>' +
      '<p>' + product.description + '</p>' +
      '<p class="price">$' + product.price + '</p>' +
      '<button class="add-to-cart" data-id="' + product.id + '">Add to Cart</button>';
    
    container.appendChild(element);
    
    // Add event listener
    const button = element.querySelector('.add-to-cart');
    const handler = function() {
      addToCart(product.id);
    };
    button.addEventListener('click', handler);
    eventListeners.push({ element: button, handler });
  }
  */
  }
}

// Filter products by category
function filterByCategory(category) {
  const container = document.getElementById('product-container');
  container.innerHTML = '';
  
  const filtered = products.filter(p => p.category === category);
  
  for (let i = 0; i < filtered.length; i++) {
    // Similar rendering code as above...
    // This creates duplicate code and event listeners
  }
  
  updateCartTotal();
}

// Add product to cart
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (product) {
    cart.push({ ...product, quantity: 1 });
    updateCartTotal();
    renderCart();
  }
}

// Update cart total
function updateCartTotal() {
  let total = 0;
  for (let i = 0; i < cart.length; i++) {
    total += cart[i].price * cart[i].quantity;
  }
  
  document.querySelectorAll('.cart-total').forEach(el => {
    el.textContent = '$' + total.toFixed(2);
  });
}

// Initialize app
window.onload = function() {
  loadProducts();
  
  // Set up search
  document.getElementById('search').addEventListener('input', function(e) {
    const query = e.target.value.toLowerCase();
    const filtered = products.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.description.toLowerCase().includes(query)
    );
    
    // This resets the entire product container on each keystroke
    const container = document.getElementById('product-container');
    container.innerHTML = '';
    
    for (let i = 0; i < filtered.length; i++) {
      // More duplicate rendering code...
    }
  });
};`,
    },
  ],
  'TypeScript': [
    {
      type: 'coding',
      title: 'Build a State Management System',
      description: 'Implement a type-safe state management system in TypeScript similar to Redux but with strong typing throughout. Create a store with actions, reducers, selectors, and middleware support. Include features for async actions, immutable updates, and devtools integration.',
      timeAllotted: 55,
      codeSnippet: `// Define your types and implement the state management system
// You'll need to create:
// 1. Store type and creation function
// 2. Action creators and types
// 3. Reducer with proper typing
// 4. Middleware support
// 5. Selector functions

// Example state shape to implement:
interface AppState {
  users: {
    data: User[];
    loading: boolean;
    error: string | null;
  };
  products: {
    data: Product[];
    selected: Product | null;
    loading: boolean;
  };
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  inventory: number;
}

// Your implementation here
`,
      expectedOutput: 'A type-safe state management system with actions, reducers, selectors, and middleware support.',
    },
    {
      type: 'debugging',
      title: 'Fix Advanced TypeScript Type Errors',
      description: 'The provided TypeScript code has complex type errors involving generics, conditional types, and type inference. Identify and fix the issues while maintaining the functionality and improving type safety.',
      timeAllotted: 40,
      codeSnippet: `// Generic data fetcher with type issues
type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

interface RequestState<T> {
  data: T | null;
  status: FetchStatus;
  error: string | null;
}

// This utility is supposed to create a type-safe API but has issues
function createApi<T extends Record<string, any>>(baseUrl: string) {
  const endpoints = {} as T;
  
  // This should add type-safe endpoints but has issues
  function addEndpoint<K extends keyof T, R>(
    key: K, 
    path: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'
  ): void {
    endpoints[key] = async (data?: any): Promise<R> => {
      const url = \`\${baseUrl}\${path}\`;
      const options: RequestInit = { method };
      
      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
        options.headers = {
          'Content-Type': 'application/json'
        };
      }
      
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(\`API Error: \${response.status}\`);
      return response.json();
    };
  }
  
  return {
    endpoints,
    addEndpoint
  };
}

// Usage with type errors
interface UserEndpoints {
  getUser: (id: number) => Promise<User>;
  updateUser: (user: User) => Promise<User>;
  searchUsers: (query: string) => Promise<User[]>;
}

interface User {
  id: number;
  name: string;
  email: string;
}

const api = createApi<UserEndpoints>('https://api.example.com');

// These calls have type issues
api.addEndpoint('getUser', '/users/:id', 'GET');
api.addEndpoint('updateUser', '/users/:id', 'PUT');
api.addEndpoint('searchUsers', '/users/search', 'GET');

// This usage has type issues
async function fetchUserData(id: number) {
  const user = await api.endpoints.getUser(id);
  const similarUsers = await api.endpoints.searchUsers(user.name);
  
  user.lastLogin = new Date(); // Type error: adding property to User
  return { user, similarUsers };
}`,
    },
    {
      type: 'thought-process',
      title: 'Design a Type-Safe Component Library',
      description: 'Design a comprehensive type-safe component library in TypeScript for a React application. Consider component composition, prop typing, theme customization, accessibility, and documentation. Explain your architectural decisions, type system design, and how you would handle edge cases.',
      timeAllotted: 45,
      codeSnippet: `// Example component with basic typing to improve upon
import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

function Button({ 
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onClick,
  children 
}: ButtonProps) {
  return (
    <button
      className={\`btn btn-\${variant} btn-\${size}\`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// How would you extend this to create a complete design system?
// Consider:
// - Theme typing and customization
// - Component composition
// - Prop inheritance and overrides
// - Accessibility props
// - Event handling with proper types
// - Responsive variants
// - Integration with styling solutions`,
    },
  ],
  'React': [
    {
      type: 'coding',
      title: 'Build a Dynamic Form Generator',
      description: 'Create a React component that dynamically generates forms based on a JSON schema. The form should support various input types (text, number, select, checkbox, radio, date), field validation, conditional fields, and form submission handling. Implement proper accessibility attributes and error handling.',
      timeAllotted: 50,
      codeSnippet: `import React from 'react';

// Sample schema to implement
const formSchema = {
  title: "User Registration",
  fields: [
    {
      id: "name",
      label: "Full Name",
      type: "text",
      required: true,
      validation: {
        minLength: 2,
        maxLength: 50
      }
    },
    {
      id: "email",
      label: "Email Address",
      type: "email",
      required: true,
      validation: {
        pattern: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$"
      }
    },
    {
      id: "age",
      label: "Age",
      type: "number",
      required: true,
      validation: {
        min: 18,
        max: 120
      }
    },
    {
      id: "role",
      label: "Role",
      type: "select",
      options: [
        { value: "user", label: "User" },
        { value: "admin", label: "Administrator" },
        { value: "editor", label: "Editor" }
      ],
      required: true
    },
    {
      id: "notifications",
      label: "Notification Preferences",
      type: "checkbox-group",
      options: [
        { value: "email", label: "Email" },
        { value: "sms", label: "SMS" },
        { value: "push", label: "Push Notifications" }
      ],
      required: false
    },
    {
      id: "adminAccess",
      label: "Admin Access Level",
      type: "radio-group",
      options: [
        { value: "full", label: "Full Access" },
        { value: "limited", label: "Limited Access" },
        { value: "readonly", label: "Read Only" }
      ],
      required: true,
      conditional: {
        field: "role",
        value: "admin"
      }
    }
  ]
};

// Implement your FormGenerator component here
interface FormGeneratorProps {
  schema: any;
  onSubmit: (values: any) => void;
}

export default function FormGenerator({ schema, onSubmit }: FormGeneratorProps) {
  // Your implementation here
}`,
      expectedOutput: 'A dynamic form generator that renders forms based on JSON schema with validation and conditional fields.',
    },
    {
      type: 'debugging',
      title: 'Fix Performance Issues in a React App',
      description: 'The provided React component has performance issues with unnecessary re-renders, inefficient data fetching, and memory leaks. Identify and fix the problems using React best practices like memoization, proper dependency arrays, and cleanup functions.',
      timeAllotted: 45,
      codeSnippet: `import React, { useState, useEffect } from 'react';

// This component has performance issues
function ProductDashboard({ categoryId }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filters, setFilters] = useState({
    inStock: false,
    onSale: false,
    price: { min: 0, max: 1000 }
  });
  
  // Fetch products when category changes
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      const response = await fetch(\`/api/categories/\${categoryId}/products\`);
      const data = await response.json();
      setProducts(data);
      setLoading(false);
    }
    
    fetchProducts();
    
    // Set up polling for updates
    const interval = setInterval(() => {
      fetchProducts();
    }, 5000);
  }, [categoryId, filters]); // This dependency array is problematic
  
  // Example code for filtering and sorting products (not actually executed)
  // This is just for demonstration purposes
  /*
  const filteredProducts = products.filter(product => {
    return (
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filters.inStock ? product.inStock : true) &&
      (filters.onSale ? product.onSale : true) &&
      product.price >= filters.price.min &&
      product.price <= filters.price.max
    );
  }).sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'price') {
      return a.price - b.price;
    }
    return 0;
  });
  */
  const filteredProducts = [];
  
  // This creates a new function on every render
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // This creates a new function on every render
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };
  
  // This creates a new function on every render
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Example of a component that re-renders unnecessarily (not actually executed)
  // This is just for demonstration purposes
  // Simplified component for demonstration
  const ProductCard = () => <div>Product Card Component</div>;
  
  return (
    <div className="product-dashboard">
      <div className="filters">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={handleSearch}
        />
        
        <select value={sortBy} onChange={handleSortChange}>
          <option value="name">Sort by Name</option>
          <option value="price">Sort by Price</option>
        </select>
        
        <label>
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={(e) => handleFilterChange('inStock', e.target.checked)}
          />
          In Stock Only
        </label>
        
        <label>
          <input
            type="checkbox"
            checked={filters.onSale}
            onChange={(e) => handleFilterChange('onSale', e.target.checked)}
          />
          On Sale
        </label>
      </div>
      
      {loading ? (
        <p>Loading products...</p>
      ) : (
        <div className="product-grid">
          {/* Example of rendering product cards */}
            <ProductCard />
            <ProductCard />
            <ProductCard />
        </div>
      )}
    </div>
  );
}

export default ProductDashboard;`,
    },
    {
      type: 'ui-implementation',
      title: 'Build an Interactive Data Dashboard',
      description: 'Create a React dashboard that displays data visualizations with interactive filters. The dashboard should include a line chart showing trends over time, a pie chart showing distribution, and a data table with sorting and filtering capabilities. Implement responsive design, accessibility features, and smooth transitions between views.',
      timeAllotted: 60,
      designImageUrl: '/task-images/data-dashboard.png',
      codeSnippet: `import React from 'react';

// Sample data to work with
const salesData = [
  { month: 'Jan', revenue: 5000, profit: 1000, category: 'Electronics' },
  { month: 'Feb', revenue: 6200, profit: 1200, category: 'Electronics' },
  { month: 'Mar', revenue: 7800, profit: 1600, category: 'Electronics' },
  { month: 'Apr', revenue: 7200, profit: 1400, category: 'Electronics' },
  { month: 'May', revenue: 8400, profit: 1800, category: 'Electronics' },
  { month: 'Jan', revenue: 3000, profit: 800, category: 'Clothing' },
  { month: 'Feb', revenue: 3200, profit: 900, category: 'Clothing' },
  { month: 'Mar', revenue: 4100, profit: 1200, category: 'Clothing' },
  { month: 'Apr', revenue: 4900, profit: 1500, category: 'Clothing' },
  { month: 'May', revenue: 5600, profit: 1700, category: 'Clothing' },
  { month: 'Jan', revenue: 1800, profit: 400, category: 'Food' },
  { month: 'Feb', revenue: 2200, profit: 500, category: 'Food' },
  { month: 'Mar', revenue: 2700, profit: 600, category: 'Food' },
  { month: 'Apr', revenue: 3200, profit: 700, category: 'Food' },
  { month: 'May', revenue: 3800, profit: 900, category: 'Food' },
];

// Implement your Dashboard component here
export default function Dashboard() {
  // Your implementation here
}`,
    },
  ],
  'Vue': [
    {
      type: 'coding',
      title: 'Build a Vue 3 Composition API E-commerce Cart',
      description: 'Create a Vue 3 shopping cart component using the Composition API with TypeScript. Implement features like adding/removing items, quantity adjustments, price calculations with discounts, and cart persistence using localStorage. Use Vue\'s reactivity system effectively and implement proper state management.',
      timeAllotted: 50,
      codeSnippet: `<template>
  <!-- Implement your shopping cart UI here -->
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted } from 'vue';

// Product interface
interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
  inventory: number;
}

// Cart item interface
interface CartItem {
  product: Product;
  quantity: number;
}

// Sample products data
const availableProducts: Product[] = [
  {
    id: 1,
    name: "Wireless Headphones",
    price: 99.99,
    image: "https://example.com/headphones.jpg",
    description: "Premium wireless headphones with noise cancellation",
    inventory: 10
  },
  {
    id: 2,
    name: "Smartphone",
    price: 699.99,
    image: "https://example.com/smartphone.jpg",
    description: "Latest model with high-resolution camera",
    inventory: 5
  },
  {
    id: 3,
    name: "Laptop",
    price: 1299.99,
    image: "https://example.com/laptop.jpg",
    description: "Powerful laptop for professionals",
    inventory: 3
  }
];

export default defineComponent({
  name: 'ShoppingCart',
  setup() {
    // Implement your composition API logic here
    
    return {
      // Return your reactive state and methods here
    };
  }
});
</script>

<style scoped>
/* Your styles here */
</style>`,
      expectedOutput: 'A functional Vue 3 shopping cart with Composition API, TypeScript, and proper state management.',
    },
    {
      type: 'debugging',
      title: 'Fix Vue 3 Component Communication Issues',
      description: 'The provided Vue 3 application has issues with component communication, reactivity, and lifecycle hooks. Identify and fix the problems while maintaining the functionality and improving performance.',
      timeAllotted: 40,
      codeSnippet: `// Parent component with issues
<template>
  <div class="dashboard">
    <h1>User Dashboard</h1>
    
    <user-profile 
      :user="currentUser" 
      @update:user="updateUser"
    />
    
    <activity-feed 
      :activities="userActivities" 
      :loading="loading"
    />
    
    <settings-panel 
      :settings="userSettings"
      @update:settings="settings => userSettings = settings"
    />
  </div>
</template>

<script>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import UserProfile from './UserProfile.vue';
import ActivityFeed from './ActivityFeed.vue';
import SettingsPanel from './SettingsPanel.vue';

export default {
  components: {
    UserProfile,
    ActivityFeed,
    SettingsPanel
  },
  setup() {
    // User state with reactivity issues
    const currentUser = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin'
    };
    
    // Settings with update issues
    const userSettings = ref({
      notifications: true,
      theme: 'light',
      language: 'en'
    });
    
    // Activities with loading state issues
    const userActivities = ref([]);
    const loading = ref(false);
    
    // This watch has dependency tracking issues
    watch(currentUser, (newUser) => {
      fetchUserActivities(newUser.id);
    });
    
    // This fetch method has issues with loading state
    const fetchUserActivities = async (userId) => {
      loading.value = true;
      
      try {
        // Simulated API call
        const response = await fetch(\`/api/users/\${userId}/activities\`);
        const data = await response.json();
        userActivities = data; // This assignment is problematic
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      }
      
      loading.value = false;
    };
    
    // This update method doesn't properly handle reactivity
    const updateUser = (updatedUser) => {
      Object.assign(currentUser, updatedUser);
      
      // Save to API - this should be awaited properly
      fetch(\`/api/users/\${currentUser.id}\`, {
        method: 'PUT',
        body: JSON.stringify(currentUser)
      });
    };
    
    onMounted(() => {
      fetchUserActivities(currentUser.id);
    });
    
    return {
      currentUser,
      userSettings,
      userActivities,
      loading,
      updateUser
    };
  }
}
</script>

// Child component with issues
<template>
  <div class="user-profile">
    <h2>{{ user.name }}</h2>
    <p>{{ user.email }}</p>
    
    <button @click="editMode = !editMode">
      {{ editMode ? 'Cancel' : 'Edit Profile' }}
    </button>
    
    <form v-if="editMode" @submit.prevent="saveChanges">
      <input v-model="localUser.name" placeholder="Name" />
      <input v-model="localUser.email" placeholder="Email" />
      <button type="submit">Save Changes</button>
    </form>
  </div>
</template>

<script>
import { ref, reactive, toRefs, watch } from 'vue';

export default {
  props: {
    user: {
      type: Object,
      required: true
    }
  },
  emits: ['update:user'],
  setup(props, { emit }) {
    const editMode = ref(false);
    
    // This local copy has reactivity issues
    const localUser = { ...props.user };
    
    // This watch doesn't properly sync when props change
    watch(props.user, (newUser) => {
      localUser.name = newUser.name;
      localUser.email = newUser.email;
    });
    
    // This save method doesn't properly emit updates
    const saveChanges = () => {
      emit('update:user', localUser);
      editMode.value = false;
    };
    
    return {
      editMode,
      localUser,
      saveChanges
    };
  }
}
</script>`,
    },
    {
      type: 'thought-process',
      title: 'Design a Vue 3 State Management Solution',
      description: 'Design a custom state management solution for a large-scale Vue 3 application that handles complex data flows, asynchronous operations, and persists state. Compare your approach with existing solutions like Pinia and Vuex, explaining the trade-offs and benefits. Provide code examples to illustrate your design decisions.',
      timeAllotted: 45,
      codeSnippet: `// Consider this application structure:
// - User authentication
// - Product catalog with filtering and search
// - Shopping cart with checkout flow
// - User preferences and settings
// - Real-time notifications

// Design a state management solution that addresses:
// 1. Performance optimization for large state trees
// 2. Type safety with TypeScript
// 3. Devtools integration
// 4. Testing strategies
// 5. Code splitting and lazy loading
// 6. Handling of side effects
// 7. State persistence and rehydration

// Provide a sample implementation of your core state management logic
`,
    },
  ],
  'Next.js': [
    {
      type: 'coding',
      title: 'Build a Full-Stack Next.js E-commerce Product Page',
      description: 'Create a full-stack Next.js App Router product detail page with server components, client components, and data fetching. Implement features like image gallery with zoom, product variants selection, reviews with pagination, related products, and add-to-cart functionality with optimistic UI updates. Use proper error handling, loading states, and SEO optimization.',
      timeAllotted: 60,
      codeSnippet: `// app/products/[slug]/page.tsx
// Implement the product detail page with both server and client components

// Sample product data structure
interface ProductVariant {
  id: string;
  color: string;
  size: string;
  price: number;
  compareAtPrice?: number;
  inventory: number;
  imageUrls: string[];
}

interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  features: string[];
  category: string;
  brand: string;
  variants: ProductVariant[];
  reviews: {
    id: string;
    rating: number;
    author: string;
    date: string;
    title: string;
    content: string;
  }[];
  relatedProducts: {
    id: string;
    slug: string;
    name: string;
    price: number;
    imageUrl: string;
  }[];
}

// Implement your solution here`,
      expectedOutput: 'A full-stack Next.js product detail page with server and client components, data fetching, and interactive features.',
    },
    {
      type: 'debugging',
      title: 'Fix Next.js Data Fetching and Caching Issues',
      description: 'The provided Next.js application has issues with data fetching, caching, and server/client component boundaries. Identify and fix the problems while improving performance and user experience.',
      timeAllotted: 45,
      codeSnippet: `// app/dashboard/page.tsx - Server Component with issues
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import UserGreeting from './UserGreeting';
import RecentOrders from './RecentOrders';
import Analytics from './Analytics';
import RecommendedProducts from './RecommendedProducts';

async function getUser() {
  const token = cookies().get('auth_token')?.value;
  
  if (!token) {
    return null;
  }
  
  // This fetch has caching issues
  const res = await fetch('https://api.example.com/user/profile', {
    headers: {
      'Authorization': \`Bearer \${token}\`
    }
  });
  
  if (!res.ok) return null;
  return res.json();
}

export default async function DashboardPage() {
  const user = await getUser();
  
  if (!user) {
    // This redirect has issues
    window.location.href = '/login';
    return null;
  }
  
  return (
    <div className="dashboard">
      <UserGreeting user={user} />
      
      <div className="dashboard-content">
        <Suspense fallback={<p>Loading orders...</p>}>
          <RecentOrders userId={user.id} />
        </Suspense>
        
        <Analytics userId={user.id} />
        
        <Suspense fallback={<p>Loading recommendations...</p>}>
          <RecommendedProducts userId={user.id} />
        </Suspense>
      </div>
    </div>
  );
}

// RecentOrders.tsx - Component with data fetching issues
'use client';

import { useState, useEffect } from 'react';

export default function RecentOrders({ userId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // This fetch approach has issues
  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch(\`/api/orders?userId=\${userId}\`);
        const data = await res.json();
        setOrders(data);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchOrders();
  }, [userId]);
  
  if (loading) {
    return <p>Loading orders...</p>;
  }
  
  return (
    <div className="recent-orders">
      <h2>Recent Orders</h2>
      {orders.length === 0 ? (
        <p>No recent orders found.</p>
      ) : (
        <ul>
          {/* Example of rendering orders */}
            <li>Order #1234 - 2023-10-07 - $99.99</li>
            <li>Order #5678 - 2023-10-05 - $149.99</li>
        </ul>
      )}
    </div>
  );
}

// RecommendedProducts.tsx - Server component with client interactions
import { cookies } from 'next/headers';

async function getRecommendations(userId) {
  // This fetch has revalidation issues
  const res = await fetch(\`https://api.example.com/recommendations?userId=\${userId}\`, {
    next: { revalidate: 3600 }
  });
  
  if (!res.ok) return [];
  return res.json();
}

export default async function RecommendedProducts({ userId }) {
  const products = await getRecommendations(userId);
  
  // This client-side interaction in a server component has issues
  const handleAddToCart = async (productId) => {
    const token = cookies().get('auth_token')?.value;
    
    await fetch('/api/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${token}\`
      },
      body: JSON.stringify({ productId, quantity: 1 })
    });
    
    alert('Product added to cart!');
  };
  
  return (
    <div className="recommended-products">
      <h2>Recommended For You</h2>
      <div className="product-grid">
        {/* Example of rendering product cards */}
          <div className="product-card">
            <img src="/images/headphones.jpg" alt="Wireless Headphones" />
            <h3>Wireless Headphones</h3>
            <p>$99.99</p>
            <button>Add to Cart</button>
          </div>
          <div className="product-card">
            <img src="/images/smartphone.jpg" alt="Smartphone" />
            <h3>Smartphone</h3>
            <p>$699.99</p>
            <button>Add to Cart</button>
          </div>
      </div>
    </div>
  );
}`,
    },
    {
      type: 'thought-process',
      title: 'Design a Next.js Architecture for a Global SaaS Application',
      description: 'Design the architecture for a Next.js-based SaaS application that needs to serve users globally with high performance, SEO requirements, and complex authentication flows. Consider rendering strategies, data fetching patterns, internationalization, deployment strategies, and performance optimizations. Explain your reasoning for each architectural decision.',
      timeAllotted: 45,
      codeSnippet: `// Consider these requirements:
// 1. The application needs to support multiple languages and regions
// 2. Authentication with role-based permissions and SSO options
// 3. Real-time collaborative features in certain sections
// 4. Dashboard with complex data visualizations
// 5. Public marketing pages with strong SEO requirements
// 6. User-generated content that needs moderation
// 7. Payment processing with multiple providers
// 8. Must comply with GDPR, CCPA, and other regional regulations
// 9. Needs to work in regions with poor internet connectivity
// 10. Must support both desktop and mobile experiences

// Design an architecture addressing:
// - Project structure and organization
// - Rendering strategy for different page types
// - Data fetching and caching approach
// - State management solution
// - Authentication and authorization flow
// - Performance optimization strategy
// - Deployment and hosting architecture
// - Monitoring and error handling
`,
    },
  ],
  'Tailwind CSS': [
    {
      type: 'ui-implementation',
      title: 'Build a Modern Dashboard UI with Tailwind CSS',
      description: 'Create a responsive dashboard interface using Tailwind CSS with a sidebar navigation, stats cards, data tables, and charts. The dashboard should include dark/light mode toggle, responsive layout for mobile and desktop, and interactive elements with hover/focus states. Use Tailwind\'s utility classes effectively and implement proper accessibility.',
      timeAllotted: 60,
      designImageUrl: '/task-images/dashboard-ui.png',
    },
    {
      type: 'coding',
      title: 'Implement an Advanced Form with Tailwind CSS',
      description: 'Create a multi-step form with validation using Tailwind CSS. The form should include various input types, custom checkboxes and radio buttons, dropdown menus with search functionality, file uploads with preview, and progress indicators. Implement proper form validation with error states and success messages.',
      timeAllotted: 45,
      codeSnippet: `<!-- Implement your multi-step form with Tailwind CSS classes -->
<div class="max-w-4xl mx-auto">
  <!-- Step indicators -->
  <div class="mb-8">
    <!-- Implement step indicators here -->
  </div>
  
  <!-- Form container -->
  <div class="bg-white rounded-lg shadow-lg p-6">
    <!-- Step 1: Personal Information -->
    <div id="step-1">
      <!-- Implement personal information form fields -->
    </div>
    
    <!-- Step 2: Account Details -->
    <div id="step-2" class="hidden">
      <!-- Implement account details form fields -->
    </div>
    
    <!-- Step 3: Preferences -->
    <div id="step-3" class="hidden">
      <!-- Implement preferences form fields -->
    </div>
    
    <!-- Navigation buttons -->
    <div class="flex justify-between mt-8">
      <!-- Implement back/next/submit buttons -->
    </div>
  </div>
</div>`,
      expectedOutput: 'A functional multi-step form with validation, custom form elements, and smooth navigation between steps.',
    },
    {
      type: 'ui-implementation',
      title: 'Create an Accessible E-commerce Product Page',
      description: 'Build a fully accessible e-commerce product page using Tailwind CSS. The page should include a product image gallery with thumbnails, product details, variant selectors (size, color), quantity picker, add-to-cart functionality, product tabs (description, specifications, reviews), and related products carousel. Focus on accessibility features like proper ARIA attributes, keyboard navigation, and screen reader support.',
      timeAllotted: 50,
      designImageUrl: '/task-images/product-page.png',
    },
  ],
};

// Function to generate tasks based on selected tech stacks and experience level
export function generateTasksFromTechStacks(
  techStacks: string[],
  experienceLevel: string,
  totalTime: number = 180
): Task[] {
  if (!techStacks.length) return [];
  
  const tasks: Task[] = [];
  const timePerTech = Math.floor(totalTime / (techStacks.length + 1)); // Reserve time for a thought process task
  
  // Add tech-specific tasks
  techStacks.forEach(tech => {
    if (taskTemplates[tech] && taskTemplates[tech].length > 0) {
      // Select a task based on experience level
      let taskIndex = 0;
      if (experienceLevel.includes('Senior')) {
        // For senior developers, use more complex tasks (usually the second one if available)
        taskIndex = taskTemplates[tech].length > 1 ? 1 : 0;
      }
      
      const task = { ...taskTemplates[tech][taskIndex] };
      
      // Adjust time allotted based on experience level
      if (experienceLevel.includes('Junior')) {
        task.timeAllotted = Math.min(task.timeAllotted * 1.5, timePerTech); // More time for juniors
      } else if (experienceLevel.includes('Senior')) {
        task.timeAllotted = Math.max(task.timeAllotted * 0.8, 20); // Less time for seniors
      }
      
      tasks.push(task);
    }
  });
  
  // Always add a thought process task
  tasks.push({
    type: 'thought-process',
    title: 'System Design and Technical Decision Making',
    description: `Based on the tasks you've completed, provide a comprehensive analysis of your approach, architecture decisions, and trade-offs. Consider scalability, performance, maintainability, and accessibility. What design patterns did you apply and why? What technical debt did you identify, and how would you address it? How would you improve your solution with more time? If you were to implement this at scale for thousands of users, what would you change?`,
    timeAllotted: Math.min(40, totalTime * 0.25), // 25% of total time, max 40 minutes
  });
  
  return tasks;
}
