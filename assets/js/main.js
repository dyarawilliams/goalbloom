// Explaination of each function
// 1. The `DOMContentLoaded` event is fired when the initial HTML document has been completely loaded and parsed, without waiting for stylesheets, images, and subframes to finish loading.
// 2. The `navbarToggler` variable stores the element with the class `navbar-toggler`.
// 3. The `navbarCollapse` variable stores the element with the ID `navbarNav`.
// 4. The `navbarToggler` element listens for a `click` event and toggles the `show` class on the `navbarCollapse` element.
// 5. The `columns` variable stores all elements with the class `kanban-column`.
// 6. The `addTaskButtons` variable stores all elements with the class `add-task-btn`.
// 7. The `loadTasks` function loads tasks from the local storage.
// 8. The `columns` array is iterated over, and event listeners are added for drag and drop functionality.
// 9. The `addTaskButtons` array is iterated over, and event listeners are added for adding tasks.
// 10. The `createTaskElement` function creates a new task element with the provided text.
// 11. The `addDragAndDropListeners` function adds drag and drop event listeners to the task element.
// 12. The `editTask` function allows the user to edit the task text.
// 13. The `updateTaskElement` function updates the task element with the new text.
// 14. The `createDeleteButton` function creates a delete button for the task element.
// 15. The `getDragAfterElement` function determines the closest element when dragging over a column.
// 16. The `saveTasks` function saves the tasks to the local storage.
// 17. The `loadTasks` function loads the tasks from the local storage when the page is loaded.

document.addEventListener('DOMContentLoaded', function() {
    var navbarToggler = document.querySelector('.navbar-toggler');
    var navbarCollapse = document.querySelector('#navbarNav');

    navbarToggler.addEventListener('click', function() {
        navbarCollapse.classList.toggle('show');
    });

    const columns = document.querySelectorAll('.kanban-column');
    const addTaskButtons = document.querySelectorAll('.add-task-btn');

    // Load tasks from localStorage
    loadTasks();

    columns.forEach(column => {
        column.addEventListener('dragover', e => {
            e.preventDefault();
            const afterElement = getDragAfterElement(column, e.clientY);
            const draggable = document.querySelector('.dragging');
            if (afterElement == null) {
                column.appendChild(draggable);
            } else {
                column.insertBefore(draggable, afterElement);
            }
        });

        column.addEventListener('dragenter', () => {
            column.classList.add('drag-over');
        });

        column.addEventListener('dragleave', () => {
            column.classList.remove('drag-over');
        });

        column.addEventListener('drop', () => {
            column.classList.remove('drag-over');
            saveTasks();
        });
    });

    addTaskButtons.forEach(button => {
        button.addEventListener('click', () => {
            const inputElement = createInputElement('Enter the task');
            const submitButton = createButtonElement('Add Task', ['btn', 'btn-primary', 'mb-2']);

            const firstColumn = button.closest('div.kanban-column');
            firstColumn.appendChild(inputElement);
            firstColumn.appendChild(submitButton);

            submitButton.addEventListener('click', () => {
                const taskText = inputElement.value.trim();
                if (taskText) {
                    const taskElement = createTaskElement(taskText);
                    firstColumn.appendChild(taskElement);
                    saveTasks();

                    inputElement.remove();
                    submitButton.remove();
                }
            });
        });
    });

    function createInputElement(placeholder) {
        const inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.placeholder = placeholder;
        inputElement.classList.add('form-control', 'mb-2');
        return inputElement;
    }

    function createButtonElement(text, classes) {
        const buttonElement = document.createElement('button');
        buttonElement.textContent = text;
        buttonElement.classList.add(...classes);
        return buttonElement;
    }

    function createTaskElement(taskText) {
        const taskElement = document.createElement('div');
        taskElement.classList.add('kanban-card', 'shadow-sm', 'p-3', 'mb-2', 'bg-body', 'rounded', 'd-flex', 'justify-content-between', 'align-items-center');
        taskElement.setAttribute('draggable', 'true');

        const taskContent = document.createElement('span');
        taskContent.textContent = taskText;
        taskElement.appendChild(taskContent);

        const deleteButton = createDeleteButton(taskElement);
        taskElement.appendChild(deleteButton);

        addDragAndDropListeners(taskElement);
        return taskElement;
    }

    function addDragAndDropListeners(taskElement) {
        taskElement.addEventListener('dragstart', () => {
            taskElement.classList.add('dragging');
        });
        taskElement.addEventListener('dragend', () => {
            taskElement.classList.remove('dragging');
            saveTasks();
        });
        taskElement.addEventListener('dblclick', () => {
            editTask(taskElement);
        });

        let pressTimer;
        taskElement.addEventListener('touchstart', () => {
            pressTimer = setTimeout(() => {
                editTask(taskElement);
            }, 1000); // 1 second long press
        });

        taskElement.addEventListener('touchend', () => {
            clearTimeout(pressTimer);
        });
    }

    function editTask(taskElement) {
        try {
            const currentText = taskElement.querySelector('span').textContent.trim();
            const inputElement = document.createElement('input');
            inputElement.type = 'text';
            inputElement.value = currentText;
            inputElement.classList.add('form-control', 'mb-2');

            taskElement.innerHTML = '';
            taskElement.appendChild(inputElement);

            inputElement.addEventListener('blur', () => {
                const newText = inputElement.value.trim();
                if (newText) {
                    updateTaskElement(taskElement, newText);
                } else {
                    updateTaskElement(taskElement, currentText);
                }
            });

            inputElement.focus();
        } catch (error) {
            console.error('Error editing task:', error);
        }
    }

    function updateTaskElement(taskElement, text) {
        try {
            taskElement.innerHTML = '';
            const taskContent = document.createElement('span');
            taskContent.textContent = text;
            taskElement.appendChild(taskContent);
            taskElement.appendChild(createDeleteButton(taskElement));
            addDragAndDropListeners(taskElement);
            saveTasks();
        } catch (error) {
            console.error('Error updating task element:', error);
        }
    }

    function createDeleteButton(taskElement) {
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.classList.add('btn', 'btn-danger', 'btn-sm');
        deleteButton.addEventListener('click', () => {
            if (confirm('Do you want to delete this task?')) {
                taskElement.remove();
                saveTasks();
            }
        });
        return deleteButton;
    }

    function getDragAfterElement(column, y) {
        const draggableElements = [...column.querySelectorAll('.kanban-card:not(.dragging)')];

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

    function saveTasks() {
        try {
            const tasks = {};
            columns.forEach(column => {
                const columnTasks = [];
                column.querySelectorAll('.kanban-card').forEach(card => {
                    columnTasks.push(card.querySelector('span').textContent.trim());
                });
                tasks[column.querySelector('h3').textContent.trim()] = columnTasks;
            });
            const pageId = document.querySelector('main').id;
            localStorage.setItem(`kanbanTasks_${pageId}`, JSON.stringify(tasks));
        } catch (error) {
            console.error('Error saving tasks:', error);
        }
    }

    function loadTasks() {
        try {
            const pageId = document.querySelector('main').id;
            const tasks = JSON.parse(localStorage.getItem(`kanbanTasks_${pageId}`)) || {};
            if (tasks) {
                columns.forEach(column => {
                    const columnTitle = column.querySelector('h3').textContent.trim();
                    const columnTasks = tasks[columnTitle];
                    if (columnTasks) {
                        columnTasks.forEach(task => {
                            const taskElement = createTaskElement(task);
                            column.appendChild(taskElement);
                        });
                    }
                });
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }
});