// Task management
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let draggedItem = null;
let touchStartY = 0;
let touchStartX = 0;
let currentSortingMode = localStorage.getItem('sortingMode') || 'dueDate';
let collapsedGroups = JSON.parse(localStorage.getItem('collapsedGroups')) || {};

// DOM elements
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const taskCount = document.getElementById('task-count');
const clearCompletedBtn = document.getElementById('clear-completed');
const newTaskInput = document.getElementById('new-task-input');
const dueDateInput = document.getElementById('due-date-input');

// Initialize the application
function init() {
    localStorage.removeItem('theme');
    updateSortSelect();
    renderTasks();
    setupEventListeners();
}

// Update sort select to match current mode
function updateSortSelect() {
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.value = currentSortingMode;
    }
}

// Handle sort change
function handleSortChange() {
    const sortSelect = document.getElementById('sort-select');
    currentSortingMode = sortSelect.value;
    localStorage.setItem('sortingMode', currentSortingMode);
    renderTasks();
}

// Sort tasks by due date
function sortByDueDate(tasksToSort) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return [...tasksToSort].sort((a, b) => {
        // Tasks without due dates go to the end
        if (!a.dueDate && !b.dueDate) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        
        // Sort by due date (earliest first)
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        dateA.setHours(0, 0, 0, 0);
        dateB.setHours(0, 0, 0, 0);
        
        return dateA - dateB;
    });
}

// Group tasks by due date
function groupTasksByDate(tasksToGroup) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const groups = {
        overdue: [],
        today: [],
        future: {},
        noDate: []
    };
    
    tasksToGroup.forEach(task => {
        if (!task.dueDate) {
            groups.noDate.push(task);
            return;
        }
        
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        if (dueDate < today) {
            groups.overdue.push(task);
        } else if (dueDate.getTime() === today.getTime()) {
            groups.today.push(task);
        } else {
            const dateKey = task.dueDate;
            if (!groups.future[dateKey]) {
                groups.future[dateKey] = [];
            }
            groups.future[dateKey].push(task);
        }
    });
    
    return groups;
}

// Format date for header
function formatDateHeader(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    
    if (dateOnly.getTime() === tomorrow.getTime()) {
        return 'Tomorrow';
    }
    
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Toggle group collapse
function toggleGroupCollapse(groupId) {
    collapsedGroups[groupId] = !collapsedGroups[groupId];
    localStorage.setItem('collapsedGroups', JSON.stringify(collapsedGroups));
    
    const group = document.getElementById(groupId);
    const header = document.querySelector(`[data-group-id="${groupId}"]`);
    
    if (group) {
        group.classList.toggle('collapsed', collapsedGroups[groupId]);
    }
    if (header) {
        header.classList.toggle('collapsed', collapsedGroups[groupId]);
    }
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
        createdAt: new Date().toISOString(),
        dueDate: dueDateInput.value || null
    };

    tasks.unshift(newTask); // Add to beginning of array
    saveTasks();
    renderTasks();
    
    // Clear input and focus
    newTaskInput.value = '';
    dueDateInput.value = '';
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

    // Render based on sorting mode
    if (currentSortingMode === 'dueDate') {
        renderGroupedByDate();
    } else {
        renderFlatList();
    }
}

// Render tasks in flat list (manual sorting)
function renderFlatList() {
    tasks.forEach((task, index) => {
        const taskElement = createTaskElement(task, index);
        taskList.appendChild(taskElement);
    });
}

