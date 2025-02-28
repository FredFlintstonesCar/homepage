// Initialize urls array from localStorage or default
let urls = JSON.parse(localStorage.getItem('urls')) || [
];

// Save URLs to localStorage
function saveUrls() {
    localStorage.setItem('urls', JSON.stringify(urls));
}

// Global function for updating the grid order
function updateOrder() {
    const clickCounts = JSON.parse(localStorage.getItem('linkClickCounts')) || {};
    
    // Sort urls by click count
    const sortedUrls = [...urls].sort((a, b) => (clickCounts[b.url] || 0) - (clickCounts[a.url] || 0));

    // Clear existing grid
    const gridContainer = document.querySelector('.grid-container');
    if (!gridContainer) return;
    gridContainer.innerHTML = '';

    // Create and append elements
    sortedUrls.forEach(urlData => {
        const container = document.createElement('div');
        container.className = 'icon-container';
        
        const link = document.createElement('a');
        link.href = urlData.url;
        link.target = '_parent';
        link.onclick = () => updateClickCount(urlData.url);

        const img = document.createElement('img');
        img.src = urlData.image;
        img.className = 'icon';
        img.alt = urlData.name;
        img.title = urlData.name;
        
        const text = document.createElement('span');
        text.className = 'link-text';
        text.textContent = urlData.name;
        text.title = urlData.name;

        const clickCount = document.createElement('span');
        clickCount.className = 'click-count';
        clickCount.textContent = `${clickCounts[urlData.url] || 0}`;

        link.appendChild(img);
        link.appendChild(text);
        link.appendChild(clickCount);
        container.appendChild(link);
        gridContainer.appendChild(container);
    });
}

function updateClickCount(url) {
    const clickCounts = JSON.parse(localStorage.getItem('linkClickCounts')) || {};
    clickCounts[url] = (clickCounts[url] || 0) + 1;
    localStorage.setItem('linkClickCounts', JSON.stringify(clickCounts));
    
    // Force reload the grid to update counts
    // updateOrder();
}

document.addEventListener("DOMContentLoaded", () => {
    const grid = document.querySelector(".grid-container");
    const placeholder = document.createElement("div");
    placeholder.className = "placeholder";
    let draggedItem = null;

    function saveOrder() {
        const containers = Array.from(grid.querySelectorAll('.icon-container'));
        const order = containers.map(container => container.dataset.url);
        localStorage.setItem('linkOrder', JSON.stringify(order));
    }

    function truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    grid.addEventListener("dragover", (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(grid, e.clientX, e.clientY);

        if (afterElement) {
            afterElement.parentElement.insertBefore(placeholder, afterElement);
        } else {
            grid.appendChild(placeholder);
        }
    });

    grid.addEventListener("drop", (e) => {
        e.preventDefault();
        if (placeholder.parentNode) {
            placeholder.parentNode.insertBefore(draggedItem, placeholder);
            placeholder.parentNode.removeChild(placeholder);
        }
        saveOrder();
    });

    function getDragAfterElement(container, x, y) {
        const draggableElements = [...container.querySelectorAll(".icon-container:not(.dragging)")];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // Get the saved order from localStorage or create a new one
    let order = JSON.parse(localStorage.getItem('linkOrder')) || {};
    
    // If there are new items, add them to the order
    urls.forEach((url, index) => {
        if (!(url.url in order)) {
            order[url.url] = index;
        }
    });
    
    // Save the updated order
    if (Object.keys(order).length > 0) {
        localStorage.setItem('linkOrder', JSON.stringify(order));
    }

    // Initialize
    updateOrder();
    initializeToggle();
    setupColorPicker();
    
    // Load saved tasks
    const savedTasks = JSON.parse(localStorage.getItem('tasks')) || { red: [], yellow: [], green: [] };
    loadTasksFromData(savedTasks);

    // Add event listener for the add button
    document.getElementById('add-button').addEventListener('click', addTask);
    
    // Add event listener for Enter key in input field
    document.getElementById('todo-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTask();
        }
    });
});

function initializeToggle() {
    const toggleBtn = document.getElementById('todo-toggle');
    const content = document.getElementById('todo-content');
    const toggleIcon = toggleBtn.querySelector('.toggle-icon');
    const toggleText = toggleBtn.querySelector('.toggle-text');
    
    // Load saved state without animation
    const isCollapsed = localStorage.getItem('todoListCollapsed') === 'true';
    if (isCollapsed) {
        content.classList.add('collapsed');
        toggleBtn.classList.add('collapsed');
        toggleText.textContent = 'To Do';
    }
    
    // Enable animations after initial state is set
    setTimeout(() => {
        content.classList.add('animate-enabled');
    }, 100);
    
    toggleBtn.addEventListener('click', () => {
        const isNowCollapsed = content.classList.toggle('collapsed');
        toggleBtn.classList.toggle('collapsed');
        toggleText.textContent = isNowCollapsed ? 'To Do' : 'To Do';
        localStorage.setItem('todoListCollapsed', isNowCollapsed);
    });
}

