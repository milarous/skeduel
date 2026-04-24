const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const taskCount = document.getElementById('task-count');
const clearCompletedBtn = document.getElementById('clear-completed');
const newTaskInput = document.getElementById('new-task-input');
const dueDateInput = document.getElementById('due-date-input');
window.collapsedSubtasks = window.collapsedSubtasks || {};

function toggleSubtaskCollapse(taskId) {
    if (window.collapsedSubtasks[taskId] === undefined) {
        window.collapsedSubtasks[taskId] = false; // open after first click
    } else {
        window.collapsedSubtasks[taskId] = !window.collapsedSubtasks[taskId];
    }
    renderTasks();
}

function getPinnedDates(taskId) {
    const dates = [];
    const taskIdStr = String(taskId);
    const focusDays = Storage.getFocusDays();
    for (const dateStr in focusDays) {
        const focusDay = focusDays[dateStr];
        const taskIds = focusDay?.taskIds?.map(id => String(id)) || [];
        if (taskIds.includes(taskIdStr)) {
            dates.push(dateStr);
        }
    }
    return dates.sort();
}

function formatFocusDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly.getTime() === today.getTime()) {
        return 'Today';
    }
    if (dateOnly.getTime() === tomorrow.getTime()) {
        return 'Tomorrow';
    }

    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}
const modalOverlay = document.getElementById('modal-overlay');
const modalMessage = document.getElementById('modal-message');
const modalButtons = document.getElementById('modal-buttons');
const modalConfirm = document.getElementById('modal-confirm');
const modalCancel = document.getElementById('modal-cancel');

let confirmCallback = null;

function showModal(message) {
    if (!modalOverlay || !modalMessage || !modalButtons) return;
    modalMessage.textContent = message;
    if (modalConfirm) modalConfirm.style.display = 'none';
    if (modalCancel) {
        modalCancel.textContent = 'OK';
        modalCancel.onclick = hideModal;
    }
    confirmCallback = null;
    modalOverlay.classList.add('show');
}

function showConfirmModal(message, onConfirm) {
    if (!modalOverlay || !modalMessage || !modalButtons) return;
    modalMessage.textContent = message;
    if (modalConfirm) {
        modalConfirm.style.display = 'inline-block';
        modalConfirm.onclick = () => {
            hideModal();
            if (onConfirm) onConfirm();
        };
    }
    if (modalCancel) {
        modalCancel.textContent = 'Cancel';
        modalCancel.onclick = hideModal;
    }
    confirmCallback = onConfirm;
    modalOverlay.classList.add('show');
}

function hideModal() {
    if (modalOverlay) {
        modalOverlay.classList.remove('show');
    }
    if (modalConfirm) {
        modalConfirm.style.display = 'inline-block';
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay?.classList.contains('show')) {
        hideModal();
    }
});

modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        hideModal();
    }
});

async function init() {
    localStorage.removeItem('theme');
    localStorage.removeItem('sortingMode');

    const data = await Storage.load();
    tasks = data.tasks || [];
    collapsedGroups = data.collapsedGroups || {};
    window.collapsedSubtasks = window.collapsedSubtasks || {};

    document.getElementById('loading-overlay')?.classList.add('loading-hidden');

    renderTasks();
    setupEventListeners();

    if (typeof FocusDay !== 'undefined') {
        FocusDay.onDataChange = () => {
            renderTasks();
        };
        FocusDay.init();
    }
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
        showModal('This task already exists!');
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
        recurrence,
        subtasks: []
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

function addSubtask(taskId, text) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !text.trim()) return;

    if (!task.subtasks) task.subtasks = [];

    task.subtasks.push({
        id: Date.now(),
        text: text.trim(),
        completed: false,
        completedDate: null
    });

    saveTasks();
    renderTasks();
}

function toggleSubtask(taskId, subtaskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;

    const subtask = task.subtasks.find(s => s.id === subtaskId);
    if (!subtask) return;

    subtask.completed = !subtask.completed;
    subtask.completedDate = subtask.completed ? new Date().toISOString() : null;

    saveTasks();
    renderTasks();
}

