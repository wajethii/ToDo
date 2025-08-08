// Use an empty string for the API key in the code. Canvas will automatically provide it at runtime.
const apiKey = "";

// --- DATA PERSISTENCE with localStorage ---
function saveTasksToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasksFromLocalStorage() {
    const storedTasks = localStorage.getItem('tasks');
    return storedTasks ? JSON.parse(storedTasks) : [];
}

// --- Custom Confirmation Modal ---
function customConfirm(message) {
    return new Promise((resolve) => {
        const modalOverlay = document.getElementById('confirm-modal-overlay');
        const modalMessage = document.getElementById('confirm-modal-message');
        const yesButton = document.getElementById('confirm-modal-yes');
        const noButton = document.getElementById('confirm-modal-no');

        if (!modalOverlay || !modalMessage || !yesButton || !noButton) {
            // Fallback for cases where the modal isn't in the DOM
            resolve(window.confirm(message));
            return;
        }

        modalMessage.textContent = message;
        modalOverlay.classList.remove('hidden');

        const handleYes = () => {
            modalOverlay.classList.add('hidden');
            yesButton.removeEventListener('click', handleYes);
            noButton.removeEventListener('click', handleNo);
            resolve(true);
        };

        const handleNo = () => {
            modalOverlay.classList.add('hidden');
            yesButton.removeEventListener('click', handleYes);
            noButton.removeEventListener('click', handleNo);
            resolve(false);
        };

        yesButton.addEventListener('click', handleYes);
        noButton.addEventListener('click', handleNo);
    });
}

// API URL - would be replaced with real API in production
const API_URL = 'http://localhost:3000/api/tasks';

// Current view state
let currentView = 'all';
let tasks = [];

// Navigation elements
const navButtons = {
    all: document.getElementById('all-tasks'),
    active: document.getElementById('active-tasks'),
    completed: document.getElementById('completed-tasks'),
    deleted: document.getElementById('deleted-tasks')
};

// Mobile navigation elements
const mobileNav = document.getElementById('mobile-nav');
const openBtn = document.getElementById('open-mobile-nav');
const closeBtn = document.getElementById('close-mobile-nav');
const overlay = document.getElementById('overlay');

// --- Mobile Navigation Logic ---
function openMobileNav() {
    mobileNav.classList.remove('-translate-x-full');
    overlay.classList.remove('hidden');
}

function closeMobileNav() {
    mobileNav.classList.add('-translate-x-full');
    overlay.classList.add('hidden');
}

// --- Initialize the app ---
document.addEventListener('DOMContentLoaded', () => {
    tasks = loadTasksFromLocalStorage();
    renderTasks();
    setupEventListeners();
});

// --- Set up event listeners ---
function setupEventListeners() {
    // Form submission
    document.getElementById('task-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('task-input');
        const taskTitle = input.value.trim();
        if (taskTitle) {
            createTask(taskTitle);
            input.value = '';
        }
    });

    // Navigation buttons (desktop and mobile)
    document.querySelectorAll('.nav-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const view = e.currentTarget.id.replace('-tasks', '');
            setActiveView(view);
            // Close mobile nav after selection
            if (window.innerWidth < 768) {
                closeMobileNav();
            }
        });
    });

    // Task list events
    document.getElementById('task-list').addEventListener('click', handleTaskAction);

    // Mobile nav events
    if (openBtn) openBtn.addEventListener('click', openMobileNav);
    if (closeBtn) closeBtn.addEventListener('click', closeMobileNav);
    if (overlay) overlay.addEventListener('click', closeMobileNav);
}

// --- Set active view ---
function setActiveView(view) {
    currentView = view;

    // Update active button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.id === `${view}-tasks`) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Re-render tasks
    renderTasks();
}

