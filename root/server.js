// server.js

// 1. Import necessary modules
// Express is the web framework for Node.js
const express = require('express');
// CORS (Cross-Origin Resource Sharing) is a mechanism that allows a server
// to indicate any origins (domain, scheme, or port) other than its own from which
// a browser should permit loading of resources. This is essential for our
// front-end (on one origin) to talk to our back-end (on another).
const cors = require('cors');

// 2. Initialize the Express application
const app = express();
const port = 3000;

// 3. Apply middleware
// `express.json()` is a built-in middleware function in Express. It parses incoming
// JSON payloads from the client and makes them available on `req.body`.
app.use(express.json());
// `cors()` enables all CORS requests from the front-end.
app.use(cors());

// 4. Our "in-memory database"
// In a real application, this would be replaced with a database like Firestore, MongoDB, etc.
let tasks = [
    { id: 1, title: 'Learn Node.js', completed: false },
    { id: 2, title: 'Build a CRUD app', completed: false },
    { id: 3, title: 'Deploy the application', completed: false },
];

let nextTaskId = 4;

// --- API Endpoints for CRUD Operations ---

// 5. READ: Get all tasks
// This handles GET requests to the '/api/tasks' endpoint.
// It sends back the entire `tasks` array as a JSON response.
app.get('/api/tasks', (req, res) => {
    res.json(tasks);
});

// 6. CREATE: Add a new task
// This handles POST requests to the '/api/tasks' endpoint.
app.post('/api/tasks', (req, res) => {
    // We expect the new task's title to be in the request body.
    const { title } = req.body;

    // Basic input validation
    if (!title) {
        return res.status(400).json({ error: 'Task title is required.' });
    }

    // Create a new task object with a unique ID
    const newTask = {
        id: nextTaskId++, // Assign and increment the unique ID
        title,
        completed: false,
    };

    // Add the new task to our "database"
    tasks.push(newTask);

    // Send back the newly created task with a 201 Created status code.
    res.status(201).json(newTask);
});

// 7. UPDATE: Update a task by ID
// This handles PUT requests to '/api/tasks/:id', where ':id' is a URL parameter.
app.put('/api/tasks/:id', (req, res) => {
    // Get the task ID from the URL parameters.
    const taskId = parseInt(req.params.id);

    // Get the updated data from the request body.
    const { title, completed } = req.body;

    // Find the task in our array by its ID.
    const task = tasks.find(t => t.id === taskId);

    // If the task is not found, return a 404 Not Found error.
    if (!task) {
        return res.status(404).json({ error: 'Task not found.' });
    }

    // Update the task's properties if they are provided in the request body.
    if (title) {
        task.title = title;
    }
    if (typeof completed === 'boolean') {
        task.completed = completed;
    }

    // Send back the updated task object.
    res.json(task);
});

// 8. DELETE: Delete a task by ID
// This handles DELETE requests to '/api/tasks/:id'.
app.delete('/api/tasks/:id', (req, res) => {
    // Get the task ID from the URL parameters.
    const taskId = parseInt(req.params.id);

    // Find the index of the task in our array.
    const taskIndex = tasks.findIndex(t => t.id === taskId);

    // If the task is not found, return a 404 Not Found error.
    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Task not found.' });
    }

    // Remove the task from the array using `splice`.
    tasks.splice(taskIndex, 1);

    // Send a 204 No Content status, which is standard for successful deletion.
    // We don't send back any data.
    res.status(204).send();
});

// 9. Start the server
// This starts the server and listens for incoming requests on the specified port.
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
