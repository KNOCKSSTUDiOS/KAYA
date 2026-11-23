import cinemaCameraImg from './assets/images/cinema_camera_subject_1794798514965.jpg';
import studioHeadphonesImg from './assets/images/studio_headphone_subject_1794798516001.jpg';
import workstationLaptopImg from './assets/images/workstation_laptop_subject_1794798516221.jpg';
import heroAndroidImg from './assets/images/hero_android_holo_1794800054600.jpg';
import heroHypercarImg from './assets/images/hero_neon_hypercar_1794800054933.jpg';
import heroMechImg from './assets/images/hero_mech_vortex_1794800053918.jpg';
import heroOrbitalImg from './assets/images/hero_orbital_dawn_1794800055374.jpg';

import employeeWorkspaceImg from './assets/images/employee_workspace_env_1794798536026.jpg';
import executiveOfficeImg from './assets/images/executive_office_env_1794798535841.jpg';
import enterpriseBoardroomImg from './assets/images/enterprise_boardroom_env_1794798536682.jpg';
import productionStageImg from './assets/images/production_stage_env_1794798536441.jpg';

export interface SuggestionChip {
  id: string;
  label: string;
  prompt: string;
  description: string;
  image: string;
  transparentImage?: string;
}

export interface MediaSelection {
  id: string;
  source: 'suggestion' | 'upload';
  images: string[];
  description: string;
}

export const MAX_PRODUCT_IMAGES = 1;

export interface BackgroundCubeVideo {
  id: string;
  label: string;
  url: string;
  poster?: string;
}

export const STUDIO_COLLAGE_BRAND_IMG = '/assets/aistudio/20260804_152818-COLLAGE_2724c318.jpg';
export const STUDIO_IRON_GATES_IMG = '/assets/aistudio/970502132_1783764988436682_aedae37b.jpg';

export const BACKGROUND_CUBE_VIDEOS: BackgroundCubeVideo[] = [
  {
    id: 'vid-santa-ana-3am',
    label: 'Santa Ana 3AM Street',
    url: '/assets/aistudio/20260730_200630-CINEMATIC_3_d22ffa2a.mp4',
    poster: STUDIO_COLLAGE_BRAND_IMG,
  },
  {
    id: 'vid-desert-fence',
    label: 'Desert Perimeter Fence',
    url: '/assets/aistudio/42073490_1783764494224455_73636a64.mp4',
    poster: STUDIO_IRON_GATES_IMG,
  },
  {
    id: 'vid-harbor-rain',
    label: 'Harbor Rain Freighter',
    url: '/assets/aistudio/gemini_generated_video_57a48fa0_f35f9eb9.mp4',
    poster: STUDIO_COLLAGE_BRAND_IMG,
  },
  {
    id: 'vid-oc-3am-port',
    label: '3AM Orange County Port',
    url: '/assets/aistudio/gemini_generated_video_68794ec2_7969eea6.mp4',
    poster: STUDIO_IRON_GATES_IMG,
  },
  {
    id: 'vid-golden-rack-focus',
    label: 'Golden Rack Focus',
    url: '/assets/aistudio/Untitled_Scene_07-08_07_45_37_202607080047_2a33917f.mp4',
    poster: STUDIO_COLLAGE_BRAND_IMG,
  },
];

export const PRODUCTS: SuggestionChip[] = [
  {
    id: 'knocks_chrome_emblem',
    label: 'Chrome Core Crest',
    prompt: 'Sculpted chrome geometric emblem illuminated by crimson and violet plasma sphere',
    description: 'Sculpted beveled titanium crest illuminated by crimson ember reflections.',
    image: STUDIO_COLLAGE_BRAND_IMG,
  },
  {
    id: 'cinema_camera',
    label: 'Cinema Camera Rig',
    prompt: 'Matte-black 4K digital cinema camera rig with anamorphic prime lens on carbon rails',
    description: '4K digital cinema camera rig with anamorphic prime optics mounted on precision rails.',
    image: cinemaCameraImg,
  },
  {
    id: 'studio_headphones',
    label: 'Mastering Headphones',
    prompt: 'Flagship anodized dark titanium reference headphones for broadcast audio mastering',
    description: 'Anodized titanium studio reference headphones engineered for broadcast mastering.',
    image: studioHeadphonesImg,
  },
  {
    id: 'workstation_laptop',
    label: 'Pro Workstation',
    prompt: 'CNC brushed aluminum enterprise mobile workstation in dark anodized finish',
    description: 'CNC-milled dark aluminum enterprise mobile workstation built for 4K post-production.',
    image: workstationLaptopImg,
  },
  {
    id: 'neon_hypercar',
    label: 'Neon Hypercar Frame',
    prompt: 'Wet midnight asphalt tracking shot with crimson neon tail streaks',
    description: 'Wet midnight tracking shot with neon tail streaks and specular chrome reflections.',
    image: heroHypercarImg,
  },
  {
    id: 'mech_vortex',
    label: 'Kinetic Core Rig',
    prompt: 'Articulated metallic orbital gyro rig inside volcanic studio chamber',
    description: 'Articulated metallic gyro rig inside obsidian-crimson forge stage.',
    image: heroMechImg,
  },
];

export const ATMOSPHERES: SuggestionChip[] = [
  {
    id: 'iron_gates_compound',
    label: 'Iron Chains & Vault Gates',
    prompt: 'Monumental brutalist concrete and rusted steel fortress gates breaking heavy iron chains',
    description: 'Monumental concrete compound with rusted steel gates and flying forge sparks.',
    image: STUDIO_IRON_GATES_IMG,
  },
  {
    id: 'production_stage',
    label: 'Production Stage',
    prompt: 'Enterprise cinema and broadcast production soundstage with overhead matte-black lighting truss',
    description: 'Enterprise cinema production soundstage with full overhead lighting truss and crew rig.',
    image: productionStageImg,
  },
  {
    id: 'orbital_dawn',
    label: 'Orbital Sunrise',
    prompt: 'Atmospheric orbital horizon at sunrise with deep space optical flare',
    description: 'High-orbit atmospheric horizon with crisp volumetric dawn rim light.',
    image: heroOrbitalImg,
  },
  {
    id: 'holo_chamber',
    label: 'Holo Projection Grid',
    prompt: 'Holographic projection bay with dark mirrored deck and ember light sweep',
    description: 'Dark mirrored optical stage for hologram and shader sequences.',
    image: heroAndroidImg,
  },
  {
    id: 'executive_office',
    label: 'Executive Office',
    prompt: 'Corner glass executive office overlooking skyline at dusk with acoustic walnut paneling',
    description: 'Glass corner executive office with skyline backdrop and architectural linear lighting.',
    image: executiveOfficeImg,
  },
  {
    id: 'enterprise_boardroom',
    label: 'Boardroom Suite',
    prompt: 'Architectural enterprise boardroom featuring honed black slate conference table and daylight glazing',
    description: 'Enterprise briefing boardroom with honed black slate table and acoustic glass walls.',
    image: enterpriseBoardroomImg,
  },
  {
    id: 'employee_workspace',
    label: 'Production Floor',
    prompt: 'Modern enterprise employee collaborative floor with glass acoustic conference pods and natural daylight',
    description: 'Enterprise collaborative production floor with acoustic glass pods and worktables.',
    image: employeeWorkspaceImg,
  },
];