// --- Render tasks based on current view ---
function renderTasks() {
    const list = document.getElementById('task-list');
    const emptyState = document.getElementById('empty-state');

    // Filter tasks based on current view
    let filteredTasks = tasks;

    switch (currentView) {
        case 'active':
            filteredTasks = tasks.filter(task =>
                !task.completed && !task.deletedAt
            );
            break;
        case 'completed':
            filteredTasks = tasks.filter(task =>
                task.completed && !task.deletedAt
            );
            break;
        case 'deleted':
            filteredTasks = tasks.filter(task =>
                task.deletedAt
            );
            break;
        default: // 'all'
            filteredTasks = tasks.filter(task =>
                !task.deletedAt
            );
    }

    // Sort tasks: pinned first, then by creation date
    filteredTasks.sort((a, b) => {
        // Pinned tasks first
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;

        // Then sort by creation date (newest first)
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Update pinned count
    const pinnedCount = tasks.filter(task => task.pinned && !task.deletedAt).length;
    document.getElementById('pinned-count').textContent = pinnedCount;

    // Clear the list
    list.innerHTML = '';

    // Show empty state if no tasks
    if (filteredTasks.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    // Render each task
    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.dataset.taskId = task.id;
        li.classList.add('task-item', 'flex', 'justify-between', 'items-start', 'p-4', 'rounded-lg', 'shadow-sm', 'mb-2');

        // Add status classes from your CSS
        if (task.pinned && !task.deletedAt) {
            li.classList.add('pinned-task');
        }
        if (task.completed) {
            li.classList.add('completed-task');
        }
        if (task.deletedAt) {
            li.classList.add('deleted-task');
        }

        // Task content
        const taskContent = document.createElement('div');
        taskContent.classList.add('flex', 'items-start', 'flex-grow');

        // Complete button
        const completeBtn = document.createElement('button');
        completeBtn.classList.add('complete-btn', 'action-btn', 'mr-3', 'mt-1');
        completeBtn.innerHTML = task.completed ?
            '<i class="fas fa-check-circle text-green-500"></i>' :
            '<i class="far fa-circle text-gray-400"></i>';

        // Task details
        const detailsDiv = document.createElement('div');
        detailsDiv.classList.add('flex-grow');

        const titleDiv = document.createElement('div');
        titleDiv.classList.add('flex', 'items-center');
        titleDiv.innerHTML = `<span class="task-title text-lg font-medium">${task.title}</span>`;

        // Dates
        const dateDiv = document.createElement('div');
        dateDiv.classList.add('task-date', 'mt-1', 'text-sm');
        const createdAt = new Date(task.createdAt);

        dateDiv.innerHTML = `
            <div>Created: ${createdAt.toLocaleDateString()} at ${createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
        `;

        if (task.completed) {
            const updatedAt = new Date(task.updatedAt);
            dateDiv.innerHTML += `
                <div>Completed: ${updatedAt.toLocaleDateString()} at ${updatedAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            `;
        } else if (task.deletedAt) {
            const deletedAt = new Date(task.deletedAt);
            dateDiv.innerHTML += `
                <div>Deleted: ${deletedAt.toLocaleDateString()} at ${deletedAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            `;
        }

        detailsDiv.appendChild(titleDiv);
        detailsDiv.appendChild(dateDiv);

        // Action buttons
        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('task-actions', 'flex', 'space-x-2', 'ml-4', 'mt-1');

        // Buttons for active tasks
        if (!task.deletedAt) {
            // Pin button
            const pinBtn = document.createElement('button');
            pinBtn.classList.add('pin-btn', 'action-btn');
            pinBtn.innerHTML = task.pinned ?
                '<i class="fas fa-thumbtack text-blue-500"></i>' :
                '<i class="fas fa-thumbtack text-gray-400"></i>';
            pinBtn.title = task.pinned ? 'Unpin task' : 'Pin task';

            // Edit button
            const editBtn = document.createElement('button');
            editBtn.classList.add('edit-btn', 'action-btn');
            editBtn.innerHTML = '<i class="fas fa-edit text-blue-400"></i>';
            editBtn.title = 'Edit task';

            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-btn', 'action-btn');
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt text-red-400"></i>';
            deleteBtn.title = 'Delete task';

            actionsDiv.appendChild(pinBtn);
            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);
        } else {
            // Restore button for deleted tasks
            const restoreBtn = document.createElement('button');
            restoreBtn.classList.add('restore-btn', 'action-btn');
            restoreBtn.innerHTML = '<i class="fas fa-trash-restore text-green-500"></i>';
            restoreBtn.title = 'Restore task';
            actionsDiv.appendChild(restoreBtn);

            // Permanently delete button for deleted tasks
            const permanentDeleteBtn = document.createElement('button');
            permanentDeleteBtn.classList.add('permanent-delete-btn', 'action-btn');
            permanentDeleteBtn.innerHTML = '<i class="fas fa-trash text-red-500"></i>';
            permanentDeleteBtn.title = 'Permanently delete';
            actionsDiv.appendChild(permanentDeleteBtn);
        }

        // Assemble the task
        taskContent.appendChild(completeBtn);
        taskContent.appendChild(detailsDiv);

        li.appendChild(taskContent);
        li.appendChild(actionsDiv);

        list.appendChild(li);
    });
}

// --- Handle task actions ---
function handleTaskAction(e) {
    const listItem = e.target.closest('li');
    if (!listItem) return;

    const taskId = parseInt(listItem.dataset.taskId);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (e.target.closest('.complete-btn')) {
        toggleComplete(task);
    } else if (e.target.closest('.pin-btn')) {
        togglePin(task);
    } else if (e.target.closest('.edit-btn')) {
        startEditing(listItem, task);
    } else if (e.target.closest('.delete-btn')) {
        softDeleteTask(task);
    } else if (e.target.closest('.restore-btn')) {
        restoreTask(task);
    } else if (e.target.closest('.permanent-delete-btn')) {
        permanentDeleteTask(task);
    }
}

