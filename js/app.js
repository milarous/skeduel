// Task management
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// DOM elements
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const taskCount = document.getElementById('task-count');
const clearCompletedBtn = document.getElementById('clear-completed');
const newTaskInput = document.getElementById('new-task-input');

// Initialize the application
function init() {
    applyTheme();
    renderTasks();
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Add task on Enter key
    newTaskInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            addTask();
        }
    });

    // Add task on input focus + Enter (for better UX)
    newTaskInput.addEventListener('focus', () => {
        newTaskInput.parentElement.classList.add('focused');
    });

    newTaskInput.addEventListener('blur', () => {
        newTaskInput.parentElement.classList.remove('focused');
    });
}

// Add a new task
function addTask() {
    const text = newTaskInput.value.trim();
    
    if (!text) {
        // Add visual feedback for empty input
        newTaskInput.style.borderColor = '#ef4444';
        setTimeout(() => {
            newTaskInput.style.borderColor = '';
        }, 1000);
        return;
    }

    // Check for duplicate tasks
    const isDuplicate = tasks.some(task => 
        task.text.toLowerCase() === text.toLowerCase()
    );

    if (isDuplicate) {
        alert('This task already exists!');
        return;
    }

    const newTask = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.unshift(newTask); // Add to beginning of array
    saveTasks();
    renderTasks();
    
    // Clear input and focus
    newTaskInput.value = '';
    newTaskInput.focus();

    // Add success animation
    const firstTask = taskList.querySelector('.task-item');
    if (firstTask) {
        firstTask.style.animation = 'none';
        firstTask.offsetHeight; // Trigger reflow
        firstTask.style.animation = 'fadeIn 0.3s ease';
    }
}

// Render all tasks
function renderTasks() {
    taskList.innerHTML = '';

    if (tasks.length === 0) {
        emptyState.classList.add('show');
        taskCount.textContent = '0 tasks';
        clearCompletedBtn.style.display = 'none';
        return;
    }

    emptyState.classList.remove('show');

    // Update task count
    const activeTasks = tasks.filter(task => !task.completed).length;
    const completedTasks = tasks.filter(task => task.completed).length;
    
    taskCount.textContent = `${activeTasks} active task${activeTasks !== 1 ? 's' : ''}`;
    
    // Show/hide clear completed button
    clearCompletedBtn.style.display = completedTasks > 0 ? 'block' : 'none';

    // Render each task
    tasks.forEach((task, index) => {
        const taskElement = createTaskElement(task, index);
        taskList.appendChild(taskElement);
    });
}

// Create a task element
function createTaskElement(task, index) {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.setAttribute('data-task-id', task.id);

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', `Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`);
    checkbox.onchange = () => toggleTask(task.id);

    // Task text
    const span = document.createElement('span');
    span.textContent = task.text;
    span.className = 'task-text';
    if (task.completed) {
        span.classList.add('completed');
    }

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.setAttribute('aria-label', `Delete task "${task.text}"`);
    deleteBtn.onclick = () => deleteTask(task.id);

    // Assemble the task item
    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(deleteBtn);

    return li;
}

// Toggle task completion
function toggleTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
}

// Delete a task
function deleteTask(taskId) {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    
    if (taskElement) {
        // Add delete animation
        taskElement.style.animation = 'fadeOut 0.3s ease';
        
        setTimeout(() => {
            tasks = tasks.filter(t => t.id !== taskId);
            saveTasks();
            renderTasks();
        }, 300);
    }
}

// Clear all completed tasks
function clearCompleted() {
    const completedTasks = tasks.filter(task => task.completed);
    
    if (completedTasks.length === 0) return;

    // Confirm deletion
    if (!confirm(`Are you sure you want to delete ${completedTasks.length} completed task${completedTasks.length !== 1 ? 's' : ''}?`)) {
        return;
    }

    // Animate out completed tasks
    const completedElements = document.querySelectorAll('.task-text.completed');
    completedElements.forEach(el => {
        const taskItem = el.closest('.task-item');
        if (taskItem) {
            taskItem.style.animation = 'fadeOut 0.3s ease';
        }
    });

    setTimeout(() => {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
    }, 300);
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Theme management
function toggleTheme() {
    const html = document.documentElement;
    const themeToggle = document.querySelector('.theme-toggle');
    const themeIcon = themeToggle.querySelector('.theme-icon');
    const themeText = themeToggle.querySelector('.theme-text');
    
    if (html.getAttribute('data-theme') === 'dark') {
        html.removeAttribute('data-theme');
        themeIcon.textContent = '🌙';
        themeText.textContent = 'Dark Mode';
        localStorage.setItem('theme', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Light Mode';
        localStorage.setItem('theme', 'dark');
    }
}

function applyTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeToggle = document.querySelector('.theme-toggle');
    const themeIcon = themeToggle.querySelector('.theme-icon');
    const themeText = themeToggle.querySelector('.theme-text');
    
    if (savedTheme === 'light') {
        document.documentElement.removeAttribute('data-theme');
        themeIcon.textContent = '🌙';
        themeText.textContent = 'Dark Mode';
    } else {
        // Default to dark mode if no preference
        document.documentElement.setAttribute('data-theme', 'dark');
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Light Mode';
        if (!savedTheme) {
            localStorage.setItem('theme', 'dark');
        }
    }
}

// Add CSS for fadeOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-10px);
        }
    }
`;
document.head.appendChild(style);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}