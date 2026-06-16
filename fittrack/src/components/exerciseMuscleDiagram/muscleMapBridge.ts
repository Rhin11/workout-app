import type { MuscleGroup, MusclePath, OutlinePath } from './assets/muscleMapTypes';
import type { MuscleRegionId, MuscleRole } from './types';

/** Maps exercise diagram regions to MuscleMap muscle groups. */
export const REGION_TO_MUSCLE_GROUPS: Record<MuscleRegionId, MuscleGroup[]> = {
  chest: ['CHEST'],
  front_delts: ['SHOULDERS_FRONT', 'SHOULDERS_SIDE'],
  rear_delts: ['SHOULDERS_REAR', 'SHOULDERS_SIDE'],
  traps: ['TRAPEZIUS'],
  lats: ['LATS'],
  biceps: ['BICEPS'],
  triceps: ['TRICEPS'],
  forearms: ['FOREARMS'],
  abs: ['CORE'],
  obliques: ['OBLIQUES'],
  lower_back: ['BACK_LOWER'],
  glutes: ['GLUTES'],
  quadriceps: ['QUADS'],
  hamstrings: ['HAMSTRINGS'],
  calves: ['CALVES'],
  adductors: ['ADDUCTORS'],
  abductors: ['ABDUCTORS'],
};

export type RenderMusclePath = {
  key: string;
  group: MuscleGroup;
  partId?: string;
  d: string;
  mirrored: boolean;
};

export type RenderOutlinePath = {
  key: string;
  d: string;
  mirrored: boolean;
};

export function expandOutlinePath(part: OutlinePath, index: number): RenderOutlinePath[] {
  if (part.side === 'CENTER') {
    return [{ key: `${part.id}-${index}-c`, d: part.d, mirrored: false }];
  }

  return [
    { key: `${part.id}-${index}-l`, d: part.d, mirrored: false },
    { key: `${part.id}-${index}-r`, d: part.d, mirrored: true },
  ];
}

export function expandMusclePath(path: MusclePath, index: number): RenderMusclePath[] {
  if (path.side === 'CENTER') {
    return [
      {
        key: `${path.group}-${index}-c`,
        group: path.group,
        partId: path.id,
        d: path.d,
        mirrored: false,
      },
    ];
  }

  const rightId = path.id?.replace(/_LEFT$/, '_RIGHT');
  return [
    {
      key: `${path.group}-${index}-l`,
      group: path.group,
      partId: path.id,
      d: path.d,
      mirrored: false,
    },
    {
      key: `${path.group}-${index}-r`,
      group: path.group,
      partId: rightId,
      d: path.d,
      mirrored: true,
    },
  ];
}

export function buildGroupRoleMap(
  roleMap: Map<MuscleRegionId, MuscleRole>,
): Map<MuscleGroup, MuscleRole> {
  const groupRoles = new Map<MuscleGroup, MuscleRole>();

  for (const [regionId, role] of roleMap) {
    const groups = REGION_TO_MUSCLE_GROUPS[regionId];
    for (const group of groups) {
      const existing = groupRoles.get(group);
      if (!existing || role === 'primary') {
        groupRoles.set(group, role);
      }
    }
  }

  return groupRoles;
}

export function roleForMuscleGroup(
  group: MuscleGroup,
  groupRoles: Map<MuscleGroup, MuscleRole>,
): MuscleRole {
  return groupRoles.get(group) ?? 'inactive';
}
