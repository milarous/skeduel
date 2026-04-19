const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const taskCount = document.getElementById('task-count');
const clearCompletedBtn = document.getElementById('clear-completed');
const newTaskInput = document.getElementById('new-task-input');
const dueDateInput = document.getElementById('due-date-input');

function init() {
    localStorage.removeItem('theme');
    localStorage.removeItem('sortingMode');
    renderTasks();
    setupEventListeners();
}

function sortByDueDate(tasksToSort) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return [...tasksToSort].sort((a, b) => {
        if (!a.dueDate && !b.dueDate) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        dateA.setHours(0, 0, 0, 0);
        dateB.setHours(0, 0, 0, 0);
        
        return dateA - dateB;
    });
}

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

function toggleGroupCollapse(groupId) {
    collapsedGroups[groupId] = !collapsedGroups[groupId];
    saveCollapsedGroups();
    
    const group = document.getElementById(groupId);
    const header = document.querySelector(`[data-group-id="${groupId}"]`);
    
    if (group) {
        group.classList.toggle('collapsed', collapsedGroups[groupId]);
    }
    if (header) {
        header.classList.toggle('collapsed', collapsedGroups[groupId]);
    }
}

function setupEventListeners() {
    newTaskInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            addTask();
        }
    });

    newTaskInput.addEventListener('focus', () => {
        newTaskInput.parentElement.classList.add('focused');
    });

    newTaskInput.addEventListener('blur', () => {
        newTaskInput.parentElement.classList.remove('focused');
    });
}

function toggleRecurrenceOptions() {
    const enabled = document.getElementById('recurrence-enabled');
    const options = document.getElementById('recurrence-options');
    if (options) {
        options.style.display = enabled.checked ? 'flex' : 'none';
    }
}

function toggleExpiryInput() {
    const expiryType = document.getElementById('expiry-type');
    const dateInput = document.getElementById('expiry-date');
    const countInput = document.getElementById('expiry-count');
    if (dateInput) dateInput.style.display = expiryType.value === 'date' ? 'inline-block' : 'none';
    if (countInput) countInput.style.display = expiryType.value === 'count' ? 'inline-block' : 'none';
}

function resetRecurrenceInputs() {
    const enabled = document.getElementById('recurrence-enabled');
    const options = document.getElementById('recurrence-options');
    const expiryType = document.getElementById('expiry-type');
    const expiryDate = document.getElementById('expiry-date');
    const expiryCount = document.getElementById('expiry-count');
    if (enabled) enabled.checked = false;
    if (options) options.style.display = 'none';
    if (expiryType) expiryType.value = 'none';
    if (expiryDate) {
        expiryDate.value = '';
        expiryDate.style.display = 'none';
    }
    if (expiryCount) {
        expiryCount.value = '';
        expiryCount.style.display = 'none';
    }
}

function addTask() {
    const text = newTaskInput.value.trim();
    
    if (!text) {
        newTaskInput.style.borderColor = '#ef4444';
        setTimeout(() => {
            newTaskInput.style.borderColor = '';
        }, 1000);
        return;
    }

    const isDuplicate = tasks.some(task => 
        task.text.toLowerCase() === text.toLowerCase()
    );

    if (isDuplicate) {
        alert('This task already exists!');
        return;
    }

    const recurrenceEnabled = document.getElementById('recurrence-enabled')?.checked || false;
    const frequency = document.getElementById('recurrence-frequency')?.value || 'weekly';
    const interval = parseInt(document.getElementById('recurrence-interval')?.value) || 1;
    const expiryType = document.getElementById('expiry-type')?.value || 'none';
    const expiryDate = document.getElementById('expiry-date')?.value || null;
    const expiryCount = parseInt(document.getElementById('expiry-count')?.value) || null;

    const recurrence = recurrenceEnabled ? {
        enabled: true,
        frequency,
        interval,
        startDate: dueDateInput.value || new Date().toISOString().split('T')[0],
        currentInstance: 1,
        expiryType: expiryType === 'none' ? null : expiryType,
        expiryDate: expiryType === 'date' ? expiryDate : null,
        expiryCount: expiryType === 'count' ? expiryCount : null
    } : { enabled: false };

    const newTask = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString(),
        dueDate: dueDateInput.value || null,
        recurrence
    };

    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    
    newTaskInput.value = '';
    dueDateInput.value = '';
    resetRecurrenceInputs();
    newTaskInput.focus();

    const firstTask = taskList.querySelector('.task-item');
    if (firstTask) {
        firstTask.style.animation = 'none';
        firstTask.offsetHeight;
        firstTask.style.animation = 'fadeIn 0.3s ease';
    }
}

