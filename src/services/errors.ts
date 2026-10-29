/** 服务层错误：调用者缺少执行该操作的权限 */
export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/** 服务层错误：目标记录不存在 */
export class NotFoundError extends Error {
  constructor(message = 'Not Found') {
    super(message);
    this.name = 'NotFoundError';
  }
}
