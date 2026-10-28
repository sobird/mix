import { models } from '@/models';

// oxlint-disable-next-line typescript/no-extraneous-class
class PermissionService {
  static get templates() {
    for (const model of Object.values(models)) {
      for (const [_action, _item] of Object.entries(model.permission || {})) {
        //
        console.log('model', model.permission);
      }
    }
    return 1212;
  }
}

export default PermissionService;
