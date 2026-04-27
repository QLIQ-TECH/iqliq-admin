import { http } from "../client";


type PresignedUrlResponse = {
  success: boolean;
  message: string;
  data: {
    uploadUrl: string;
    fileUrl: string;
  };
};

export const getPresignedUrl = async (fileName: string, fileType: string) => {
  const query = new URLSearchParams({ fileName, fileType });
  return await http.get<PresignedUrlResponse>(
    "posts",
    `/api/upload/presigned-url?${query.toString()}`,
  );
};
