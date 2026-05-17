/**
 * 菜单数据模型 - 处理数据库操作和树形结构构建
 * 表名：sys_menu（菜单权限表）
 */

/**
 * @typedef {Object} SysMenu
 * @property {number} menu_id - 菜单ID (SERIAL, PRIMARY KEY)
 * @property {string} menu_name - 菜单名称 (varchar(50), NOT NULL)
 * @property {number} parent_id - 父菜单ID (bigint, DEFAULT 0)
 * @property {number} order_num - 显示顺序 (integer, DEFAULT 0)
 * @property {string} [path] - 路由地址 (varchar(200), DEFAULT '')
 * @property {string} [component] - 组件路径 (varchar(255))
 * @property {string} [query] - 路由参数 (varchar(255))
 * @property {string} [route_name] - 路由名称 (varchar(50), DEFAULT '')
 * @property {number} [is_frame] - 是否外链 (integer, DEFAULT 1, 0是 1否)
 * @property {number} [is_cache] - 是否缓存 (integer, DEFAULT 0, 0缓存 1不缓存)
 * @property {string} menu_type - 菜单类型 (character(1), DEFAULT '', M目录 C菜单 F按钮)
 * @property {string} visible - 菜单状态 (character(1), DEFAULT '0', 0显示 1隐藏)
 * @property {string} status - 菜单状态 (character(1), DEFAULT '0', 0正常 1停用)
 * @property {string} [perms] - 权限标识 (varchar(100))
 * @property {string} [icon] - 菜单图标 (varchar(100), DEFAULT '#')
 * @property {string} [create_by] - 创建者 (varchar(64), DEFAULT '')
 * @property {Date} [create_time] - 创建时间 (timestamp, DEFAULT CURRENT_TIMESTAMP)
 * @property {string} [update_by] - 更新者 (varchar(64), DEFAULT '')
 * @property {Date} [update_time] - 更新时间 (timestamp)
 * @property {string} [remark] - 备注 (varchar(500), DEFAULT '')
 * @property {SysMenu[]} [children] - 子菜单列表 (树形结构时使用)
 */

const { pool } = require('../../config/db')

class MenuModel {
  /**
   * 获取所有菜单列表（平铺）
   * @param {Object} params - 查询参数（下划线命名）
   * @returns {Promise<SysMenu[]>}
   */
  async list(params = {}) {
    const { menu_id, menu_name, menu_type, visible, status } = params

    let query = `
      SELECT 
        menu_id,
        menu_name,
        parent_id,
        order_num,
        path,
        component,
        query,
        route_name,
        is_frame,
        is_cache,
        menu_type,
        visible,
        status,
        icon,
        create_time,
        update_time,
        remark
      FROM sys_menu
      WHERE 1=1
    `
    const values = []
    let idx = 1

    // ✅ 菜单ID（精确匹配）
    if (menu_id) {
      query += ` AND menu_id = $${idx++}`
      values.push(menu_id)
    }

    // ✅ 菜单名称（模糊匹配）
    if (menu_name) {
      query += ` AND menu_name ILIKE $${idx++}`
      values.push(`%${menu_name}%`)
    }

    // ✅ 菜单类型（精确匹配）
    if (menu_type) {
      query += ` AND menu_type = $${idx++}`
      values.push(menu_type)
    }

    if (visible !== undefined && visible !== '') {
      query += ` AND visible = $${idx++}`
      values.push(visible)
    }

    if (status !== undefined && status !== '') {
      query += ` AND status = $${idx++}`
      values.push(status)
    }

    query += ` ORDER BY parent_id ASC, order_num ASC`

    const result = await pool.query(query, values)
    // ✅ 返回数据库原始字段（下划线格式）
    return result.rows
  }

  /**
   * 根据ID查询菜单详情
   * @param {number} menu_id- 菜单ID
   * @returns {Promise<SysMenu|null>}
   */
  async getById(menu_id) {
    const query = `
      SELECT 
        menu_id,
        menu_name,
        parent_id,
        order_num,
        path,
        component,
        query,
        route_name,
        is_frame,
        is_cache,
        menu_type,
        visible,
        status,
        icon,
        create_time,
        update_time,
        remark
      FROM sys_menu WHERE menu_id = $1
    `
    const result = await pool.query(query, [menu_id])
    // ✅ 返回数据库原始字段（下划线格式）
    return result.rows[0] || null
  }

