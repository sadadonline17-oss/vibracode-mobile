export interface Todo {
  id: string;
  content: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
}

let todos: Todo[] = [];

export const TodoTool = {
  read(): Todo[] {
    return [...todos];
  },

  write(newTodos: Todo[]): Todo[] {
    todos = [...newTodos];
    return todos;
  },

  add(content: string, priority: "low" | "medium" | "high" = "medium"): Todo {
    const todo: Todo = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      content,
      priority,
      status: "pending",
    };
    todos.push(todo);
    return todo;
  },

  update(id: string, updates: Partial<Omit<Todo, "id">>): Todo | undefined {
    todos = todos.map((t) => (t.id === id ? { ...t, ...updates } : t));
    return todos.find((t) => t.id === id);
  },

  remove(id: string): void {
    todos = todos.filter((t) => t.id !== id);
  },

  clear(): void {
    todos = [];
  },
};
