export const inch = 0.0254; // meters
export const mil = 0.001 * inch; // meters
export const mm = 0.001; // meters
export const c = 299_792_458; // m/s
export const kelvinShift = 273.15;
export const IN2_PER_M2 = 1550.0031; // square inches per square meter
export const SQMILS_PER_IN2 = 1_000_000; // square mils per square inch

export enum ItemType {
  Resistor = 1,
  Capacitor,
  Inductor
}

export class Item {
  constructor(
    public type: ItemType,
    public nominal: number,
    public tolerance: number,
  ) { }
}

export class ESeries {
  constructor(
    public name: string,
    public tolerance: number,
    public values: number[],
  ) { }
}

export const Series: ESeries[] = [
  new ESeries('E3', 0.4,
    [1.0, 2.2, 4.7]
  ),
  new ESeries('E6', 0.2,
    [1.0, 1.5, 2.2, 3.3, 4.7, 6.8]
  ),
  new ESeries('E12', 0.1,
    [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2]
  ),
  new ESeries('E24', 0.05,
    [1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0,
      3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1]
  ),
  new ESeries('E48', 0.02,
    [1.00, 1.05, 1.10, 1.15, 1.21, 1.27, 1.33, 1.40, 1.47, 1.54,
      1.62, 1.69, 1.78, 1.87, 1.96, 2.05, 2.15, 2.26, 2.37, 2.49,
      2.61, 2.74, 2.87, 3.01, 3.16, 3.32, 3.48, 3.65, 3.83, 4.02,
      4.22, 4.42, 4.64, 4.87, 5.11, 5.36, 5.62, 5.90, 6.19, 6.49,
      6.81, 7.15, 7.50, 7.87, 8.25, 8.66, 9.09, 9.53],
  ),
  new ESeries('E96', 0.01,
    [1.00, 1.02, 1.05, 1.07, 1.10, 1.13, 1.15, 1.18, 1.21, 1.24,
      1.27, 1.30, 1.33, 1.37, 1.40, 1.43, 1.47, 1.50, 1.54, 1.58,
      1.62, 1.65, 1.69, 1.74, 1.78, 1.82, 1.87, 1.91, 1.96, 2.00,
      2.05, 2.10, 2.15, 2.21, 2.26, 2.32, 2.37, 2.43, 2.49, 2.55,
      2.61, 2.67, 2.74, 2.80, 2.87, 2.94, 3.01, 3.09, 3.16, 3.24,
      3.32, 3.40, 3.48, 3.57, 3.65, 3.74, 3.83, 3.92, 4.02, 4.12,
      4.22, 4.32, 4.42, 4.53, 4.64, 4.75, 4.87, 4.99, 5.11, 5.23,
      5.36, 5.49, 5.62, 5.76, 5.90, 6.04, 6.19, 6.34, 6.49, 6.65,
      6.81, 6.98, 7.15, 7.32, 7.50, 7.68, 7.87, 8.06, 8.25, 8.45,
      8.66, 8.87, 9.09, 9.31, 9.53, 9.76],
  ),
  new ESeries('E192', 0.005,
    [1.00, 1.01, 1.02, 1.04, 1.05, 1.06, 1.07, 1.09, 1.10, 1.11,
      1.13, 1.14, 1.15, 1.17, 1.18, 1.20, 1.21, 1.23, 1.24, 1.26,
      1.27, 1.29, 1.30, 1.32, 1.33, 1.35, 1.37, 1.38, 1.40, 1.42,
      1.43, 1.45, 1.47, 1.49, 1.50, 1.52, 1.54, 1.56, 1.58, 1.60,
      1.62, 1.64, 1.65, 1.67, 1.69, 1.72, 1.74, 1.76, 1.78, 1.80,
      1.82, 1.84, 1.87, 1.89, 1.91, 1.93, 1.96, 1.98, 2.00, 2.03,
      2.05, 2.08, 2.10, 2.13, 2.15, 2.18, 2.21, 2.23, 2.26, 2.29,
      2.32, 2.34, 2.37, 2.40, 2.43, 2.46, 2.49, 2.52, 2.55, 2.58,
      2.61, 2.64, 2.67, 2.71, 2.74, 2.77, 2.80, 2.84, 2.87, 2.91,
      2.94, 2.98, 3.01, 3.05, 3.09, 3.12, 3.16, 3.20, 3.24, 3.28,
      3.32, 3.36, 3.40, 3.44, 3.48, 3.52, 3.57, 3.61, 3.65, 3.70,
      3.74, 3.79, 3.83, 3.88, 3.92, 3.97, 4.02, 4.07, 4.12, 4.17,
      4.22, 4.27, 4.32, 4.37, 4.42, 4.48, 4.53, 4.59, 4.64, 4.70,
      4.75, 4.81, 4.87, 4.93, 4.99, 5.05, 5.11, 5.17, 5.23, 5.30,
      5.36, 5.42, 5.49, 5.56, 5.62, 5.69, 5.76, 5.83, 5.90, 5.97,
      6.04, 6.12, 6.19, 6.26, 6.34, 6.42, 6.49, 6.57, 6.65, 6.73,
      6.81, 6.90, 6.98, 7.06, 7.15, 7.23, 7.32, 7.41, 7.50, 7.59,
      7.68, 7.77, 7.87, 7.96, 8.06, 8.16, 8.25, 8.35, 8.45, 8.56,
      8.66, 8.76, 8.87, 8.98, 9.09, 9.20, 9.31, 9.42, 9.53, 9.65,
      9.76, 9.88],
  ),
];

