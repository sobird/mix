/**
 * 侧边栏导航组件
 *
 * 菜单由服务端组件按用户权限过滤后传入，收藏编辑通过 Server Action 保存。
 */

'use client';

import { PlusCircleOutlined, MinusCircleOutlined, PlusCircleFilled, MinusCircleFilled } from '@ant-design/icons';
import { message, Button, Menu } from 'antd';
import classNames from 'classnames';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { ActionStatus } from '@/actions';
import { updateMenuPreferencesAction } from '@/actions/menu';
import type { MenuNode, MenuView } from '@/services/menu';
import { useAppDispatch } from '@/store';
import { toggleAside } from '@/store/slices/app';

import styles from './index.module.scss';

const { Item, SubMenu, Divider } = Menu;

const FAVORITES_KEY = 'favorites';
const MAX_FAVORITES = 10;

function renderMenuLink(item: MenuNode) {
  return (
    <Link href={item.href}>
      {item.icon ? <i className={`icon iconfont icon-${item.icon}`} /> : null}
      <span>{item.name}</span>
    </Link>
  );
}

interface AsideProps {
  menu: MenuView;
  collapsed: boolean;
}

const Aside: React.FC<AsideProps> = ({ menu, collapsed }) => {
  const pathname = usePathname() || '';
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [editMode, setEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { items, favorites } = menu;
  const [first, ...others] = items;

  const startEdit = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedIds(favorites.map((item) => item.id));
    setEditMode(true);
  };

  const toggleFavorite = (menuId: number) => {
    setSelectedIds((current) => {
      if (current.includes(menuId)) {
        return current.filter((id) => id !== menuId);
      }

      if (current.length >= MAX_FAVORITES) {
        message.error('已达最大添加限制');
        return current;
      }

      return [...current, menuId];
    });
  };

  const saveEdit = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const result = await updateMenuPreferencesAction(selectedIds);

    if (result.status !== ActionStatus.SUCCESS) {
      message.error('保存收藏失败');
      return;
    }

    setEditMode(false);
    router.refresh();
  };

  return (
    <aside className={styles.container}>
      <div className={styles.menu}>
        {items.length > 0 && (
          <Menu
            mode="inline"
            inlineCollapsed={collapsed}
            selectedKeys={[pathname]}
            defaultOpenKeys={collapsed ? [] : [FAVORITES_KEY]}
            inlineIndent={0}
            forceSubMenuRender
          >
            {first ? <Item key={first.href}>{renderMenuLink(first)}</Item> : null}

            <Divider />

            <SubMenu
              className="fav-submenu"
              key={FAVORITES_KEY}
              title={
                <>
                  <span className="submenu-title">
                    <span className="submenu-title-text">常用功能</span>
                    {editMode ? (
                      <span className="fav-submenu-count">
                        已添加
                        {selectedIds.length}/{MAX_FAVORITES}
                      </span>
                    ) : null}
                  </span>

                  <button
                    type="button"
                    className={editMode ? 'fav-submenu-save' : 'fav-submenu-setting'}
                    onClick={editMode ? saveEdit : startEdit}
                  >
                    {editMode ? '保存' : '管理'}
                  </button>
                </>
              }
            >
              {editMode
                ? items.map((item) => {
                    const added = selectedIds.includes(item.id);

                    return (
                      <Item
                        key={`edit-${item.id}`}
                        className={classNames('fav-item-edit', {
                          'fav-item-added': added,
                        })}
                        onClick={() => {
                          toggleFavorite(item.id);
                        }}
                      >
                        <span>{item.name}</span>
                        {added ? (
                          <>
                            <MinusCircleOutlined className="outlined" />
                            <MinusCircleFilled className="filled" />
                          </>
                        ) : (
                          <>
                            <PlusCircleOutlined className="outlined" />
                            <PlusCircleFilled className="filled" />
                          </>
                        )}
                      </Item>
                    );
                  })
                : favorites.map((item) => <Item key={`fav-${item.id}`}>{renderMenuLink(item)}</Item>)}
            </SubMenu>

            <Divider />

            {others.map((item) => (
              <Item key={item.href}>{renderMenuLink(item)}</Item>
            ))}
          </Menu>
        )}

        <Button
          type="text"
          className={styles.hamburger}
          onClick={() => {
            return dispatch(toggleAside());
          }}
        >
          <i className="icon iconfont icon-bars" />
        </Button>
      </div>
    </aside>
  );
};

export default Aside;
