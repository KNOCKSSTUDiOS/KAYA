import enterpriseExecutiveImg from './assets/images/enterprise_executive_subject_1794798514202.jpg';
import cinemaCameraImg from './assets/images/cinema_camera_subject_1794798514965.jpg';
import studioHeadphonesImg from './assets/images/studio_headphone_subject_1794798516001.jpg';
import workstationLaptopImg from './assets/images/workstation_laptop_subject_1794798516221.jpg';

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

export const PRODUCTS: SuggestionChip[] = [
  {
    id: 'enterprise_executive',
    label: 'Enterprise Director',
    prompt: 'Enterprise creative director portrait in tailored dark slate blazer under three-point commercial lighting',
    description: 'Enterprise leadership subject in tailored dark slate attire under calibrated studio lighting.',
    image: enterpriseExecutiveImg,
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
];

export const ATMOSPHERES: SuggestionChip[] = [
  {
    id: 'employee_workspace',
    label: 'Employee Floor',
    prompt: 'Modern enterprise employee collaborative floor with glass acoustic conference pods and natural daylight',
    description: 'Enterprise employee collaborative production floor with acoustic glass pods and oak worktables.',
    image: employeeWorkspaceImg,
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
    id: 'production_stage',
    label: 'Production Stage',
    prompt: 'Enterprise cinema and broadcast production soundstage with overhead matte-black lighting truss',
    description: 'Enterprise cinema production soundstage with full overhead lighting truss and crew rig.',
    image: productionStageImg,
  },
];