function setupColorPicker() {
    const colorPicker = document.querySelector(".task-color-picker");
    colorPicker.addEventListener("click", (event) => {
        if (event.target.classList.contains("color-option")) {
            document.querySelectorAll(".color-option").forEach(el => el.classList.remove("selected"));
            event.target.classList.add("selected");
        }
    });
}

function getSelectedColor() {
    const selected = document.querySelector(".color-option.selected");
    return selected ? selected.dataset.color : "green";
}

function updateGroupVisibility() {
    ['red', 'yellow', 'green'].forEach(color => {
        const group = document.getElementById(color + "-tasks");
        const hasItems = group.children.length > 0;
        group.style.display = hasItems ? 'flex' : 'none';
    });
}

function loadTasksFromData(tasksData) {
    Object.keys(tasksData).forEach(color => {
        const taskGroup = document.getElementById(`${color}-tasks`);
        // Clear existing tasks
        taskGroup.innerHTML = '';

        // Add saved tasks
        tasksData[color].forEach(taskText => {
            createTaskElement(taskText, color, taskGroup);
        });
    });
}

function createTaskElement(taskText, color, taskGroup) {
    const taskElement = document.createElement('li');
    taskElement.dataset.color = color;
    
    const taskTextSpan = document.createElement('span');
    taskTextSpan.className = 'task-text';
    taskTextSpan.contentEditable = 'true';
    taskTextSpan.textContent = taskText;
    
    taskTextSpan.addEventListener('blur', () => {
        saveTasks();
    });
    taskTextSpan.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            taskTextSpan.blur();
        }
    });
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'task-delete';
    deleteButton.textContent = '×';
    deleteButton.onclick = () => removeTask(deleteButton);
    
    taskElement.appendChild(taskTextSpan);
    taskElement.appendChild(deleteButton);
    taskGroup.appendChild(taskElement);
    return taskElement;
}

function saveTasks() {
    const tasks = {
        red: Array.from(document.getElementById('red-tasks').children)
            .map(task => task.querySelector('.task-text').textContent),
        yellow: Array.from(document.getElementById('yellow-tasks').children)
            .map(task => task.querySelector('.task-text').textContent),
        green: Array.from(document.getElementById('green-tasks').children)
            .map(task => task.querySelector('.task-text').textContent)
    };
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function importTasks(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Import tasks
                if (importedData.tasks) {
                    loadTasksFromData(importedData.tasks);
                    // Save imported tasks to localStorage
                    localStorage.setItem('tasks', JSON.stringify(importedData.tasks));
                }

                // Import webpage data
                if (importedData.webpages) {
                    // Clear and update urls array with imported data
                    urls.length = 0;
                    urls.push(...importedData.webpages.map(webpage => ({
                        name: webpage.name,
                        url: webpage.url,
                        image: webpage.image
                    })));
                    
                    // Save URLs to localStorage
                    saveUrls();
                    
                    // Update click counts
                    if (importedData.clickCounts) {
                        localStorage.setItem('linkClickCounts', JSON.stringify(importedData.clickCounts));
                    }
                    
                    // Reload the grid with new data
                    updateOrder();
                }

                alert('Import successful!');
                // Reset file input
                event.target.value = '';
            } catch (error) {
                console.error('Import error:', error);
                alert('Error importing file: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
}

function removeTask(button) {
    const taskElement = button.parentElement;
    taskElement.remove();
    saveTasks();
}

function addTask() {
    const input = document.getElementById('todo-input');
    const taskText = input.value.trim();
    if (!taskText) return;

    const selectedColor = document.querySelector('.color-option.selected').dataset.color;
    const taskGroup = document.getElementById(`${selectedColor}-tasks`);
    
    // Create and add the task element
    createTaskElement(taskText, selectedColor, taskGroup);
    
    // Clear input
    input.value = '';
    
    // Save tasks to localStorage
    saveTasks();
}

function exportTasks() {
    const tasks = {
        red: Array.from(document.getElementById('red-tasks').children)
            .map(task => task.querySelector('.task-text').textContent),
        yellow: Array.from(document.getElementById('yellow-tasks').children)
            .map(task => task.querySelector('.task-text').textContent),
        green: Array.from(document.getElementById('green-tasks').children)
            .map(task => task.querySelector('.task-text').textContent)
    };

    // Get webpage data and sort by clicks
    const clickCounts = JSON.parse(localStorage.getItem('linkClickCounts')) || {};
    const sortedWebpages = [...urls].sort((a, b) => (clickCounts[b.url] || 0) - (clickCounts[a.url] || 0))
        .map(webpage => ({
            ...webpage,
            clicks: clickCounts[webpage.url] || 0
        }));

    const exportData = {
        tasks: tasks,
        webpages: sortedWebpages,
        clickCounts: clickCounts
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'homepage-config.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}
