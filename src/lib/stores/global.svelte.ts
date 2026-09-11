class GlobalState {
  private isFirstAddTodo = $state(false);
  private supportModalIsOpen = $state(false);

  setIsFirstAddTodo(value: boolean) {
    this.isFirstAddTodo = value;
  }

  getIsFirstAddTodo() {
    return this.isFirstAddTodo;
  }

  setSupportModalIsOpen(value: boolean) {
    this.supportModalIsOpen = value;
  }

  getSupportModalIsOpen() {
    return this.supportModalIsOpen;
  }
}

export const globalState = new GlobalState();