export class PCBMaterial {
  constructor(
    public name: string,
    public epsilon: number
  ) { }
}

export const copperWeightsList = ['0.5oz', '1oz', '1.5oz', '2oz', '2.5oz', '3oz', '4oz', '5oz'];

export const pcbMaterials: PCBMaterial[] = [
  new PCBMaterial("FR-4 (Standard)", 4.4),
  new PCBMaterial("FR-4 (High Tg)", 4.2),
  new PCBMaterial("Rogers 4350B", 3.48),
  new PCBMaterial("Rogers 4003C", 3.55),
  new PCBMaterial("Rogers 5880", 2.20),
  new PCBMaterial("Rogers 6010", 10.2),
  new PCBMaterial("Isola FR408", 3.7),
  new PCBMaterial("Isola I-Tera MT40", 3.45),
  new PCBMaterial("Isola Astra MT77", 3.0),
  new PCBMaterial("Taconic TLY-5", 2.2),
  new PCBMaterial("Taconic RF-35", 3.5),
  new PCBMaterial("Taconic CER-10", 10.0),
  new PCBMaterial("Polyimide", 3.8),
  new PCBMaterial("BT Epoxy", 3.9),
];

export class Battery {
  constructor(
    public name: string,
    public capacity: number,
    public selfDischarge: number,
    public nominalVoltage: number,
    public maxContCurrent: number,
    public maxPulseCurrent: number
  ) { }
}

export const batteries: Battery[] = [
  new Battery("Alkaline AA", 2850, 0.3, 1.5, 1000, 0),
  new Battery("Alkaline AAA", 1250, 0.3, 1.5, 400, 0),
  new Battery("Alkaline C", 8350, 0.3, 1.5, 3000, 0),
  new Battery("Alkaline D", 20500, 0.3, 1.5, 7500, 0),
  new Battery("Alkaline 9V", 20500, 0.3, 1.5, 200, 0),
  new Battery("CR1225", 48, 0.12, 1.5, 1, 5),
  new Battery("Li-MnO2 (CR1632)", 125.0, 0.12, 3.0, 1.5, 10.0),
  new Battery("Li-MnO2 (CR2032)", 225.0, 0.12, 3.0, 3.0, 15.0),
  new Battery("Li-MnO2 (CR2430)", 285.0, 0.12, 3.0, 4.0, 20.0),
  new Battery("Li-MnO2 (CR2477)", 850.0, 0.12, 3.0, 2.0, 10.0),
  new Battery("LiSOCL2 (AAA700)", 700.0, 0.08, 3.6, 10.0, 30.0),
  new Battery("LiSOCL2 (A3400)", 3400.0, 0.08, 3.6, 100.0, 200.0),
  new Battery("LiSOCL2 (C9000)", 9000.0, 0.08, 3.6, 230.0, 400.0),
  new Battery("LiSOCL2 (D19000)", 19000.0, 0.08, 3.6, 230.0, 500.0),
  new Battery("LiSOCL2 (DD36000)", 36000.0, 0.08, 3.6, 450.0, 1000.0),
  new Battery("Ni-Cd (AA1100)", 1100.0, 20.0, 1.2, 220.0, 0.0),
  new Battery("Ni-Cd (A1700)", 1700.0, 20.0, 1.2, 340.0, 0.0),
  new Battery("Ni-Cd (C3000)", 3000.0, 20.0, 1.2, 600.0, 0.0),
  new Battery("Ni-Cd (D4400)", 4400.0, 20.0, 1.2, 880.0, 0.0),
  new Battery("Ni-Cd (F7000)", 7000.0, 20.0, 1.2, 1400.0, 0.0),
  new Battery("Ni-MH (AAA800)", 800.0, 30.0, 1.2, 160.0, 0.0),
  new Battery("Ni-MH (AA1800)", 1800.0, 30.0, 1.2, 360.0, 0.0),
  new Battery("Ni-MH (A2500)", 2500.0, 30.0, 1.2, 500.0, 0.0),
  new Battery("Ni-MH (C4500)", 4500.0, 30.0, 1.2, 900.0, 0.0),
  new Battery("Ni-MH (D8000)", 8000.0, 30.0, 1.2, 1600, 0.0),
  new Battery("Ni-MH (F14000)", 14000.0, 30.0, 1.2, 2800, 0.0),
  new Battery("Zinc-Air(180)", 180.0, 0.4, 1.4, 5.0, 0.0),
  new Battery("Zinc-Air(310)", 310, 0.4, 1.4, 10, 0),
  new Battery("Zinc-Air(650)", 650, 0.4, 1.4, 25, 0),
];

export type Tolerance = {
  label: string; percentage: string;
};

export const TOLERANCE_OPTIONS: Tolerance[] = [
  { label: 'E12', percentage: '10' },
  { label: 'E24', percentage: '5' },
  { label: 'E48', percentage: '2' },
  { label: 'E96', percentage: '1' },
  { label: 'E192', percentage: '0.5' },
  { label: 'E192+', percentage: '0.1' },
];
