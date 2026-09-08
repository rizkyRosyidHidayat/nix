class DbState {
  todo = $state(0);

  notify(store: 'todo') {
    this[store]++;
  }

  subscribe(store: 'todo') {
    return this[store];
  }
}

export const dbState = new DbState();