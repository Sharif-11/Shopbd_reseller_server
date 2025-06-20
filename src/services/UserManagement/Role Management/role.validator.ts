import { body, param } from 'express-validator'

class RoleValidator {
  static getRole() {
    return [
      param('roleId')
        .trim()
        .notEmpty()
        .withMessage('Role ID is required')
        .isString()
        .withMessage('Role ID must be a string'),
    ]
  }

  static createRole() {
    return [
      body('roleName')
        .trim()
        .notEmpty()
        .withMessage('Role name is required')
        .isString()
        .withMessage('Role name must be a string'),
      body('description')
        .optional()
        .isString()
        .withMessage('Description must be a string'),
      body('isDefault')
        .optional()
        .isBoolean()
        .withMessage('isDefault must be a boolean'),
      body('permissions')
        .optional()
        .isArray()
        .withMessage('Permissions must be an array'),
    ]
  }

  static updateRolePermissions() {
    return [
      param('roleId')
        .trim()
        .notEmpty()
        .withMessage('Role ID is required')
        .isString()
        .withMessage('Role ID must be a string'),
      body('permissions').isArray().withMessage('Permissions must be an array'),
    ]
  }

  static getUserRoles() {
    return [
      param('userId')
        .trim()
        .notEmpty()
        .withMessage('User ID is required')
        .isString()
        .withMessage('User ID must be a string'),
    ]
  }

  static updateUserRoles() {
    return [
      param('userId')
        .trim()
        .notEmpty()
        .withMessage('User ID is required')
        .isString()
        .withMessage('User ID must be a string'),
      body('roleIds')
        .isArray()
        .withMessage('Role IDs must be an array')
        .optional(),
      body('roleIds.*')
        .if(body('roleIds').exists())
        .isString()
        .withMessage('Role ID must be a string'),
    ]
  }

  static deleteRole() {
    return [
      param('roleId')
        .trim()
        .notEmpty()
        .withMessage('Role ID is required')
        .isString()
        .withMessage('Role ID must be a string'),
    ]
  }

  static getUserPermissions() {
    return [
      param('userId')
        .trim()
        .notEmpty()
        .withMessage('User ID is required')
        .isString()
        .withMessage('User ID must be a string'),
    ]
  }
}

export default RoleValidator
