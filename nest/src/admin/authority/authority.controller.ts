// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  Query,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  Delete,
  Put,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { AuthorityService } from './authority.service';
import { AdminJwtAuthGuard } from '../../auth/guards/admin-jwt-auth.guard';
import {
  AuthorityQueryDto,
  AuthorityDetailDto,
  CreateAuthorityDto,
  UpdateAuthorityDto,
  DeleteAuthorityDto,
  BatchDeleteAuthorityDto,
} from './authority.dto';

@ApiTags('Admin API - 权限管理')
@Controller('adminapi/authority/authority')
@UseGuards(AdminJwtAuthGuard)
export class AuthorityController {
  constructor(private readonly authorityService: AuthorityService) {}

  /**
   * 获取权限列表 - 对应PHP的getAuthority接口
   */
  @Get('getAuthority')
  @ApiOperation({ summary: '获取权限列表' })
  async getAuthority(
    @Query('type') type: string = '0',
    @Request() req,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('用户未登录');
    }

    // 获取管理员信息
    const adminUser = await this.authorityService['prisma'].admin_user.findUnique({
      where: { admin_id: userId },
      select: {
        admin_type: true,
        auth_list: true,
        shop_id: true,
        merchant_id: true
      },
    });

    if (!adminUser) {
      throw new Error('管理员不存在');
    }

    // 获取权限列表 - 基于PHP逻辑
    let authList: string[] = [];
    if (adminUser.auth_list) {
      try {
        // auth_list 可能是 JSON 格式的字符串
        authList = JSON.parse(adminUser.auth_list);
      } catch (e) {
        // 如果解析失败，可能是逗号分隔的字符串
        authList = adminUser.auth_list.split(',').filter(Boolean);
      }
    }

    // 如果是店铺管理员，检查 admin_user_shop 表
    if (adminUser.shop_id) {
      const adminUserShop = await this.authorityService['prisma'].admin_user_shop.findFirst({
        where: {
          admin_id: userId,
          shop_id: adminUser.shop_id,
          is_using: 1
        },
        select: { auth_list: true }
      });

      if (adminUserShop?.auth_list) {
        try {
          const shopAuthList = JSON.parse(adminUserShop.auth_list);
          authList = [...authList, ...shopAuthList];
        } catch (e) {
          const shopAuthList = adminUserShop.auth_list.split(',').filter(Boolean);
          authList = [...authList, ...shopAuthList];
        }
      }
    }

    // 构建查询条件
    const where: any = {
      is_show: 1,
    };

    // 根据管理员类型过滤
    if (adminUser.admin_type === 'admin') {
      // 超级管理员可以看到所有权限
    } else {
      // 普通管理员只能看到有权限的
      if (authList.length > 0) {
        where.authority_sn = {
          in: authList
        };
      }
    }

