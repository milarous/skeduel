const tasks = JSON.parse(localStorage.getItem('tasks')) || [];

function addTask() {
    const input = document.getElementById('new-task-input');
    const text = input.value.trim();
    if (text) {
        tasks.push({ text: text, completed: false });
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks();
        input.value = '';
    }
}

function renderTasks() {
    const taskList = document.querySelector('.task-list');
    const emptyMessage = document.getElementById('empty-message');
    taskList.innerHTML = '';

    if (tasks.length === 0) {
        emptyMessage.style.display = 'block';
    } else {
        emptyMessage.style.display = 'none';
        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.className = 'task-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'task-checkbox';
            checkbox.checked = task.completed;
            checkbox.onchange = () => toggleTask(index);
            
            const span = document.createElement('span');
            span.textContent = task.text;
            span.className = 'task-text';
            if (task.completed) {
                span.classList.add('completed');
            }
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'X';
            deleteBtn.onclick = () => deleteTask(index);
            
            li.appendChild(checkbox);
            li.appendChild(span);
            li.appendChild(deleteBtn);
            taskList.appendChild(li);
        });
    }
}

function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderTasks();
}

function deleteTask(index) {
    tasks.splice(index, 1);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderTasks();
}

function toggleTheme() {
    const html = document.documentElement;
    const themeToggle = document.querySelector('.theme-toggle');
    
    if (html.getAttribute('data-theme') === 'dark') {
        html.removeAttribute('data-theme');
        themeToggle.textContent = '🌙 Dark Mode';
        localStorage.setItem('theme', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        themeToggle.textContent = '☀️ Light Mode';
        localStorage.setItem('theme', 'dark');
    }
}

function applyTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeToggle = document.querySelector('.theme-toggle');
    
    if (savedTheme === 'light') {
        document.documentElement.removeAttribute('data-theme');
        themeToggle.textContent = '🌙 Dark Mode';
    } else {
        // Default to dark mode if no preference or dark preference
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.textContent = '☀️ Light Mode';
        if (!savedTheme) {
            localStorage.setItem('theme', 'dark');
        }
    }
}

window.onload = () => {
    applyTheme();
    renderTasks();
    
    // Add Enter key listener to input field
    const input = document.getElementById('new-task-input');
    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            addTask();
        }
    });
};