/** Survey step 1 photos (public/survey/, cropped from public/osiedla/ — see credits.json). */
import type { ProfileId } from '../../app/types'

export interface SurveyPhoto {
  src: string
  /** Where the picture was taken (caption). */
  place: string
  credit: string
}

export const PROFILE_PHOTOS: Record<ProfileId, SurveyPhoto> = {
  student: { src: '/survey/student.jpg', place: 'Powiśle', credit: 'fot. Adrian Grycuk (CC BY 3.0 pl)' },
  rodzina: { src: '/survey/rodzina.jpg', place: 'Miasteczko Wilanów', credit: 'fot. Wistula (CC BY-SA 4.0)' },
  senior: { src: '/survey/senior.jpg', place: 'Saska Kępa', credit: 'fot. Adrian Grycuk (CC BY-SA 3.0 pl)' },
}
