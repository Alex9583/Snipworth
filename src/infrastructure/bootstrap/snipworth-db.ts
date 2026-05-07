import { createSnipworthDB, type SnipworthDB } from '@/adapters/secondary/dexie/SnipworthDB';

let instance: SnipworthDB | undefined;

export function getSnipworthDB(): SnipworthDB {
  return (instance ??= createSnipworthDB());
}
