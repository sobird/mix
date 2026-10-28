import PermissionService from './permission';

describe('Permission Service', () => {
  it('get permission templates', () => {
    const { templates } = PermissionService;
    console.log('templates', templates);
  });
});
