<template>
  <div class="permission-demo-container">
    <n-card title="权限指令演示" :bordered="false">
      <n-alert type="info" :bordered="false" style="margin-bottom: 20px">
        当前用户权限列表：{{ permissions.join(', ') || '无权限' }}
      </n-alert>

      <n-divider>隐藏模式（默认）</n-divider>
      
      <n-space vertical :size="16">
        <n-card title="用户管理权限演示" size="small">
          <n-space>
            <!-- 需要 user:read 权限 -->
            <n-button v-permission="'user:read'" type="info">
              查看用户 (user:read)
            </n-button>
            
            <!-- 需要 user:create 权限 -->
            <n-button v-permission="'user:create'" type="success">
              创建用户 (user:create)
            </n-button>
            
            <!-- 需要 user:update 权限 -->
            <n-button v-permission="'user:update'" type="warning">
              编辑用户 (user:update)
            </n-button>
            
            <!-- 需要 user:delete 权限 -->
            <n-button v-permission="'user:delete'" type="error">
              删除用户 (user:delete)
            </n-button>
          </n-space>
        </n-card>

        <n-card title="角色管理权限演示" size="small">
          <n-space>
            <n-button v-permission="'role:read'" type="info">
              查看角色 (role:read)
            </n-button>
            
            <n-button v-permission="'role:create'" type="success">
              创建角色 (role:create)
            </n-button>
            
            <n-button v-permission="'role:update'" type="warning">
              编辑角色 (role:update)
            </n-button>
            
            <n-button v-permission="'role:delete'" type="error">
              删除角色 (role:delete)
            </n-button>
          </n-space>
        </n-card>

        <n-card title="权限管理权限演示" size="small">
          <n-space>
            <n-button v-permission="'permission:read'" type="info">
              查看权限 (permission:read)
            </n-button>
            
            <n-button v-permission="'permission:create'" type="success">
              创建权限 (permission:create)
            </n-button>
            
            <n-button v-permission="'permission:update'" type="warning">
              编辑权限 (permission:update)
            </n-button>
            
            <n-button v-permission="'permission:delete'" type="error">
              删除权限 (permission:delete)
            </n-button>
          </n-space>
        </n-card>
      </n-space>

      <n-divider>多个权限（任一即可）</n-divider>
      
      <n-card title="拥有任一权限即可显示" size="small">
        <n-space>
          <!-- 拥有 user:create 或 user:update 任一权限即可 -->
          <n-button 
            v-permission="['user:create', 'user:update']" 
            type="primary"
          >
            创建或编辑用户
          </n-button>
          
          <!-- 拥有 role:create 或 role:update 或 role:delete 任一权限即可 -->
          <n-button 
            v-permission="['role:create', 'role:update', 'role:delete']" 
            type="primary"
          >
            管理角色
          </n-button>
        </n-space>
      </n-card>

      <n-divider>禁用模式</n-divider>
      
      <n-card title="没有权限时禁用（而不是隐藏）" size="small">
        <n-space>
          <!-- 没有权限时按钮变灰且不可点击 -->
          <n-button 
            v-permission="{ code: 'user:delete', type: 'disabled' }"
            type="error"
          >
            删除用户（禁用模式）
          </n-button>
          
          <n-button 
            v-permission="{ code: 'role:delete', type: 'disabled' }"
            type="error"
          >
            删除角色（禁用模式）
          </n-button>
          
          <n-button 
            v-permission="{ code: 'permission:delete', type: 'disabled' }"
            type="error"
          >
            删除权限（禁用模式）
          </n-button>
        </n-space>
      </n-card>

      <n-divider>实际应用示例</n-divider>
      
      <n-card title="表格操作列模拟" size="small">
        <n-data-table
          :columns="demoColumns"
          :data="demoData"
          :pagination="false"
          size="small"
        />
      </n-card>
    </n-card>
  </div>
</template>

<script setup name="PermissionDemo">
import { h, computed } from 'vue'
import { usePermissionStore } from '@/stores/modules/permission'
import { NButton, NSpace, NTag } from 'naive-ui'

const permissionStore = usePermissionStore()

// 当前用户权限列表
const permissions = computed(() => permissionStore.permissions)

// 演示数据
const demoData = [
  { id: 1, name: '张三', email: 'zhangsan@example.com' },
  { id: 2, name: '李四', email: 'lisi@example.com' },
  { id: 3, name: '王五', email: 'wangwu@example.com' },
]

// 演示表格列
const demoColumns = [
  {
    title: 'ID',
    key: 'id',
    width: 60,
  },
  {
    title: '姓名',
    key: 'name',
    width: 100,
  },
  {
    title: '邮箱',
    key: 'email',
  },
  {
    title: '操作',
    key: 'actions',
    width: 250,
    render(row) {
      return h(
        NSpace,
        {},
        {
          default: () => [
            // 编辑按钮 - 需要 user:update 权限
            h(
              NButton,
              {
                size: 'small',
                onClick: () => console.log('编辑', row.id),
              },
              { default: () => '编辑' }
            ),
            // 删除按钮 - 需要 user:delete 权限
            // 注意：在 h() 函数中无法使用 v-permission 指令
            // 实际项目中建议在模板中使用，或者通过条件渲染
            h(
              NButton,
              {
                size: 'small',
                type: 'error',
                onClick: () => console.log('删除', row.id),
                // 这里只是演示，实际应该用 v-permission 指令
                disabled: !permissionStore.hasPermission('user:delete'),
              },
              { default: () => '删除' }
            ),
          ],
        }
      )
    },
  },
]
</script>

<style scoped>
.permission-demo-container {
  padding: 20px;
}
</style>
