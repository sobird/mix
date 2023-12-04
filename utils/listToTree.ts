export interface IList {
  id: number | string;
  parentId: string;
  name?: string;
  title?: string;
  [key: string]: any;
}

type ITree = IList & { children?: IList[] };

/**
 * 将数组转换为树结构
 *
 * @param list
 * @returns
 */
export default function listToTree(list: IList[]): ITree[] {
  const result: ITree[] = [];
  const map = new Map();

  list.forEach((item) => {
    if (!item.children) {
      // item.children = []
    }
    map.set(item.id, item);
  });

  list.forEach((item) => {
    const parent = map.get(item.parentId);
    if (parent) {
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(item);
    } else {
      result.push(item);
    }
  });
  return result;
}
