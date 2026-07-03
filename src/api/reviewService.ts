import { post } from './BaseService';

export interface ReviewItem {
  SrNo: number;
  Id: number;
  ProductId: number;
  ProductName: string;
  UserName: string;
  Rating: number;
  ReviewText: string;
  AverageRating: number;
  TotalReviews: number;
  IsApproved: boolean;
  IsActive: boolean;
  CreatedDate: string;
}

export interface ReviewGetAllResponse {
  statusCode: number;
  message: string;
  isSuccess: boolean;
  isConfirm: boolean;
  data: {
    table1: { TotalRecords: number; FilteredRecords: number }[];
    table2: ReviewItem[];
  };
}

export interface SaveReviewPayload {
  id: number;
  productId: number;
  userId: number;
  rating: number;
  reviewText: string;
}

export interface GetReviewsParams {
  productId: number;
  search: string;
  start: number;
  length: number;
  sortColumnIndex: number;
  sortDirection: string;
}

export function getUserId(): number {
  const customerIdStr = localStorage.getItem("customerId");
  if (customerIdStr) {
    const num = Number(customerIdStr);
    if (!isNaN(num)) return num;
  }

  const token = localStorage.getItem("authToken");
  if (token) {
    try {
      const parts = token.split(".");
      if (parts.length >= 2) {
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const decoded = JSON.parse(window.atob(base64));
        const uId = decoded.CustomerId || 
                    decoded.customerId || 
                    decoded.Id || 
                    decoded.id || 
                    decoded.UserId || 
                    decoded.userid ||
                    decoded.uid;
        if (uId) {
          const num = Number(uId);
          if (!isNaN(num)) return num;
        }
      }
    } catch (e) {
      console.error("[reviewService] Error decoding token for user ID", e);
    }
  }
  return 0;
}

export const reviewService = {
  save: async (review: SaveReviewPayload): Promise<any> => {
    return post('/Review/Save', review);
  },

  getAll: async (params: GetReviewsParams): Promise<ReviewGetAllResponse> => {
    return post('/Review/GetAll', params);
  }
};