// Render tasks grouped by date
function renderGroupedByDate() {
    const sortedTasks = sortByDueDate(tasks);
    const groups = groupTasksByDate(sortedTasks);
    
    // Render overdue tasks (always visible)
    if (groups.overdue.length > 0) {
        const groupId = 'overdue';
        const isCollapsed = collapsedGroups[groupId] || false;
        
        // Create header
        const header = createDateHeader('Overdue', groups.overdue.length, groupId, isCollapsed, true);
        taskList.appendChild(header);
        
        // Create group container
        const groupContainer = document.createElement('div');
        groupContainer.className = `task-group ${isCollapsed ? 'collapsed' : ''}`;
        groupContainer.id = groupId;
        
        groups.overdue.forEach(task => {
            const taskElement = createTaskElement(task);
            groupContainer.appendChild(taskElement);
        });
        
        taskList.appendChild(groupContainer);
    }
    
    // Render today's tasks (always visible)
    if (groups.today.length > 0) {
        const groupId = 'today';
        const isCollapsed = collapsedGroups[groupId] || false;
        
        // Create header
        const header = createDateHeader('Today', groups.today.length, groupId, isCollapsed, false, true);
        taskList.appendChild(header);
        
        // Create group container
        const groupContainer = document.createElement('div');
        groupContainer.className = `task-group ${isCollapsed ? 'collapsed' : ''}`;
        groupContainer.id = groupId;
        
        groups.today.forEach(task => {
            const taskElement = createTaskElement(task);
            groupContainer.appendChild(taskElement);
        });
        
        taskList.appendChild(groupContainer);
    }
    
    // Render future tasks by date
    const futureDates = Object.keys(groups.future).sort();
    futureDates.forEach(dateKey => {
        const tasksForDate = groups.future[dateKey];
        const groupId = `date-${dateKey}`;
        const isCollapsed = collapsedGroups[groupId] || false;
        
        // Create header
        const header = createDateHeader(formatDateHeader(dateKey), tasksForDate.length, groupId, isCollapsed);
        taskList.appendChild(header);
        
        // Create group container
        const groupContainer = document.createElement('div');
        groupContainer.className = `task-group ${isCollapsed ? 'collapsed' : ''}`;
        groupContainer.id = groupId;
        
        tasksForDate.forEach(task => {
            const taskElement = createTaskElement(task);
            groupContainer.appendChild(taskElement);
        });
        
        taskList.appendChild(groupContainer);
    });
    
    // Render tasks without due dates
    if (groups.noDate.length > 0) {
        const groupId = 'no-date';
        const isCollapsed = collapsedGroups[groupId] || false;
        
        // Create header
        const header = createDateHeader('No Due Date', groups.noDate.length, groupId, isCollapsed);
        taskList.appendChild(header);
        
        // Create group container
        const groupContainer = document.createElement('div');
        groupContainer.className = `task-group ${isCollapsed ? 'collapsed' : ''}`;
        groupContainer.id = groupId;
        
        groups.noDate.forEach(task => {
            const taskElement = createTaskElement(task);
            groupContainer.appendChild(taskElement);
        });
        
        taskList.appendChild(groupContainer);
    }
}

// Create date header element
function createDateHeader(title, count, groupId, isCollapsed = false, isOverdue = false, isToday = false) {
    const header = document.createElement('div');
    header.className = `date-header ${isCollapsed ? 'collapsed' : ''} ${isOverdue ? 'overdue' : ''} ${isToday ? 'today' : ''}`;
    header.setAttribute('data-group-id', groupId);
    header.onclick = () => toggleGroupCollapse(groupId);
    
    const titleSpan = document.createElement('span');
    titleSpan.className = 'date-header-title';
    titleSpan.textContent = title;
    
    const countSpan = document.createElement('span');
    countSpan.className = 'date-header-count';
    countSpan.textContent = `${count} task${count !== 1 ? 's' : ''}`;
    
    const iconSpan = document.createElement('span');
    iconSpan.className = 'date-header-icon';
    iconSpan.textContent = '▼';
    
    header.appendChild(titleSpan);
    header.appendChild(countSpan);
    header.appendChild(iconSpan);
    
    return header;
}