function editSubtask(taskId, subtaskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;

    const subtask = task.subtasks.find(s => s.id === subtaskId);
    if (!subtask) return;

    const subtaskElement = document.querySelector(`.subtask-item input[value="${subtaskId}"]`)?.closest('.subtask-item') || 
                         [...document.querySelectorAll('.subtask-item')].find(li => li.querySelector(`[data-subtask-id="${subtaskId}"]`));
    if (!subtaskElement) return;

    const subtaskText = subtaskElement.querySelector('.subtask-text');
    const subtaskCheckbox = subtaskElement.querySelector('.subtask-checkbox');
    const subtaskEdit = subtaskElement.querySelector('.subtask-edit');
    const subtaskDelete = subtaskElement.querySelector('.subtask-delete');
    
    if (!subtaskText) return;

    const originalText = subtask.text;

    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'subtask-edit-input';
    editInput.value = originalText;
    editInput.style.flex = '1';
    editInput.style.fontSize = '0.875rem';
    editInput.style.padding = '4px';
    editInput.style.border = '1px solid var(--border-color)';
    editInput.style.borderRadius = 'var(--radius-sm)';
    editInput.style.backgroundColor = 'var(--bg-primary)';
    editInput.style.color = 'var(--text-primary)';

    const saveEdit = () => {
        const newText = editInput.value.trim();
        if (newText && newText !== originalText) {
            subtask.text = newText;
            saveTasks();
            renderTasks();
        } else {
            renderTasks();
        }
    };

    const cancelEdit = () => {
        renderTasks();
    };

    editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveEdit();
        } else if (e.key === 'Escape') {
            cancelEdit();
        }
    });

    editInput.addEventListener('blur', saveEdit);

    subtaskText.replaceWith(editInput);
    if (subtaskCheckbox) subtaskCheckbox.style.display = 'none';
    if (subtaskEdit) subtaskEdit.style.display = 'none';
    if (subtaskDelete) subtaskDelete.style.display = 'none';

    editInput.focus();
    editInput.select();
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

    const pinnedDates = getPinnedDates(task.id);
    if (pinnedDates.length > 0) {
        const focusIndicator = document.createElement('button');
        focusIndicator.className = 'focus-indicator';
        focusIndicator.textContent = '📌 ' + formatFocusDate(pinnedDates[0]);
        focusIndicator.setAttribute('aria-label', 'Go to pinned date');
        const pinnedDate = pinnedDates[0];
        focusIndicator.onclick = () => {
            FocusDay.currentFocusDate = pinnedDate;
            FocusDay.render();
            setTimeout(() => {
                const card = document.querySelector(`.focus-task-card[data-task-id="${task.id}"]`);
                if (card) {
                    card.classList.add('highlight');
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => card.classList.remove('highlight'), 1500);
                }
            }, 100);
        };
        taskContent.appendChild(focusIndicator);
    }

    const taskActions = document.createElement('div');
    taskActions.className = 'task-actions';

    const subtaskToggleBtn = document.createElement('button');
    subtaskToggleBtn.className = 'subtask-toggle-btn';
    const completedCount = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0;
    const totalCount = task.subtasks ? task.subtasks.length : 0;
    subtaskToggleBtn.innerHTML = `☰ ${totalCount > 0 ? completedCount + '/' + totalCount : 'Add'}`;
    subtaskToggleBtn.setAttribute('aria-label', 'Toggle subtasks');
    subtaskToggleBtn.onclick = (e) => {
        e.stopPropagation();
        toggleSubtaskCollapse(task.id);
    };
    if (totalCount > 0) {
        subtaskToggleBtn.classList.add('has-subtasks');
    }

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

    taskActions.appendChild(subtaskToggleBtn);
    taskActions.appendChild(editBtn);
    taskActions.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(taskContent);
    li.appendChild(taskActions);

    if (task.subtasks) {
        const completedCount = task.subtasks.filter(s => s.completed).length;
        const totalCount = task.subtasks.length;
        const isCollapsed = window.collapsedSubtasks[task.id] !== false;

        const subtaskSection = document.createElement('div');
        subtaskSection.className = 'subtasks-section';

        const subtaskWrapper = document.createElement('div');
        subtaskWrapper.className = `subtasks-list-wrapper ${isCollapsed ? 'collapsed' : ''}`;

        if (task.subtasks.length > 0) {
            const subtaskList = document.createElement('ul');
            subtaskList.className = 'subtask-list';

task.subtasks.forEach(subtask => {
                const subtaskLi = document.createElement('li');
                subtaskLi.className = 'subtask-item';
                subtaskLi.dataset.subtaskId = subtask.id;

                const subtaskCheckbox = document.createElement('input');
                subtaskCheckbox.type = 'checkbox';
                subtaskCheckbox.className = 'subtask-checkbox';
                subtaskCheckbox.checked = subtask.completed;
                subtaskCheckbox.onchange = () => toggleSubtask(task.id, subtask.id);

                const subtaskText = document.createElement('span');
                subtaskText.className = 'subtask-text';
                subtaskText.textContent = subtask.text;
                subtaskText.dataset.subtaskId = subtask.id;
                if (subtask.completed) subtaskText.classList.add('completed');

                const subtaskEdit = document.createElement('button');
                subtaskEdit.className = 'subtask-edit';
                subtaskEdit.innerHTML = '&#9998;';
                subtaskEdit.onclick = (e) => {
                    e.stopPropagation();
                    editSubtask(task.id, subtask.id);
                };

                const subtaskDelete = document.createElement('button');
                subtaskDelete.className = 'delete-btn subtask-delete';
                subtaskDelete.innerHTML = '×';
                subtaskDelete.onclick = (e) => {
                    e.stopPropagation();
                    deleteSubtask(task.id, subtask.id);
                };

                subtaskLi.appendChild(subtaskCheckbox);
                subtaskLi.appendChild(subtaskText);
                subtaskLi.appendChild(subtaskEdit);
                subtaskLi.appendChild(subtaskDelete);
                subtaskList.appendChild(subtaskLi);
            });

            subtaskWrapper.appendChild(subtaskList);
        }

        const subtaskInput = document.createElement('input');
        subtaskInput.type = 'text';
        subtaskInput.className = 'subtask-input';
        subtaskInput.placeholder = 'Add a subtask...';
        subtaskInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                addSubtask(task.id, subtaskInput.value);
                subtaskInput.value = '';
            }
        });

        subtaskWrapper.appendChild(subtaskInput);

        subtaskSection.appendChild(subtaskWrapper);
        li.appendChild(subtaskSection);
    }

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

    if (task.completed && task.subtasks && task.subtasks.length > 0) {
        task.subtasks.forEach(subtask => {
            if (!subtask.completed) {
                subtask.completed = true;
                subtask.completedDate = new Date().toISOString();
            }
        });
    }

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

