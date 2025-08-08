// API URL
        const API_URL = 'http://localhost:3000/api/tasks';

        // --- READ Operation ---
        async function fetchTasks() {
            try {
                const response = await fetch(API_URL);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const tasks = await response.json();
                renderTasks(tasks);
            } catch (error) {
                console.error('Error fetching tasks:', error);
                const list = document.getElementById('task-list');
                list.innerHTML = `<li class="text-center text-red-500">Failed to load tasks. Please try again later.</li>`;
            }
        }

        // --- Helper function to render all tasks ---
        function renderTasks(tasks) {
            const list = document.getElementById('task-list');
            list.innerHTML = ''; // Clear existing tasks
            tasks.forEach(task => {
                const li = document.createElement('li');
                li.dataset.taskId = task.id;
                li.classList.add('flex', 'justify-between', 'items-center', 'bg-gray-50', 'p-4', 'rounded-lg', 'shadow-sm', 'transition-transform', 'duration-150', 'hover:scale-[1.01]');
                
                // Normal view mode
                const viewMode = document.createElement('div');
                viewMode.classList.add('flex', 'flex-grow', 'items-center', 'view-mode-controls');
                viewMode.innerHTML = `
                    <span class="task-title text-lg text-gray-700">${task.title}</span>
                    <div class="task-actions ml-auto flex space-x-2">
                        <button class="edit-btn p-1 text-blue-500 hover:text-blue-700 transition-colors duration-200">
                            ✏️
                        </button>
                        <button class="delete-btn p-1 text-red-500 hover:text-red-700 transition-colors duration-200">
                            🗑️
                        </button>
                    </div>
                `;

                // Editing mode
                const editMode = document.createElement('div');
                editMode.classList.add('flex', 'flex-grow', 'items-center', 'hidden', 'edit-mode-controls');
                editMode.innerHTML = `
                    <input type="text" class="edit-input flex-grow p-2" value="${task.title}">
                    <div class="flex space-x-2">
                        <button class="save-btn p-1 text-green-500 hover:text-green-700 transition-colors duration-200">
                            ✅
                        </button>
                        <button class="cancel-btn p-1 text-gray-500 hover:text-gray-700 transition-colors duration-200">
                            ❌
                        </button>
                    </div>
                `;

                li.appendChild(viewMode);
                li.appendChild(editMode);
                list.appendChild(li);
            });
        }
        
        // --- CREATE Operation ---
        async function createTask(taskTitle) {
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ title: taskTitle }),
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                await fetchTasks();
            } catch (error) {
                console.error('Error creating task:', error);
                // We are using a custom message box instead of alert.
                const message = 'Failed to add task.';
                const errorMessageElement = document.createElement('div');
                errorMessageElement.textContent = message;
                document.body.appendChild(errorMessageElement);
            }
        }

        // --- UPDATE Operation ---
        async function updateTask(taskId, updatedTitle) {
            try {
                const response = await fetch(`${API_URL}/${taskId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ title: updatedTitle }),
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                await fetchTasks(); // Re-fetch all tasks to update the UI
            } catch (error) {
                console.error('Error updating task:', error);
                 // We are using a custom message box instead of alert.
                const message = 'Failed to update task.';
                const errorMessageElement = document.createElement('div');
                errorMessageElement.textContent = message;
                document.body.appendChild(errorMessageElement);
            }
        }

        // --- DELETE Operation ---
        async function deleteTask(taskId) {
            try {
                const response = await fetch(`${API_URL}/${taskId}`, {
                    method: 'DELETE',
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                await fetchTasks();
            } catch (error) {
                console.error('Error deleting task:', error);
                // We are using a custom message box instead of alert.
                const message = 'Failed to delete task.';
                const errorMessageElement = document.createElement('div');
                errorMessageElement.textContent = message;
                document.body.appendChild(errorMessageElement);
            }
        }

        // --- Event Listeners ---
        document.addEventListener('DOMContentLoaded', fetchTasks);

        document.getElementById('task-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('task-input');
            const taskTitle = input.value.trim();
            if (taskTitle) {
                createTask(taskTitle);
                input.value = '';
            }
        });

        document.getElementById('task-list').addEventListener('click', (e) => {
            const listItem = e.target.closest('li');
            if (!listItem) return;
            const taskId = listItem.dataset.taskId;

            if (e.target.classList.contains('delete-btn')) {
                deleteTask(taskId);
            } else if (e.target.classList.contains('edit-btn')) {
                // Switch to editing mode
                listItem.classList.add('editing');
                listItem.querySelector('.view-mode-controls').classList.add('hidden');
                listItem.querySelector('.edit-mode-controls').classList.remove('hidden');
                listItem.querySelector('.edit-input').focus();
            } else if (e.target.classList.contains('save-btn')) {
                const updatedTitle = listItem.querySelector('.edit-input').value.trim();
                if (updatedTitle) {
                    updateTask(taskId, updatedTitle);
                }
            } else if (e.target.classList.contains('cancel-btn')) {
                // Revert to view mode
                listItem.classList.remove('editing');
                listItem.querySelector('.view-mode-controls').classList.remove('hidden');
                listItem.querySelector('.edit-mode-controls').classList.add('hidden');
            }
        });

        // Event listener for "Enter" keypress in the edit input
        document.getElementById('task-list').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const listItem = e.target.closest('li');
                if (listItem && listItem.classList.contains('editing')) {
                    const taskId = listItem.dataset.taskId;
                    const updatedTitle = e.target.value.trim();
                    if (updatedTitle) {
                        updateTask(taskId, updatedTitle);
                    }
                }
            }
        });