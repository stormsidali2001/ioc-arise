import { Todo, CreateTodoData, UpdateTodoData } from '../entities/Todo';
import { ITodoRepository } from '../repositories/ITodoRepository';
import { ITodoService } from './ITodoService';

/**
 * @scope singleton
 */
export class TodoService implements ITodoService {
  constructor(private readonly todoRepository: ITodoRepository) {}

  async createTodo(data: CreateTodoData): Promise<Todo> {
    if (!data.title || data.title.trim().length === 0) {
      throw new Error('Todo title is required');
    }

    const todo = await this.todoRepository.create(data);
    console.log('TodoService: Created new todo:', todo.id);
    return todo;
  }

  async getTodo(id: string): Promise<Todo> {
    if (!id) {
      throw new Error('Todo ID is required');
    }

    const todo = await this.todoRepository.findById(id);
    if (!todo) {
      throw new Error(`Todo with ID ${id} not found`);
    }

    console.log('TodoService: Retrieved todo:', todo.id);
    return todo;
  }

  async getAllTodos(): Promise<Todo[]> {
    const todos = await this.todoRepository.findAll();
    console.log('TodoService: Retrieved all todos, count:', todos.length);
    return todos;
  }

  async updateTodo(id: string, data: UpdateTodoData): Promise<Todo> {
    if (!id) {
      throw new Error('Todo ID is required');
    }

    const updatedTodo = await this.todoRepository.update(id, data);
    if (!updatedTodo) {
      throw new Error(`Todo with ID ${id} not found`);
    }

    console.log('TodoService: Updated todo:', updatedTodo.id);
    return updatedTodo;
  }

  async deleteTodo(id: string): Promise<void> {
    if (!id) {
      throw new Error('Todo ID is required');
    }

    const deleted = await this.todoRepository.delete(id);
    if (!deleted) {
      throw new Error(`Todo with ID ${id} not found`);
    }

    console.log('TodoService: Deleted todo:', id);
  }

  async markAsCompleted(id: string): Promise<Todo> {
    return this.updateTodo(id, { completed: true });
  }

  async markAsIncomplete(id: string): Promise<Todo> {
    return this.updateTodo(id, { completed: false });
  }

  async getCompletedTodos(): Promise<Todo[]> {
    const todos = await this.getAllTodos();
    const completedTodos = todos.filter(todo => todo.completed);
    console.log('TodoService: Retrieved completed todos, count:', completedTodos.length);
    return completedTodos;
  }

  async getIncompleteTodos(): Promise<Todo[]> {
    const todos = await this.getAllTodos();
    const incompleteTodos = todos.filter(todo => !todo.completed);
    console.log('TodoService: Retrieved incomplete todos, count:', incompleteTodos.length);
    return incompleteTodos;
  }

  async clearAllTodos(): Promise<void> {
    await this.todoRepository.clear();
    console.log('TodoService: Cleared all todos');
  }
}