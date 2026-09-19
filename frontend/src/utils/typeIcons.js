import { Building2, Droplets, Factory, FolderKanban, Route, TrainFront } from 'lucide-react'
import { PROJECT_TYPES } from './constants'

/**
 * Maps a project type to its representative lucide icon. Used by the selected
 * project banner and anywhere a compact type visual is needed.
 */
const TYPE_ICONS = {
  [PROJECT_TYPES.ROAD]: Route,
  [PROJECT_TYPES.RAIL]: TrainFront,
  [PROJECT_TYPES.IRRIGATION]: Droplets,
  [PROJECT_TYPES.INDUSTRIAL]: Factory,
  [PROJECT_TYPES.URBAN]: Building2,
}

export function getTypeIcon(type) {
  return TYPE_ICONS[type] || FolderKanban
}