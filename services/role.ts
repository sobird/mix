/**
 * 角色
 *
 * sobird<i@sobird.me> at 2023/09/21 14:17:06 created.
 */

import http from '@/lib/axios';

const RoleService = {

  async create(data) {
    return http.post('/role', data);
  },
};

export default RoleService;
