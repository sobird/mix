/**
 * 侧边栏导航组件
 *
 * @todo
 * 优化菜单管理功能 代码 和 CSS iconfont
 *
 * sobird<i@sobird.me> at 2023/09/12 15:46:42 created.
 */

'use client';

import {
  PlusCircleOutlined, MinusCircleOutlined, PlusCircleFilled, MinusCircleFilled,
} from '@ant-design/icons';
import { message, Button, Menu } from 'antd';
import classNames from 'classnames';
import Link from 'next/link';
import {
  usePathname, useSearchParams, useParams, useRouter,
} from 'next/navigation';
import React, { useEffect, useState } from 'react';

// import { useLocation } from 'react-router-dom';
import MenuService, { Favorites } from '@/services/menu';
import { useAppSelector, useAppDispatch } from '@/store';
import { toggleAside } from '@/store/slices/app';
import { fetchMenu, removeFavMenuItem, insertFavMenuItem } from '@/store/slices/menu';

import TitleWithBadge from './components/title-with-badge';
import styles from './index.module.scss';

const { Item, SubMenu, Divider } = Menu;

const DASHBOARD = '/dashboard';

const Aside: React.FunctionComponent = () => {
  const pathname = usePathname() || '';
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  // const location = useLocation();
  const [badgeMap, setBadgeMap] = useState(new Map());
  const dispatch = useAppDispatch();
  const [editMode, setEditMode] = useState(false);

  const { collapsed } = useAppSelector((state) => {
    return state.app;
  });
  const {
    menuTrees: [First, ...Others],
    favorites,
    defaultOpenKeys,
  } = useAppSelector((state) => {
    return state.menu;
  });

  // defaultOpenKeys.push(Favorites.id);

  const dok = [...defaultOpenKeys];
  dok.push(Favorites.id);

  // 收藏夹
  Favorites.children = favorites.map((item) => {
    const itemAssign = { ...item };
    itemAssign.url += '?fav';
    return itemAssign;
  });

  const menuTrees = [Favorites, ...Others];

  useEffect(() => {
    dispatch(fetchMenu());

    MenuService.badges().then((res) => {
      setBadgeMap(res);
    });
  }, [dispatch]);

  // const asideMenu = renderMenu(menuTrees, badgeMap);
  const currentURL = `${pathname}?${searchParams?.toString()}`;

  function getItem(
    label: React.ReactNode,
    key: React.Key,
    icon?: React.ReactNode,
    children?: MenuItem[],
    type?: 'group',
  ): MenuItem {
    return {
      key,
      icon,
      children,
      label,
      type,
    } as MenuItem;
  }

  const items: MenuProps['items'] = [
    getItem('Navigation One', 'sub1', '', [
      getItem('Item 1', 'g1', null, [getItem('Option 1', '1'), getItem('Option 2', '2')], 'group'),
      getItem('Item 2', 'g2', null, [getItem('Option 3', '3'), getItem('Option 4', '4')], 'group'),
    ]),

    getItem('Navigation Two', 'sub2', '', [
      getItem('Option 5', '5'),
      getItem('Option 6', '6'),
      getItem('Submenu', 'sub3', null, [getItem('Option 7', '7'), getItem('Option 8', '8')]),
    ]),

    { type: 'divider' },

    getItem('Navigation Three', 'sub4', '', [
      getItem('Option 9', '9'),
      getItem('Option 10', '10'),
      getItem('Option 11', '11'),
      getItem('Option 12', '12'),
    ]),

    getItem('Group', 'grp', null, [getItem('Option 13', '13'), getItem('Option 14', '14')], 'group'),
  ];

  return (
    <aside className={styles.container}>
      <div className={styles.menu}>
        {menuTrees.length > 1 && (
          <Menu
            mode="inline"
            inlineCollapsed={collapsed}
            selectedKeys={[currentURL, pathname]}
            defaultOpenKeys={collapsed ? [] : dok}
            // items={items}
            inlineIndent={0}
            forceSubMenuRender
          >
            {/* 后台首页 */}
            <Item key={First.url}>
              <Link href={First.url}>
                <i className={`icon iconfont icon-${First.icon}`} />
                <TitleWithBadge badge={{}}>
                  <span>{First.title}</span>
                </TitleWithBadge>
              </Link>
            </Item>

            <Divider />

            {menuTrees.map((submenu) => {
              const isFavorites = submenu.code === Favorites.code;
              const isEditMode = isFavorites && editMode;
              const badge = badgeMap && badgeMap.get && badgeMap.get(submenu.id);

              if (submenu?.children?.length > 0 || isFavorites) {
                return [
                  <SubMenu
                    className={isFavorites && 'fav-submenu'}
                    key={submenu.id}
                    title={(
                      <>
                        <span className="submenu-title">
                          {submenu.icon ? <i className={`icon iconfont icon-${submenu.icon}`} /> : null}
                          <span className="submenu-title-text">{submenu.title}</span>

                          {editMode && isFavorites ? (
                            <span className="fav-submenu-count">
                              已添加
                              {favorites?.length}
                              /10
                            </span>
                          ) : null}
                        </span>

                        {isFavorites && (
                          <span
                            className={`fav-submenu-${editMode ? 'save' : 'setting'}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();

                              if (editMode) {
                                MenuService.update({
                                  favorites,
                                }).finally(() => {
                                  setEditMode(false);
                                });
                              } else {
                                setEditMode(true);
                              }
                            }}
                            onKeyUp={() => {}}
                            role="button"
                            tabIndex={0}
                          >
                            {editMode ? '保存' : '管理'}
                          </span>
                        )}
                      </>
                    )}
                    // icon={<i className={`icon iconfont icon-${icon}`} />}
                  >
                    {submenu?.children
                      && submenu?.children.map((item) => {
                        const badgeItem = badgeMap && badgeMap.get && badgeMap.get(item.id);
                        const added = !!favorites.find((fav) => {
                          return fav.id === item.id;
                        });

                        // 编辑模式
                        if (editMode) {
                          return (
                            <Item
                              key={item.url}
                              className={classNames('fav-item-edit', {
                                'fav-item-added': added,
                              })}
                              onClick={() => {
                                if (added) {
                                  dispatch(removeFavMenuItem(item));
                                } else {
                                  if (favorites.length >= 10) {
                                    message.error('已达最大添加限制');
                                    return;
                                  }
                                  dispatch(insertFavMenuItem(item));
                                }
                              }}
                            >
                              <TitleWithBadge badge={badgeItem}>
                                <span>{item.title}</span>
                              </TitleWithBadge>

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
                        }

                        return (
                          <Item key={item.url}>
                            <Link to={item.url}>
                              <i className={`icon iconfont icon-${item.icon}`} />
                              <TitleWithBadge badge={badge}>
                                <span>{item.title}</span>
                              </TitleWithBadge>
                            </Link>
                          </Item>
                        );
                      })}
                  </SubMenu>,
                  isEditMode && <li className="nav-edit-hint">点击下方功能入口即可添加</li>,
                  !submenu.last && <Divider />,
                ];
              }

              return [
                <Item key={submenu.url}>
                  <Link to={submenu.url}>
                    <i className={`icon iconfont icon-${submenu.icon}`} />
                    <TitleWithBadge badge={badge}>
                      <span>{submenu.title}</span>
                    </TitleWithBadge>
                  </Link>
                </Item>,
                !submenu.last && <Divider />,
              ];
            })}
          </Menu>
        )}

        <Menu
          // onClick={onClick}
          // style={{ width: 256 }}
          defaultSelectedKeys={['1']}
          selectedKeys={[pathname]}
          defaultOpenKeys={['dashboard']}
          mode="inline"
        >
          <Menu.SubMenu key="dashboard" title="系统管理">
            <Menu.Item key={`${DASHBOARD}/user`}>
              <Link href={`${DASHBOARD}/user`}>用户管理</Link>
            </Menu.Item>
            <Menu.Item key={`${DASHBOARD}/role`}>
              <Link href={`${DASHBOARD}/role`}>角色管理</Link>
            </Menu.Item>
          </Menu.SubMenu>
        </Menu>
      </div>

      <Button
        type="text"
        className={styles.hamburger}
        onClick={() => {
          return dispatch(toggleAside());
        }}
      >
        <i className="icon iconfont icon-bars" />
      </Button>
    </aside>
  );
};

export default Aside;