// Create a task element
function createTaskElement(task, index) {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.setAttribute('data-task-id', task.id);
    li.setAttribute('draggable', 'true');
    
    // Drag and drop event listeners
    li.addEventListener('dragstart', handleDragStart);
    li.addEventListener('dragend', handleDragEnd);
    li.addEventListener('dragover', handleDragOver);
    li.addEventListener('dragenter', handleDragEnter);
    li.addEventListener('dragleave', handleDragLeave);
    li.addEventListener('drop', handleDrop);
    
    // Touch event listeners for mobile
    li.addEventListener('touchstart', handleTouchStart, { passive: false });
    li.addEventListener('touchmove', handleTouchMove, { passive: false });
    li.addEventListener('touchend', handleTouchEnd);

    // Check if task is overdue
    const isOverdue = task.dueDate && !task.completed && isTaskOverdue(task.dueDate);
    if (isOverdue) {
        li.classList.add('overdue');
    }

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', `Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`);
    checkbox.onchange = () => toggleTask(task.id);

    // Task content container
    const taskContent = document.createElement('div');
    taskContent.className = 'task-content';

    // Task text
    const span = document.createElement('span');
    span.textContent = task.text;
    span.className = 'task-text';
    if (task.completed) {
        span.classList.add('completed');
    }

    // Due date display
    if (task.dueDate) {
        const dueDateSpan = document.createElement('span');
        dueDateSpan.className = 'due-date';
        if (isOverdue) {
            dueDateSpan.classList.add('overdue');
        }
        dueDateSpan.textContent = formatDate(task.dueDate);
        taskContent.appendChild(span);
        taskContent.appendChild(dueDateSpan);
    } else {
        taskContent.appendChild(span);
    }

    // Task actions container
    const taskActions = document.createElement('div');
    taskActions.className = 'task-actions';

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.innerHTML = '&#9998;';
    editBtn.setAttribute('aria-label', `Edit task "${task.text}"`);
    editBtn.onclick = (e) => {
        e.stopPropagation();
        editTask(task.id);
    };

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.setAttribute('aria-label', `Delete task "${task.text}"`);
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteTask(task.id);
    };

    taskActions.appendChild(editBtn);
    taskActions.appendChild(deleteBtn);

    // Assemble the task item
    li.appendChild(checkbox);
    li.appendChild(taskContent);
    li.appendChild(taskActions);

    return li;
}

// Check if a task is overdue
function isTaskOverdue(dueDate) {
    if (!dueDate) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    return due < today;
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
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

// Edit a task
function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (!taskElement) return;

    taskElement.setAttribute('draggable', 'false');
    taskElement.classList.add('editing-mode');

    const taskContent = taskElement.querySelector('.task-content');
    taskContent.classList.add('editing');

    const textSpan = taskContent.querySelector('.task-text');
    const dueDateSpan = taskContent.querySelector('.due-date');

    const originalText = task.text;
    const originalDueDate = task.dueDate || '';

    if (textSpan) {
        textSpan.replaceWith(createEditInput('text', originalText));
    }

    if (dueDateSpan) {
        dueDateSpan.replaceWith(createEditInput('dueDate', originalDueDate));
    } else {
        const emptyDueDate = document.createElement('span');
        emptyDueDate.className = 'due-date-edit-wrapper';
        emptyDueDate.appendChild(createEditInput('dueDate', originalDueDate));
        taskContent.appendChild(emptyDueDate);
    }

    const actionsContainer = taskElement.querySelector('.task-actions');
    actionsContainer.innerHTML = '';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'save-btn';
    saveBtn.innerHTML = '&#10003;';
    saveBtn.setAttribute('aria-label', 'Save changes');
    saveBtn.onclick = (e) => {
        e.stopPropagation();
        saveTaskEdit(taskId);
    };

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'cancel-btn';
    cancelBtn.innerHTML = '&#10005;';
    cancelBtn.setAttribute('aria-label', 'Cancel editing');
    cancelBtn.onclick = (e) => {
        e.stopPropagation();
        task.text = originalText;
        task.dueDate = originalDueDate || null;
        renderTasks();
    };

    actionsContainer.appendChild(saveBtn);
    actionsContainer.appendChild(cancelBtn);
}

function createEditInput(type, value) {
    if (type === 'text') {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'edit-input';
        input.value = value;
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const taskId = parseInt(input.closest('.task-item').getAttribute('data-task-id'));
                saveTaskEdit(taskId);
            } else if (e.key === 'Escape') {
                renderTasks();
            }
        });
        return input;
    } else {
        const wrapper = document.createElement('div');
        wrapper.className = 'edit-due-date-wrapper';

        const input = document.createElement('input');
        input.type = 'date';
        input.className = 'edit-due-date-input';
        input.value = value;
        wrapper.appendChild(input);
        return wrapper;
    }
}

