import { getEnforcing, TurboModule } from '../src/types/tm';
type customType = number;

interface Spec extends TurboModule {
  readonly testVoid: () => void;
  readonly testingNumber: (a: number) => number;
  readonly testMulti: (a: number, c: customType) => number;
  readonly testIdk: (a: string) => void;
  readonly testString: (a: string) => string;
  readonly testLotsOfThings: (a: string, c: number, b: number) => string;
}

export default getEnforcing<Spec>('TestModule');