  /**
   * 创建菜单
   * @param {Object} menuData - 菜单数据（下划线格式）
   * @param {string} menuData.menu_name - 菜单名称
   * @param {number} menuData.parent_id - 父菜单ID
   * @param {number} menuData.order_num - 显示顺序
   * @param {string} menuData.path - 路由地址
   * @param {string} menuData.component - 组件路径
   * @param {string} menuData.query - 路由参数
   * @param {string} menuData.route_name - 路由名称
   * @param {number} menuData.is_frame - 是否外链
   * @param {number} menuData.is_cache - 是否缓存
   * @param {string} menuData.menu_type - 菜单类型
   * @param {string} menuData.visible - 显示状态
   * @param {string} menuData.status - 菜单状态
   * @param {string} menuData.icon - 菜单图标
   * @param {string} menuData.remark - 备注
   * @returns {Promise<SysMenu>} 创建的菜单对象（下划线格式）
   */
  async create(menuData) {
    const query = `
      INSERT INTO sys_menu (
        menu_name, parent_id, order_num, path, component, query, route_name,
        is_frame, is_cache, menu_type, visible, status, icon, remark
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      ) RETURNING *
    `
    const result = await pool.query(query, [
      menuData.menu_name,
      menuData.parent_id || 0,
      menuData.order_num || 0,
      menuData.path || '',
      menuData.component || null,
      menuData.query || null,
      menuData.route_name || '',
      menuData.is_frame !== undefined ? menuData.is_frame : 1,
      menuData.is_cache !== undefined ? menuData.is_cache : 0,
      menuData.menu_type || 'C',
      menuData.visible || '0',
      menuData.status || '0',
      menuData.icon || '#',
      menuData.remark || '',
    ])
    return result.rows[0]
  }

  /**
   * 更新菜单
   * @param {number} menu_id- 菜单ID
   * @param {Object} updates - 更新数据（下划线格式）
   * @param {string} updates.menu_name - 菜单名称
   * @param {number} updates.parent_id - 父菜单ID
   * @param {number} updates.order_num - 显示顺序
   * @param {string} updates.path - 路由地址
   * @param {string} updates.component - 组件路径
   * @param {string} updates.query - 路由参数
   * @param {string} updates.route_name - 路由名称
   * @param {number} updates.is_frame - 是否外链
   * @param {number} updates.is_cache - 是否缓存
   * @param {string} updates.menu_type - 菜单类型
   * @param {string} updates.visible - 显示状态
   * @param {string} updates.status - 菜单状态
   * @param {string} updates.icon - 菜单图标
   * @param {string} updates.remark - 备注
   * @returns {Promise<SysMenu|null>} 更新后的菜单对象（下划线格式）
   */
  async update(menu_id, updates) {
    const fields = []
    const values = []
    let idx = 1

    // 直接使用下划线字段名
    const dbFields = [
      'menu_name',
      'parent_id',
      'order_num',
      'path',
      'component',
      'query',
      'route_name',
      'is_frame',
      'is_cache',
      'menu_type',
      'visible',
      'status',
      'icon',
      'remark',
    ]

    for (const dbField of dbFields) {
      if (updates[dbField] !== undefined) {
        fields.push(`${dbField} = $${idx++}`)
        values.push(updates[dbField])
      }
    }

    if (fields.length === 0) {
      return await this.getById(menu_id)
    }

    fields.push(`update_time = NOW()`)
    values.push(menu_id)

    const query = `
      UPDATE sys_menu
      SET ${fields.join(', ')}
      WHERE menu_id = $${idx}
      RETURNING *
    `

    const result = await pool.query(query, values)
    return result.rows[0] || null
  }

  /**
   * 删除菜单
   */
  async delete(menu_id) {
    // 检查是否有子菜单
    const childCount = await this.countChildren(menu_id)
    if (childCount > 0) {
      throw new Error('存在子菜单，不允许删除')
    }

    const query = `
      DELETE FROM sys_menu WHERE menu_id = $1 RETURNING menu_id
    `
    const result = await pool.query(query, [menu_id])
    return result.rows.length > 0
  }

  /**
   * 统计子菜单数量
   */
  async countChildren(parentId) {
    const query = `
      SELECT COUNT(*) as count FROM sys_menu WHERE parent_id = $1
    `
    const result = await pool.query(query, [parentId])
    return parseInt(result.rows[0].count)
  }

