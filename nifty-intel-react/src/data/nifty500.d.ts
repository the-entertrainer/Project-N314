export interface NiftyStock {
  ticker: string;
  name: string;
  sector: string;
  isFno: boolean;
  marketCapCategory: string;
}

declare const NIFTY500: NiftyStock[];
export default NIFTY500;
export { NIFTY500 };
