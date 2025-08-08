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
            
            // Navigation buttons
            Object.keys(navButtons).forEach(view => {
                navButtons[view].addEventListener('click', () => {
                    setActiveView(view);
                });
            });
            
            // Task list events
            document.getElementById('task-list').addEventListener('click', handleTaskAction);
        }
        
        // --- Set active view ---
        function setActiveView(view) {
            currentView = view;
            
            // Update active button
            Object.keys(navButtons).forEach(key => {
                navButtons[key].classList.toggle('active', key === view);
            });
            
            // Re-render tasks
            renderTasks();
        }
        
        // --- READ Operation ---
        function fetchTasks() {
             // This is now handled by loadTasksFromLocalStorage()
             // So this function is no longer async
            renderTasks();
        }
        
        // --- Render tasks based on current view ---
        function renderTasks() {
            const list = document.getElementById('task-list');
            const emptyState = document.getElementById('empty-state');
            
            // Filter tasks based on current view
            let filteredTasks = tasks;
            
            switch(currentView) {
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
                
                // Add status classes
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
                titleDiv.innerHTML = `
                    <span class="task-title text-lg font-medium">${task.title}</span>
                `;
                
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
                
                // Restore button for deleted tasks
                if (task.deletedAt) {
                    const restoreBtn = document.createElement('button');
                    restoreBtn.classList.add('restore-btn', 'action-btn');
                    restoreBtn.innerHTML = '<i class="fas fa-trash-restore text-green-500"></i>';
                    restoreBtn.title = 'Restore task';
                    actionsDiv.appendChild(restoreBtn);
                } 
                // Action buttons for active tasks
                else {
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
                }
                
                // Permanently delete button for deleted tasks
                if (task.deletedAt) {
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
            } 
            else if (e.target.closest('.pin-btn')) {
                togglePin(task);
            }
            else if (e.target.closest('.edit-btn')) {
                startEditing(listItem, task);
            }
            else if (e.target.closest('.delete-btn')) {
                softDeleteTask(task);
            }
            else if (e.target.closest('.restore-btn')) {
                restoreTask(task);
            }
            else if (e.target.closest('.permanent-delete-btn')) {
                permanentDeleteTask(task);
            }
        }
        
        // --- Toggle task completion ---
        function toggleComplete(task) {
            task.completed = !task.completed;
            task.updatedAt = new Date().toISOString();
            renderTasks();
            saveTasksToLocalStorage();
            showMessage(`Task marked as ${task.completed ? 'completed' : 'incomplete'}`, false);
        }
        
        // --- Toggle task pinning ---
        function togglePin(task) {
            task.pinned = !task.pinned;
            renderTasks();
            saveTasksToLocalStorage();
            showMessage(`Task ${task.pinned ? 'pinned' : 'unpinned'}`, false);
        }
        
        // --- Start editing a task ---
        function startEditing(listItem, task) {
            const titleDiv = listItem.querySelector('.task-title');
            const actionsDiv = listItem.querySelector('.task-actions');
            const originalTitle = titleDiv.textContent;
            
            // Hide original title and buttons
            titleDiv.style.display = 'none';
            actionsDiv.style.display = 'none';

            // Create edit form
            const editForm = document.createElement('form');
            editForm.classList.add('edit-form', 'flex', 'items-center', 'flex-grow');
            editForm.innerHTML = `
                <input type="text" 
                       class="edit-input border p-2 rounded-lg w-full mr-2" 
                       value="${originalTitle}"
                       autofocus>
                <button type="submit" class="save-edit-btn bg-green-500 text-white p-2 rounded-lg"><i class="fas fa-check"></i></button>
                <button type="button" class="cancel-edit-btn bg-gray-500 text-white p-2 rounded-lg ml-1"><i class="fas fa-times"></i></button>
            `;
            listItem.prepend(editForm);
            
            const editInput = listItem.querySelector('.edit-input');
            editInput.focus();

            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const newTitle = editInput.value.trim();
                if (newTitle) {
                    updateTask(task, newTitle);
                }
            });
            
            listItem.querySelector('.cancel-edit-btn').addEventListener('click', () => {
                // Revert to original state
                titleDiv.style.display = 'block';
                actionsDiv.style.display = 'flex';
                editForm.remove();
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
                renderTasks();
                saveTasksToLocalStorage();
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
                renderTasks();
                saveTasksToLocalStorage();
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
                renderTasks();
                saveTasksToLocalStorage();
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
                renderTasks();
                saveTasksToLocalStorage();
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
                    renderTasks();
                    saveTasksToLocalStorage();
                    showMessage('Task permanently deleted', false);
                }
            } catch (error) {
                console.error('Error deleting task:', error);
                showMessage('Failed to delete task. Please try again.', true);
            }
        }
        
        // --- Show user messages ---
        function showMessage(text, isError) {
            // Remove existing messages
            const existingMessages = document.querySelectorAll('.user-message');
            existingMessages.forEach(msg => msg.remove());
            
            // Create message element
            const message = document.createElement('div');
            message.className = `user-message fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg text-white font-medium transition-all duration-300 transform translate-x-full ease-out ${
                isError ? 'bg-red-500' : 'bg-green-500'
            }`;
            message.textContent = text;
            document.body.appendChild(message);
            
            // Animate in
            setTimeout(() => {
                message.style.transform = 'translateX(0)';
            }, 10);
            
            // Auto remove after 3 seconds
            setTimeout(() => {
                message.style.transform = 'translateX(100%)';
                setTimeout(() => message.remove(), 300);
            }, 3000);
        }