function renderTasks() {
    taskList.innerHTML = '';

    if (tasks.length === 0) {
        emptyState.classList.add('show');
        taskCount.textContent = '0 tasks';
        clearCompletedBtn.style.display = 'none';
        return;
    }

    emptyState.classList.remove('show');

    const activeTasks = tasks.filter(task => !task.completed).length;
    const completedTasks = tasks.filter(task => task.completed).length;
    
    taskCount.textContent = `${activeTasks} active task${activeTasks !== 1 ? 's' : ''}`;
    
    clearCompletedBtn.style.display = completedTasks > 0 ? 'block' : 'none';

    renderGroupedByDate();
}

function renderGroupedByDate() {
    const sortedTasks = sortByDueDate(tasks);
    const groups = groupTasksByDate(sortedTasks);
    
    if (groups.overdue.length > 0) {
        const groupId = 'overdue';
        const isCollapsed = collapsedGroups[groupId] || false;
        
        const header = createDateHeader('Overdue', groups.overdue.length, groupId, isCollapsed, true);
        taskList.appendChild(header);
        
        const groupContainer = document.createElement('div');
        groupContainer.className = `task-group ${isCollapsed ? 'collapsed' : ''}`;
        groupContainer.id = groupId;
        
        groups.overdue.forEach(task => {
            const taskElement = createTaskElement(task);
            groupContainer.appendChild(taskElement);
        });
        
        taskList.appendChild(groupContainer);
    }
    
    if (groups.today.length > 0) {
        const groupId = 'today';
        const isCollapsed = collapsedGroups[groupId] || false;
        
        const header = createDateHeader('Today', groups.today.length, groupId, isCollapsed, false, true);
        taskList.appendChild(header);
        
        const groupContainer = document.createElement('div');
        groupContainer.className = `task-group ${isCollapsed ? 'collapsed' : ''}`;
        groupContainer.id = groupId;
        
        groups.today.forEach(task => {
            const taskElement = createTaskElement(task);
            groupContainer.appendChild(taskElement);
        });
        
        taskList.appendChild(groupContainer);
    }
    
    const futureDates = Object.keys(groups.future).sort();
    futureDates.forEach(dateKey => {
        const tasksForDate = groups.future[dateKey];
        const groupId = `date-${dateKey}`;
        const isCollapsed = collapsedGroups[groupId] || false;
        
        const header = createDateHeader(formatDateHeader(dateKey), tasksForDate.length, groupId, isCollapsed);
        taskList.appendChild(header);
        
        const groupContainer = document.createElement('div');
        groupContainer.className = `task-group ${isCollapsed ? 'collapsed' : ''}`;
        groupContainer.id = groupId;
        
        tasksForDate.forEach(task => {
            const taskElement = createTaskElement(task);
            groupContainer.appendChild(taskElement);
        });
        
        taskList.appendChild(groupContainer);
    });
    
    if (groups.noDate.length > 0) {
        const groupId = 'no-date';
        const isCollapsed = collapsedGroups[groupId] || false;
        
        const header = createDateHeader('No Due Date', groups.noDate.length, groupId, isCollapsed);
        taskList.appendChild(header);
        
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

function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.setAttribute('data-task-id', task.id);
    li.setAttribute('draggable', 'true');
    li.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', task.id.toString());
    });

    const isOverdue = task.dueDate && !task.completed && isTaskOverdue(task.dueDate);
    if (isOverdue) {
        li.classList.add('overdue');
    }

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', `Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`);
    checkbox.onchange = () => toggleTask(task.id);

    const taskContent = document.createElement('div');
    taskContent.className = 'task-content';

    const span = document.createElement('span');
    span.textContent = task.text;
    span.className = 'task-text';
    if (task.completed) {
        span.classList.add('completed');
    }

    if (task.recurrence?.enabled && task.dueDate) {
        const dueDateSpan = document.createElement('span');
        dueDateSpan.className = 'due-date';
        if (isOverdue) {
            dueDateSpan.classList.add('overdue');
        }
        dueDateSpan.textContent = formatDate(task.dueDate);
        taskContent.appendChild(span);
        taskContent.appendChild(dueDateSpan);
        const recurIcon = document.createElement('span');
        recurIcon.className = 'recurrence-icon';
        recurIcon.textContent = '🔄';
        taskContent.appendChild(recurIcon);
    } else if (task.dueDate) {
        const dueDateSpan = document.createElement('span');
        dueDateSpan.className = 'due-date';
        if (isOverdue) {
            dueDateSpan.classList.add('overdue');
        }
        dueDateSpan.textContent = formatDate(task.dueDate);
        taskContent.appendChild(span);
        taskContent.appendChild(dueDateSpan);
    } else if (task.recurrence?.enabled) {
        const recurIcon = document.createElement('span');
        recurIcon.className = 'recurrence-icon';
        recurIcon.textContent = '🔄';
        taskContent.appendChild(span);
        taskContent.appendChild(recurIcon);
    } else {
        taskContent.appendChild(span);
    }

    const taskActions = document.createElement('div');
    taskActions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.innerHTML = '&#9998;';
    editBtn.setAttribute('aria-label', `Edit task "${task.text}"`);
    editBtn.onclick = (e) => {
        e.stopPropagation();
        editTask(task.id);
    };

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

    li.appendChild(checkbox);
    li.appendChild(taskContent);
    li.appendChild(taskActions);

    return li;
}

