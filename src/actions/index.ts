/**
 * Server Functions
 * Server Actions(Until September 2024, we referred to all Server Functions as “Server Actions”)
 *
 * * 处理 HTTP 请求的输入/输出。
 * * 执行简单的输入验证（如字段是否存在）。
 * * 调用一个或多个 Services 方法。
 * * 处理服务端副作用（如设置 Cookie、重定向）。
 *
 * @see https://zh-hans.react.dev/reference/rsc/server-functions
 *
 * sobird<i@sobird.me> at 2025/03/12 23:21:51 created.
 */

export enum ActionStatus {
  INITIAL = -1,
  SUCCESS,
  FAILURE,
}
