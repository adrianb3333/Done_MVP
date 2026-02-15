export interface HoleInfo {
  number: number;
  par: number;
  index: number;
  distance: number;
}

export interface MockCourse {
  id: string;
  name: string;
  clubName: string;
  holes: HoleInfo[];
  totalPar: number;
}

const HULTA_GK_HOLES: HoleInfo[] = [
  { number: 1, par: 4, index: 3, distance: 380 },
  { number: 2, par: 4, index: 7, distance: 350 },
  { number: 3, par: 4, index: 13, distance: 310 },
  { number: 4, par: 3, index: 5, distance: 165 },
  { number: 5, par: 4, index: 11, distance: 370 },
  { number: 6, par: 4, index: 9, distance: 340 },
  { number: 7, par: 3, index: 17, distance: 145 },
  { number: 8, par: 5, index: 15, distance: 480 },
  { number: 9, par: 4, index: 1, distance: 400 },
  { number: 10, par: 3, index: 8, distance: 155 },
  { number: 11, par: 4, index: 10, distance: 360 },
  { number: 12, par: 4, index: 14, distance: 325 },
  { number: 13, par: 4, index: 16, distance: 300 },
  { number: 14, par: 5, index: 2, distance: 510 },
  { number: 15, par: 4, index: 6, distance: 375 },
  { number: 16, par: 4, index: 12, distance: 345 },
  { number: 17, par: 5, index: 18, distance: 490 },
  { number: 18, par: 3, index: 4, distance: 170 },
];

export const MOCK_COURSE: MockCourse = {
  id: 'hulta-gk',
  name: 'Hulta GK',
  clubName: 'Hulta Golfklubb',
  holes: HULTA_GK_HOLES,
  totalPar: HULTA_GK_HOLES.reduce((sum, h) => sum + h.par, 0),
};

export function getHolesForOption(option: string): HoleInfo[] {
  switch (option) {
    case '9_first':
      return HULTA_GK_HOLES.filter((h) => h.number <= 9);
    case '9_back':
      return HULTA_GK_HOLES.filter((h) => h.number >= 10);
    case '18':
    default:
      return HULTA_GK_HOLES;
  }
}

export function getParForHoles(holes: HoleInfo[]): number {
  return holes.reduce((sum, h) => sum + h.par, 0);
}

export function getScoreLabel(score: number, par: number): string {
  const diff = score - par;
  if (diff <= -3) return 'Albatross';
  if (diff === -2) return 'Eagle';
  if (diff === -1) return 'Birdie';
  if (diff === 0) return 'Par';
  if (diff === 1) return 'Bogey';
  if (diff === 2) return 'Double Bogey';
  if (diff === 3) return 'Triple Bogey';
  return `+${diff}`;
}

export function getToPar(totalScore: number, totalPar: number): string {
  const diff = totalScore - totalPar;
  if (diff === 0) return 'E';
  if (diff > 0) return `+${diff}`;
  return `${diff}`;
}
