import { Role } from '../../domain/entities/User';

/**
 * Input DTO for creating user
 */
export interface CreateUserDTO {
  email: string;
  name: string;
  role: Role;
  department?: string;
  title?: string;
  bio?: string;
  avatar?: string;
}

/**
 * Input DTO for updating user profile
 */
export interface UpdateUserProfileDTO {
  userId: string;
  name?: string;
  department?: string;
  position?: string;
  title?: string;
  bio?: string;
  avatar?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

/**
 * Input DTO for updating sensitive fields
 */
export interface UpdateSensitiveFieldsDTO {
  userId: string;
  salary?: number;
  ssn?: string;
  performanceRating?: number;
}

/**
 * Output DTO for user (public fields)
 */
export interface UserDTO {
  id: string;
  email: string;
  name: string;
  role: Role;
  department?: string;
  position?: string;
  title?: string;
  bio?: string;
  avatar?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Output DTO for user with sensitive fields
 */
export interface UserWithSensitiveDTO extends UserDTO {
  salary?: number;
  ssn?: string;
  performanceRating?: number;
  dateOfBirth?: Date;
  hireDate?: Date;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

/**
 * Output DTO for paginated user list
 */
export interface PaginatedUsersDTO {
  users: UserDTO[] | UserWithSensitiveDTO[];
  total: number;
  page: number;
  pageSize: number;
}
