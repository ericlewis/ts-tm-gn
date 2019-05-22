export interface TurboModule {}
export function getEnforcing<T extends TurboModule>(name: string): T {
  console.log(name);
  // just a dummy function
  return null;
}
