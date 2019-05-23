import { getEnforcing, TurboModule } from '../src/types/tm';

interface Spec extends TurboModule {
  readonly voidFunc: () => void;
  readonly getBool: (arg: boolean) => boolean;
  readonly getNumber: (arg: number) => number;
  readonly getString: (arg: string) => string;
  readonly getArray: (arg: readonly any[]) => readonly any[];
  readonly getObject: (arg: object) => object;
  readonly getValue: (x: number, y: string, z: object) => object;
  readonly getValueWithCallback: (callback: (value: string) => void) => void;
  readonly getValueWithPromise: (error: boolean) => Promise<string>;
}

export default getEnforcing<Spec>('TestModule');
