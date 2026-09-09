class GlobalState {
  private isFirstAddTodo = $state(false);

  setIsFirstAddTodo(value: boolean) {
    this.isFirstAddTodo = value;
  }

  getIsFirstAddTodo() {
    return this.isFirstAddTodo;
  }
}

export const globalState = new GlobalState();