    // 根据 type 参数决定返回结构
    if (type === '0') {
      // 获取树形结构
      const authorities = await this.authorityService['prisma'].authority.findMany({
        where,
        orderBy: [
          { parent_id: 'asc' },
          { sort_order: 'asc' },
          { authority_id: 'asc' }
        ]
      });

      // 构建树形结构
      const treeData = this.buildAuthorityTree(authorities);

      // 扁平化处理 - 对应PHP的flattenTreeIterative
      const flattenedData = this.flattenAuthorityTree(treeData);

      return {
        code: 0,
        data: flattenedData,
        message: 'success',
        timestamp: new Date().toISOString(),
      };
    } else {
      // 获取列表结构
      const [items, total] = await Promise.all([
        this.authorityService['prisma'].authority.findMany({
          where,
          orderBy: {
            sort_order: 'asc'
          }
        }),
        this.authorityService['prisma'].authority.count({ where }),
      ]);

      return {
        code: 0,
        data: {
          items,
          total,
        },
        message: 'success',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 构建权限树
   */
  private buildAuthorityTree(authorities: any[], parentId: number = 0): any[] {
    const tree = [];

    for (const authority of authorities) {
      if (authority.parent_id === parentId) {
        const children = this.buildAuthorityTree(authorities, authority.authority_id);
        if (children.length > 0) {
          authority.children = children;
        }
        tree.push(authority);
      }
    }

    return tree;
  }

  /**
   * 扁平化权限树 - 对应PHP的flattenTreeIterative
   */
  private flattenAuthorityTree(tree: any[]): any[] {
    const result: any[] = [];

    const flatten = (nodes: any[]) => {
      for (const node of nodes) {
        // 添加当前节点
        const flatNode = {
          authority_id: node.authority_id,
          authority_sn: node.authority_sn,
          authority_name: node.authority_name,
          parent_id: node.parent_id,
          sort_order: node.sort_order,
          is_show: node.is_show,
          child_auth: node.child_auth,
          route_link: node.route_link,
          authority_ico: node.authority_ico,
          is_system: node.is_system,
          admin_type: node.admin_type,
        };

        result.push(flatNode);

        // 递归处理子节点
        if (node.children && node.children.length > 0) {
          flatten(node.children);
        }
      }
    };

    flatten(tree);
    return result;
  }

  /**
   * 获取权限详情
   */
  @Get('detail/:id')
  @ApiOperation({ summary: '获取权限详情' })
  async getAuthorityDetail(
    @Param('id') id: number,
    @Request() req,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('用户未登录');
    }

    const authority = await this.authorityService.findOne(id);

    return {
      code: 0,
      data: authority,
      message: 'success',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 获取权限树
   */
  @Get('tree')
  @ApiOperation({ summary: '获取权限树' })
  async getAuthorityTree(
    @Query('type') type?: number,
    @Query('status') status?: number,
    @Request() req,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('用户未登录');
    }

    const tree = await this.authorityService.getAuthorityTree(type, status);

    return {
      code: 0,
      data: tree,
      message: 'success',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 获取菜单权限
   */
  @Get('menu')
  @ApiOperation({ summary: '获取菜单权限' })
  async getMenuPermissions(
    @Query('roleId') roleId?: number,
    @Request() req,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('用户未登录');
    }

    const menus = await this.authorityService.getMenuPermissions(roleId);

    return {
      code: 0,
      data: menus,
      message: 'success',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 获取操作权限
   */
  @Get('actions')
  @ApiOperation({ summary: '获取操作权限' })
  async getActionPermissions(
    @Query('roleId') roleId?: number,
    @Request() req,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('用户未登录');
    }

    const actions = await this.authorityService.getActionPermissions(roleId);

    return {
      code: 0,
      data: actions,
      message: 'success',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 创建权限
   */
  @Post('create')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '创建权限' })
  async createAuthority(
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    createData: CreateAuthorityDto,
    @Request() req,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('用户未登录');
    }

    // 检查管理员权限
    const adminUser = await this.authorityService['prisma'].admin_user.findUnique({
      where: { admin_id: userId },
      select: { admin_type: true },
    });

    if (!adminUser || adminUser.admin_type !== 1) {
      throw new Error('只有超级管理员可以创建权限');
    }

    const authority = await this.authorityService.create(createData);

    return {
      code: 0,
      data: authority,
      message: 'success',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 更新权限
   */
  @Put('update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '更新权限' })
  async updateAuthority(
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    updateData: UpdateAuthorityDto,
    @Request() req,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('用户未登录');
    }

    // 检查管理员权限
    const adminUser = await this.authorityService['prisma'].admin_user.findUnique({
      where: { admin_id: userId },
      select: { admin_type: true },
    });

    if (!adminUser || adminUser.admin_type !== 1) {
      throw new Error('只有超级管理员可以更新权限');
    }

    const authority = await this.authorityService.update(updateData);

    return {
      code: 0,
      data: authority,
      message: 'success',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 删除权限
   */
  @Delete('delete/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除权限' })
  async deleteAuthority(
    @Param('id') id: number,
    @Request() req,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('用户未登录');
    }

    // 检查管理员权限
    const adminUser = await this.authorityService['prisma'].admin_user.findUnique({
      where: { admin_id: userId },
      select: { admin_type: true },
    });

    if (!adminUser || adminUser.admin_type !== 1) {
      throw new Error('只有超级管理员可以删除权限');
    }

    await this.authorityService.remove(id);

    return {
      code: 0,
      data: true,
      message: 'success',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 批量删除权限
   */
  @Post('batchDelete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '批量删除权限' })
  async batchDeleteAuthority(
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    deleteData: BatchDeleteAuthorityDto,
    @Request() req,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('用户未登录');
    }

    // 检查管理员权限
    const adminUser = await this.authorityService['prisma'].admin_user.findUnique({
      where: { admin_id: userId },
      select: { admin_type: true },
    });

    if (!adminUser || adminUser.admin_type !== 1) {
      throw new Error('只有超级管理员可以删除权限');
    }

    await this.authorityService.batchRemove(deleteData.ids);

    return {
      code: 0,
      data: true,
      message: 'success',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 更新权限状态
   */
  @Post('updateStatus')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '更新权限状态' })
  async updateAuthorityStatus(
    @Body() body: { id: number; status: number },
    @Request() req,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('用户未登录');
    }

    // 检查管理员权限
    const adminUser = await this.authorityService['prisma'].admin_user.findUnique({
      where: { admin_id: userId },
      select: { admin_type: true },
    });

    if (!adminUser || adminUser.admin_type !== 1) {
      throw new Error('只有超级管理员可以更新权限状态');
    }

    const authority = await this.authorityService.updateStatus(body.id, body.status);

    return {
      code: 0,
      data: authority,
      message: 'success',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('adminUser/mineDetail')
  @ApiOperation({ summary: '获取当前管理员详情' })
  async mineDetail(@Request() req) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('用户未登录');
    }

    const adminUser = await this.authorityService['prisma'].admin_user.findUnique({
      where: { admin_id: userId },
      select: {
        admin_id: true,
        username: true,
        real_name: true,
        email: true,
        mobile: true,
        avatar: true,
        admin_type: true,
        status: true,
        create_time: true,
        update_time: true,
      },
    });

    if (!adminUser) {
      throw new Error('管理员不存在');
    }

    return {
      code: 0,
      data: adminUser,
      message: 'success',
      timestamp: new Date().toISOString(),
    };
  }
}