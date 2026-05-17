/**
 * 角色 Model - listAll 方法
 * 添加到: src/modules/role/model.js
 */

async listAll(params = {}) {
  const { status, role_name, role_key } = params

  let query = `
    SELECT 
      role_id, role_name, role_key, role_sort, data_scope,
      status, create_time, update_time, remark
    FROM sys_role
    WHERE del_flag = '0'
  `
  const values = []
  let idx = 1

  if (status) {
    query += ` AND status = $${idx++}`
    values.push(status)
  }

  if (role_name) {
    query += ` AND role_name ILIKE $${idx++}`
    values.push(`%${role_name}%`)
  }

  if (role_key) {
    query += ` AND role_key ILIKE $${idx++}`
    values.push(`%${role_key}%`)
  }

  query += ` ORDER BY role_sort ASC, create_time DESC`

  const result = await pool.query(query, values)
  return result.rows
}