  /**
   * 将平铺列表转换为树形结构
   */
  buildTree(menus, parent_id = 0) {
    const tree = []

    for (const menu of menus) {
      // ✅ 类型安全比较：确保 parent_id 是数字类型
      const menuParentId = Number(menu.parent_id)
      const targetParentId = Number(parent_id)

      if (menuParentId === targetParentId) {
        // ✅ 递归查找子节点，确保 menu_id 转换为数字
        const children = this.buildTree(menus, Number(menu.menu_id))
        const node = {
          ...menu,
          // ✅ 确保 menu_id 和 parent_id 是 Number 类型（防止 PostgreSQL BigInt 返回字符串）
          menu_id: Number(menu.menu_id),
          parent_id: Number(menu.parent_id),
          children: children.length > 0 ? children : undefined,
        }
        tree.push(node)
      }
    }

    return tree
  }

  /**
   * 获取用户菜单树(根据权限过滤)
   * 从 sys_menu 表查询,通过若依风格的 sys_user_role 和 sys_role 表桥接
   * 注意: 所有表使用 BIGINT/BIGSERIAL 整型主键，废弃 UUID
   * ✅ 职责单一化：只查询 'M'(目录) 和 'C'(菜单) 类型，剔除按钮('F')
   * ✅ 结构标准化：返回路由必须字段 (path, component, meta)
   */
  async getUserMenuTree(user_id) {
    console.log('\n🔍 [菜单查询] 开始查询用户菜单树')
    console.log('   用户ID:', user_id, '类型:', typeof user_id)

    // ✅ 修改 SQL：只查询 'M'(目录) 和 'C'(菜单)，剔除 'F'(按钮)
    // 按钮权限已由 sys_button 表管理，不应参与侧边栏路由构建
    const query = `
      SELECT DISTINCT 
        m.menu_id,
        m.menu_name,
        m.parent_id,
        m.order_num,
        m.path,
        m.component,
        m.query,
        m.route_name,
        m.is_frame,
        m.is_cache,
        m.menu_type,
        m.visible,
        m.status,
        m.icon,
        m.remark
      FROM sys_menu m
      INNER JOIN sys_role_menu srm ON m.menu_id = srm.menu_id
      INNER JOIN sys_user_role ur ON srm.role_id = ur.role_id
      INNER JOIN sys_role r ON ur.role_id = r.role_id
      WHERE ur.user_id = $1::int
        AND m.status = '0'
        AND r.status = '0'
        AND m.menu_type IN ('M', 'C')
      ORDER BY m.parent_id ASC, m.order_num ASC
    `

    console.log('   执行SQL查询...')
    const result = await pool.query(query, [user_id])
    // ✅ 返回数据库原始字段（下划线格式）
    const menus = result.rows

    console.log('   查询结果:', menus.length, '个菜单(不含按钮)')

    if (menus.length === 0) {
      console.warn('   ⚠️  警告: 未找到任何菜单！')
      console.warn('   可能原因:')
      console.warn('     1. 用户没有分配角色')
      console.warn('     2. 用户的角色在 sys_role_menu 中没有菜单')
      console.warn('     3. 菜单状态不是 "0" (正常)')
      console.warn('     4. 菜单类型不是 "M" (目录) 或 "C" (菜单)')
      console.warn('     5. 角色状态不是 "0" (正常)')

      // 诊断：检查用户的角色
      const userRolesQuery = `
        SELECT r.role_id, r.role_name, r.role_key, r.status
        FROM sys_role r
        INNER JOIN sys_user_role ur ON r.role_id = ur.role_id
        WHERE ur.user_id = $1::int
          AND r.del_flag = '0'
      `
      const userRoles = await pool.query(userRolesQuery, [user_id])
      console.log(
        '   用户角色:',
        userRoles.rows.length > 0
          ? userRoles.rows.map((r) => `${r.role_name}(${r.role_key}) [id:${r.role_id}, status:${r.status}]`).join(', ')
          : '无角色',
      )

      // 诊断：检查每个角色的菜单数
      for (const role of userRoles.rows) {
        const roleMenuQuery = `
          SELECT COUNT(*) as count
          FROM sys_role_menu
          WHERE role_id = $1::int
        `
        const roleMenuResult = await pool.query(roleMenuQuery, [role.role_id])
        const menuCount = parseInt(roleMenuResult.rows[0].count)
        console.log(`   角色 "${role.role_name}" [${role.role_id}] 的菜单数: ${menuCount}`)

        // 显示该角色的前5个菜单ID
        if (menuCount > 0) {
          const sampleMenusQuery = `
            SELECT menu_id FROM sys_role_menu
            WHERE role_id = $1::int
            LIMIT 5
          `
          const sampleMenus = await pool.query(sampleMenusQuery, [role.role_id])
          console.log(
            `   角色 "${role.role_name}" 的前5个菜单ID:`,
            sampleMenus.rows.map((r) => r.menu_id).join(', '),
          )
        }
      }

      // 诊断：检查系统中的菜单总数(不含按钮)
      const totalMenusQuery = `
        SELECT COUNT(*) as count
        FROM sys_menu
        WHERE status = '0' AND menu_type IN ('M', 'C')
      `
      const totalMenusResult = await pool.query(totalMenusQuery)
      console.log('   系统中可用的菜单总数(不含按钮):', totalMenusResult.rows[0].count)
    } else {
      console.log(
        '   前3个菜单:',
        menus
          .slice(0, 3)
          .map((m) => `${m.menu_name}(${m.menu_type}) [id:${m.menu_id}]`)
          .join(', '),
      )
    }

    // 构建树形结构
    const tree = this.buildTree(menus)
    console.log('   构建后的菜单树:', tree.length, '个根节点')
    console.log('✅ [菜单查询] 查询完成\n')

    return tree
  }

