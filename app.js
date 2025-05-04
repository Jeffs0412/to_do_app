// TodoList class to manage the todo list functionality
class TodoList {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.currentFilter = 'all';
        this.editingId = null;
        this.initializeElements();
        this.attachEventListeners();
        this.render();
    }

    initializeElements() {
        this.todoInput = document.getElementById('todoInput');
        this.addButton = document.getElementById('addButton');
        this.todoList = document.getElementById('todoList');
        this.filterButtons = document.querySelectorAll('.filter-btn');
    }

    attachEventListeners() {
        this.addButton.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });
        
        this.filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.setFilter(button.dataset.filter);
                this.updateFilterButtons(button);
            });
        });
    }

    addTodo() {
        const text = this.todoInput.value.trim();
        if (text) {
            const todo = {
                id: Date.now(),
                text,
                completed: false
            };
            this.todos.push(todo);
            this.saveTodos();
            this.render();
            this.todoInput.value = '';
        }
    }

    deleteTodo(id) {
        this.todos = this.todos.filter(todo => todo.id !== id);
        this.saveTodos();
        this.render();
    }

    toggleTodo(id) {
        this.todos = this.todos.map(todo => {
            if (todo.id === id) {
                return { ...todo, completed: !todo.completed };
            }
            return todo;
        });
        this.saveTodos();
        this.render();
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.render();
    }

    updateFilterButtons(activeButton) {
        this.filterButtons.forEach(button => {
            button.classList.remove('active');
        });
        activeButton.classList.add('active');
    }

    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'active':
                return this.todos.filter(todo => !todo.completed);
            case 'completed':
                return this.todos.filter(todo => todo.completed);
            default:
                return this.todos;
        }
    }

    createTodoElement(todo) {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = todo.completed;
        checkbox.addEventListener('change', () => this.toggleTodo(todo.id));

        const span = document.createElement('span');
        span.textContent = todo.text;

        const editButton = document.createElement('button');
        editButton.className = 'edit-btn';
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => this.startEditing(todo.id));

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => this.deleteTodo(todo.id));

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(editButton);
        li.appendChild(deleteButton);

        return li;
    }

    startEditing(id) {
        if (this.editingId === id) return;
        
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        this.editingId = id;
        const todoElement = document.querySelector(`[data-id="${id}"]`);
        if (!todoElement) return;

        const span = todoElement.querySelector('span');
        const currentText = span.textContent;

        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentText;
        input.className = 'edit-input';

        const saveButton = document.createElement('button');
        saveButton.textContent = 'Save';
        saveButton.className = 'save-btn';
        saveButton.addEventListener('click', () => this.saveEdit(id, input.value));

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.className = 'cancel-btn';
        cancelButton.addEventListener('click', () => this.cancelEdit());

        span.replaceWith(input);
        todoElement.querySelector('.edit-btn').replaceWith(saveButton, cancelButton);
        input.focus();
    }

    saveEdit(id, newText) {
        const trimmedText = newText.trim();
        if (trimmedText) {
            this.todos = this.todos.map(todo => {
                if (todo.id === id) {
                    return { ...todo, text: trimmedText };
                }
                return todo;
            });
            this.saveTodos();
            this.editingId = null;
            this.render();
        }
    }

    cancelEdit() {
        this.editingId = null;
        this.render();
    }

    render() {
        this.todoList.innerHTML = '';
        const filteredTodos = this.getFilteredTodos();
        filteredTodos.forEach(todo => {
            const element = this.createTodoElement(todo);
            element.setAttribute('data-id', todo.id);
            this.todoList.appendChild(element);
        });
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }
}

// Initialize the TodoList when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TodoList();
}); 