function deleteSubtask(taskId, subtaskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;

    task.subtasks = task.subtasks.filter(s => s.id !== subtaskId);
    saveTasks();
    renderTasks();
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
        showModal('This task already exists!');
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

    const message = `Are you sure you want to delete ${completedTasks.length} completed task${completedTasks.length !== 1 ? 's' : ''}?`;

    showConfirmModal(message, () => {
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
    });
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
    .subtask-toggle-btn {
        background-color: transparent;
        color: var(--text-muted);
        border: none;
        width: 3rem;
        height: 2rem;
        border-radius: var(--radius-md);
        cursor: pointer;
        font-size: 0.7rem;
        font-weight: 600;
        transition: all var(--transition-fast);
        display: flex;
        align-items: center;
        justify-content: center;
    }
.subtask-toggle-btn:hover {
        background-color: #6693F5;
        color: #fff;
        box-shadow: 0 0 12px rgba(102, 147, 245, 0.5);
    }
    .subtask-toggle-btn.has-subtasks {
        font-weight: 600;
    }
    .subtasks-section {
        display: flex;
        flex-direction: column;
        width: 100%;
        margin-top: 4px;
    }
    .subtasks-list-wrapper {
        overflow: hidden;
        transition: max-height var(--transition-normal), opacity var(--transition-normal);
        max-height: 500px;
        opacity: 1;
        padding: 8px;
        background-color: var(--bg-secondary);
        border-radius: var(--radius-sm);
    }
    .subtasks-list-wrapper.collapsed {
        max-height: 0;
        opacity: 0;
        padding: 0 12px;
    }
    .subtask-list {
        list-style: none;
        padding-left: 0;
        margin: 0 0 8px 0;
    }
    .subtask-item {
        display: flex;
        align-items: center;
    }
    .subtask-checkbox {
        appearance: none;
        width: 16px;
        height: 16px;
        border: 2px solid var(--border-color);
        border-radius: var(--radius-sm);
        background-color: var(--bg-primary);
        cursor: pointer;
        position: relative;
    }
    .subtask-checkbox:checked {
        background-color: var(--accent-primary);
        border-color: var(--accent-primary);
    }
    .subtask-checkbox:checked::after {
        content: '✓';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        font-size: 0.6rem;
        font-weight: 700;
    }
    .subtask-item::before {
        content: '↳';
        color: var(--text-muted);
        font-size: 1rem;
        font-weight: 600;
        padding-right: 4px;
    }
    .subtask-checkbox {
        margin-right: 4px;
    }
    .subtask-text {
        flex: 1;
        font-size: 0.875rem;
    }
    .subtask-text.completed {
        text-decoration: line-through;
        color: var(--text-muted);
    }
    .subtask-edit {
        background-color: transparent;
        color: var(--text-muted);
        border: none;
        width: 1.5rem;
        height: 1.5rem;
        border-radius: var(--radius-md);
        cursor: pointer;
        font-size: 0.75rem;
        font-weight: 600;
        transition: all var(--transition-fast);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
    }
    .task-item:hover .subtask-edit {
        opacity: 1;
    }
    .subtask-edit:hover {
        background-color: var(--accent-primary);
        color: #fff;
        box-shadow: 0 0 12px rgb(129 140 248 / 0.5);
    }
    .subtask-delete {
        background-color: transparent;
        color: var(--text-muted);
        border: none;
        width: 1.5rem;
        height: 1.5rem;
        border-radius: var(--radius-md);
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 600;
        transition: all var(--transition-fast);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
    }
    .task-item:hover .subtask-delete {
        opacity: 1;
    }
    .subtask-delete:hover {
        background-color: #ef4444;
        color: #fff;
        box-shadow: 0 0 12px rgb(239 68 68 / 0.5);
    }
    .subtask-input {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        font-size: 0.875rem;
        background-color: var(--bg-primary);
        color: var(--text-primary);
    }
    .subtask-input:focus {
        outline: none;
        border-color: var(--accent-color);
    }
`;
document.head.appendChild(style);

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}