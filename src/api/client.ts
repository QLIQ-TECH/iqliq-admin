import axios, {  AxiosError,type AxiosInstance,type AxiosRequestConfig,type AxiosResponse} from "axios";


export const GigsBaseURL = process.env.NEXT_PUBLIC_GIGS_SERVICE_URL;
export const PostsBaseURL = process.env.NEXT_PUBLIC_POSTS_SERVICE_URL;
export const OnboardingBaseURL = process.env.NEXT_PUBLIC_ONBOARDING_SERVICE_URL;

const normalizeAuthServiceUrl = () => {
  const explicitServiceUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL;
  if (explicitServiceUrl) return explicitServiceUrl;

  const authApiUrl = process.env.NEXT_PUBLIC_AUTH_API_URL;
  if (!authApiUrl) return undefined;

  // Convert ".../api/auth" style URL to service root so route paths
  // like "/api/auth/login" are not duplicated.
  return authApiUrl.replace(/\/api\/auth\/?$/, '');
};

export const AuthBaseURL = normalizeAuthServiceUrl();
export const AmpBaseURL = process.env.NEXT_PUBLIC_AMP_SERVICE_URL;
const normalizeMessageServiceUrl = () => {
  const messageServiceUrl = process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL;
  if (!messageServiceUrl) return undefined;

  // Convert ".../api" style URL to service root so route paths
  // like "/api/otp/send" are not duplicated.
  return messageServiceUrl.replace(/\/api\/?$/, '');
};

export const MessageBaseUrl = normalizeMessageServiceUrl();


const serviceBaseUrls = {
  gigs: GigsBaseURL,
  auth: AuthBaseURL,
  onboarding: OnboardingBaseURL,
  posts: PostsBaseURL,
  amp: AmpBaseURL,
  message: MessageBaseUrl,
} as const;


type ServiceName = keyof typeof serviceBaseUrls;

// Refresh handling
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else if (token) {
      p.resolve(token);
    } else {
      p.reject(new Error("No token provided"));
    }
  });
  failedQueue = [];
};

interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

const createClient = (service: ServiceName): AxiosInstance => {
  const client = axios.create({
    baseURL: serviceBaseUrls[service],
    timeout: 10000,
    headers: { "Content-Type": "application/json" },
  });

  // Attach token
  client.interceptors.request.use((config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Handle 401 and refresh
  client.interceptors.response.use(
    (res: AxiosResponse) => res,
    async (error: AxiosError) => {
      const originalRequest = error.config as
        | ExtendedAxiosRequestConfig
        | undefined;

      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry
      ) {
        if (isRefreshing) {
          return new Promise<AxiosResponse>((resolve, reject) => {
            failedQueue.push({
              resolve: (token: string) => {
                if (originalRequest.headers) {
                  originalRequest.headers["Authorization"] = `Bearer ${token}`;
                }
                resolve(client(originalRequest));
              },
              reject,
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
        if (!refreshToken) {
          if (typeof window !== "undefined") {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
          }
          // window.location.href = "/login";
          return Promise.reject(error);
        }

        try {
          const email = typeof window !== "undefined" ? localStorage.getItem("email") : null;
          const res = await axios.post<{ accessToken: string }>(
            `${serviceBaseUrls.auth}/api/auth/refresh-token`,
            { refreshToken, email },
          );
          const newToken = res.data.accessToken;
          if (typeof window !== "undefined") localStorage.setItem("access_token", newToken);
          processQueue(null, newToken);

          if (originalRequest.headers) {
            originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
          }
          return client(originalRequest);
        } catch (err) {
          const refreshError =
            err instanceof Error ? err : new Error("Token refresh failed");
          processQueue(refreshError, null);
          if (typeof window !== "undefined") {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
          }
          // window.location.href = "/login";
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      }
      return Promise.reject(error);
    },
  );

  return client;
};

export const http = {
  get: async <T = unknown>(
    service: ServiceName,
    url: string,
    config: AxiosRequestConfig = {},
  ): Promise<T> => {
    const res = await createClient(service).get<T>(url, config);
    return res.data;
  },

  post: async <T = unknown>(
    service: ServiceName,
    url: string,
    data?: unknown,
    config: AxiosRequestConfig = {},
  ): Promise<T> => {
    const res = await createClient(service).post<T>(url, data, config);
    return res.data;
  },

  put: async <T = unknown>(
    service: ServiceName,
    url: string,
    data?: unknown,
    config: AxiosRequestConfig = {},
  ): Promise<T> => {
    const res = await createClient(service).put<T>(url, data, config);
    return res.data;
  },

  delete: async <T = unknown>(
    service: ServiceName,
    url: string,
    config: AxiosRequestConfig = {},
  ): Promise<T> => {
    const res = await createClient(service).delete<T>(url, config);
    return res.data;
  },
};