function isTaskOverdue(dueDate) {
    if (!dueDate) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    return due < today;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function toggleTask(taskId) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = tasks[taskIndex];
    task.completed = !task.completed;

    if (task.completed && task.recurrence?.enabled) {
        const isExpired = RecurrenceEngine.isExpired(task);
        
        if (!isExpired) {
            const newInstance = task.recurrence.currentInstance + 1;
            const nextDueDate = RecurrenceEngine.calculateNextInstance({
                ...task,
                recurrence: { ...task.recurrence, currentInstance: newInstance }
            });
            
            task.dueDate = nextDueDate;
            task.recurrence.currentInstance = newInstance;
            task.completed = false;
        }
    }

    saveTasks();
    renderTasks();
}

function deleteTask(taskId) {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);

    if (taskElement) {
        taskElement.style.animation = 'fadeOut 0.3s ease';

        setTimeout(() => {
            tasks = tasks.filter(t => t.id !== taskId);
            saveTasks();
            renderTasks();
        }, 300);
    }
}

function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (!taskElement) return;

    taskElement.classList.add('editing-mode');

    const taskContent = taskElement.querySelector('.task-content');
    taskContent.classList.add('editing');

    const textSpan = taskContent.querySelector('.task-text');
    const dueDateSpan = taskContent.querySelector('.due-date');
    const recurrenceIcon = taskContent.querySelector('.recurrence-icon');

    const originalText = task.text;
    const originalDueDate = task.dueDate || '';
    const originalRecurrence = task.recurrence || { enabled: false };

    const row1 = document.createElement('div');
    row1.className = 'task-edit-row';

    if (textSpan) {
        row1.appendChild(createEditInput('text', originalText));
    }

    if (dueDateSpan) {
        row1.appendChild(createEditInput('dueDate', originalDueDate));
    } else if (!recurrenceIcon) {
        row1.appendChild(createEditInput('dueDate', originalDueDate));
    }

    taskContent.innerHTML = '';
    taskContent.appendChild(row1);

    const row2 = document.createElement('div');
    row2.className = 'task-edit-row';
    row2.appendChild(createRecurrenceEditRow(originalRecurrence));
    taskContent.appendChild(row2);

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
        task.recurrence = originalRecurrence;
        renderTasks();
    };

    actionsContainer.appendChild(saveBtn);
    actionsContainer.appendChild(cancelBtn);
}

