import * as migration_20260610_201554_baseline from './20260610_201554_baseline';
import * as migration_20260610_214555_stillinger from './20260610_214555_stillinger';

export const migrations = [
  {
    up: migration_20260610_201554_baseline.up,
    down: migration_20260610_201554_baseline.down,
    name: '20260610_201554_baseline',
  },
  {
    up: migration_20260610_214555_stillinger.up,
    down: migration_20260610_214555_stillinger.down,
    name: '20260610_214555_stillinger'
  },
];
