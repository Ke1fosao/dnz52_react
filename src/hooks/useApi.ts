import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  pagesApi, slidersApi, contactApi, staffApi, parentsApi, attestationApi,
  newsApi, galleryApi, groupsApi, specialistsApi, circlesApi,
  documentsApi, reviewsApi, menuApi, searchApi,
} from '@/api/endpoints';
import type { ReviewCreate, SpecialistPageType } from '@/types';

// Main
export const usePages = () =>
  useQuery({ queryKey: ['pages'], queryFn: pagesApi.list });

export const usePage = (slug: string) =>
  useQuery({ queryKey: ['page', slug], queryFn: () => pagesApi.detail(slug), enabled: !!slug });

export const useSliders = () =>
  useQuery({ queryKey: ['sliders'], queryFn: slidersApi.list });

export const useContact = () =>
  useQuery({ queryKey: ['contact'], queryFn: contactApi.list });

export const useStaff = () =>
  useQuery({ queryKey: ['staff'], queryFn: staffApi.list });

// Parents
export const useParentsAnnouncements = () =>
  useQuery({ queryKey: ['parents', 'announcements'], queryFn: parentsApi.announcements });

export const useParentsDocuments = () =>
  useQuery({ queryKey: ['parents', 'documents'], queryFn: parentsApi.documents });

export const useParentsAdaptation = () =>
  useQuery({ queryKey: ['parents', 'adaptation'], queryFn: parentsApi.adaptation });

export const useParentsEnrollment = () =>
  useQuery({ queryKey: ['parents', 'enrollment'], queryFn: parentsApi.enrollment });

export const useParentsSamples = () =>
  useQuery({ queryKey: ['parents', 'samples'], queryFn: parentsApi.samples });

// Attestation
export const useAttestationSettings = () =>
  useQuery({ queryKey: ['attestation', 'settings'], queryFn: attestationApi.settings });

export const useAttestationDocuments = () =>
  useQuery({ queryKey: ['attestation', 'documents'], queryFn: attestationApi.documents });

export const useAttestationSteps = () =>
  useQuery({ queryKey: ['attestation', 'steps'], queryFn: attestationApi.steps });

export const useAttestationCategories = () =>
  useQuery({ queryKey: ['attestation', 'categories'], queryFn: attestationApi.categories });

export const useAttestationLaws = () =>
  useQuery({ queryKey: ['attestation', 'laws'], queryFn: attestationApi.laws });

// News
export const useNewsList = (params?: { page?: number; category__slug?: string; search?: string }) =>
  useQuery({ queryKey: ['news', params], queryFn: () => newsApi.list(params) });

export const useNewsDetail = (slug: string) =>
  useQuery({ queryKey: ['news', slug], queryFn: () => newsApi.detail(slug), enabled: !!slug });

export const useNewsCategories = () =>
  useQuery({ queryKey: ['news', 'categories'], queryFn: newsApi.categories });

// Gallery
export const useGalleryCategories = () =>
  useQuery({ queryKey: ['gallery', 'categories'], queryFn: galleryApi.categories });

export const useAlbums = (params?: { page?: number; category__slug?: string }) =>
  useQuery({ queryKey: ['gallery', 'albums', params], queryFn: () => galleryApi.albums(params) });

export const useAlbum = (slug: string) =>
  useQuery({ queryKey: ['gallery', 'album', slug], queryFn: () => galleryApi.album(slug), enabled: !!slug });

// Groups
export const useGroups = () =>
  useQuery({ queryKey: ['groups'], queryFn: groupsApi.list });

export const useGroup = (slug: string) =>
  useQuery({ queryKey: ['group', slug], queryFn: () => groupsApi.detail(slug), enabled: !!slug });

// Specialists
export const useSpecialists = () =>
  useQuery({ queryKey: ['specialists'], queryFn: specialistsApi.list });

export const useSpecialistPage = (pageType: SpecialistPageType) =>
  useQuery({
    queryKey: ['specialist', pageType],
    queryFn: () => specialistsApi.detail(pageType),
    enabled: !!pageType,
  });

// Circles
export const useCircles = () =>
  useQuery({ queryKey: ['circles'], queryFn: circlesApi.list });

export const useCircle = (slug: string) =>
  useQuery({ queryKey: ['circle', slug], queryFn: () => circlesApi.detail(slug), enabled: !!slug });

// Documents
export const useDocuments = (params?: { page?: number; category__slug?: string }) =>
  useQuery({ queryKey: ['documents', params], queryFn: () => documentsApi.list(params) });

export const useDocumentCategories = () =>
  useQuery({ queryKey: ['documents', 'categories'], queryFn: documentsApi.categories });

export const useTrackDownload = () =>
  useMutation({ mutationFn: (id: number) => documentsApi.trackDownload(id) });

// Reviews
export const useReviews = (params?: { page?: number; rating?: number; ordering?: string }) =>
  useQuery({ queryKey: ['reviews', params], queryFn: () => reviewsApi.list(params) });

export const useCreateReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ReviewCreate) => reviewsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
};

export const useLikeReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => reviewsApi.like(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }),
  });
};

export const useDislikeReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => reviewsApi.dislike(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }),
  });
};

// Menu
export const useMenuToday = () =>
  useQuery({ queryKey: ['menu', 'today'], queryFn: menuApi.today });

export const useMenuWeek = (start?: string) =>
  useQuery({ queryKey: ['menu', 'week', start], queryFn: () => menuApi.week(start) });

// Search
export const useSearch = (q: string) =>
  useQuery({
    queryKey: ['search', q],
    queryFn: () => searchApi.query(q),
    enabled: q.trim().length >= 2,
  });