function createRecurrenceEditRow(recurrence) {
    const wrapper = document.createElement('div');
    wrapper.className = 'recurrence-edit-row';

    const toggleLabel = document.createElement('label');
    toggleLabel.className = 'recurrence-edit-toggle';

    const toggleSwitch = document.createElement('span');
    toggleSwitch.className = 'toggle-switch';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'recurrence-edit-checkbox';
    checkbox.checked = recurrence.enabled;
    checkbox.id = 'edit-recurrence-enabled';

    const toggleSlider = document.createElement('span');
    toggleSlider.className = 'toggle-slider';

    toggleSwitch.appendChild(checkbox);
    toggleSwitch.appendChild(toggleSlider);
    toggleLabel.appendChild(toggleSwitch);

    const repeatLabel = document.createElement('span');
    repeatLabel.className = 'recurrence-edit-label';
    repeatLabel.textContent = 'Repeat';

    const select = document.createElement('select');
    select.className = 'recurrence-edit-frequency';
    select.id = 'edit-recurrence-frequency';
    ['daily', 'weekly', 'monthly', 'yearly'].forEach(freq => {
        const option = document.createElement('option');
        option.value = freq;
        option.textContent = freq.charAt(0).toUpperCase() + freq.slice(1);
        if (recurrence.frequency === freq) option.selected = true;
        select.appendChild(option);
    });

    const intervalInput = document.createElement('input');
    intervalInput.type = 'number';
    intervalInput.className = 'recurrence-edit-interval';
    intervalInput.id = 'edit-recurrence-interval';
    intervalInput.min = 1;
    intervalInput.value = recurrence.interval || 1;

    const expiryLabel = document.createElement('span');
    expiryLabel.className = 'recurrence-edit-expiry-label';
    expiryLabel.textContent = 'Ends:';

    const expirySelect = document.createElement('select');
    expirySelect.className = 'recurrence-edit-expiry-type';
    expirySelect.id = 'edit-expiry-type';
    ['none', 'date', 'count'].forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type === 'none' ? 'Never' : type === 'date' ? 'On date' : 'After';
        if (recurrence.expiryType === type) option.selected = true;
        expirySelect.appendChild(option);
    });

    const expiryDateInput = document.createElement('input');
    expiryDateInput.type = 'date';
    expiryDateInput.className = 'recurrence-edit-expiry-date';
    expiryDateInput.id = 'edit-expiry-date';
    expiryDateInput.value = recurrence.expiryDate || '';

    const expiryCountInput = document.createElement('input');
    expiryCountInput.type = 'number';
    expiryCountInput.className = 'recurrence-edit-expiry-count';
    expiryCountInput.id = 'edit-expiry-count';
    expiryCountInput.min = 1;
    expiryCountInput.value = recurrence.expiryCount || '';
    expiryCountInput.placeholder = 'times';

    const showExtras = recurrence.enabled;
    select.style.display = showExtras ? 'inline-block' : 'none';
    intervalInput.style.display = showExtras ? 'inline-block' : 'none';
    expiryLabel.style.display = showExtras ? 'inline-block' : 'none';
    expirySelect.style.display = showExtras ? 'inline-block' : 'none';
    expiryDateInput.style.display = (showExtras && recurrence.expiryType === 'date') ? 'inline-block' : 'none';
    expiryCountInput.style.display = (showExtras && recurrence.expiryType === 'count') ? 'inline-block' : 'none';

    checkbox.addEventListener('change', () => {
        const enabled = checkbox.checked;
        select.style.display = enabled ? 'inline-block' : 'none';
        intervalInput.style.display = enabled ? 'inline-block' : 'none';
        expiryLabel.style.display = enabled ? 'inline-block' : 'none';
        expirySelect.style.display = enabled ? 'inline-block' : 'none';
        if (!enabled) {
            expiryDateInput.style.display = 'none';
            expiryCountInput.style.display = 'none';
        }
    });

    expirySelect.addEventListener('change', () => {
        expiryDateInput.style.display = expirySelect.value === 'date' ? 'inline-block' : 'none';
        expiryCountInput.style.display = expirySelect.value === 'count' ? 'inline-block' : 'none';
    });

    wrapper.appendChild(toggleLabel);
    wrapper.appendChild(repeatLabel);
    wrapper.appendChild(select);
    wrapper.appendChild(intervalInput);
    wrapper.appendChild(expiryLabel);
    wrapper.appendChild(expirySelect);
    wrapper.appendChild(expiryDateInput);
    wrapper.appendChild(expiryCountInput);

    return wrapper;
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
    const recurrenceCheckbox = taskElement.querySelector('.recurrence-edit-checkbox');
    const recurrenceFrequency = taskElement.querySelector('.recurrence-edit-frequency');
    const recurrenceInterval = taskElement.querySelector('.recurrence-edit-interval');

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

    if (recurrenceCheckbox) {
        const enabled = recurrenceCheckbox.checked;
        const frequency = recurrenceFrequency ? recurrenceFrequency.value : 'weekly';
        const interval = recurrenceInterval ? parseInt(recurrenceInterval.value) || 1 : 1;
        
        const expiryTypeSelect = taskElement.querySelector('.recurrence-edit-expiry-type');
        const expiryDateInput = taskElement.querySelector('.recurrence-edit-expiry-date');
        const expiryCountInput = taskElement.querySelector('.recurrence-edit-expiry-count');
        
        const expiryType = expiryTypeSelect ? expiryTypeSelect.value : 'none';
        const expiryDate = expiryType === 'date' ? (expiryDateInput ? expiryDateInput.value : null) : null;
        const expiryCount = expiryType === 'count' ? (expiryCountInput ? parseInt(expiryCountInput.value) : null) : null;

        if (enabled) {
            const previousRecurrence = task.recurrence || {};
            const intervalChanged = previousRecurrence.interval !== interval;
            const frequencyChanged = previousRecurrence.frequency !== frequency;
            const shouldReset = intervalChanged || frequencyChanged;
            
            let adjustedExpiryCount = expiryCount;
            
            if (expiryType === 'count' && expiryCount && !shouldReset && previousRecurrence.currentInstance) {
                adjustedExpiryCount = previousRecurrence.currentInstance + expiryCount;
            }
            
            task.recurrence = {
                enabled: true,
                frequency,
                interval,
                startDate: shouldReset 
                    ? (task.dueDate || task.createdAt.split('T')[0])
                    : (previousRecurrence.startDate || task.dueDate || task.createdAt.split('T')[0]),
                currentInstance: shouldReset ? 1 : (previousRecurrence.currentInstance || 1),
                expiryType: expiryType === 'none' ? null : expiryType,
                expiryDate,
                expiryCount: adjustedExpiryCount
            };
        } else {
            task.recurrence = { enabled: false };
        }
    }

    saveTasks();
    renderTasks();
}

function clearCompleted() {
    const completedTasks = tasks.filter(task => task.completed);
    
    if (completedTasks.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${completedTasks.length} completed task${completedTasks.length !== 1 ? 's' : ''}?`)) {
        return;
    }

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

document.addEventListener('DOMContentLoaded', init);

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}