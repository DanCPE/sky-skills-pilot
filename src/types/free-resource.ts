export interface FreeResource {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  downloadUrl: string;
  buttonLabel: string;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type FreeResourceInput = Pick<
  FreeResource,
  | "title"
  | "description"
  | "imageUrl"
  | "downloadUrl"
  | "buttonLabel"
  | "isPublished"
  | "sortOrder"
>;