  /**
   * 获取所有菜单树（用于管理界面）
   */
  async getMenuTree(params = {}) {
    const menus = await this.list(params)
    return this.buildTree(menus)
  }

  /**
   * 获取所有状态正常的菜单（用于管理员权限）
   * @returns {Promise<SysMenu[]>}
   */
  async getAllMenus() {
    const query = `
      SELECT 
        menu_id,
        menu_name,
        parent_id,
        order_num,
        path,
        component,
        query,
        route_name,
        is_frame,
        is_cache,
        menu_type,
        visible,
        status,
        icon,
        create_time,
        update_time,
        remark
      FROM sys_menu
      WHERE status = '0'
      ORDER BY parent_id ASC, order_num ASC
    `
    const result = await pool.query(query)
    return result.rows
  }

  /**
   * 为菜单树挂载按钮列表（多表聚合）
   * @param {Array} tree - 菜单树
   * @param {number} user_id - 用户ID
   * @param {boolean} isAdmin - 是否为管理员
   * @returns {Promise<Array>} 挂载按钮后的菜单树
   */
  async attachButtonsToTree(tree, user_id, isAdmin) {
    const { pool } = require('../../config/db')

    // 1. 收集所有菜单 ID
    const menuIds = new Set()
    const collectIds = (nodes) => {
      if (!nodes) return
      for (const node of nodes) {
        menuIds.add(node.menu_id)
        if (node.children) collectIds(node.children)
      }
    }
    collectIds(tree)

    if (menuIds.size === 0) return tree

    // 2. 查询按钮权限
    let buttonsQuery, buttonsParams
    if (isAdmin) {
      // 管理员：获取所有状态正常的按钮（特权处理）
      buttonsQuery = `
        SELECT * FROM sys_button
        WHERE status = '0'
        ORDER BY order_num ASC
      `
      buttonsParams = []
    } else {
      // 普通用户：根据角色权限获取按钮
      buttonsQuery = `
        SELECT DISTINCT b.*
        FROM sys_button b
        INNER JOIN sys_role_button srb ON b.button_id = srb.button_id
        INNER JOIN sys_user_role ur ON srb.role_id = ur.role_id
        INNER JOIN sys_role r ON ur.role_id = r.role_id
        WHERE ur.user_id = $1::int
          AND b.status = '0'
          AND r.status = '0'
        ORDER BY b.order_num ASC
      `
      buttonsParams = [user_id]
    }

    const result = await pool.query(buttonsQuery, buttonsParams)
    const buttons = result.rows

    // 3. 按 parent_id 分组
    const buttonMap = {}
    buttons.forEach((btn) => {
      const pid = String(btn.parent_id)
      if (!buttonMap[pid]) buttonMap[pid] = []
      buttonMap[pid].push(btn)
    })

    // 4. 挂载到树节点
    const attach = (nodes) => {
      if (!nodes) return
      for (const node of nodes) {
        const nid = String(node.menu_id)
        if (buttonMap[nid]) {
          node.buttons = buttonMap[nid]
        }
        if (node.children) attach(node.children)
      }
    }
    attach(tree)

    return tree
  }
}

module.exports = new MenuModel()
