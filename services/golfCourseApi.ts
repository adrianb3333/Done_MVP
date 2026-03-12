const API_BASE = 'https://api.golfcourseapi.com/v1';
const API_KEY = '4C5IEPDN323SRT23367YBA6DP4';

export interface GolfCourseSearchResult {
  id: number;
  club_name: string;
  course_name: string;
  location: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface GolfCourseHole {
  par: number;
  yardage: number;
  handicap: number;
}

export interface GolfCourseTee {
  tee_name: string;
  course_rating: number;
  slope_rating: number;
  bogey_rating: number;
  total_yards: number;
  total_meters: number;
  number_of_holes: number;
  par_total: number;
  holes: GolfCourseHole[];
}

export interface GolfCourseDetail {
  id: number;
  club_name: string;
  course_name: string;
  location: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  tees: {
    female?: GolfCourseTee[];
    male?: GolfCourseTee[];
  };
}

export async function searchGolfCourses(query: string): Promise<GolfCourseSearchResult[]> {
  try {
    console.log('[GolfCourseAPI] Searching for:', query);
    const response = await fetch(`${API_BASE}/search?search_query=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Key ${API_KEY}`,
      },
    });
    if (!response.ok) {
      console.log('[GolfCourseAPI] Search error:', response.status);
      return [];
    }
    const data = await response.json();
    console.log('[GolfCourseAPI] Search results:', data.courses?.length ?? 0);
    return data.courses ?? [];
  } catch (e) {
    console.log('[GolfCourseAPI] Search error:', e);
    return [];
  }
}

export async function getGolfCourseDetail(courseId: number): Promise<GolfCourseDetail | null> {
  try {
    console.log('[GolfCourseAPI] Fetching course detail:', courseId);
    const response = await fetch(`${API_BASE}/courses/${courseId}`, {
      headers: {
        'Authorization': `Key ${API_KEY}`,
      },
    });
    if (!response.ok) {
      console.log('[GolfCourseAPI] Detail error:', response.status);
      return null;
    }
    const data = await response.json();
    console.log('[GolfCourseAPI] Got course detail:', data.course?.course_name);
    return data.course ?? null;
  } catch (e) {
    console.log('[GolfCourseAPI] Detail error:', e);
    return null;
  }
}

export function getDefaultMaleTee(course: GolfCourseDetail): GolfCourseTee | null {
  const maleTees = course.tees?.male;
  if (maleTees && maleTees.length > 0) {
    return maleTees[0];
  }
  const femaleTees = course.tees?.female;
  if (femaleTees && femaleTees.length > 0) {
    return femaleTees[0];
  }
  return null;
}
