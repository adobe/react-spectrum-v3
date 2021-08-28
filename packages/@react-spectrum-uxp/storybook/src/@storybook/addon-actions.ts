export function action(name: string) {
  return () => {
    console.log('actions: ' + name);
  };
}
