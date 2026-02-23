import { UserRole } from '../constants/roles.constants';

export interface IUser {
  userId: number;
  email: string;
  role: UserRole;
  name?: string;
}

export interface IRequestWithUser extends Request {
  user: IUser;
}
