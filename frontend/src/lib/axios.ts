import { useAuthStore } from '@/stores/useAuthStore';
import axios from 'axios';
import { config } from 'zod';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
});

//tự động gắc access token vào header của tất cả request
api.interceptors.request.use((config) => {
    const {accessToken} = useAuthStore.getState();

    if(accessToken){
        config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
});


//tự động gọi refresh token khi access token hết hạn
api.interceptors.response.use((res) => res, async(error) => {
    const originalRequest = error.config;

    if(originalRequest.url.includes("/auth/signin") ||
        originalRequest.url.includes("/auth/signup") ||
        originalRequest.url.includes("/auth/refresh")){
            return Promise.reject(error);
        }

        originalRequest._retryCount = originalRequest._retryCount || 0;

        if(error.response?.status == 403 && originalRequest._retryCount < 4){
            originalRequest._retryCount += 1;
            try {
                const res = await api.post("/auth/refresh", {withCredential: true});
                const newAccessToken = res.data.accessToken;

                useAuthStore.getState().setAccessToken(newAccessToken);

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                useAuthStore.getState().clearState();
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
})
export default api;