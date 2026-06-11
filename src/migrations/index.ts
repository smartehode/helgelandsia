import * as migration_20260610_201554_baseline from './20260610_201554_baseline';
import * as migration_20260610_214555_stillinger from './20260610_214555_stillinger';
import * as migration_20260611_101223_bedrift_innsending from './20260611_101223_bedrift_innsending';
import * as migration_20260611_111123_pressemeldinger_nyhetsbrev from './20260611_111123_pressemeldinger_nyhetsbrev';

export const migrations = [
  {
    up: migration_20260610_201554_baseline.up,
    down: migration_20260610_201554_baseline.down,
    name: '20260610_201554_baseline',
  },
  {
    up: migration_20260610_214555_stillinger.up,
    down: migration_20260610_214555_stillinger.down,
    name: '20260610_214555_stillinger',
  },
  {
    up: migration_20260611_101223_bedrift_innsending.up,
    down: migration_20260611_101223_bedrift_innsending.down,
    name: '20260611_101223_bedrift_innsending',
  },
  {
    up: migration_20260611_111123_pressemeldinger_nyhetsbrev.up,
    down: migration_20260611_111123_pressemeldinger_nyhetsbrev.down,
    name: '20260611_111123_pressemeldinger_nyhetsbrev'
  },
];
