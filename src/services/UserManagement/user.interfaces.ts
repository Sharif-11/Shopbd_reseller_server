import {
  ActionType,
  BlockActionType,
  PermissionType,
  Prisma,
} from '@prisma/client'

type CreateSuperAdminInput = {
  phoneNo: string
  name: string
  password: string
  email?: string
}

type CreateAdminInput = {
  phoneNo: string
  name: string
  password: string
  email?: string
}

type CreateSellerInput = Prisma.UserCreateInput & {
  referredByCode?: string
}

type LoginInput = {
  phoneNo: string
  password: string
}

type UpdateProfileInput = {
  name?: string
  email?: string
  zilla?: string
  upazilla?: string
  address?: string
  shopName?: string
  nomineePhone?: string
  facebookProfileLink?: string
  phoneNo?: string
}

type ChangePasswordInput = {
  userId: string
  currentPassword: string
  newPassword: string
}

type CreateRoleInput = {
  roleName: string
  description?: string
  isDefault?: boolean
}

type AssignPermissionInput = {
  roleId: string
  permission: PermissionType
  actions: ActionType[]
}

type AssignRoleInput = {
  userId: string
  roleId: string
}

type BlockUserInput = {
  userPhoneNo: string
  reason?: string
  actionType: BlockActionType
  expiresAt?: Date
}
export {
  AssignPermissionInput,
  AssignRoleInput,
  BlockUserInput,
  ChangePasswordInput,
  CreateAdminInput,
  CreateRoleInput,
  CreateSellerInput,
  CreateSuperAdminInput,
  LoginInput,
  UpdateProfileInput,
}
