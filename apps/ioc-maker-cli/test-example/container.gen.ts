import { UserRepository } from './implementations';
import { EmailService } from './implementations';
import { UserService } from './implementations';
import { Sidali } from './implementations';

const userRepository = new UserRepository(new Sidali());
const emailService = new EmailService();
const userService = new UserService(userRepository, emailService);

export const container = {
  userRepository,
  emailService,
  userService,
};

export type Container = typeof container;
