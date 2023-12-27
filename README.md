# mix
The streaming build system based on Middleware

## sequelize

nextjs 使用 sequelize 终端会报下面的错误（但不影响程序运行）：
```sh
Critical dependency: the request of a dependency is an expression

Import trace for requested module:
./node_modules/sequelize/lib/dialects/abstract/connection-manager.js
./node_modules/sequelize/lib/dialects/mariadb/connection-manager.js
./node_modules/sequelize/lib/dialects/mariadb/index.js
./node_modules/sequelize/lib/sequelize.js
./node_modules/sequelize/lib/index.js
./node_modules/sequelize/lib/index.mjs
./models/userRole.ts
./models/index.ts
./app/dashboard/role/create/action.ts
```

在网上有人通过下面的方式给出了解决上面报错的方案：
```js
// 在next.config.js 文件中添加如下配置

const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['sequelize'],
  },
};

module.exports = nextConfig;
```
经本人测试虽然解决了上面的问题，但是在使用nextjs的`server actions`时报错，发现lib中导入的sequelize为`undefined`(SyntaxError: Unexpected identifier)引起了js错误（影响程序运行）。

处罚上面错误的条件是：所使用的action文件没有在其`page.ts`文件中导入，如果在`page.ts`文件中进行一次导入，则不会报错。

最终有一种解决方式是，用require代替import导入sequelize。
```ts
// import { Sequelize } from 'sequelize';
const sequelize = require('sequelize')
```

这种虽然兼顾了上面的两个问题，但是sequelize的ts类型推导失效，编写操作模型时会感到不方便。

### 完美解决方案

1. 修改`package.json`文件的type
```json
{
  "type": "module",
}
```

2. 修改`next.config.js`配置

```js
const nextConfig = {
  experimental: {
    esmExternals: false,
    serverComponentsExternalPackages: ['sequelize'],
  },
}

export default nextConfig;
```
## prisma

```sh
yarn add prisma

# 创建prisma目录，并将SQLite配置为数据库
npx prisma init --datasource-provider sqlite
```

### id vs cuid vs uuid ？


## casl