// --- Toggle task completion ---
function toggleComplete(task) {
    task.completed = !task.completed;
    task.updatedAt = new Date().toISOString();
    saveTasksToLocalStorage();
    renderTasks();
    showMessage(`Task marked as ${task.completed ? 'completed' : 'incomplete'}`, false);
}

// --- Toggle task pinning ---
function togglePin(task) {
    task.pinned = !task.pinned;
    saveTasksToLocalStorage();
    renderTasks();
    showMessage(`Task ${task.pinned ? 'pinned' : 'unpinned'}`, false);
}

// --- Start editing a task ---
function startEditing(listItem, task) {
    const titleDiv = listItem.querySelector('.task-title');
    const originalTitle = titleDiv.textContent;

    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'edit-input border p-2 rounded-lg w-full flex-grow focus:outline-none focus:ring-2 focus:ring-blue-500';
    editInput.value = originalTitle;

    const saveBtn = document.createElement('button');
    saveBtn.className = 'save-edit-btn bg-green-500 text-white p-2 rounded-lg ml-2';
    saveBtn.innerHTML = '<i class="fas fa-check"></i>';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'cancel-edit-btn bg-gray-500 text-white p-2 rounded-lg ml-1';
    cancelBtn.innerHTML = '<i class="fas fa-times"></i>';

    const currentContent = listItem.querySelector('.flex-grow');
    currentContent.innerHTML = '';
    currentContent.appendChild(editInput);
    currentContent.appendChild(saveBtn);
    currentContent.appendChild(cancelBtn);

    editInput.focus();

    const saveEdit = () => {
        const newTitle = editInput.value.trim();
        if (newTitle && newTitle !== originalTitle) {
            updateTask(task, newTitle);
        } else {
            // Restore original state if no change or empty
            renderTasks();
        }
    };

    saveBtn.addEventListener('click', saveEdit);
    editInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEdit();
        }
    });
    cancelBtn.addEventListener('click', () => {
        renderTasks(); // Re-render to revert
    });
}

// --- CREATE Operation ---
async function createTask(taskTitle) {
    try {
        const newTask = {
            id: Date.now(), // Use a unique timestamp for the ID
            title: taskTitle,
            completed: false,
            pinned: false,
            deletedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        tasks.unshift(newTask);
        saveTasksToLocalStorage();
        renderTasks();
        showMessage('Task created successfully!', false);
    } catch (error) {
        console.error('Error creating task:', error);
        showMessage('Failed to create task. Please try again.', true);
    }
}

// --- UPDATE Operation ---
async function updateTask(task, updatedTitle) {
    try {
        task.title = updatedTitle;
        task.updatedAt = new Date().toISOString();
        saveTasksToLocalStorage();
        renderTasks();
        showMessage('Task updated successfully!', false);
    } catch (error) {
        console.error('Error updating task:', error);
        showMessage('Failed to update task. Please try again.', true);
    }
}

// --- SOFT DELETE Operation ---
async function softDeleteTask(task) {
    try {
        task.deletedAt = new Date().toISOString();
        saveTasksToLocalStorage();
        renderTasks();
        showMessage('Task moved to trash', false);
    } catch (error) {
        console.error('Error deleting task:', error);
        showMessage('Failed to delete task. Please try again.', true);
    }
}

// --- RESTORE Operation ---
async function restoreTask(task) {
    try {
        task.deletedAt = null;
        saveTasksToLocalStorage();
        renderTasks();
        showMessage('Task restored successfully!', false);
    } catch (error) {
        console.error('Error restoring task:', error);
        showMessage('Failed to restore task. Please try again.', true);
    }
}

// --- PERMANENT DELETE Operation ---
async function permanentDeleteTask(task) {
    try {
        const confirmed = await customConfirm('Are you sure you want to permanently delete this task? This action cannot be undone.');
        if (confirmed) {
            tasks = tasks.filter(t => t.id !== task.id);
            saveTasksToLocalStorage();
            renderTasks();
            showMessage('Task permanently deleted', false);
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        showMessage('Failed to delete task. Please try again.', true);
    }
}

// --- Show user messages ---
function showMessage(text, isError) {
    const message = document.createElement('div');
    message.className = `user-message fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg text-white font-medium transition-all duration-300 transform translate-x-full ease-out ${
        isError ? 'bg-red-500' : 'bg-green-500'
    }`;
    message.textContent = text;
    document.body.appendChild(message);

    setTimeout(() => {
        message.style.transform = 'translateX(0)';
    }, 10);

    setTimeout(() => {
        message.style.transform = 'translateX(100%)';
        setTimeout(() => message.remove(), 300);
    }, 3000);
}