function saveTaskEdit(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (!taskElement) return;

    const editInput = taskElement.querySelector('.edit-input');
    const editDueDateInput = taskElement.querySelector('.edit-due-date-input');

    const newText = editInput ? editInput.value.trim() : task.text;
    const newDueDate = editDueDateInput ? editDueDateInput.value || null : task.dueDate;

    if (!newText) {
        if (editInput) {
            editInput.style.borderColor = '#ef4444';
            setTimeout(() => {
                editInput.style.borderColor = '';
            }, 1000);
        }
        return;
    }

    const isDuplicate = tasks.some(t =>
        t.id !== taskId &&
        t.text.toLowerCase() === newText.toLowerCase()
    );

    if (isDuplicate) {
        alert('This task already exists!');
        return;
    }

    task.text = newText;
    task.dueDate = newDueDate;

    saveTasks();
    renderTasks();
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

// Drag and drop handlers
function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    draggedItem = null;
    
    // Remove drag-over class from all items
    document.querySelectorAll('.task-item').forEach(item => {
        item.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    if (this !== draggedItem) {
        this.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (this !== draggedItem) {
        // Get the indices of the dragged and dropped items
        const draggedId = parseInt(draggedItem.getAttribute('data-task-id'));
        const droppedId = parseInt(this.getAttribute('data-task-id'));
        
        const draggedIndex = tasks.findIndex(t => t.id === draggedId);
        const droppedIndex = tasks.findIndex(t => t.id === droppedId);
        
        if (draggedIndex !== -1 && droppedIndex !== -1) {
            // Remove the dragged item from its original position
            const [removed] = tasks.splice(draggedIndex, 1);
            
            // Insert it at the new position
            tasks.splice(droppedIndex, 0, removed);
            
            // Switch to manual sorting mode
            currentSortingMode = 'manual';
            localStorage.setItem('sortingMode', currentSortingMode);
            updateSortSelect();
            
            // Save and re-render
            saveTasks();
            renderTasks();
        }
    }
    
    this.classList.remove('drag-over');
}

// Touch event handlers for mobile drag and drop
function handleTouchStart(e) {
    if (e.touches.length === 1) {
        draggedItem = this;
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
        this.classList.add('dragging');
    }
}

function handleTouchMove(e) {
    if (!draggedItem) return;
    
    e.preventDefault();
    
    const touchY = e.touches[0].clientY;
    const touchX = e.touches[0].clientX;
    
    // Find the element under the touch point
    const elementUnder = document.elementFromPoint(touchX, touchY);
    const taskItem = elementUnder?.closest('.task-item');
    
    // Remove drag-over class from all items
    document.querySelectorAll('.task-item').forEach(item => {
        item.classList.remove('drag-over');
    });
    
    // Add drag-over class to the item under the touch point
    if (taskItem && taskItem !== draggedItem) {
        taskItem.classList.add('drag-over');
    }
}

function handleTouchEnd(e) {
    if (!draggedItem) return;
    
    // Find the element under the final touch point
    const touch = e.changedTouches[0];
    const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY);
    const taskItem = elementUnder?.closest('.task-item');
    
    if (taskItem && taskItem !== draggedItem) {
        // Get the indices of the dragged and dropped items
        const draggedId = parseInt(draggedItem.getAttribute('data-task-id'));
        const droppedId = parseInt(taskItem.getAttribute('data-task-id'));
        
        const draggedIndex = tasks.findIndex(t => t.id === draggedId);
        const droppedIndex = tasks.findIndex(t => t.id === droppedId);
        
        if (draggedIndex !== -1 && droppedIndex !== -1) {
            // Remove the dragged item from its original position
            const [removed] = tasks.splice(draggedIndex, 1);
            
            // Insert it at the new position
            tasks.splice(droppedIndex, 0, removed);
            
            // Switch to manual sorting mode
            currentSortingMode = 'manual';
            localStorage.setItem('sortingMode', currentSortingMode);
            updateSortSelect();
            
            // Save and re-render
            saveTasks();
            renderTasks();
        }
    }
    
    // Clean up
    draggedItem.classList.remove('dragging');
    document.querySelectorAll('.task-item').forEach(item => {
        item.classList.remove('drag-over');
    });
    draggedItem = null;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}