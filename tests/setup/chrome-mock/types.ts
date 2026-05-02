export type StorageValue =
  | string
  | number
  | boolean
  | null
  | StorageValue[]
  | { [key: string]: StorageValue };

export type DeepPartial<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

export type ChromeMock = DeepPartial<typeof chrome>;
