import models from '@/models';

class PermissionService {
  static get templates() {
    for (const model of Object.values(models)) {
      for (const [action, item] of Object.entries(model.permission || {})) {
        //
      }
    }
    return 1212;
  }
}
