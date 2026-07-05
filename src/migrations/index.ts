import * as migration_20260610_201554_baseline from './20260610_201554_baseline';
import * as migration_20260610_214555_stillinger from './20260610_214555_stillinger';
import * as migration_20260611_101223_bedrift_innsending from './20260611_101223_bedrift_innsending';
import * as migration_20260611_111123_pressemeldinger_nyhetsbrev from './20260611_111123_pressemeldinger_nyhetsbrev';
import * as migration_20260611_132028_widget_system from './20260611_132028_widget_system';
import * as migration_20260612_215753_widget_system from './20260612_215753_widget_system';
import * as migration_20260612_223647_widget_system from './20260612_223647_widget_system';
import * as migration_20260612_224114_widget_system from './20260612_224114_widget_system';
import * as migration_20260612_235331_news_brreg_blocks from './20260612_235331_news_brreg_blocks';
import * as migration_20260613_075834_verify_members from './20260613_075834_verify_members';
import * as migration_20260613_095658_webcam_locations from './20260613_095658_webcam_locations';
import * as migration_20260613_105605_webkamera_vaer from './20260613_105605_webkamera_vaer';
import * as migration_20260613_133028_brreg_import from './20260613_133028_brreg_import';
import * as migration_20260613_170043_business_model_a from './20260613_170043_business_model_a';
import * as migration_20260613_220725_brreg_extended_fields from './20260613_220725_brreg_extended_fields';
import * as migration_20260615_000000_show_on_public_listing from './20260615_000000_show_on_public_listing';
import * as migration_20260704_000000_entity_type_to_text from './20260704_000000_entity_type_to_text';
import * as migration_20260704_005223 from './20260704_005223';
import * as migration_20260705_061342_doffin_tenders from './20260705_061342_doffin_tenders';

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
    name: '20260611_111123_pressemeldinger_nyhetsbrev',
  },
  {
    up: migration_20260611_132028_widget_system.up,
    down: migration_20260611_132028_widget_system.down,
    name: '20260611_132028_widget_system',
  },
  {
    up: migration_20260612_215753_widget_system.up,
    down: migration_20260612_215753_widget_system.down,
    name: '20260612_215753_widget_system',
  },
  {
    up: migration_20260612_223647_widget_system.up,
    down: migration_20260612_223647_widget_system.down,
    name: '20260612_223647_widget_system',
  },
  {
    up: migration_20260612_224114_widget_system.up,
    down: migration_20260612_224114_widget_system.down,
    name: '20260612_224114_widget_system',
  },
  {
    up: migration_20260612_235331_news_brreg_blocks.up,
    down: migration_20260612_235331_news_brreg_blocks.down,
    name: '20260612_235331_news_brreg_blocks',
  },
  {
    up: migration_20260613_075834_verify_members.up,
    down: migration_20260613_075834_verify_members.down,
    name: '20260613_075834_verify_members',
  },
  {
    up: migration_20260613_095658_webcam_locations.up,
    down: migration_20260613_095658_webcam_locations.down,
    name: '20260613_095658_webcam_locations',
  },
  {
    up: migration_20260613_105605_webkamera_vaer.up,
    down: migration_20260613_105605_webkamera_vaer.down,
    name: '20260613_105605_webkamera_vaer',
  },
  {
    up: migration_20260613_133028_brreg_import.up,
    down: migration_20260613_133028_brreg_import.down,
    name: '20260613_133028_brreg_import',
  },
  {
    up: migration_20260613_170043_business_model_a.up,
    down: migration_20260613_170043_business_model_a.down,
    name: '20260613_170043_business_model_a',
  },
  {
    up: migration_20260613_220725_brreg_extended_fields.up,
    down: migration_20260613_220725_brreg_extended_fields.down,
    name: '20260613_220725_brreg_extended_fields',
  },
  {
    up: migration_20260615_000000_show_on_public_listing.up,
    down: migration_20260615_000000_show_on_public_listing.down,
    name: '20260615_000000_show_on_public_listing',
  },
  {
    up: migration_20260704_000000_entity_type_to_text.up,
    down: migration_20260704_000000_entity_type_to_text.down,
    name: '20260704_000000_entity_type_to_text',
  },
  {
    up: migration_20260704_005223.up,
    down: migration_20260704_005223.down,
    name: '20260704_005223',
  },
  {
    up: migration_20260705_061342_doffin_tenders.up,
    down: migration_20260705_061342_doffin_tenders.down,
    name: '20260705_061342_doffin_tenders'
  },
];
