import { post, getCustomerIdFromToken } from './BaseService';

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
    const customerId = getCustomerIdFromToken(token);
    if (customerId) {
      const num = Number(customerId);
      if (!isNaN(num)) return num;
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
