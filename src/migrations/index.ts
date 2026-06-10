import * as migration_20260610_201554_baseline from './20260610_201554_baseline';

export const migrations = [
  {
    up: migration_20260610_201554_baseline.up,
    down: migration_20260610_201554_baseline.down,
    name: '20260610_201554_baseline'
  },
];
