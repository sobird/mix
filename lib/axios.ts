/**
 * Axios 默认配置，全局代理项目所有浏览器接口请求
 * Axios 是一个基于 Promise 的 HTTP 库，可以用在浏览器和Node.js中。
 *
 * 接口规范
 * {
 *   code: 0,
 *   message: "ok",
 *   data,
 * }
 *
 * @example
 * export function submit() {
 *   return axios.post("/submit", {
 *     responseParser: (response) => response.data
 *   });
 * }
 *
 * @see https://axios-http.com/zh/docs/intro
 * sobird<i@sobird.me> at 2021/02/20 11:18:13 created.
 */

import axios, {
  CreateAxiosDefaults,
  AxiosInstance,
  AxiosResponse,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
  AxiosError,
} from 'axios';

export type ResponseParser<T = unknown> = (response: AxiosResponse) => T;

interface InternalHttpRequestConfig<T = unknown> extends InternalAxiosRequestConfig<T> {
  /**
   * 接口请求开始时间戳
   */
  startTime: number;
  responseParser?: ResponseParser;
}

export interface HttpRequestConfig<T = unknown> extends AxiosRequestConfig<T> {
  responseParser?: ResponseParser;
}

export interface ResponseFormat<T = unknown> {
  code: number;
  message: string;
  data?: T;
}

interface HttpResponse<T = ResponseFormat, D = unknown> extends AxiosResponse<T, D> {
  timing?: number;
  config: InternalHttpRequestConfig<D>;
}

interface HttpError<T = unknown, D = unknown> extends AxiosError<T, D> {
  config?: InternalHttpRequestConfig<D>;
}

export class Http {
  service: AxiosInstance;

  constructor(config?: CreateAxiosDefaults) {
    this.service = axios.create(config);
    // 请求拦截器
    this.service.interceptors.request.use(
      (config: InternalHttpRequestConfig) => {
        config.startTime = Date.now();

        return config;
      },
      (error: HttpError) => {
        // const { config } = error;

        return Promise.reject(error);
      },
    );
    // 响应拦截器
    this.service.interceptors.response.use(
      (response: HttpResponse) => {
        const { config, data, request } = response;
        response.timing = Date.now() - config.startTime;
        response.headers.timing = response.timing;

        // 为登录
        if (data.code == 401) {
          window.location.href = '';
        }

        const result = (config.responseParser ? config.responseParser(response) : data) as ResponseFormat;

        if (result?.code === 0) {
          return result.data as HttpResponse;
        }
        // 业务级错误信息
        return Promise.reject({
          code: data.code,
          message: data.message,
          config,
          request,
          response,
        });
        // throw new AxiosError(data.message, data.code as unknown as string, config, request, response);
      },
      // 超出 2xx 范围的状态码都会触发该函数。
      (error: HttpError) => {
        const {
          code, message, request, response, config,
        } = error;

        if (response) {
          // 请求成功发出且服务器也响应了状态码，但状态代码超出了 2xx 的范围
          switch (response.status) {
            case 401:
              window.location.href = '';
              break;
            case 404:
              break;
            default:
          }
        } else if (request) {
          // 请求已经成功发起，但没有收到响应
        }
        return Promise.reject({
          code,
          message,
          config,
          request,
          response,
        });
      },
    );
  }

  request(config: HttpRequestConfig) {
    return this.service.request(config);
  }

  get<T>(url: string, params?: object | string, config?: Omit<HttpRequestConfig, 'params'>) {
    return this.service.get(url, { params, ...config }) as Promise<T>;
  }

  post<T>(url: string, data?: object, config?: HttpRequestConfig) {
    return this.service.post(url, data, config) as Promise<T>;
  }

  put<T>(url: string, data?: object, config?: HttpRequestConfig) {
    return this.service.put(url, data, config) as Promise<T>;
  }

  patch<T>(url: string, data?: object, config?: HttpRequestConfig) {
    return this.service.patch(url, data, config) as Promise<T>;
  }

  delete<T>(url: string, params?: object, config?: HttpRequestConfig) {
    return this.service.delete(url, { params, ...config }) as Promise<T>;
  }

  upload<T>(url: string, data: object = {}, config: HttpRequestConfig = {}) {
    const { headers, ...others } = config;
    const formData = new FormData();

    Object.keys(data).map((key) => {
      formData.append(key, data[key]);
    });

    return this.service.post(url, formData, {
      headers: {
        'content-type': 'multipart/form-data',
        ...headers,
      },
      ...others,
    }) as Promise<T>;
  }
}

export const defaults: CreateAxiosDefaults = {
  // withCredentials: true,
  timeout: 10 * 1000,
  baseURL: process.env.baseURL,
  headers: {
    // 'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/json;charset=UTF-8',
  },
};

export default new Http(defaults);
