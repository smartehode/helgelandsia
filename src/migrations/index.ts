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
import * as migration_20260705_100347_regnskap from './20260705_100347_regnskap';
import * as migration_20260705_105446_regnskap from './20260705_105446_regnskap';
import * as migration_20260705_172608_fremhevet_og_anbudwidget from './20260705_172608_fremhevet_og_anbudwidget';
import * as migration_20260705_175634_historier_arrangementer_blokker from './20260705_175634_historier_arrangementer_blokker';
import * as migration_20260705_175739_test_tom from './20260705_175739_test_tom';
import * as migration_20260705_181403_skipstrafikk_blokk from './20260705_181403_skipstrafikk_blokk';
import * as migration_20260705_181414_test_tom from './20260705_181414_test_tom';
import * as migration_20260705_231004_widget_layout_control from './20260705_231004_widget_layout_control';
import * as migration_20260705_231027_test_tom from './20260705_231027_test_tom';
import * as migration_20260714_194716_politilogg_blokk from './20260714_194716_politilogg_blokk';
import * as migration_20260715_013907_ferge_slider from './20260715_013907_ferge_slider';
import * as migration_20260715_092949_kunngjoringer_widget from './20260715_092949_kunngjoringer_widget';
import * as migration_20260716_011758 from './20260716_011758';
import * as migration_20260722_065046_ics_import from './20260722_065046_ics_import';
import * as migration_20260723_234726_kalender_aktivitet from './20260723_234726_kalender_aktivitet';
import * as migration_20260724_102514 from './20260724_102514';
import * as migration_20260724_160029 from './20260724_160029';
import * as migration_20260802_192700 from './20260802_192700';
import * as migration_20260802_195954_oppdrag_collection from './20260802_195954_oppdrag_collection';

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
    name: '20260705_061342_doffin_tenders',
  },
  {
    up: migration_20260705_100347_regnskap.up,
    down: migration_20260705_100347_regnskap.down,
    name: '20260705_100347_regnskap',
  },
  {
    up: migration_20260705_105446_regnskap.up,
    down: migration_20260705_105446_regnskap.down,
    name: '20260705_105446_regnskap',
  },
  {
    up: migration_20260705_172608_fremhevet_og_anbudwidget.up,
    down: migration_20260705_172608_fremhevet_og_anbudwidget.down,
    name: '20260705_172608_fremhevet_og_anbudwidget',
  },
  {
    up: migration_20260705_175634_historier_arrangementer_blokker.up,
    down: migration_20260705_175634_historier_arrangementer_blokker.down,
    name: '20260705_175634_historier_arrangementer_blokker',
  },
  {
    up: migration_20260705_175739_test_tom.up,
    down: migration_20260705_175739_test_tom.down,
    name: '20260705_175739_test_tom',
  },
  {
    up: migration_20260705_181403_skipstrafikk_blokk.up,
    down: migration_20260705_181403_skipstrafikk_blokk.down,
    name: '20260705_181403_skipstrafikk_blokk',
  },
  {
    up: migration_20260705_181414_test_tom.up,
    down: migration_20260705_181414_test_tom.down,
    name: '20260705_181414_test_tom',
  },
  {
    up: migration_20260705_231004_widget_layout_control.up,
    down: migration_20260705_231004_widget_layout_control.down,
    name: '20260705_231004_widget_layout_control',
  },
  {
    up: migration_20260705_231027_test_tom.up,
    down: migration_20260705_231027_test_tom.down,
    name: '20260705_231027_test_tom',
  },
  {
    up: migration_20260714_194716_politilogg_blokk.up,
    down: migration_20260714_194716_politilogg_blokk.down,
    name: '20260714_194716_politilogg_blokk',
  },
  {
    up: migration_20260715_013907_ferge_slider.up,
    down: migration_20260715_013907_ferge_slider.down,
    name: '20260715_013907_ferge_slider',
  },
  {
    up: migration_20260715_092949_kunngjoringer_widget.up,
    down: migration_20260715_092949_kunngjoringer_widget.down,
    name: '20260715_092949_kunngjoringer_widget',
  },
  {
    up: migration_20260716_011758.up,
    down: migration_20260716_011758.down,
    name: '20260716_011758',
  },
  {
    up: migration_20260722_065046_ics_import.up,
    down: migration_20260722_065046_ics_import.down,
    name: '20260722_065046_ics_import',
  },
  {
    up: migration_20260723_234726_kalender_aktivitet.up,
    down: migration_20260723_234726_kalender_aktivitet.down,
    name: '20260723_234726_kalender_aktivitet',
  },
  {
    up: migration_20260724_102514.up,
    down: migration_20260724_102514.down,
    name: '20260724_102514',
  },
  {
    up: migration_20260724_160029.up,
    down: migration_20260724_160029.down,
    name: '20260724_160029',
  },
  {
    up: migration_20260802_192700.up,
    down: migration_20260802_192700.down,
    name: '20260802_192700',
  },
  {
    up: migration_20260802_195954_oppdrag_collection.up,
    down: migration_20260802_195954_oppdrag_collection.down,
    name: '20260802_195954_oppdrag_collection'
  },
];
