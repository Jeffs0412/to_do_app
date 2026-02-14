// TodoList class to manage the todo list functionality
class TodoList {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.currentFilter = 'all';
        this.editingId = null;
        this.pendingDeleteId = null;
        this.initializeElements();
        this.attachEventListeners();
        this.render();
    }

    initializeElements() {
        this.todoInput = document.getElementById('todoInput');
        this.addButton = document.getElementById('addButton');
        this.todoList = document.getElementById('todoList');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        // Modal elements
        this.modalBackdrop = document.getElementById('modalBackdrop');
        this.confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        this.cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
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

        // Modal events
        if (this.cancelDeleteBtn) {
            this.cancelDeleteBtn.addEventListener('click', () => this.closeDeleteModal());
        }
        if (this.confirmDeleteBtn) {
            this.confirmDeleteBtn.addEventListener('click', () => this.confirmDelete());
        }
        if (this.modalBackdrop) {
            this.modalBackdrop.addEventListener('click', (e) => {
                if (e.target === this.modalBackdrop) this.closeDeleteModal();
            });
        }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modalBackdrop.classList.contains('hidden')) {
                this.closeDeleteModal();
            }
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

    openDeleteModal(id) {
        this.pendingDeleteId = id;
        this.modalBackdrop.classList.remove('hidden');
        this.modalBackdrop.setAttribute('aria-hidden', 'false');
        if (this.cancelDeleteBtn) this.cancelDeleteBtn.focus();
    }

    closeDeleteModal() {
        this.modalBackdrop.classList.add('hidden');
        this.modalBackdrop.setAttribute('aria-hidden', 'true');
        this.pendingDeleteId = null;
    }

    confirmDelete() {
        if (this.pendingDeleteId !== null) {
            const id = this.pendingDeleteId;
            this.pendingDeleteId = null;
            this.deleteTodo(id);
        }
        this.closeDeleteModal();
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
        li.setAttribute('data-id', todo.id);

        const canDrag = this.currentFilter === 'all' && this.editingId !== todo.id;
        if (canDrag) {
            li.draggable = true;
            const dragHandle = document.createElement('span');
            dragHandle.className = 'drag-handle';
            dragHandle.setAttribute('aria-label', 'Drag to reorder');
            dragHandle.textContent = '⋮⋮';
            li.appendChild(dragHandle);
            this.attachDragListeners(li, todo.id);
        }

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = todo.completed;
        checkbox.addEventListener('change', () => this.toggleTodo(todo.id));

        const span = document.createElement('span');
        span.textContent = todo.text;
        span.className = 'todo-text';

        const editButton = document.createElement('button');
        editButton.className = 'edit-btn';
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => this.startEditing(todo.id));

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => this.openDeleteModal(todo.id));

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(editButton);
        li.appendChild(deleteButton);

        return li;
    }

    attachDragListeners(li, todoId) {
        li.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', String(todoId));
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setDragImage(li, 0, 0);
            li.classList.add('dragging');
        });

        li.addEventListener('dragend', () => {
            li.classList.remove('dragging');
            this.todoList.querySelectorAll('.todo-item').forEach(el => el.classList.remove('drag-over'));
        });

        li.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const dragging = this.todoList.querySelector('.dragging');
            if (dragging && dragging !== li) {
                li.classList.add('drag-over');
            }
        });

        li.addEventListener('dragleave', () => {
            li.classList.remove('drag-over');
        });

        li.addEventListener('drop', (e) => {
            e.preventDefault();
            li.classList.remove('drag-over');
            const draggedId = Number(e.dataTransfer.getData('text/plain'));
            if (draggedId === todoId) return;
            this.reorderTodos(draggedId, todoId);
        });
    }

    reorderTodos(draggedId, targetId) {
        const fromIndex = this.todos.findIndex(t => t.id === draggedId);
        const toIndex = this.todos.findIndex(t => t.id === targetId);
        if (fromIndex === -1 || toIndex === -1) return;
        const newTodos = [...this.todos];
        const [removed] = newTodos.splice(fromIndex, 1);
        const insertIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
        newTodos.splice(insertIndex, 0, removed);
        this.todos = newTodos;
        this.saveTodos();
        this.render();
    }

    startEditing(id) {
        if (this.editingId === id) return;
        
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        this.editingId = id;
        const todoElement = document.querySelector(`[data-id="${id}"]`);
        if (!todoElement) return;

        const dragHandle = todoElement.querySelector('.drag-handle');
        if (dragHandle) dragHandle.style.display = 'none';

        const todoText = todoElement.querySelector('.todo-text');
        const currentText = todoText.textContent;

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

        todoText.replaceWith(input);
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