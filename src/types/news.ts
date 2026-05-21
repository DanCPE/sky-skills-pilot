export interface NewsItem {
  id: string;
  title: string;
  date: string;
  summary: string;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type NewsItemInput = Pick<
  NewsItem,
  "title" | "date" | "summary" | "isPublished" | "sortOrder"
>;
