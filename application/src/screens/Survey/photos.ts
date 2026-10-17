/**
 * Survey step 1 photos: 720×450 crops (public/survey/) of the featured osiedla's first hero photo
 * (public/osiedla/<slug>/01.jpg, Wikimedia Commons — full attribution in public/osiedla/credits.json).
 */
import type { ProfileId } from '../../app/types'

export interface SurveyPhoto {
  src: string
  /** Where the picture was taken (caption). */
  place: string
  /** Licence kept on one line (non-breaking spaces). */
  credit: string
}

export const PROFILE_PHOTOS: Record<ProfileId, SurveyPhoto> = {
  student: { src: '/survey/student.jpg', place: 'Muranów', credit: 'fot. Cybularny (CC0)' },
  rodzina: { src: '/survey/rodzina.jpg', place: 'Natolin', credit: 'fot. Emptywords (CC\u00a0BY-SA\u00a04.0)' },
  senior: { src: '/survey/senior.jpg', place: 'Stare Bielany', credit: 'fot. Monika from Warszawa (CC\u00a0BY-SA\u00a02.0)' },
}
