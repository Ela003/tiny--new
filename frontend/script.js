const API = "http://18.61.174.104:3000"

// ===============================
// LOAD ALL TASKS
// ===============================
async function loadTasks() {
    const list = document.getElementById("taskList");
    const status = document.getElementById("status");

    try {
        status.textContent = "Loading tasks...";

        const response = await fetch(`${API}/api/tasks`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const tasks = await response.json();

        list.innerHTML = "";

        if (tasks.length === 0) {
            list.innerHTML = "<li>No tasks found.</li>";
        }

        tasks.forEach(task => {
            const li = document.createElement("li");

            li.className = "task-item";

            li.innerHTML = `
                <span class="task-title">${escapeHTML(task.title)}</span>

                <div class="task-buttons">
                    <button
                        class="update-btn"
                        onclick="updateTask(${task.id}, '${escapeJS(task.title)}')">
                        Update
                    </button>

                    <button
                        class="delete-btn"
                        onclick="deleteTask(${task.id})">
                        Delete
                    </button>
                </div>
            `;

            list.appendChild(li);
        });

        status.textContent = `${tasks.length} task(s)`;

    } catch (error) {
        console.error("Load tasks failed:", error);

        status.textContent = "Unable to connect to server";
    }
}


// ===============================
// ADD TASK
// ===============================
async function addTask() {

    const input = document.getElementById("taskInput");

    const title = input.value.trim();

    if (!title) {
        alert("Please enter a task");
        return;
    }

    try {

        const response = await fetch(`${API}/api/tasks`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                title: title
            })
        });

        const data = await response.json();

        if (!response.ok) {

            console.error("Add task failed:", data);

            document.getElementById("status").textContent =
                "Failed to add task";

            return;
        }

        input.value = "";

        await loadTasks();

    } catch (error) {

        console.error("Add task error:", error);

        document.getElementById("status").textContent =
            "Unable to connect to server";
    }
}


// ===============================
// DELETE TASK
// ===============================
async function deleteTask(id) {

    console.log("Deleting task ID:", id);

    const confirmDelete = confirm(
        "Are you sure you want to delete this task?"
    );

    if (!confirmDelete) {
        return;
    }

    try {

        const response = await fetch(
            `${API}/api/tasks/${id}`,
            {
                method: "DELETE"
            }
        );

        console.log("Delete status:", response.status);

        const text = await response.text();

        console.log("Delete response:", text);

        if (!response.ok) {

            console.error(
                "Delete failed:",
                response.status,
                text
            );

            document.getElementById("status").textContent =
                "Failed to delete task";

            return;
        }

        document.getElementById("status").textContent =
            "Task deleted successfully";

        await loadTasks();

    } catch (error) {

        console.error("Delete error:", error);

        document.getElementById("status").textContent =
            "Unable to connect to server";
    }
}


// ===============================
// UPDATE TASK
// ===============================
async function updateTask(id, oldTitle) {

    const newTitle = prompt(
        "Update task:",
        oldTitle
    );

    if (newTitle === null) {
        return;
    }

    const title = newTitle.trim();

    if (!title) {
        alert("Task cannot be empty");
        return;
    }

    try {

        const response = await fetch(
            `${API}/api/tasks/${id}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    title: title
                })
            }
        );

        const data = await response.json();

        console.log("Update response:", data);

        if (!response.ok) {

            console.error("Update failed:", data);

            document.getElementById("status").textContent =
                "Failed to update task";

            return;
        }

        document.getElementById("status").textContent =
            "Task updated successfully";

        await loadTasks();

    } catch (error) {

        console.error("Update error:", error);

        document.getElementById("status").textContent =
            "Unable to connect to server";
    }
}


// ===============================
// SECURITY HELPERS
// ===============================
function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


function escapeJS(text) {

    return text
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r");
}


// ===============================
// ENTER KEY = ADD TASK
// ===============================
document.addEventListener("DOMContentLoaded", () => {

    const input = document.getElementById("taskInput");

    if (input) {

        input.addEventListener("keydown", (event) => {

            if (event.key === "Enter") {
                addTask();
            }

        });
    }

    loadTasks();
});
