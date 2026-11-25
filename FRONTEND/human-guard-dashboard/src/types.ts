export * from "./types/index";

import type { Device as BaseDevice } from "./types/index";

export type Device = BaseDevice & {
  secret_key?: string;
};
