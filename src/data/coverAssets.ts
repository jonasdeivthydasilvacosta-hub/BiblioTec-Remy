import heroSchoolLibrary from '../assets/images/hero_school_library_1794591609683.jpg';
import coverLiteraturaBrasileira from '../assets/images/cover_literatura_brasileira_1794591609032.jpg';
import coverFiccaoFantasia from '../assets/images/cover_ficcao_fantasia_1794591609950.jpg';
import coverCienciasTecnologia from '../assets/images/cover_ciencias_tecnologia_1794591610261.jpg';
import coverHistoria from '../assets/images/cover_historia_1794591610747.jpg';
import coverQuadrinhos from '../assets/images/cover_quadrinhos_1794591611326.jpg';
import type { CollectionId } from '../types/library';

export const HERO_LIBRARY_IMAGE = heroSchoolLibrary;

export interface PresetCoverOption {
  id: string;
  label: string;
  url: string;
}

export const PRESET_COVERS: PresetCoverOption[] = [
  {
    id: 'literatura',
    label: 'Arcos & Botânica',
    url: coverLiteraturaBrasileira,
  },
  {
    id: 'fantasia',
    label: 'Torre & Astrolábio',
    url: coverFiccaoFantasia,
  },
  {
    id: 'ciencias',
    label: 'Órbitas & Prisma',
    url: coverCienciasTecnologia,
  },
  {
    id: 'historia',
    label: 'Bússola & Pórtico',
    url: coverHistoria,
  },
  {
    id: 'quadrinhos',
    label: 'Voo sobre a Costa',
    url: coverQuadrinhos,
  },
];

export const DEFAULT_COVER_BY_COLLECTION: Record<CollectionId, string> = {
  'literatura-brasileira': coverLiteraturaBrasileira,
  'ficcao-fantasia': coverFiccaoFantasia,
  'ciencias-tecnologia': coverCienciasTecnologia,
  historia: coverHistoria,
  'material-didatico': coverCienciasTecnologia,
  quadrinhos: coverQuadrinhos,
};
