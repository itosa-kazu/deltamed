/**
 * State名 → 日本語表示ラベル
 * VeSMed step1の全stateを網羅
 */
export const STATE_LABELS: Record<string, string> = {
  // ─── 汎用 ──────────────────────────────────────
  present: '陽性',
  absent: '陰性',
  yes: 'あり',
  no: 'なし',
  none: 'なし',
  normal: '正常',
  negative: '陰性',
  positive: '陽性',
  not_assessed: '未評価',
  not_done_or_pending: '未実施',
  other: 'その他',
  multiple: '多発',
  unknown: '不明',

  // ─── 感染パターン ──────────────────────────────
  bacterial: '細菌性',
  viral: 'ウイルス性',
  bacterial_pattern: '細菌パターン',
  viral_pattern: 'ウイルスパターン',
  tb_fungal_pattern: '結核/真菌パターン',
  fungal: '真菌',

  // ─── 血算・WBC関連 ─────────────────────────────
  high: '上昇',
  low: '低下',
  very_high: '著明上昇',
  very_low: '著明低下',
  normal_4000_10000: '正常(4千-1万)',
  high_10000_20000: '上昇(1-2万)',
  very_high_over_20000: '著明上昇(>2万)',
  low_under_4000: '低下(<4千)',
  left_shift: '左方移動',
  atypical_lymphocytes: '異型リンパ球',
  eosinophilia: 'エオジン好酸球増多',
  lymphocyte_predominant: 'リンパ球優位',
  thrombocytopenia: '血小板減少',

  // ─── 血小板 ────────────────────────────────────
  low_50k_150k: '軽度低下(5-15万)',
  very_low_under_50k: '著明低下(<5万)',
  high_over_400k: '増多(>40万)',
  very_high_over_1000k: '著明増多(>100万)',

  // ─── 貧血・MCV ────────────────────────────────
  microcytic: '小球性',
  normocytic: '正球性',
  macrocytic: '大球性',
  iron_deficiency: '鉄欠乏パターン',
  iron_overload: '鉄過剰',
  chronic_disease: '慢性疾患パターン',

  // ─── 炎症マーカー(CRP等) ───────────────────────
  'mild_0.3_3': '軽度上昇(0.3-3)',
  moderate_3_10: '中等度上昇(3-10)',
  very_high_over_100: '著明上昇(>100)',
  very_high_over_1000: '著明上昇(>1000)',
  very_high_over_500: '著明上昇(>500)',
  normal_under_0_3: '正常(<0.3)',
  'normal_under_0.3': '正常(<0.3)',
  high_over_10: '高度上昇(>10)',

  // ─── LDH ──────────────────────────────────────
  mild_elevated: '軽度上昇',
  moderate_elevated: '中等度上昇',
  markedly_elevated: '著明上昇',
  mildly_elevated: '軽度上昇',

  // ─── 肝機能 ───────────────────────────────────
  hepatocellular: '肝細胞障害型',
  cholestatic: '胆汁うっ滞型',
  elevated: '上昇',
  extreme_over_10000: '劇症(>10000)',

  // ─── ビリルビン ───────────────────────────────
  direct_dominant: '直接ビリルビン優位',
  indirect_dominant: '間接ビリルビン優位',

  // ─── 腎機能 ───────────────────────────────────
  no_AKI: 'AKIなし',
  high_AKI: 'AKI',
  prerenal: '腎前性',
  renal: '腎性',
  postrenal: '腎後性',

  // ─── 蛋白尿 ───────────────────────────────────
  mild_proteinuria: '軽度蛋白尿',
  nephrotic_range: 'ネフローゼ域',

  // ─── 電解質 ───────────────────────────────────
  hyponatremia: '低Na血症',
  hyperkalemia: '高K血症',
  hyper_5_0_6_5: '軽度高K(5.0-6.5)',
  'hyper_5.0_6.5': '軽度高K(5.0-6.5)',
  severe_hyper_over_6_5: '重度高K(>6.5)',
  'severe_hyper_over_6.5': '重度高K(>6.5)',
  hypo_2_5_3_5: '軽度低Ca(2.5-3.5)',
  'hypo_2.5_3.5': '軽度低Ca(2.5-3.5)',
  severe_hypo_under_2_5: '重度低Ca(<2.5)',
  'severe_hypo_under_2.5': '重度低Ca(<2.5)',

  // ─── 血糖 ─────────────────────────────────────
  hypoglycemia: '低血糖',
  hyperglycemia: '高血糖',
  prediabetic: '耐糖能異常',
  diabetic: '糖尿病域',

  // ─── 甲状腺 ───────────────────────────────────
  hyperthyroid: '甲状腺機能亢進',
  hypothyroid: '甲状腺機能低下',

  // ─── 血液ガス ──────────────────────────────────
  metabolic_acidosis: '代謝性アシドーシス',
  metabolic_alkalosis: '代謝性アルカローシス',
  respiratory_acidosis: '呼吸性アシドーシス',
  respiratory_alkalosis: '呼吸性アルカローシス',
  lactic_acidosis: '乳酸アシドーシス',
  osmolar_gap_elevated: '浸透圧ギャップ上昇',

  // ─── 凝固 ─────────────────────────────────────
  mildly_prolonged: '軽度延長',
  very_prolonged: '著明延長',
  overt_DIC: '顕性DIC',
  pre_DIC: 'DIC前段階',

  // ─── Hb ───────────────────────────────────────
  low_7_10: '軽度低下(7-10)',
  very_low_under_7: '重度低下(<7)',
  mild_low_10_12: '境界低下(10-12)',
  mildly_low: '軽度低下',

  // ─── 免疫 ─────────────────────────────────────
  c_ANCA: 'c-ANCA陽性',
  p_ANCA: 'p-ANCA陽性',
  low_C3: '低C3',
  low_C4: '低C4',
  low_both: 'C3+C4低下',
  monoclonal_gammopathy: '単クローン性',
  polyclonal_gammopathy: '多クローン性',
  reactive: '反応性',

  // ─── 尿検査 ───────────────────────────────────
  pyuria_bacteriuria: '膿尿+細菌尿',
  concentrated: '濃縮尿',
  dilute: '希釈尿',
  inappropriately_concentrated: '不適切濃縮',
  crystals: '結晶',

  // ─── 培養・グラム染色 ──────────────────────────
  gpc: 'グラム陽性球菌',
  gnr: 'グラム陰性桿菌',
  gpr: 'グラム陽性桿菌',
  gn: 'グラム陰性菌',
  gram_positive: 'グラム陽性',
  gram_negative: 'グラム陰性',
  afb: '抗酸菌',
  branching_filaments: '分岐フィラメント',
  pathogen_detected: '病原体検出',

  // ─── 肝炎ウイルス ──────────────────────────────
  HAV_IgM: 'HAV IgM陽性',
  HBV: 'HBV陽性',
  HCV: 'HCV陽性',
  HEV: 'HEV陽性',
  HSV_PCR_positive: 'HSV PCR陽性',

  // ─── 画像(胸部) ───────────────────────────────
  lobar_infiltrate: '大葉性浸潤影',
  bilateral_infiltrate: '両側浸潤影',
  consolidation: '浸潤影',
  pleural_effusion: '胸水',
  pneumothorax: '気胸',
  cavity: '空洞',
  GGO: 'すりガラス影',
  BHL: '両側肺門リンパ節腫脹',
  halo_sign: 'ハローサイン',
  granuloma: '肉芽腫',

  // ─── 画像(腹部) ───────────────────────────────
  gallbladder_wall_thickening: '胆嚢壁肥厚',
  subdiaphragmatic_free_air: '横隔膜下遊離ガス',
  free_fluid: '腹水',
  appendix_swelling: '虫垂腫大',
  diverticula: '憩室',

  // ─── 画像(頭部・脊椎) ──────────────────────────
  temporal_lobe_lesion: '側頭葉病変',
  epidural_abscess: '硬膜外膿瘍',
  myelitis: '脊髄炎',
  disc_herniation: '椎間板ヘルニア',
  compression_fracture: '圧迫骨折',
  diffuse_abnormal: 'びまん性異常',

  // ─── 画像(その他) ──────────────────────────────
  bone: '骨転移',
  brain: '脳転移',
  liver: '肝転移',
  lung: '肺転移',
  lytic_lesions: '溶骨性病変',
  tumor: '腫瘍性',
  inflammation: '炎症性',
  castleman: 'キャッスルマン型',
  kikuchi_pattern: '菊池病パターン',
  lymphoma: 'リンパ腫パターン',

  // ─── 内視鏡 ───────────────────────────────────
  esophagitis: '食道炎',
  gastritis: '胃炎',
  ulcer: '潰瘍',
  varices: '静脈瘤',
  polyp: 'ポリープ',

  // ─── 婦人科 ───────────────────────────────────
  adnexal_mass: '付属器腫瘤',
  cervical_mass: '子宮頸部腫瘤',
  endometrial_thickening: '子宮内膜肥厚',
  endometrioma: 'チョコレート嚢胞',
  fibroid: '子宮筋腫',
  uterine_enlargement: '子宮腫大',

  // ─── 心機能 ───────────────────────────────────
  mild_NYHA2: '軽度(NYHA II)',
  severe_NYHA3_4: '重度(NYHA III-IV)',
  congestive: 'うっ血型',
  septic: '敗血症型',

  // ─── 被曝量 ───────────────────────────────────
  'gray_0.25_0.5': '0.25-0.5 Gy',
  gray_0_25_0_5: '0.25-0.5 Gy',
  high_over_0_5: '>0.5 Gy',
  'high_over_0.5': '>0.5 Gy',
  low_under_0_25: '<0.25 Gy',
  'low_under_0.25': '<0.25 Gy',

  // ─── ABI ──────────────────────────────────────
  low_under_0_9: '低下(<0.9)',
  'low_under_0.9': '低下(<0.9)',
  normal_over_0_9: '正常(≥0.9)',
  'normal_over_0.9': '正常(≥0.9)',

  // ─── DIC ──────────────────────────────────────
  both_elevated: '両方上昇',
  elevated_over_250: '上昇(>250)',

  // ─── 心電図 ───────────────────────────────────
  AF: '心房細動',
  SVT: '上室性頻拍',
  VT: '心室頻拍',
  ST_elevation: 'ST上昇',
  ST_depression: 'ST低下',
  QT_prolongation: 'QT延長',
  LVH: '左室肥大',
  LVH_pattern: '左室肥大パターン',
  RVH_strain: '右室負荷',
  Brugada_pattern: 'Brugada型',

  // ─── 心音 ─────────────────────────────────────
  S3: 'III音',
  S4: 'IV音',
  new: '新規',
  pre_existing: '既存',

  // ─── 心エコー ──────────────────────────────────
  wall_motion_abnormal: '壁運動異常',
  valvular_abnormal: '弁異常',
  dilated_chamber: '腔拡大',
  pericardial_effusion: '心嚢液貯留',

  // ─── バイタル・体温 ────────────────────────────
  under_37_5: '<37.5℃',
  'under_37.5': '<37.5℃',
  '37.5_38.0': '37.5-38.0℃',
  '38.0_39.0': '38.0-39.0℃',
  '39.0_40.0': '39.0-40.0℃',
  over_40_0: '>40.0℃',
  'over_40.0': '>40.0℃',
  hypothermia_under_35: '低体温(<35℃)',

  // ─── バイタル・脈拍 ────────────────────────────
  under_100: '正常(<100)',
  '100_120': '頻脈(100-120)',
  over_120: '著明頻脈(>120)',

  // ─── バイタル・血圧 ────────────────────────────
  normal_under_140: '正常(<140)',
  elevated_140_180: '高血圧(140-180)',
  crisis_over_180: '高血圧緊急(>180)',
  hypotension_under_90: '低血圧(<90)',
  normal_over_90: '正常(>90)',
  shock: 'ショック',

  // ─── バイタル・呼吸 ────────────────────────────
  normal_under_20: '正常(<20)',
  tachypnea_20_30: '頻呼吸(20-30)',
  severe_over_30: '重度頻呼吸(>30)',

  // ─── SpO2 ─────────────────────────────────────
  normal_over_96: '正常(>96%)',
  mild_hypoxia_93_96: '軽度低酸素(93-96%)',
  severe_hypoxia_under_93: '重度低酸素(<93%)',

  // ─── CRT ──────────────────────────────────────
  normal_under_2s: '正常(<2秒)',
  delayed_2_4s: '延長(2-4秒)',
  very_delayed_over_4s: '著明延長(>4秒)',

  // ─── 意識 ─────────────────────────────────────
  confused: '混迷',
  obtunded: '昏蒙',

  // ─── 皮膚所見 ──────────────────────────────────
  maculopapular_rash: '斑丘疹',
  vesicle_bulla: '水疱・水泡',
  vesicular_dermatomal: '帯状疱疹型水疱',
  petechiae_purpura: '点状出血・紫斑',
  purpura: '紫斑',
  erythema: '紅斑',
  localized_erythema_warmth_swelling: '局所発赤・熱感・腫脹',
  diffuse_erythroderma: 'びまん性紅皮症',
  skin_necrosis: '皮膚壊死',
  necrotic_ulcer: '壊死性潰瘍',
  gangrene: '壊疽',
  flushing: '紅潮',
  pallor: '蒼白',
  pallor_cold: '蒼白+冷感',
  cyanosis: 'チアノーゼ',
  hyperpigmentation: '色素沈着',
  bronze: '青銅色',
  clubbing: 'ばち指',
  janeway_osler: 'Janeway/Osler',
  splinter_hemorrhage: '爪下線状出血',
  skin_tag: '皮膚タグ',
  localized_pain_redness: '局所疼痛・発赤',

  // ─── 分布 ─────────────────────────────────────
  localized: '局所性',
  generalized: '全身性',
  bilateral: '両側性',
  unilateral: '片側性',
  diffuse: 'びまん性',

  // ─── リンパ節 ──────────────────────────────────
  cervical: '頸部',
  axillary: '腋窩',
  inguinal: '鼠径',
  mediastinal: '縦隔',
  supraclavicular: '鎖骨上',

  // ─── 眼所見 ───────────────────────────────────
  conjunctivitis: '結膜炎',
  uveitis: 'ぶどう膜炎',
  papilledema: 'うっ血乳頭',
  cotton_wool: '綿花様白斑',
  roth_spots: 'Roth斑',
  hemorrhage: '出血',
  diabetic_changes: '糖尿病性変化',
  RAPD: 'RAPD陽性',
  anisocoria: '瞳孔不同',
  miosis: '縮瞳',
  mydriasis: '散瞳',

  // ─── 脳神経 ───────────────────────────────────
  CN3_palsy: 'CN3麻痺',
  CN4_palsy: 'CN4麻痺',
  CN6_palsy: 'CN6麻痺',
  INO: '核間性眼筋麻痺',
  gaze_palsy: '注視麻痺',

  // ─── 筋緊張・反射 ──────────────────────────────
  flaccid: '弛緩性',
  spastic: '痙性',
  rigid: '固縮',
  paratonia: 'パラトニア',
  hyperreflexia: '反射亢進',
  hyporeflexia: '反射低下',
  areflexia: '反射消失',
  hyperactive_high_pitched: '亢進+高調音',
  hypoactive: '低下',

  // ─── 眼振 ─────────────────────────────────────
  horizontal: '水平性',
  vertical: '垂直性',
  rotatory: '回旋性',

  // ─── 関節 ─────────────────────────────────────
  monoarticular: '単関節',
  polyarticular: '多関節',

  // ─── 腸音 ─────────────────────────────────────
  stable: '正常',
  decreased: '減弱',
  decreased_absent: '減弱〜消失',
  blood: '血性',

  // ─── 腹部所見 ──────────────────────────────────
  soft_nontender: '軟・圧痛なし',
  localized_tenderness: '局所圧痛',
  peritoneal_signs: '腹膜刺激徴候',
  compensated: '代償性',

  // ─── 肛門 ─────────────────────────────────────
  fissure: '裂肛',
  hemorrhoid: '痔核',
  fistula: '瘻孔',
  mass: '腫瘤',
  abscess: '膿瘍',

  // ─── 泌尿器 ───────────────────────────────────
  prostate_enlargement: '前立腺肥大',

  // ─── 婦人科(診察) ──────────────────────────────
  adnexal_tenderness: '付属器圧痛',
  cervical_motion_tenderness: '子宮頸管牽引痛',

  // ─── 出血 ─────────────────────────────────────
  bleeding: '出血',
  both: '両方',
  few_under_11: '少数(<11)',
  many_11_or_more: '多数(≥11)',

  // ─── 滲出液 ───────────────────────────────────
  clear: '透明',
  exudate_or_white_patch: '滲出液/白斑',
  perforated: '穿孔',
  retracted: '陥凹',
  bulging_erythematous: '膨隆・発赤',

  // ─── 重症度 ───────────────────────────────────
  mild: '軽度',
  moderate: '中等度',
  severe: '重度',

  // ─── 発熱経過 ──────────────────────────────────
  under_3d: '3日未満',
  '3d_to_1w': '3日-1週間',
  '1w_to_3w': '1-3週間',
  over_3w: '3週間以上',
  sudden: '突発',
  acute: '急性',
  subacute: '亜急性',
  chronic: '慢性',
  intermittent: '間欠的',
  continuous: '持続的',
  periodic: '周期的',
  double_quotidian: '二峰性',

  // ─── 症状(発症様式) ────────────────────────────
  hyperacute: '超急性',
  hyperacute_seconds: '超急性(秒)',
  instantaneous_seconds: '瞬間的(秒)',
  acute_onset: '急性発症',
  acute_hours: '急性(時間)',
  acute_under_2w: '急性(<2週)',
  acute_under_3w: '急性(<3週)',
  subacute_days_weeks: '亜急性(日-週)',
  subacute_3w_8w: '亜急性(3-8週)',
  chronic_over_4w: '慢性(>4週)',
  chronic_over_8w: '慢性(>8週)',
  chronic_progressive: '慢性進行性',
  chronic_stable: '慢性安定',
  gradual_months: '緩徐(月単位)',
  rapid_weeks: '急速(週単位)',
  progressive: '進行性',
  progressive_with_neuro: '進行性+神経症状',
  recurrent: '反復性',
  first_episode: '初発',
  transient: '一過性',
  persistent: '持続性',
  persistent_2w_4w: '持続(2-4週)',
  persistent_hours_days: '持続(時間-日)',
  single_acute: '単発急性',
  episodic_recurrent: '反復性',
  episodic_with_hearing: '反復+聴力障害',
  thunderclap: '雷鳴様',

  // ─── 症状(頭痛) ───────────────────────────────
  unilateral_pulsating: '片側拍動性',
  bilateral_pressing: '両側圧迫感',
  periorbital_stabbing: '眼窩周囲刺痛',
  photophobia_only: '光過敏のみ',
  phonophobia_only: '音過敏のみ',

  // ─── 症状(めまい) ──────────────────────────────
  continuous_rotatory: '持続性回転性',
  non_rotatory_disequilibrium: '非回転性平衡障害',
  positional_brief: '頭位変換性(短時間)',

  // ─── 症状(痛み) ───────────────────────────────
  sharp: '鋭痛',
  dull_aching: '鈍痛',
  burning: '灼熱痛',
  burning_gnawing: '灼熱・齧痛',
  colicky: '疝痛',
  intermittent_colicky: '間欠性疝痛',
  sharp_stabbing: '刺痛',
  throbbing: '拍動痛',
  pressure: '圧迫感',
  tearing: '裂痛',
  electric_triggered: '電撃痛',

  // ─── 症状(疼痛部位) ────────────────────────────
  epigastric: '心窩部',
  RUQ: '右上腹部',
  RLQ: '右下腹部',
  LLQ: '左下腹部',
  suprapubic: '恥骨上',
  chest: '胸部',
  back: '背部',
  groin: '鼠径',
  lumbar: '腰部',
  thoracic: '胸椎',
  sacral: '仙骨部',
  saddle: '会陰部',
  left_arm_jaw: '左腕・下顎',
  left_shoulder: '左肩',
  right_shoulder: '右肩',
  anterior: '前方',
  posterior: '後方',

  // ─── 症状(放散・誘因) ──────────────────────────
  relieved_by_food: '食事で軽減',
  relieved_by_leaning_forward: '前屈で軽減',
  worse_with_movement: '体動で増悪',
  postprandial: '食後',
  exercise: '運動',
  exertion: '労作',
  exertional: '労作時',
  on_exertion: '労作時',
  at_rest: '安静時',
  rest: '安静時',
  stress: 'ストレス',
  cold_air: '冷気',
  allergen: 'アレルゲン',
  weather: '天候',
  valsalva_cough: 'Valsalva/咳嗽',
  positional: '体位性',
  positional_supine: '仰臥位',
  positional_upright: '立位',
  positional_platypnea: '起座呼吸(逆)',
  supine: '仰臥位',
  position: '体位変換',
  activity: '活動',
  meals: '食事',
  meals_speaking: '食事・会話',
  fasting_improves: '絶食で改善',
  sleep_deprivation: '睡眠不足',
  emotional: '感情',
  photic: '光刺激',
  medication_related: '薬剤関連',
  ACE_inhibitor: 'ACE阻害薬',
  antibiotics: '抗菌薬',
  alcohol_withdrawal: 'アルコール離脱',
  none_identified: '誘因なし',

  // ─── 症状(呼吸) ───────────────────────────────
  dry: '乾性',
  productive: '湿性',
  stridor: '吸気性喘鳴',
  wheezing: '呼気性喘鳴',
  air_hunger_kussmaul: 'Kussmaul呼吸',
  paroxysmal_nocturnal: '発作性夜間',

  // ─── 症状(嘔吐) ───────────────────────────────
  food_content: '食物残渣',
  bilious: '胆汁性',
  feculent: '糞臭性',
  projectile: '噴射性',

  // ─── 症状(下痢) ───────────────────────────────
  watery: '水様',
  bloody: '血性',
  mucoid: '粘液',

  // ─── 症状(排尿) ───────────────────────────────
  oliguria: '乏尿',
  anuria: '無尿',
  overflow: '溢流性',
  urge: '切迫性',

  // ─── 症状(嚥下) ───────────────────────────────
  solids_only: '固形物のみ',
  liquids_worse: '液体で増悪',
  solids_and_liquids: '固形+液体',

  // ─── 症状(分泌物) ──────────────────────────────
  purulent: '膿性',
  serous: '漿液性',
  foamy: '泡沫状',
  milky: '乳白色',
  tea_colored: '茶褐色',
  cola_colored: 'コーラ色',
  cloudy: '混濁',
  clear_rhinorrhea: '水様鼻漏',
  purulent_rhinorrhea: '膿性鼻漏',

  // ─── 症状(視覚) ───────────────────────────────
  visual: '視覚性',
  visual_loss: '視力低下',
  monocular: '単眼性',
  binocular: '両眼性',
  central_scotoma: '中心暗点',
  hemianopia: '半盲',

  // ─── 症状(聴覚) ───────────────────────────────
  conductive: '伝音性',
  sensorineural: '感音性',
  auditory: '聴覚性',
  tactile: '触覚性',

  // ─── 症状(神経) ───────────────────────────────
  focal: '局所性',
  focal_to_bilateral: '局所→両側化',
  status_epilepticus: 'てんかん重積',
  aphasia: '失語',
  dysarthria: '構音障害',
  hemisensory: '片側感覚障害',
  unilateral_weakness: '片側筋力低下',
  ascending: '上行性',
  stocking_glove: '手袋靴下型',
  dermatomal: 'デルマトーム分布',
  proximal_girdle: '近位筋',
  upper_and_lower: '上下肢',
  lower_only: '下肢のみ',

  // ─── 症状(不随意運動) ──────────────────────────
  tremor_resting: '安静時振戦',
  tremor_action: '動作時振戦',
  chorea: '舞踏運動',
  dystonia: 'ジストニア',
  myoclonus: 'ミオクローヌス',

  // ─── 症状(歩行) ───────────────────────────────
  antalgic: '疼痛性',
  ataxic: '失調性',
  shuffling: 'すり足',
  steppage: '鶏歩',
  waddling: '動揺性',
  functional: '機能性',

  // ─── 症状(発疹分布) ────────────────────────────
  rash_widespread: '広範囲',
  patchy: '斑状',
  acral: '四肢末端',
  extremities_centrifugal: '四肢優位(遠心性)',
  trunk_centripetal: '体幹優位(求心性)',
  mucosal: '粘膜',

  // ─── 症状(発熱パターン) ────────────────────────
  fever: '発熱',
  morning: '朝方',
  constant: '持続性',
  abnormal: '異常',

  // ─── 症状(持続時間) ────────────────────────────
  under_30min: '<30分',
  over_30min: '>30分',
  minutes_to_hours: '分-時間',
  over_1hour: '>1時間',
  migratory: '移動性',

  // ─── 症状(その他) ──────────────────────────────
  no_change: '変化なし',
  improves_with_activity: '活動で改善',
  worsens_with_activity: '活動で増悪',
  excessive: '過剰',
  metabolic: '代謝性',
  neither: 'いずれでもない',
  mixed: '混合',
  ipsilateral_testicle: '同側精巣',

  // ─── リスク因子(年齢) ──────────────────────────
  '0_1': '0-1歳',
  '1_5': '1-5歳',
  '6_12': '6-12歳',
  '13_17': '13-17歳',
  '18_39': '18-39歳',
  '40_64': '40-64歳',
  '65_plus': '65歳以上',

  // ─── リスク因子(性別) ──────────────────────────
  male: '男性',
  female: '女性',

  // ─── リスク因子(喫煙) ──────────────────────────
  current: '現在喫煙',
  former: '元喫煙者',
  never: '非喫煙',

  // ─── リスク因子(HIV) ──────────────────────────
  hiv_positive_controlled: 'HIV陽性(管理良好)',
  hiv_positive_uncontrolled: 'HIV陽性(未管理)',
  aids: 'AIDS',
  active_on_treatment: '治療中',
  active_untreated: '未治療',
  history_remission: '寛解',

  // ─── リスク因子(予防接種) ──────────────────────
  vaccinated: '接種済',
  unvaccinated: '未接種',

  // ─── リスク因子(地域・動物) ────────────────────
  tropical_endemic: '熱帯流行地',
  developed: '先進国',
  domestic: '家畜',
  livestock: '畜産',
  pet_cat: '猫飼育',
  wild_animal: '野生動物',

  // ─── リスク因子(季節) ──────────────────────────
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬',

  // ─── リスク(曝露) ─────────────────────────────
  drug_allergy: '薬物アレルギー',
  food_allergy: '食物アレルギー',
  asbestos: 'アスベスト',
  silica: 'シリカ',
  radiation: '放射線',
  heavy_metals: '重金属',
  organic_solvents: '有機溶剤',

  // ─── リスク(妊娠) ─────────────────────────────
  not_pregnant: '非妊娠',
  first_trimester: '妊娠初期',
  second_trimester: '妊娠中期',
  third_trimester: '妊娠後期',
  postpartum: '産褥期',
}

/** state名を日本語に変換。マッピングがなければ原名を整形して返す */
export function getStateLabel(state: string): string {
  if (STATE_LABELS[state]) return STATE_LABELS[state]
  // Fallback: アンダースコアをスペースに、読みやすく
  return state.replace(/_/g, ' ')
}
