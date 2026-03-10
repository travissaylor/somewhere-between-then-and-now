export interface EraConfig {
  id: number;       // 0-indexed (0-12)
  name: string;
  weight: number;   // relative scroll distance (1.0 = baseline)
}

// NOTE: These initial weights are scaffold values. Authorial tuning is a deferred decision.
// Major transitions get 2-3x weight; connective eras get 1.0; compressed eras get < 1.0.
export const ERA_CONFIG: EraConfig[] = [
  { id: 0,  name: 'Being Born',              weight: 2.0 },  // slow — pre-language
  { id: 1,  name: 'Early Childhood',          weight: 1.0 },
  { id: 2,  name: 'The Abuse Era',            weight: 1.5 },
  { id: 3,  name: 'The Divorce',              weight: 2.5 },  // major transition
  { id: 4,  name: 'Teenage Years & Sports',   weight: 1.0 },
  { id: 5,  name: 'College',                  weight: 1.5 },
  { id: 6,  name: 'The Identity Years',       weight: 1.0 },
  { id: 7,  name: 'The Seven Years',          weight: 2.0 },
  { id: 8,  name: 'The Breakup',              weight: 3.0 },  // slow — rupture
  { id: 9,  name: 'Pittsburgh & The House',   weight: 2.5 },  // major transition
  { id: 10, name: 'The Year of Chaos',        weight: 0.5 },  // fast — compressed
  { id: 11, name: 'Finding Her',              weight: 1.5 },
  { id: 12, name: 'Somewhere Between',        weight: 2.0 },  // linger at end
];
